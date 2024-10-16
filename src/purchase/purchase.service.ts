import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between, In } from 'typeorm';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseAsset } from '../entities/purchase_asset.entity';
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

    @Inject('PURCHASE_ASSET_REPOSITORY')
    private purchaseAssetRepository: Repository<PurchaseAsset>,

    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

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

      // 이미 구매한 정보 결제중(P2), 결제완료(P3) 이면 구매 못함.
      const purchaseAssetNo = createPurchaseDto.purchaseAssetNo;
      const fromAddr = createPurchaseDto.saleAddr.toLowerCase();
      const toAddr = createPurchaseDto.purchaseAddr.toLowerCase();

      const purchaseInfo = await this.purchaseRepository.findOne({ where:{purchaseAssetNo, state: In(['P2', 'P3'])}  });
     
      if (purchaseInfo) {
        // if(purchaseInfo.state === 'P2' || purchaseInfo.state === 'P3'){
          throw new ConflictException("Data already existed. : 이미 구매한 에셋");
        // }
      }
      
      const purchaseAssetInfo = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
      if (!purchaseAssetInfo) {
        throw new NotFoundException("Data Not found. : 엔터사 구매 정보");
      }
      const productNo = purchaseAssetInfo.productNo;
      const assetNo = purchaseAssetInfo.assetNo;
      const assetInfo = await this.assetRepository.findOne({ where:{assetNo} });
      if (!assetInfo) {
        throw new NotFoundException("Data Not found.: 에셋");
      }
      if (!assetInfo.tokenId) {
        throw new NotFoundException("Data Not Minted.: 에셋");
      }

      // console.log("===== createPurchaseDto : "+createPurchaseDto);

      // Purchase 저장
      const createPurchase: CreatePurchaseDto  = {...createPurchaseDto, 
        saleAddr: fromAddr,
        purchaseAddr: toAddr
      }
      // console.log("===== createPurchase : "+ JSON.stringify(createPurchase));
      const newPurchase = queryRunner.manager.create(Purchase, createPurchase);
      const result = await queryRunner.manager.save<Purchase>(newPurchase);
      const purchaseNo = result.purchaseNo;

      await queryRunner.commitTransaction();
    
      // nftService.  // nftService.createTransfer 호출 호출
      const tokenId = assetInfo.tokenId;
      const nftTransferInfo: CreateTransferDto = {purchaseAssetNo, purchaseNo, fromAddr, toAddr, 
        assetNo, productNo, tokenId, state: ''};
      this.nftService.createTransfer(user, nftTransferInfo);
      
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
   * 구매 상태 정보 수정
   * 
   * @param purchaseNo 
   * @param modifyPurchaseDto 
   */
  async updateState(purchaseNo: number, modifyPurchaseDto: ModifyPurchaseDto): Promise<void> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        const purchaseInfo = await this.purchaseRepository.findOne({ where:{purchaseNo} });
        if (!purchaseInfo) {
          throw new NotFoundException("Data Not found. : 사용자 구매 정보");
        }

        const state = modifyPurchaseDto.state;
        const failDesc = modifyPurchaseDto.failDesc;
        let data = {};
        if(failDesc){
          data = { state, failDesc };
        }else{
          data = { state }
        }
    
        await queryRunner.manager.update(Purchase, purchaseNo, data);

      // state가 결제완료(P3)
        if(state=== 'P3'){
          const purchaseAssetNo = purchaseInfo.purchaseAssetNo;
          const purchaseAssetInfo = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
          if (!purchaseAssetInfo) {
            throw new NotFoundException("Data Not found. : 엔터사 구매 정보");
          }
          const productNo = purchaseAssetInfo.productNo;
          const assetNo = purchaseAssetInfo.assetNo;
          const nftMintInfo = await this.nftMintRepository.findOne({ where:{assetNo, productNo} });
          if (!nftMintInfo) {
            throw new NotFoundException("Data Not found. : NFT 민트 정보");
          }

          // NftTransfer 저장
          const nftTransferInfo: CreateTransferDto = {purchaseNo: purchaseInfo.purchaseNo, fromAddr: purchaseInfo.saleAddr,
            toAddr: purchaseInfo.purchaseAddr, purchaseAssetNo, assetNo, productNo, tokenId: nftMintInfo.tokenId, state: 'B5'};

          // console.log("===== nftTransferInfo : "+ JSON.stringify(nftTransferInfo));
          const newTransfer = queryRunner.manager.create(NftTransfer, nftTransferInfo);
          const result = await queryRunner.manager.save<NftTransfer>(newTransfer);

          // 엔터사 구매 정보에 sold_yn='Y'로 저장         
          let data1 = {soldYn: 'Y'};
          await queryRunner.manager.update(PurchaseAsset, purchaseAssetNo, data1);

          // NFT Transfer 하기   
        }

        await queryRunner.commitTransaction();

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
                      .innerJoin(PurchaseAsset, 'purchaseAsset', 'purchaseAsset.purchase_asset_no = purchase.purchase_asset_no')
                      .innerJoin(Asset, 'asset', 'asset.asset_no = purchaseAsset.asset_no')
                      .innerJoin(State, 'state', 'state.state = purchase.state')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .select('purchase.purchase_no', 'purchaseNo')
                      .addSelect('purchase.sale_addr', 'saleAddr')
                      .addSelect('purchase.sale_user_name', 'saleUserName')
                      .addSelect('purchase.purchase_addr', 'purchaseAddr')
                      .addSelect('purchase.purchase_user_name', 'purchaseUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.price", 'price')
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
                      .where("purchase.purchase_no = :purchaseNo", { purchaseNo })
                    // .andWhere("nftMint.use_yn = 'N'")
                    // .andWhere("nftMint.burn_yn = 'N'");

      const purchaseInfo = await sql.groupBy(``)
                                    .getRawOne();

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
                      .innerJoin(PurchaseAsset, 'purchaseAsset', 'purchaseAsset.purchase_asset_no = purchase.purchase_asset_no')
                      .innerJoin(Asset, 'asset', 'asset.asset_no = purchaseAsset.asset_no')
                      .innerJoin(State, 'state', 'state.state = purchase.state')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .select('purchase.purchase_no', 'purchaseNo')
                      .addSelect('purchase.sale_user_name', 'saleUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.price", 'price')                      
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
                            .skip(skip)
                            .take(take)
                            .groupBy(`purchase.purchase_no, asset.price, asset.asset_name, asset.asset_desc,
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
