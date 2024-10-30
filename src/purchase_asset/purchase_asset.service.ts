import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { PurchaseAsset } from '../entities/purchase_asset.entity';
import { Product } from "../entities/product.entity";
import { Asset } from '../entities/asset.entity';
import { Purchase } from '../entities/purchase.entity';
import { State } from '../entities/state.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { User } from '../entities/user.entity';
import { NftService } from '../nft/nft.service';
import { ConfigService } from '@nestjs/config';
import { CreatePurchaseAssetDto } from '../dtos/create_purchase_asset.dto';
import { ModifyPurchaseAssetDto } from '../dtos/modify_purchase_asset.dto';
import { GetPurchaseAssetDto } from '../dtos/get_purchase_asset.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class PurchaseAssetService {
  private logger = new Logger('PurchaseAssetService');

  constructor(
    private configService: ConfigService,
    private nftService: NftService,

    @Inject('PURCHASE_ASSET_REPOSITORY')
    private purchaseAssetRepository: Repository<PurchaseAsset>,

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
   * 에셋 구매 등록
   * 
   * @param user 
   * @param createPurchaseAssetDto 
   */
  async purchase(user: User, createPurchaseAssetDto: CreatePurchaseAssetDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const productNo = createPurchaseAssetDto.productNo;
      const assetNo = createPurchaseAssetDto.assetNo;
      const toAddr = createPurchaseAssetDto.purchaseAddr.toLowerCase();
      const productInfo = await this.productRepository.findOne({ where:{productNo} });
      if (!productInfo) {
        throw new NotFoundException("Data Not found.: 굿즈");
      }

      const assetInfo = await this.assetRepository.findOne({ where:{assetNo} });
      if (!assetInfo) {
        throw new NotFoundException("Data Not found.: 에셋");
      }
      if (!assetInfo.tokenId) {
        throw new NotFoundException("Data Not Minted.: 에셋");
      }
      const fromAddr = assetInfo.regAddr;
      createPurchaseAssetDto['saleAddr'] = fromAddr;
      createPurchaseAssetDto['saleUserName'] = assetInfo.regName;

      createPurchaseAssetDto['tokenId'] = assetInfo.tokenId;
      // createPurchaseAssetDto['startDttm'] = productInfo.startDttm;
      // createPurchaseAssetDto['endDttm'] = productInfo.endDttm;

      // console.log("===== createPurchaseAssetDto : "+JSON.stringify(createPurchaseAssetDto));
      // console.log("===== fromAddr : "+fromAddr);
     
      // PurchaseAsset 저장
      const createPurchaseAsset: CreatePurchaseAssetDto  = {...createPurchaseAssetDto, 
        purchaseAddr: toAddr
      }
      // console.log("===== createPurchaseAsset : "+ JSON.stringify(createPurchaseAsset));
      
      const newPurchaseAsset = queryRunner.manager.create(PurchaseAsset, createPurchaseAsset);
      const result = await queryRunner.manager.save<PurchaseAsset>(newPurchaseAsset);
      const purchaseAssetNo = result.purchaseAssetNo;

      await queryRunner.commitTransaction();

      // nftService.createTransfer 호출
      const tokenId = assetInfo.tokenId;
      const nftTransferInfo: CreateTransferDto = {purchaseAssetNo, marcketNo: null, purchaseNo: null, fromAddr, toAddr, 
        assetNo, productNo, tokenId, purchaseCnt: 1, state: ''};
      this.nftService.createTransfer(user, nftTransferInfo);
      
    // console.log("===== nftTransferInfo : "+ JSON.stringify(nftTransferInfo));

      return { purchaseAssetNo };

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
   * @param purchaseAssetNo 
   * @returns 
   */
  // async getInfo(purchaseAssetNo: number): Promise<any> {

  //   const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

  //   try {
  //     const purchaseAsset = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
  //     if (!purchaseAsset) {                         
  //       throw new NotFoundException("Data Not found. : 엔터사 구매 정보");
  //     }

  //     const sql = this.purchaseAssetRepository.createQueryBuilder('purchaseAsset')
  //                     .leftJoin(Asset, 'asset', 'asset.asset_no = purchaseAsset.asset_no')
  //                     .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
  //                     .leftJoin(NftTransfer, 'transfer', 'purchaseAsset.token_id = transfer.token_id')
  //                     .select('purchaseAsset.purchase_asset_no', 'purchaseAssetNo')
  //                     .addSelect('purchaseAsset.product_no', 'productNo')
  //                     .addSelect('purchaseAsset.asset_no', 'assetNo')
  //                     .addSelect('purchaseAsset.purchase_addr', 'purchaseAddr')
  //                     .addSelect('purchaseAsset.purchase_user_name', 'purchaseUserName')
  //                     .addSelect('purchaseAsset.sale_addr', 'saleAddr')
  //                     .addSelect('purchaseAsset.sale_user_name', 'saleUserName')
  //                     .addSelect("asset.asset_name", 'assetName')
  //                     .addSelect("asset.asset_desc", 'assetDesc')
  //                     .addSelect("asset.price", 'price')
  //                     .addSelect("asset.metaverse_name", 'metaverseName')
  //                     .addSelect("asset.type_def", 'typeDef')
  //                     .addSelect('purchaseAsset.start_dttm', 'startDttm')
  //                     .addSelect('purchaseAsset.end_dttm', 'endDttm')
  //                     .addSelect("fileAsset.file_name_first", 'fileNameFirst')
  //                     .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
  //                     .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
  //                     .addSelect("fileAsset.file_name_second", 'fileNameSecond')
  //                     .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
  //                     .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
  //                     .addSelect(process.env.CONTRACT_ADDRESS, 'nftContractAddress')
  //                     .addSelect('transfer.tx_id', 'nftTxId')
  //                     .addSelect('transfer.token_id', 'nftTokenId')
  //                     .addSelect("purchaseAsset.sale_addr", 'nftSellerAddr')
  //                     .addSelect("purchaseAsset.purchase_addr", 'nftBuyerAddr')
  //                     .where("purchaseAsset.purchase_asset_no = :purchaseAssetNo", { purchaseAssetNo })
  //                   // .andWhere("nftMint.use_yn = 'N'")
  //                   // .andWhere("nftMint.burn_yn = 'N'");

  //     const purchaseAssetInfo = await sql.groupBy(``)
  //                                     .getRawOne();

  //     return purchaseAssetInfo;

  //   } catch (e) {
  //     this.logger.error(e);
  //     throw e;
  //   }
  // }  

  /**
   * 구매 목록 조회
   * @param getPurchaseAssetDto 
   */
//   async getPurchaseList(getPurchaseAssetDto: GetPurchaseAssetDto): Promise<any> {

//     const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
//     const skip = getPurchaseAssetDto.getOffset();
//     const take = getPurchaseAssetDto.getLimit();
//     const word = getPurchaseAssetDto.word;

//     let options = `purchaseAsset.use_yn='Y' and purchaseAsset.state='P3'
//      and purchaseAsset.sale_state='S2'`;
//     if (word) {
//         options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
//     }
  
//     console.log("options : "+options);

//     try {
//         const sql = this.purchaseAssetRepository.createQueryBuilder('purchaseAsset')
//                       .leftJoin(Asset, 'asset', 'asset.asset_no = purchaseAsset.asset_no')
//                       .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
//                       .select('purchaseAsset.purchase_asset_no', 'purchaseAssetNo')
//                       .addSelect('purchaseAsset.purchase_addr', 'purchaseAddr')
//                       .addSelect('purchaseAsset.purchase_user_name', 'purchaseUserName')
//                       .addSelect('purchaseAsset.sale_addr', 'saleAddr')
//                       .addSelect('purchaseAsset.sale_user_name', 'saleUserName')
//                       .addSelect("asset.asset_name", 'assetName')
//                       .addSelect("asset.asset_desc", 'assetDesc')
//                       .addSelect("asset.price", 'price')
//                       .addSelect("asset.metaverse_name", 'metaverseName')
//                       .addSelect("asset.type_def", 'typeDef')
//                       .addSelect('purchaseAsset.start_dttm', 'startDttm')
//                       .addSelect('purchaseAsset.end_dttm', 'endDttm')
//                       .addSelect("fileAsset.file_name_first", 'fileNameFirst')
//                       .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
//                       .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
//                       .addSelect("fileAsset.file_name_second", 'fileNameSecond')
//                       .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
//                       .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
//                       .where(options);


//         const list = await sql.orderBy('purchaseAsset.purchase_asset_no', getPurchaseAssetDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
//                               .offset(skip)
//                               .limit(take)
//                               .groupBy(`purchaseAsset.purchase_asset_no, asset.price, asset.asset_name,
//                                 asset.asset_desc, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
//                                 fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
//                                 fileAsset.file_path_second, fileAsset.thumbnail_second`)
//                               .getRawMany();

//         const totalCount = await sql.getCount(); 

//         return new PageResponse(totalCount, getPurchaseAssetDto.pageSize, list);
// 0
//     } catch (e) {
//       this.logger.error(e);
//       throw e;
//     }
//   }

    /**
   * 구매 정보 조회 (마이페이지)
   * @param user
   * @param purchaseAssetNo 
   * @returns 
   */
    async getMyInfo(user: User, purchaseAssetNo: number): Promise<any> {

      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
  
      try {
        const userNo = user.userNo;
        const purchaseAsset = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
        if (!purchaseAsset) {                         
          throw new NotFoundException("Data Not found. : 엔터사 구매 정보");
        }
  
        const sql = this.purchaseAssetRepository.createQueryBuilder('purchaseAsset')
                        .leftJoin(Asset, 'asset', 'asset.asset_no = purchaseAsset.asset_no')
                        .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                        .leftJoin(State, 'state', 'state.state = purchaseAsset.state')
                        .leftJoin(NftTransfer, 'transfer', 'purchaseAsset.token_id = transfer.token_id')
                        .select('purchaseAsset.purchase_asset_no', 'purchaseAssetNo')
                        .addSelect('purchaseAsset.product_no', 'productNo')
                        .addSelect('purchaseAsset.asset_no', 'assetNo')
                        .addSelect('purchaseAsset.purchase_addr', 'purchaseAddr')
                        .addSelect('purchaseAsset.purchase_user_name', 'purchaseUserName')
                        .addSelect('purchaseAsset.sale_addr', 'saleAddr')
                        .addSelect('purchaseAsset.sale_user_name', 'saleUserName')
                        .addSelect("asset.asset_name", 'assetName')
                        .addSelect("asset.asset_desc", 'assetDesc')
                        .addSelect("asset.price", 'price')
                        .addSelect("asset.metaverse_name", 'metaverseName')
                        .addSelect("asset.type_def", 'typeDef')
                        // .addSelect('purchaseAsset.start_dttm', 'startDttm')
                        // .addSelect('purchaseAsset.end_dttm', 'endDttm')
                        .addSelect('purchaseAsset.reg_dttm', 'regDttm')
                        .addSelect('purchaseAsset.pay_dttm', 'payDttm')
                        .addSelect('purchaseAsset.use_yn', 'useYn')
                        .addSelect('purchaseAsset.state', 'state')
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
                        .addSelect(`'${process.env.CONTRACT_ADDRESS}'`, 'nftContractAddress')
                        .addSelect('transfer.tx_id', 'nftTxId')
                        .addSelect('transfer.token_id', 'nftTokenId')
                        .addSelect("purchaseAsset.sale_addr", 'nftSellerAddr')
                        .addSelect("purchaseAsset.purchase_addr", 'nftBuyerAddr')
                        .where("purchaseAsset.purchase_asset_no = :purchaseAssetNo", { purchaseAssetNo })
                      // .andWhere("nftMint.use_yn = 'N'")
                      // .andWhere("nftMint.burn_yn = 'N'");
  
        const purchaseAssetInfo = await sql.groupBy(``)
                                        .getRawOne();
  
        return purchaseAssetInfo;
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    } 
  
  /**
   * 구매 목록 조회 (마이페이지)
   * @param user 
   * @param getPurchaseAssetDto 
   */
  async getPurchaseMyList(user: User, getPurchaseAssetDto: GetPurchaseAssetDto): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getPurchaseAssetDto.getOffset();
    const take = getPurchaseAssetDto.getLimit();
    const word = getPurchaseAssetDto.word;
    const purchaseAddr = user.nftWalletAddr;
    const startDttm = getPurchaseAssetDto.startDttm;
    const endDttm = getPurchaseAssetDto.endDttm;
    const state = getPurchaseAssetDto.state;

    let options = `purchaseAsset.purchase_addr = '${purchaseAddr}' and purchaseAsset.state='P3'`;
    if (word) {
        options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
    }
    if (state) {
      options += ` and purchaseAsset.state = '${state}'`;
    }
    if (startDttm) {
      if(endDttm){
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and purchaseAsset.pay_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        options += ` and purchaseAsset.pay_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }else{
        options += ` and purchaseAsset.pay_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
      }
    }else{
      if(endDttm){
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and purchaseAsset.pay_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }
    }

    console.log("options : "+options);

    try {
        const sql = this.purchaseAssetRepository.createQueryBuilder('purchaseAsset')
                      .leftJoin(Asset, 'asset', 'asset.asset_no = purchaseAsset.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .leftJoin(State, 'state', 'state.state = purchaseAsset.state')
                      .select('purchaseAsset.purchase_asset_no', 'purchaseAssetNo')
                      .addSelect('purchaseAsset.purchase_addr', 'purchaseAddr')
                      .addSelect('purchaseAsset.purchase_user_name', 'purchaseUserName')
                      .addSelect('purchaseAsset.sale_addr', 'saleAddr')
                      .addSelect('purchaseAsset.sale_user_name', 'saleUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.price", 'price')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      // .addSelect('purchaseAsset.start_dttm', 'startDttm')
                      // .addSelect('purchaseAsset.end_dttm', 'endDttm')
                      .addSelect('purchaseAsset.pay_dttm', 'payDttm')
                      .addSelect('purchaseAsset.state', 'state')
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


        const list = await sql.orderBy('purchaseAsset.purchase_asset_no', getPurchaseAssetDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .offset(skip)
                              .limit(take)
                              .groupBy(`purchaseAsset.purchase_asset_no, asset.price, asset.asset_name,
                                asset.asset_desc, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
                                fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
                                fileAsset.file_path_second, fileAsset.thumbnail_second, fileAsset.file_name_third,
                                fileAsset.file_path_third, fileAsset.thumbnail_third, state.state_desc`)
                              .getRawMany();

        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getPurchaseAssetDto.pageSize, list);
0
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

}
