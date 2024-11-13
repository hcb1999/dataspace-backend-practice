import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { Marcket } from '../entities/marcket.entity';
import { PurchaseAsset } from '../entities/purchase_asset.entity';
import { Purchase } from '../entities/purchase.entity';
import { Product } from "../entities/product.entity";
import { Asset } from '../entities/asset.entity';
import { State } from '../entities/state.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { User } from '../entities/user.entity';
import { NftService } from '../nft/nft.service';
import { ConfigService } from '@nestjs/config';
import { CreateMarcketDto} from '../dtos/create_marcket.dto';
import { ModifyMarcketDto } from '../dtos/modify_marcket.dto';
import { GetMarcketDto } from '../dtos/get_marcket.dto';
import { CreateMintDto } from '../dtos/create_mint.dto';
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class MarcketService {
  private logger = new Logger('MarcketService');

  constructor(
    private configService: ConfigService,
    private nftService: NftService,

    @Inject('MARCKET_REPOSITORY')
    private marcketRepository: Repository<Marcket>,

    @Inject('PURCHASE_ASSET_REPOSITORY')
    private purchaseAssetRepository: Repository<PurchaseAsset>,

    @Inject('PURCHASE_REPOSITORY')
    private purchaseRepository: Repository<Purchase>,

    @Inject('PRODUCT_REPOSITORY')
    private productRepository: Repository<Product>,
    
    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('STATE_REPOSITORY')
    private stateRepository: Repository<State>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

    @Inject('NFT_TRANSFER_REPOSITORY')
    private nftTransferRepository: Repository<NftTransfer>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}

  /**
   *  엔터사 에셋 판매 등록
   * 
   * @param user 
   * @param createMarcketDto 
   */
  async create(user: User, createMarcketDto: CreateMarcketDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const purchaseAssetNo = createMarcketDto.purchaseAssetNo;
      const price = createMarcketDto.price;
      const issueCnt = createMarcketDto.issueCnt;
      const startDttm = createMarcketDto.startDttm;
      const endDttm = createMarcketDto.endDttm;
      const marcketAssetName = createMarcketDto.marcketAssetName;
    
      const purchaseAssetInfo = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
      if (!purchaseAssetInfo) {
        throw new NotFoundException('Data Not found. : 엔터사 구매 에셋 정보');
      }

      // Marcket 저장
      const assetNo = purchaseAssetInfo.assetNo;
      const productNo = purchaseAssetInfo.productNo;
      const creatroTokenId = purchaseAssetInfo.tokenId;
      let data = { purchaseAssetNo, assetNo, productNo, marcketAssetName, marcketAssetDesc: createMarcketDto.marcketAssetDesc,
        saleAddr: user.nftWalletAddr, saleUserName: user.nickName, 
        creatroTokenId, price, issueCnt, inventoryCnt: issueCnt, startDttm, endDttm};

      // console.log("===== data : "+ JSON.stringify(data));

      const newMarcket = queryRunner.manager.create(Marcket, data);
      const result = await queryRunner.manager.save<Marcket>(newMarcket);
      const marcketNo = result.marcketNo;

      await queryRunner.commitTransaction();

      // nftService.createMarcketMint 호출
      const address = user.nftWalletAddr;
      const nftMintInfo: CreateMintDto = {assetNo, productNo, issuedTo: address, 
        issueCnt, tokenId: null, state: 'B1', marcketNo};
      this.nftService.createMarcketMint(user, nftMintInfo);

      return { marcketNo };

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 엔터사 에셋 판매 정보 수정(민트전)
   * 
   * @param user
   * @param marcketNo 
   * @param modifyMarcketDto 
   */
  async update(user: User, marcketNo: number, modifyMarcketDto: ModifyMarcketDto): Promise<void> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        const marcketInfo = await this.marcketRepository.findOne({ where:{marcketNo} });
        if (!marcketInfo) {
          throw new NotFoundException("Data Not found. : 마켓 에셋 판매 정보");
        }

        if (marcketInfo.state !== "S1") {
          const statetInfo = await this.stateRepository.findOne({ where:{state : marcketInfo.state} });
          if (statetInfo) {
            throw new NotFoundException("Already on "+statetInfo.stateDesc+".");
          }
        }

        await queryRunner.manager.update(Marcket, marcketNo, modifyMarcketDto);

        await queryRunner.commitTransaction();

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }  

  /**
   * 엔터사 에셋 판매 정보 삭제
   *
   * @param user
   * @param marcketNo
   */
  async delete(user: User, marcketNo: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const marcketInfo = await this.marcketRepository.findOne({ where:{marcketNo, saleAddr: user.nftWalletAddr} });
      if (!marcketInfo) {
        throw new NotFoundException('Data Not found. : 마켓 에셋 판매 정보');
      }

      if (marcketInfo.state === 'S4' || marcketInfo.state === 'S5') {
        const statetInfo = await this.stateRepository.findOne({
          where: { state: marcketInfo.state },
        });
        if (statetInfo) {
          throw new NotFoundException(
            'Already on ' + statetInfo.stateDesc + '.',
          );
        }
      }

      let data = { useYn: 'N', state: 'S4' };
      await this.marcketRepository.update(marcketNo, data);

      await queryRunner.commitTransaction();

    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   *  사용자 에셋 재판매 등록
   * 
   * @param user 
   * @param createMarcketDto 
   */
  async recreate(user: User, createMarcketDto: CreateMarcketDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      // 수정하기
      const purchaseAssetNo = createMarcketDto.purchaseAssetNo;
      const purchaseNo = createMarcketDto.purchaseNo;
      const price = createMarcketDto.price;
      const issueCnt = createMarcketDto.issueCnt;
      const startDttm = createMarcketDto.startDttm;
      const endDttm = createMarcketDto.endDttm;
      const marcketAssetName = createMarcketDto.marcketAssetName;
    
      const purchaseInfo = await this.purchaseRepository.findOne({ where:{purchaseNo} });
      if (!purchaseInfo) {
        throw new NotFoundException('Data Not found. : 사용자 에셋 구매 정보');
      }
      const purchaseAssetInfo = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
      if (!purchaseAssetInfo) {
        throw new NotFoundException('Data Not found. : 엔터사 구매 에셋 정보');
      }

      // Marcket 저장
      const assetNo = purchaseAssetInfo.assetNo;
      const productNo = purchaseAssetInfo.productNo;
      const creatroTokenId = purchaseAssetInfo.tokenId;
      const fromTokenId = (parseInt(purchaseInfo.fromTokenId) + purchaseInfo.saleCnt).toString();
      // console.log("===== fromTokenId : "+ fromTokenId);
      const toTokenId = (parseInt(fromTokenId) + issueCnt-1).toString();
      // console.log("===== toTokenId : "+ toTokenId);

      const todayKST = new Date();
      const year = todayKST.getFullYear();
      const month = String(todayKST.getMonth() + 1).padStart(2, '0');
      const day = String(todayKST.getDate()).padStart(2, '0');
      const startDateString = `${year}-${month}-${day}`;  
      const startDate = new Date(startDateString);

      const isSameDate = (date1: Date, date2: Date) =>
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
      const state = isSameDate(startDttm, startDate) ? 'S2' : 'S1';  
  
      let data = { purchaseAssetNo, assetNo, productNo, marcketAssetName, marcketAssetDesc: createMarcketDto.marcketAssetDesc,
        saleAddr: user.nftWalletAddr, saleUserName: user.nickName, 
        creatroTokenId, resaleYn: 'Y', fromTokenId, toTokenId, price, issueCnt, inventoryCnt: issueCnt, 
        startDttm, endDttm, state, purchaseNo};

      // console.log("===== data : "+ JSON.stringify(data));
      const newMarcket = queryRunner.manager.create(Marcket, data);
      const result = await queryRunner.manager.save<Marcket>(newMarcket);
      const marcketNo = result.marcketNo;

      // purchase 수정
      const saleCnt = purchaseInfo.saleCnt + issueCnt;
      const inventoryCnt = purchaseInfo.purchaseCnt - saleCnt;
      let data1 = { resaleYn: 'Y', saleCnt, inventoryCnt};
      // console.log("===== data1 : "+ JSON.stringify(data1));
      await this.purchaseRepository.update(purchaseNo, data1);

      await queryRunner.commitTransaction();

      return { marcketNo };

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 판매 정보 조회
   * 
   * @param marcketNo 
   * @returns 
   */
  async getInfo(marcketNo: number): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {
      const marcket = await this.marcketRepository.findOne({ where:{marcketNo} });
      if (!marcket) {                         
        throw new NotFoundException("Data Not found. : 마켓 에셋 판매 정보");
      }

      const sql = this.marcketRepository.createQueryBuilder('marcket')
                      .leftJoin(Asset, 'asset', 'asset.asset_no = marcket.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .leftJoin(NftTransfer, 'transfer', 'marcket.from_token_id = transfer.token_id')
                      .select('marcket.marcket_no', 'marcketNo')
                      .addSelect('marcket.purchase_asset_no', 'purchaseAssetNo')
                      .addSelect('marcket.product_no', 'productNo')
                      .addSelect('marcket.asset_no', 'assetNo')
                      .addSelect('marcket.marcket_asset_name', 'marcketAssetName')
                      .addSelect('marcket.marcket_asset_desc', 'marcketAssetDesc')
                      .addSelect('marcket.sale_addr', 'saleAddr')
                      .addSelect(`'${process.env.BESU_EXPLORER}accounts/'  || marcket.sale_addr`, 'saleAddrUrl')
                      .addSelect('marcket.sale_user_name', 'saleUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.asset_url", 'assetUrl')
                      .addSelect("marcket.price", 'price')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('marcket.start_dttm', 'startDttm')
                      .addSelect('marcket.end_dttm', 'endDttm')
                      .addSelect('marcket.issue_cnt', 'issueCnt')                      
                      .addSelect('marcket.sale_cnt', 'saleCnt')                      
                      .addSelect('marcket.inventory_cnt', 'inventoryCnt') 
                      .addSelect('marcket.from_token_id', 'fromTokenId')     
                      .addSelect('marcket.to_token_id', 'toTokenId')    
                      .addSelect("fileAsset.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("fileAsset.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
                      .addSelect("fileAsset.file_name_third", 'fileNameThird')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_third)", 'fileUrlThird')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_third)", 'thumbnailThird')
                      .addSelect(`'${process.env.CONTRACT_ADDRESS}'`, 'nftContractAddress')
                      .addSelect(`'${process.env.BESU_EXPLORER}contracts/${process.env.CONTRACT_ADDRESS}'`, 'nftContractAddressUrl')
                      .addSelect('transfer.tx_id', 'nftTxId')
                      .addSelect(`'${process.env.BESU_EXPLORER}transactions/'  || transfer.tx_id`, 'nftTxIdUrl')
                      // .addSelect('transfer.token_id', 'nftTokenId')
                      // .addSelect("marcket.sale_addr", 'nftSellerAddr')
                      // .addSelect("marcket.purchase_addr", 'nftBuyerAddr')
                      .where("marcket.marcket_no = :marcketNo", { marcketNo })
                    // .andWhere("nftMint.use_yn = 'N'")
                    // .andWhere("nftMint.burn_yn = 'N'");

      const marcketInfo = await sql.groupBy(``)
                                      .getRawOne();

      const fromTokenId =  parseInt(marcketInfo.fromTokenId);
      const toTokenId =  parseInt(marcketInfo.toTokenId);
      // console.log(fromTokenId);
      // console.log(toTokenId);

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

      // console.log(transferList);

      const transferIds = transferList.map(item => item.token_id);
      // console.log(transferIds);
      const missingIds = [];
      for (let id = fromTokenId; id <= toTokenId; id++) {
        console.log(id);
        if (!transferIds.includes(id.toString())) {
          // console.log("추가 : "+id);
          missingIds.push(id);
        }
      }
      // console.log("missingIds : "+missingIds);
    
      let mintList: any[] = [];
      if (missingIds.length > 0) {
        mintList = await this.nftMintRepository.createQueryBuilder("mint")
                                    .select(["mint.token_id", "mint.issued_to"])
                                    .where("mint.token_id IN (:...missingIds)", { missingIds })
                                    .getRawMany();
      }

      // console.log(mintList);

      const combinedList = [
        ...(transferList || []).map(item => ({ tokenId: item.token_id, ownerAddress: item.to_addr,
           ownerAddressUrl: `${process.env.BESU_EXPLORER}accounts/${item.to_addr}` })),
        ...(mintList || []).map(item => ({ tokenId: item.token_id, ownerAddress: item.issued_to, 
          ownerAddressUrl: `${process.env.BESU_EXPLORER}accounts/${item.issued_to}` }))
      ];
    
      const sortedCombinedList = combinedList.sort((a, b) => {
        return a.tokenId - b.tokenId; 
      });
    
      marcketInfo.tokenInfo = sortedCombinedList;

      return marcketInfo;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }  

  /**
   * 판매 목록 조회
   * @param getMarcketDto 
   */
  async getSaleList(getMarcketDto: GetMarcketDto): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getMarcketDto.getOffset();
    const take = getMarcketDto.getLimit();
    const word = getMarcketDto.word;

    let options = `marcket.use_yn='Y' and marcket.state='S2'`;
    if (word) {
        // options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
        options += ` and ( marcket.marcket_asset_name like '%${word}%' or asset.asset_desc like '%${word}%'
          or asset.asset_name like '%${word}%' or asset.type_def like '%${word}%' ) `;
    }
  
    // console.log("options : "+options);

    try {
        const sql = this.marcketRepository.createQueryBuilder('marcket')
                      .leftJoin(Asset, 'asset', 'asset.asset_no = marcket.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .select('marcket.marcket_no', 'marcketNo')
                      .addSelect('marcket.purchase_asset_no', 'purchaseAssetNo')
                      .addSelect('marcket.marcket_asset_name', 'marcketAssetName')
                      .addSelect('marcket.sale_addr', 'saleAddr')
                      .addSelect(`'${process.env.BESU_EXPLORER}accounts/'  || marcket.sale_addr`, 'saleAddrUrl')
                      .addSelect('marcket.sale_user_name', 'saleUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.asset_url", 'assetUrl')
                      .addSelect("marcket.price", 'price')
                      .addSelect("marcket.inventory_cnt", 'inventoryCnt')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('marcket.start_dttm', 'startDttm')
                      .addSelect('marcket.end_dttm', 'endDttm')
                      .addSelect("fileAsset.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("fileAsset.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
                      .addSelect("fileAsset.file_name_third", 'fileNameThird')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_third)", 'fileUrlThird')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_third)", 'thumbnailThird')
                      .where(options);


        const list = await sql.orderBy('marcket.marcket_no', getMarcketDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .offset(skip)
                              .limit(take)
                              .groupBy(`marcket.marcket_no, marcket.purchase_asset_no, asset.price, asset.asset_name,
                                asset.asset_desc, marcket.marcket_asset_name, asset.asset_url, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
                                fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
                                fileAsset.file_path_second, fileAsset.thumbnail_second, fileAsset.file_name_third,
                                fileAsset.file_path_third, fileAsset.thumbnail_third`)
                              .getRawMany();

        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getMarcketDto.pageSize, list);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

    /**
   * 판매 정보 조회 (마이페이지)
   * @param user
   * @param marcketNo 
   * @returns 
   */
    async getMyInfo(user: User, marcketNo: number): Promise<any> {

      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
  
      try {
        const saleAddr = user.nftWalletAddr;
        const marcket = await this.marcketRepository.findOne({ where:{marcketNo, saleAddr} });
        if (!marcket) {                         
          throw new NotFoundException("Data Not found. : 마켓 에셋 판매 정보");
        }
  
        const sql = this.marcketRepository.createQueryBuilder('marcket')
                        .leftJoin(Asset, 'asset', 'asset.asset_no = marcket.asset_no')
                        .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                        .leftJoin(State, 'state', 'state.state = marcket.state')
                        .leftJoin(NftTransfer, 'transfer', 'marcket.from_token_id = transfer.token_id')
                        // .leftJoin(Purchase, 'purchase', 'marcket.purchase_asset_no = ANY(marcket.purchase_asset_no)')
                        .select('marcket.marcket_no', 'marcketNo')
                        .addSelect('marcket.purchase_asset_no', 'purchaseAssetNo')
                        .addSelect('marcket.purchase_no', 'purchaseNo')
                        .addSelect('marcket.product_no', 'productNo')
                        .addSelect('marcket.asset_no', 'assetNo')
                        .addSelect('marcket.marcket_asset_name', 'marcketAssetName')
                        .addSelect('marcket.marcket_asset_desc', 'marcketAssetDesc')
                        .addSelect('marcket.sale_addr', 'saleAddr')
                        .addSelect(`'${process.env.BESU_EXPLORER}accounts/'  || marcket.sale_addr`, 'saleAddrUrl')
                        .addSelect('marcket.sale_user_name', 'saleUserName')
                        .addSelect("asset.asset_name", 'assetName')
                        .addSelect("asset.asset_desc", 'assetDesc')
                        .addSelect("asset.asset_url", 'assetUrl')
                        .addSelect("marcket.price", 'price')
                        .addSelect("asset.metaverse_name", 'metaverseName')
                        .addSelect("asset.type_def", 'typeDef')
                        .addSelect('marcket.start_dttm', 'startDttm')
                        .addSelect('marcket.end_dttm', 'endDttm')
                        .addSelect('marcket.reg_dttm', 'regDttm')
                        .addSelect('marcket.use_yn', 'useYn')
                        .addSelect('marcket.state', 'state')                        
                        .addSelect('state.state_desc', 'stateDesc')
                        .addSelect('marcket.issue_cnt', 'issueCnt')                      
                        .addSelect('marcket.sale_cnt', 'saleCnt')                      
                        .addSelect('marcket.inventory_cnt', 'inventoryCnt') 
                        .addSelect('marcket.from_token_id', 'fromTokenId')     
                        .addSelect('marcket.to_token_id', 'toTokenId')     
                        .addSelect("fileAsset.file_name_first", 'fileNameFirst')
                        .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
                        .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
                        .addSelect("fileAsset.file_name_second", 'fileNameSecond')
                        .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
                        .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
                        .addSelect("fileAsset.file_name_third", 'fileNameThird')
                        .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_third)", 'fileUrlThird')
                        .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_third)", 'thumbnailThird')  
                        .addSelect(`'${process.env.CONTRACT_ADDRESS}'`, 'nftContractAddress')
                        .addSelect(`'${process.env.BESU_EXPLORER}contracts/${process.env.CONTRACT_ADDRESS}'`, 'nftContractAddressUrl')
                        .addSelect('transfer.tx_id', 'nftTxId')
                        .addSelect(`'${process.env.BESU_EXPLORER}transactions/'  || transfer.tx_id`, 'nftTxIdUrl')
                        // .addSelect('transfer.token_id', 'nftTokenId')
                        // .addSelect("ARRAY_AGG(purchase.token_id)", 'nftTokenIdAry')
                        // .addSelect("marcket.sale_addr", 'nftSellerAddr')
                        // .addSelect("marcket.purchase_addr", 'nftBuyerAddr')
                        .where("marcket.marcket_no = :marcketNo", { marcketNo })
                      // .andWhere("nftMint.use_yn = 'N'")
                      // .andWhere("nftMint.burn_yn = 'N'");
  
        const marcketInfo = await sql.groupBy(``)
                                        .getRawOne();

        const fromTokenId =  parseInt(marcketInfo.fromTokenId);
        const toTokenId =  parseInt(marcketInfo.toTokenId);
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
  
        // console.log(transferList);
  
        const transferIds = transferList.map(item => item.token_id);
        console.log(transferIds);
        const missingIds = [];
        for (let id = fromTokenId; id <= toTokenId; id++) {
          console.log(id);
          if (!transferIds.includes(id.toString())) {
            // console.log("추가 : "+id);
            missingIds.push(id);
          }
        }
        // console.log("missingIds : "+missingIds);
      
        let mintList: any[] = [];
        if (missingIds.length > 0) {
          mintList = await this.nftMintRepository.createQueryBuilder("mint")
                                      .select(["mint.token_id", "mint.issued_to"])
                                      .where("mint.token_id IN (:...missingIds)", { missingIds })
                                      .getRawMany();
        }

        // console.log(mintList);

        const combinedList = [
          ...(transferList || []).map(item => ({ tokenId: item.token_id, ownerAddress: item.to_addr,
            ownerAddressUrl: `${process.env.BESU_EXPLORER}accounts/${item.to_addr}` })),
          ...(mintList || []).map(item => ({ tokenId: item.token_id, ownerAddress: item.issued_to,
            ownerAddressUrl: `${process.env.BESU_EXPLORER}accounts/${item.issued_to}` }))
        ];
      
        const sortedCombinedList = combinedList.sort((a, b) => {
          return a.tokenId - b.tokenId; 
        });
        
        marcketInfo.tokenInfo = sortedCombinedList;
                                                                          
        return marcketInfo;
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    } 
  
  /**
   * 판매 목록 조회 (마이페이지)
   * @param user 
   * @param getMarcketDto 
   */
  async getSaleMyList(user: User, getMarcketDto: GetMarcketDto): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getMarcketDto.getOffset();
    const take = getMarcketDto.getLimit();
    const word = getMarcketDto.word;
    const purchaseAddr = user.nftWalletAddr;
    const startDttm = getMarcketDto.startDttm;
    const endDttm = getMarcketDto.endDttm;
    const state = getMarcketDto.state;

    let options = `marcket.sale_addr = '${purchaseAddr}'`;
    if (word) {
        // options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
        options += ` and ( marcket.marcket_asset_name like '%${word}%' or asset.asset_desc like '%${word}%'
         or asset.asset_name like '%${word}%' or asset.type_def like '%${word}%' ) `;
    }
    if (state) {
      options += ` and marcket.state = '${state}'`;
    }
    if (startDttm) {
      if(endDttm){
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and marcket.reg_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        options += ` and marcket.reg_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }else{
        options += ` and marcket.reg_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
      }
    }else{
      if(endDttm){
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and marcket.reg_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }
    }

    // console.log("options : "+options);

    try {
        const sql = this.marcketRepository.createQueryBuilder('marcket')
                      .leftJoin(Asset, 'asset', 'asset.asset_no = marcket.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .leftJoin(State, 'state', 'state.state = marcket.state')
                      .select('marcket.marcket_no', 'marcketNo')
                      .addSelect('marcket.purchase_asset_no', 'purchaseAssetNo')
                      .addSelect('marcket.marcket_asset_name', 'marcketAssetName')
                      .addSelect('marcket.sale_addr', 'saleAddr')
                      .addSelect(`'${process.env.BESU_EXPLORER}accounts/'  || marcket.sale_addr`, 'saleAddrUrl')
                      .addSelect('marcket.sale_user_name', 'saleUserName')                      
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.asset_url", 'assetUrl')
                      .addSelect("marcket.price", 'price')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('marcket.start_dttm', 'startDttm')
                      .addSelect('marcket.end_dttm', 'endDttm')
                      .addSelect('marcket.state', 'state')
                      .addSelect('state.state_desc', 'stateDesc')
                      .addSelect("fileAsset.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("fileAsset.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
                      .addSelect("fileAsset.file_name_third", 'fileNameThird')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_third)", 'fileUrlThird')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_third)", 'thumbnailThird')
                      .where(options);


        const list = await sql.orderBy('marcket.marcket_no', getMarcketDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .offset(skip)
                              .limit(take)
                              .groupBy(`marcket.marcket_no, marcket.purchase_asset_no, asset.price, asset.asset_name,
                                asset.asset_desc, marcket.marcket_asset_name, asset.asset_url, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
                                fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
                                fileAsset.file_path_second, fileAsset.thumbnail_second, fileAsset.file_name_third,
                                fileAsset.file_path_third, fileAsset.thumbnail_third, state.state_desc`)
                              .getRawMany();

        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getMarcketDto.pageSize, list);
0
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }  

}
