import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { EContract } from '../entities/contract.entity';
import { Product } from "../entities/product.entity";
import { Asset } from '../entities/asset.entity';
import { Purchase } from '../entities/purchase.entity';
import { State } from '../entities/state.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { User } from '../entities/user.entity';
import { NftService } from '../nft/nft.service';
import { ConfigService } from '@nestjs/config';
import { CreateContractDto } from '../dtos/create_contract.dto';
import { ModifyContractDto } from '../dtos/modify_contract.dto';
import { GetContractDto } from '../dtos/get_contract.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class ContractService {
  private logger = new Logger('ContractService');

  constructor(
    private configService: ConfigService,
    private nftService: NftService,

    @Inject('CONTRACT_REPOSITORY')
    private contractRepository: Repository<EContract>,

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
   * @param createContractDto 
   */
  async purchase(user: User, createContractDto: CreateContractDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const productNo = createContractDto.productNo;
      const assetNo = createContractDto.assetNo;
      // const toAddr = createContractDto.purchaseAddr.toLowerCase();     
      const toAddr = user.nftWalletAccount;
      const productInfo = await this.productRepository.findOne({ where:{productNo} });
      if (!productInfo) {
        throw new NotFoundException("Data Not found.: 굿즈");
      }

      const assetInfo = await this.assetRepository.findOne({ where:{assetNo} });
      if (!assetInfo) {
        throw new NotFoundException("Data Not found.: 에셋");
      }
      if (!assetInfo.tokenId) {
        throw new NotFoundException("Data Not Minted.: 에셋 NFT");
      }
      if (!assetInfo.vcId) {
        throw new NotFoundException("Data Not Issued.: 에셋 VC");
      }
      
      const fromAddr = assetInfo.regAddr;
      createContractDto['saleAddr'] = fromAddr;
      createContractDto['saleUserName'] = assetInfo.regName;

      createContractDto['tokenId'] = assetInfo.tokenId;
      createContractDto['purchaseAddr'] = toAddr;
      createContractDto['purchaseUserName'] = user.nickName;
      // createContractDto['startDttm'] = productInfo.startDttm;
      // createContractDto['endDttm'] = productInfo.endDttm;

      // console.log("===== createContractDto : "+JSON.stringify(createContractDto));
      // console.log("===== fromAddr : "+fromAddr);
     
      // Contract 저장
      // const createContract: CreateContractDto  = {...createContractDto, 
      //   purchaseAddr: toAddr
      // }

      const createContract: CreateContractDto  = {...createContractDto}
      // console.log("===== createContract : "+ JSON.stringify(createContract));
      
      const newContract = queryRunner.manager.create(EContract, createContract);
      const result = await queryRunner.manager.save<EContract>(newContract);
      const contractNo = result.contractNo;

      await queryRunner.commitTransaction();

      // nftService.createTransfer 호출
      const tokenId = assetInfo.tokenId;
      const nftTransferInfo: CreateTransferDto = {contractNo, marketNo: null, purchaseNo: null, fromAddr, toAddr, 
        assetNo, productNo, tokenId, purchaseCnt: 1, state: ''};
      this.nftService.createTransfer(user, nftTransferInfo);
      
    // console.log("===== nftTransferInfo : "+ JSON.stringify(nftTransferInfo));

      return { contractNo };

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
   * @param contractNo 
   * @returns 
   */
  // async getInfo(contractNo: number): Promise<any> {

  //   const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

  //   try {
  //     const contract = await this.contractRepository.findOne({ where:{contractNo} });
  //     if (!contract) {                         
  //       throw new NotFoundException("Data Not found. : 엔터사 구매 정보");
  //     }

  //     const sql = this.contractRepository.createQueryBuilder('contract')
  //                     .leftJoin(Asset, 'asset', 'asset.asset_no = contract.asset_no')
  //                     .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
  //                     .leftJoin(NftTransfer, 'transfer', 'contract.token_id = transfer.token_id')
  //                     .select('contract.contract_no', 'contractNo')
  //                     .addSelect('contract.product_no', 'productNo')
  //                     .addSelect('contract.asset_no', 'assetNo')
  //                     .addSelect('contract.purchase_addr', 'purchaseAddr')
  //                     .addSelect('contract.purchase_user_name', 'purchaseUserName')
  //                     .addSelect('contract.sale_addr', 'saleAddr')
  //                     .addSelect('contract.sale_user_name', 'saleUserName')
  //                     .addSelect("asset.asset_name", 'assetName')
  //                     .addSelect("asset.asset_desc", 'assetDesc')
  //                     .addSelect("asset.price", 'price')
  //                     .addSelect("asset.metaverse_name", 'metaverseName')
  //                     .addSelect("asset.type_def", 'typeDef')
  //                     .addSelect('contract.start_dttm', 'startDttm')
  //                     .addSelect('contract.end_dttm', 'endDttm')
  //                     .addSelect("fileAsset.file_name_first", 'fileNameFirst')
  //                     .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
  //                     .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
  //                     .addSelect("fileAsset.file_name_second", 'fileNameSecond')
  //                     .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
  //                     .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
  //                     .addSelect(process.env.CONTRACT_ADDRESS, 'nftContractAddress')
  //                     .addSelect('transfer.tx_id', 'nftTxId')
  //                     .addSelect('transfer.token_id', 'nftTokenId')
  //                     .addSelect("contract.sale_addr", 'nftSellerAddr')
  //                     .addSelect("contract.purchase_addr", 'nftBuyerAddr')
  //                     .where("contract.contract_no = :contractNo", { contractNo })
  //                   // .andWhere("nftMint.use_yn = 'N'")
  //                   // .andWhere("nftMint.burn_yn = 'N'");

  //     const contractInfo = await sql.groupBy(``)
  //                                     .getRawOne();

  //     return contractInfo;

  //   } catch (e) {
  //     this.logger.error(e);
  //     throw e;
  //   }
  // }  

  /**
   * 구매 목록 조회
   * @param getContractDto 
   */
//   async getPurchaseList(getContractDto: GetContractDto): Promise<any> {

//     const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
//     const skip = getContractDto.getOffset();
//     const take = getContractDto.getLimit();
//     const word = getContractDto.word;

//     let options = `contract.use_yn='Y' and contract.state='P3'
//      and contract.sale_state='S2'`;
//     if (word) {
//         options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
//     }
  
//     console.log("options : "+options);

//     try {
//         const sql = this.contractRepository.createQueryBuilder('contract')
//                       .leftJoin(Asset, 'asset', 'asset.asset_no = contract.asset_no')
//                       .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
//                       .select('contract.contract_no', 'contractNo')
//                       .addSelect('contract.purchase_addr', 'purchaseAddr')
//                       .addSelect('contract.purchase_user_name', 'purchaseUserName')
//                       .addSelect('contract.sale_addr', 'saleAddr')
//                       .addSelect('contract.sale_user_name', 'saleUserName')
//                       .addSelect("asset.asset_name", 'assetName')
//                       .addSelect("asset.asset_desc", 'assetDesc')
//                       .addSelect("asset.price", 'price')
//                       .addSelect("asset.metaverse_name", 'metaverseName')
//                       .addSelect("asset.type_def", 'typeDef')
//                       .addSelect('contract.start_dttm', 'startDttm')
//                       .addSelect('contract.end_dttm', 'endDttm')
//                       .addSelect("fileAsset.file_name_first", 'fileNameFirst')
//                       .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_first)", 'fileUrlFirst')
//                       .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'thumbnailFirst')
//                       .addSelect("fileAsset.file_name_second", 'fileNameSecond')
//                       .addSelect("concat('"  + serverDomain  + "/', fileAsset.file_path_second)", 'fileUrlSecond')
//                       .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_second)", 'thumbnailSecond')
//                       .where(options);


//         const list = await sql.orderBy('contract.contract_no', getContractDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
//                               .offset(skip)
//                               .limit(take)
//                               .groupBy(`contract.contract_no, asset.price, asset.asset_name,
//                                 asset.asset_desc, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
//                                 fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
//                                 fileAsset.file_path_second, fileAsset.thumbnail_second`)
//                               .getRawMany();

//         const totalCount = await sql.getCount(); 

//         return new PageResponse(totalCount, getContractDto.pageSize, list);
// 0
//     } catch (e) {
//       this.logger.error(e);
//       throw e;
//     }
//   }

    /**
   * 구매 정보 조회 (마이페이지)
   * @param user
   * @param contractNo 
   * @returns 
   */
    async getMyInfo(user: User, contractNo: number): Promise<any> {

      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
  
      try {
        const userNo = user.userNo;
        const contract = await this.contractRepository.findOne({ where:{contractNo} });
        if (!contract) {                         
          throw new NotFoundException("Data Not found. : 엔터사 구매 정보");
        }
  
        const sql = this.contractRepository.createQueryBuilder('contract')
                        .leftJoin(Asset, 'asset', 'asset.asset_no = contract.asset_no')
                        .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                        .leftJoin(State, 'state', 'state.state = contract.state')
                        .leftJoin(NftTransfer, 'transfer', 'contract.token_id = transfer.token_id')
                        .select('contract.contract_no', 'contractNo')
                        .addSelect('contract.product_no', 'productNo')
                        .addSelect('contract.asset_no', 'assetNo')
                        .addSelect('contract.purchase_addr', 'purchaseAccount')
                        .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || contract.purchase_addr`, 'purchaseAccountUrl')
                        .addSelect('contract.purchase_user_name', 'purchaseUserName')
                        .addSelect('contract.sale_addr', 'saleAccount')
                        .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || contract.sale_addr`, 'saleAccountUrl')
                        .addSelect('contract.sale_user_name', 'saleUserName')
                        .addSelect("asset.asset_name", 'assetName')
                        .addSelect("asset.asset_desc", 'assetDesc')
                        .addSelect("asset.asset_url", 'assetUrl')
                        .addSelect("asset.price", 'price')
                        .addSelect("asset.metaverse_name", 'metaverseName')
                        .addSelect("asset.type_def", 'typeDef')
                        // .addSelect('contract.start_dttm', 'startDttm')
                        // .addSelect('contract.end_dttm', 'endDttm')
                        .addSelect('contract.reg_dttm', 'regDttm')
                        .addSelect('contract.pay_dttm', 'payDttm')
                        .addSelect('contract.use_yn', 'useYn')
                        .addSelect('contract.state', 'state')
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
                        .addSelect('asset.vc_id', 'assetVcId')    
                        .addSelect(`'${process.env.CONTRACT_ADDRESS}'`, 'nftContractAddress')
                        .addSelect(`'${process.env.BC_EXPLORER}address/${process.env.CONTRACT_ADDRESS}'`, 'nftContractAddressUrl')
                        .addSelect('transfer.tx_id', 'nftTxId')
                        .addSelect(`'${process.env.BC_EXPLORER}tx/'  || transfer.tx_id`, 'nftTxIdUrl')
                        .addSelect('transfer.token_id', 'nftTokenId')
                        .addSelect("contract.sale_addr", 'nftSellerAccount')
                        .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || contract.sale_addr`, 'nftSellerAccountUrl')
                        .addSelect("contract.purchase_addr", 'nftBuyerAccount')
                        .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || contract.purchase_addr`, 'nftBuyerAccountUrl')
                        .where("contract.contract_no = :contractNo", { contractNo })
                      // .andWhere("nftMint.use_yn = 'N'")
                      // .andWhere("nftMint.burn_yn = 'N'");
  
        const contractInfo = await sql.groupBy(``)
                                        .getRawOne();
  
        return contractInfo;
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    } 
  
  /**
   * 구매 목록 조회 (마이페이지)
   * @param user 
   * @param getContractDto 
   */
  async getPurchaseMyList(user: User, getContractDto: GetContractDto): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getContractDto.getOffset();
    const take = getContractDto.getLimit();
    const word = getContractDto.word;
    const purchaseAddr = user.nftWalletAccount;
    const startDttm = getContractDto.startDttm;
    const endDttm = getContractDto.endDttm;
    const state = getContractDto.state;

    // let options = `contract.purchase_addr = '${purchaseAddr}' and contract.state='P3'`;
    let options = `contract.purchase_addr = '${purchaseAddr}'`;
    if (word) {
        // options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
        options += ` and ( asset.asset_desc like '%${word}%' or asset.asset_name like '%${word}%' or asset.type_def like '%${word}%' ) `;
    }
    if (state) {
      options += ` and contract.state = '${state}'`;
    }
    if (startDttm) {
      if(endDttm){
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and contract.pay_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        options += ` and contract.pay_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }else{
        options += ` and contract.pay_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
      }
    }else{
      if(endDttm){
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and contract.pay_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }
    }

    console.log("options : "+options);

    try {
        const sql = this.contractRepository.createQueryBuilder('contract')
                      .leftJoin(Asset, 'asset', 'asset.asset_no = contract.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .leftJoin(State, 'state', 'state.state = contract.state')
                      .select('contract.contract_no', 'contractNo')
                      .addSelect('contract.purchase_addr', 'purchaseAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || contract.purchase_addr`, 'purchaseAccountUrl')
                      .addSelect('contract.purchase_user_name', 'purchaseUserName')
                      .addSelect('contract.sale_addr', 'saleAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || contract.sale_addr`, 'saleAccountUrl')
                      .addSelect('contract.sale_user_name', 'saleUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.price", 'price')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      // .addSelect('contract.start_dttm', 'startDttm')
                      // .addSelect('contract.end_dttm', 'endDttm')
                      .addSelect('contract.pay_dttm', 'payDttm')
                      .addSelect('contract.state', 'state')
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
                      .addSelect('asset.vc_id', 'assetVcId') 
                      .where(options);


        const list = await sql.orderBy('contract.contract_no', getContractDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .offset(skip)
                              .limit(take)
                              .groupBy(`contract.contract_no, asset.price, asset.asset_name,
                                asset.asset_desc, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
                                fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
                                fileAsset.file_path_second, fileAsset.thumbnail_second, fileAsset.file_name_third,
                                fileAsset.file_path_third, fileAsset.thumbnail_third, state.state_desc, asset.vc_id`)
                              .getRawMany();

        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getContractDto.pageSize, list);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 사용자 에셋 판매 등록용 에셋 구매 등록
   * 
   * @param user 
   * @param createContractDto 
   */
  async purchaseSale(user: User, createContractDto: CreateContractDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const productNo = createContractDto.productNo;
      const assetNo = createContractDto.assetNo;
      // const toAddr = createContractDto.purchaseAddr.toLowerCase();     
      const toAddr = user.nftWalletAccount;
      const productInfo = await this.productRepository.findOne({ where:{productNo} });
      if (!productInfo) {
        throw new NotFoundException("Data Not found.: 굿즈");
      }

      const assetInfo = await this.assetRepository.findOne({ where:{assetNo} });
      if (!assetInfo) {
        throw new NotFoundException("Data Not found.: 에셋");
      }
    
      // if (!assetInfo.tokenId) {
      //   throw new NotFoundException("Data Not Minted.: 에셋 NFT");
      // }
      // if (!assetInfo.vcId) {
      //   throw new NotFoundException("Data Not Issued.: 에셋 VC");
      // }
      
      const fromAddr = assetInfo.regAddr;
      createContractDto['saleAddr'] = fromAddr;
      createContractDto['saleUserName'] = assetInfo.regName;

      createContractDto['tokenId'] = assetInfo.tokenId;
      createContractDto['purchaseAddr'] = toAddr;
      createContractDto['purchaseUserName'] = user.nickName;

      createContractDto['state'] = 'P3';

      const createContract: CreateContractDto  = {...createContractDto}
      // console.log("===== createContract : "+ JSON.stringify(createContract));
      
      const newContract = queryRunner.manager.create(EContract, createContract);
      const result = await queryRunner.manager.save<EContract>(newContract);
      const contractNo = result.contractNo;

      await queryRunner.commitTransaction();

      return { contractNo };

    } catch (e) {
      // await queryRunner.rollbackTransaction();
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

}
