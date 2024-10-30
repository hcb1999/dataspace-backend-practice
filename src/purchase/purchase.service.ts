import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between, In } from 'typeorm';
import { Purchase } from '../entities/purchase.entity';
import { Marcket } from '../entities/marcket.entity';
import { Asset } from '../entities/asset.entity';
import { State } from '../entities/state.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { User } from '../entities/user.entity';
import { NftService } from '../nft/nft.service';
import { ConfigService } from '@nestjs/config';
import { CreatePurchaseDto } from '../dtos/create_purchase.dto';
import { ModifyPurchaseDto } from '../dtos/modify_purchase.dto';
import { GetPurchaseDto } from '../dtos/get_purchase.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class PurchaseService {
  private logger = new Logger('PurchaseService');

  constructor(
    private configService: ConfigService,
    private nftService: NftService,

    @Inject('PURCHASE_REPOSITORY')
    private purchaseRepository: Repository<Purchase>,

    @Inject('MARCKET_REPOSITORY')
    private marcketRepository: Repository<Marcket>,

    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

    @Inject('NFT_TRANSFER_REPOSITORY')
    private nftTransferRepository: Repository<NftTransfer>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  /**
   * 에셋 구매 등록
   * 
   * @param user 
   * @param createPurchaseDto 
   */
  async purchase(user: User, createPurchaseDto: CreatePurchaseDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const marcketNo = createPurchaseDto.marcketNo;
      const purchaseCnt = createPurchaseDto.purchaseCnt;
      
      const marcketInfo = await this.marcketRepository.findOne({ where:{marcketNo} });
      if (!marcketInfo) {
        throw new NotFoundException("Data Not found. : 마켓 판매 정보");
      }
      if(!((purchaseCnt > 0) && (purchaseCnt <= marcketInfo.inventoryCnt)) ){
        throw new NotFoundException("Data Not found. : 마켓 판매 정보의 재고 수량 확인");
      }
      
      const productNo = marcketInfo.productNo;
      const assetNo = marcketInfo.assetNo;
      const assetInfo = await this.assetRepository.findOne({ where:{assetNo} });
      if (!assetInfo) {
        throw new NotFoundException("Data Not found.: 에셋");
      }
      if (!assetInfo.tokenId) {
        throw new NotFoundException("Data Not Minted.: 에셋");
      }
      const fromAddr = marcketInfo.saleAddr;
      const toAddr = user.nftWalletAddr;

      // Purchase 저장
      // const createPurchase: CreatePurchaseDto  = {...createPurchaseDto, 
      //   saleAddr: fromAddr,
      //   saleUserName: marcketInfo.saleUserName,
      //   purchaseAddr: toAddr,
      //   purchaseUserName: user.nickName
      // }
      const tokenId = (parseInt(marcketInfo.fromTokenId) + marcketInfo.saleCnt).toString();
      // console.log("marcketInfo.fromTokenId : "+ marcketInfo.fromTokenId);
      // console.log("marcketInfo.saleCnt : "+ marcketInfo.saleCnt);
      // console.log("marcketInfo.fromTokenId + marcketInfo.saleCnt : "+ marcketInfo.fromTokenId + marcketInfo.saleCnt);
      // console.log("tokenId : "+ tokenId);
      const fromTokenId = tokenId;
      const toTokenId = (parseInt(tokenId) + purchaseCnt -1).toString();
      createPurchaseDto['saleAddr'] = fromAddr;
      createPurchaseDto['saleUserName'] = marcketInfo.saleUserName;
      createPurchaseDto['purchaseAddr'] = toAddr;
      createPurchaseDto['purchaseUserName'] = user.nickName;
      
      createPurchaseDto['fromTokenId'] = fromTokenId;
      createPurchaseDto['toTokenId'] = toTokenId;
      createPurchaseDto['inventoryCnt'] = purchaseCnt;
     
      // console.log("===== createPurchaseDto : "+ JSON.stringify(createPurchaseDto));
      const newPurchase = queryRunner.manager.create(Purchase, createPurchaseDto);
      const result = await queryRunner.manager.save<Purchase>(newPurchase);
      const purchaseNo = result.purchaseNo;

      await queryRunner.commitTransaction();
      // nftService.createTransfer 호출 호출
      const nftTransferInfo: CreateTransferDto = {purchaseAssetNo: null, marcketNo, purchaseNo, fromAddr, toAddr, 
        assetNo, productNo, tokenId, purchaseCnt, state: ''};
      this.nftService.createMarcketTransfer(user, nftTransferInfo);
      
    // console.log("===== nftTransferInfo : "+ JSON.stringify(nftTransferInfo));

      return { purchaseNo };
  
    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }

  }

  /**
   * 구매 정보 조회
   * 
   * @param user 
   * @param purchaseNo 
   * @returns 
   */
  async getInfo(user: User, purchaseNo: number): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {
      const purchaseAddr = user.nftWalletAddr;
      const purchase = await this.purchaseRepository.findOne({ where:{purchaseNo, purchaseAddr} });
      if (!purchase) {
        throw new NotFoundException("Data Not found. : 사용자 구매 정보");
      }

      const sql = this.purchaseRepository.createQueryBuilder('purchase')
                      .innerJoin(Marcket, 'marcket', 'marcket.marcket_no = purchase.marcket_no')
                      .innerJoin(Asset, 'asset', 'asset.asset_no = marcket.asset_no')
                      .innerJoin(State, 'state', 'state.state = purchase.state')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .leftJoin(NftTransfer, 'transfer', 'purchase.from_token_id = transfer.token_id')
                      .select('purchase.purchase_no', 'purchaseNo')
                      .addSelect('marcket.purchase_asset_no', 'purchaseAssetNo')
                      .addSelect("marcket.marcket_no", 'marcketNo')    
                      .addSelect('purchase.sale_addr', 'saleAddr')
                      .addSelect('purchase.sale_user_name', 'saleUserName')
                      .addSelect('purchase.purchase_addr', 'purchaseAddr')
                      .addSelect('purchase.purchase_user_name', 'purchaseUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("marcket.price", 'price')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('state.state_desc', 'stateDesc')   
                      .addSelect('purchase.pay_dttm', 'payDttm')                      
                      .addSelect('purchase.purchase_cnt', 'purchaseCnt')                      
                      .addSelect('purchase.sale_cnt', 'saleCnt')                      
                      .addSelect('purchase.inventory_cnt', 'inventoryCnt')                      
                      .addSelect('purchase.from_token_id', 'fromTokenId')     
                      .addSelect('purchase.to_token_id', 'toTokenId')     
                      .addSelect("fileAsset.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("fileAsset.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
                      .addSelect(`'${process.env.CONTRACT_ADDRESS}'`, 'nftContractAddress')
                      .addSelect('transfer.tx_id', 'nftTxId')
                      // .addSelect("purchase.sale_addr", 'nftSellerAddr')
                      // .addSelect("purchase.purchase_addr", 'nftBuyerAddr')
                      .where("purchase.purchase_no = :purchaseNo", { purchaseNo })
                    // .andWhere("nftMint.use_yn = 'N'")
                    // .andWhere("nftMint.burn_yn = 'N'");

      const purchaseInfo = await sql.groupBy(``)
                                    .getRawOne();

      const fromTokenId =  parseInt(purchaseInfo.fromTokenId);
      const toTokenId =  parseInt(purchaseInfo.toTokenId);
      const transferList = await this.nftTransferRepository.createQueryBuilder('transfer')
      .select([
        'transfer.token_id',
        'transfer.to_addr',
        'transfer.nft_transfer_no'
      ])
      .where(
        fromTokenId === toTokenId
          ? "CAST(transfer.token_id AS INTEGER) = :fromTokenId"
          : "CAST(transfer.token_id AS INTEGER) BETWEEN :fromTokenId AND :toTokenId",
        { fromTokenId: Number(fromTokenId), toTokenId: Number(toTokenId) }
      )
      .andWhere('transfer.nft_transfer_no IN (' + 
        this.nftTransferRepository.createQueryBuilder('subTransfer')
          .select('MAX(subTransfer.nft_transfer_no)')
          .where('CAST(subTransfer.token_id AS INTEGER) = CAST(transfer.token_id AS INTEGER)')
          .groupBy('subTransfer.token_id')
          .getQuery() + 
        ')'
      )
      .orderBy("transfer.token_id", "DESC") 
      .getRawMany();

      // console.log("transferList : "+JSON.stringify(transferList));

      const transferIds = transferList.map(item => item.token_id);
      // console.log("transferIds : "+transferIds);
      const missingIds = [];
      for (let id = fromTokenId; id <= toTokenId; id++) {
        // console.log(id);
        if (!transferIds.includes(id.toString())) {
          // console.log("추가 : "+id);
          missingIds.push(id);
        }
      }
      // console.log("missingIds : "+JSON.stringify(missingIds));
    
      let mintList: any[] = [];
      if (missingIds.length > 0) {
        mintList = await this.nftMintRepository.createQueryBuilder("mint")
                                    .select(["mint.token_id", "mint.issued_to"])
                                    .where("mint.token_id IN (:...missingIds)", { missingIds })
                                    .getRawMany();
      }

      // console.log(mintList);

      const combinedList = [
        ...(transferList || []).map(item => ({ tokenId: item.token_id, ownerAddress: item.to_addr })),
        ...(mintList || []).map(item => ({ tokenId: item.token_id, ownerAddress: item.issued_to }))
      ];
    
      const sortedCombinedList = combinedList.sort((a, b) => {
        return a.tokenId - b.tokenId; 
      });                                    
    
      purchaseInfo.tokenInfo = sortedCombinedList;

      return purchaseInfo;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }  

  /**
   * 구매 목록 조회
   * 
   * @param user 
   * @param getPurchaseDto 
   */
  async getPurchaseList(user: User, getPurchaseDto: GetPurchaseDto): Promise<any> {
    try {

      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
      const skip = getPurchaseDto.getOffset();
      const take = getPurchaseDto.getLimit();
      const startDttm = getPurchaseDto.startDttm;
      const endDttm = getPurchaseDto.endDttm;
      const word = getPurchaseDto.word;
      const purchaseAddr = user.nftWalletAddr;

      let options = `purchase.purchase_addr = '${purchaseAddr}' and purchase.state = 'P3'`;
      if (word) {
          options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
      }
      
      if (startDttm) {
        if(endDttm){
          const endDttm = new Date(getPurchaseDto['endDttm']);
          const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
          options += ` and purchase.pay_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
          options += ` and purchase.pay_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
        }else{
          options += ` and purchase.pay_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        }
      }else{
        if(endDttm){
          const endDttm = new Date(getPurchaseDto['endDttm']);
          const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
          options += ` and purchase.pay_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
        }
      }
    
      console.log("options : "+options);
  
      const sql = this.purchaseRepository.createQueryBuilder('purchase')
                      .innerJoin(Marcket, 'marcket', 'marcket.marcket_no = purchase.marcket_no')
                      .innerJoin(Asset, 'asset', 'asset.asset_no = marcket.asset_no')
                      .innerJoin(State, 'state', 'state.state = purchase.state')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .select('purchase.purchase_no', 'purchaseNo')
                      .addSelect('purchase.sale_user_name', 'saleUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("marcket.price", 'price')                      
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('state.state_desc', 'stateDesc')                      
                      .addSelect('purchase.pay_dttm', 'payDttm')                      
                      .addSelect("fileAsset.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("fileAsset.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
                      .where(options)
                      // .andWhere("nftMint.use_yn = 'N'")
                      // .andWhere("nftMint.burn_yn = 'N'");

      const list = await sql.orderBy('purchase.purchase_no', getPurchaseDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .offset(skip)
                            .limit(take)
                            .groupBy(`purchase.purchase_no, marcket.price, asset.asset_name, asset.asset_desc,
                              asset.metaverse_name, asset.type_def, state.state_desc, fileAsset.file_name_first,
                                fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
                                fileAsset.file_path_second, fileAsset.thumbnail_second`)
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getPurchaseDto.pageSize, list);

    } catch(e) {
      this.logger.error(e);
      throw e;
    }
  }
}
