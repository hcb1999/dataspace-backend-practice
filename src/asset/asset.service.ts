import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, MoreThan } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { Creator } from '../entities/creator.entity';
import { File } from '../entities/file.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { AssetType } from "../entities/asset_type.entity";
import { State } from "../entities/state.entity";
import { Metaverse } from "../entities/metaverse.entity";
import { NftWallet } from "../entities/nft_wallet.entity";
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { ConfigService } from '@nestjs/config';
import { CreateAssetDto } from '../dtos/create_asset.dto';
import { ModifyAssetDto } from '../dtos/modify_asset.dto';
import { GetAssetDto } from '../dtos/get_asset.dto';
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { CreateMintDto } from '../dtos/create_mint.dto';
import { CreateBurnDto } from '../dtos/create_burn.dto';
import { NftService } from '../nft/nft.service';
import { PageResponse } from 'src/common/page.response';
import { PurchaseAsset } from 'src/entities/purchase_asset.entity';

@Injectable()
export class AssetService {
  private logger = new Logger('AssetService');

  constructor(
    private configService: ConfigService,
    private nftService: NftService,

    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('STATE_REPOSITORY')
    private stateRepository: Repository<State>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

    @Inject('NFT_TRANSFER_REPOSITORY')
    private nftTransferRepository: Repository<NftTransfer>,

    @Inject('PRODUCT_REPOSITORY')
    private productRepository: Repository<Product>,

    @Inject('METAVERSE_REPOSITORY')
    private metaverseRepository: Repository<Metaverse>,

    @Inject('ASSET_TYPE_REPOSITORY')
    private assetTypeRepository: Repository<AssetType>,

    @Inject('CREATOR_REPOSITORY')
    private creatorRepository: Repository<Creator>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) { }

  /**
   * 에셋 정보 등록
   * 
   * @param user 
   * @param files 
   * @param createAssetDto 
   */
  async create(user: User, files: any, createAssetDto: CreateAssetDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
    
      const address = user.nftWalletAddr;
      const productNo = createAssetDto.productNo;
      const metaverseNo = createAssetDto.adTarget;
      const metaverseAssetTypeNo = createAssetDto.adType;
      const productInfo = await this.productRepository.findOne({ where:{productNo} });
      if (!productInfo) {
        throw new NotFoundException("Data Not found. : 굿즈");
      }
      const metaverseInfo = await this.metaverseRepository.findOne({ where:{metaverseNo} });
      if (!metaverseInfo) {
        throw new NotFoundException("Data Not found. : 굿즈 메타버스 업체");
      }      
      const assetTypeInfo = await this.assetTypeRepository.findOne({ where:{metaverseNo, metaverseAssetTypeNo} });
      if (!assetTypeInfo) {
        throw new NotFoundException("Data Not found. : 굿즈 메타버스 업체별 에셋 분류");
      }

      const userNo = user.userNo;
      // const addr = user.nftWalletAddr;
      // console.log("===== userNo : "+ userNo);
      // console.log("===== addr : "+ addr);
      const creatorInfo = await this.creatorRepository.findOne({ where:{userNo} });
      if (!creatorInfo) {
        const creatorInfo1 = {userNo};

        // console.log("===== creator : "+ JSON.stringify(creatorInfo1));
        const newCreator = queryRunner.manager.create(Creator, creatorInfo1);
        const result = await queryRunner.manager.save<Creator>(newCreator);
      }

      // console.log("=========== file 갯수 : "+files.length)
      // if (!files) {
      //   throw new BadRequestException("파일 미입력");
      // }

      if (files) {
        let fileNameFirst = '';
        let fileTypeFirst = '';
        let filePathFirst = '';
        let fileSizeFirst = 0;
        let fileHashFirst = '';
        let thumbnailFirst = '';
        let fileNameSecond = '';
        let fileTypeSecond = '';
        let filePathSecond = '';
        let fileSizeSecond = 0;
        let fileHashSecond = '';
        let thumbnailSecond = '';
        let fileNameThird = '';
        let fileTypeThird = '';
        let filePathThird = '';
        let fileSizeThird = 0;
        let fileHashThird = '';
        let thumbnailThird = '';
        // 에셋 파일 정보 저장
        const promises = files.map(async (file:any, index:any) => { 
          // console.log("=== index : "+index+", file : "+JSON.stringify(file));
          if(index == 0){
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameFirst = file.fileName;
            fileTypeFirst = file.fileType;
            filePathFirst = file.filePath;
            fileSizeFirst = file.fileSize;
            fileHashFirst = file.fileHash;
            if(file.thumbnail) {
              thumbnailFirst = file.thumbnail;
            }
          } else if (index == 1) {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameSecond = file.fileName;
            fileTypeSecond = file.fileType;
            filePathSecond = file.filePath;
            fileSizeSecond = file.fileSize;
            fileHashSecond = file.fileHash;
            if (file.thumbnail) {
              thumbnailSecond = file.thumbnail;
            }
          } else {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameThird = file.fileName;
            fileTypeThird = file.fileType;
            filePathThird = file.filePath;
            fileSizeThird = file.fileSize;
            fileHashThird = file.fileHash;
            if (file.thumbnail) {
              thumbnailThird = file.thumbnail;
            }
          }

        // Hash값 체크
        // const fileRepo = await this.fileRepository.find({ where:{fileHash} });
        // if(fileRepo && fileRepo.length){
        //   throw new ConflictException("동일한 파일 존재");
        // }
        })

        let fileInfo = {fileNameFirst, filePathFirst, fileSizeFirst, fileTypeFirst, fileHashFirst, thumbnailFirst,
          fileNameSecond, filePathSecond, fileSizeSecond, fileTypeSecond, fileHashSecond, thumbnailSecond,
          fileNameThird, filePathThird, fileSizeThird, fileTypeThird, fileHashThird, thumbnailThird};

        // console.log("=== fileInfo : "+JSON.stringify(fileInfo));
        const newFile = queryRunner.manager.create(FileAsset, fileInfo);
        await queryRunner.manager.save<FileAsset>(newFile);
        createAssetDto['fileNo'] = newFile.fileNo;
        // console.log("===  fileNo : "+newFile.fileNo);
        // console.log("createAssetDto : "+JSON.stringify(createAssetDto));
      }

      // 에셋 정보 저장
      createAssetDto['userNo'] = userNo;
      createAssetDto['regName'] = user.nickName;
      createAssetDto['regAddr'] = user.nftWalletAddr;
      // createAssetDto['assetName'] =  productInfo.productName;
      createAssetDto['metaverseName'] =  metaverseInfo.metaverseName;
      createAssetDto['typeDef'] =  assetTypeInfo.typeDef;
      
      console.log("createAssetDto : "+JSON.stringify(createAssetDto));
      const newAsset = queryRunner.manager.create(Asset, createAssetDto);
      const result = await queryRunner.manager.save<Asset>(newAsset);
      const assetNo = result.assetNo;
      
      await queryRunner.commitTransaction();

      // nftService.createMint 호출
      const nftMintInfo: CreateMintDto = {assetNo, productNo, issuedTo: address, 
        issueCnt: 1, tokenId: null, state: 'B1', marcketNo: null};
      this.nftService.createMint(user, nftMintInfo);
      
      // console.log("===== nftMintInfo : "+ JSON.stringify(nftMintInfo));

      return { assetNo };

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 에셋 정보 수정   //반드시 mint 전에만 가능.
   * 
   * @param user 
   * @param assetNo
   * @param files
   * @param modifyAssetDto 
   */
  async update(user: User, assetNo: number, files: any, modifyAssetDto: ModifyAssetDto): Promise<void> {
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      const userNo = user.userNo;
      const assetInfo = await this.assetRepository.findOne({ where:{assetNo, userNo} });
      if (!assetInfo) {
        throw new NotFoundException("Data Not found.");
      }

      const metaverseNo = modifyAssetDto.adTarget;
      const metaverseAssetTypeNo = modifyAssetDto.adType;
      if(metaverseNo && metaverseAssetTypeNo){
        const metaverseInfo = await this.metaverseRepository.findOne({ where:{metaverseNo} });
        if (!metaverseInfo) {
          throw new NotFoundException("Data Not found. : 굿즈 메타버스 업체");
        }
        const assetTypeInfo = await this.assetTypeRepository.findOne({ where:{metaverseNo, metaverseAssetTypeNo} });
        if (!assetTypeInfo) {
          throw new NotFoundException("Data Not found. : 굿즈 메타버스 업체별 에셋 분류");
        }
        modifyAssetDto['metaverseName'] =  metaverseInfo.metaverseName;
        modifyAssetDto['typeDef'] =  assetTypeInfo.typeDef;
      }
      if (assetInfo.state !== "S1") {
        const statetInfo = await this.stateRepository.findOne({ where:{state : assetInfo.state} });
        if (statetInfo) {
          throw new NotFoundException("Already on "+statetInfo.stateDesc+".");
        }
      }

      if (files) {
        let fileNameFirst = '';
        let fileTypeFirst = '';
        let filePathFirst = '';
        let fileSizeFirst = 0;
        let fileHashFirst = '';
        let thumbnailFirst = '';
        let fileNameSecond = '';
        let fileTypeSecond = '';
        let filePathSecond = '';
        let fileSizeSecond = 0;
        let fileHashSecond = '';
        let thumbnailSecond = '';
        let fileNameThird = '';
        let fileTypeThird = '';
        let filePathThird = '';
        let fileSizeThird = 0;
        let fileHashThird = '';
        let thumbnailThird = '';
        // 에셋 파일 정보 저장
        const promises = files.map(async (file:any, index:any) => { 
          // console.log("=== index : "+index+", file : "+JSON.stringify(file));
          if(index == 0){
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameFirst = file.fileName;
            fileTypeFirst = file.fileType;
            filePathFirst = file.filePath;
            fileSizeFirst = file.fileSize;
            fileHashFirst = file.fileHash;
            if(file.thumbnail) {
              thumbnailFirst = file.thumbnail;
            }
          } else if (index == 1) {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameSecond = file.fileName;
            fileTypeSecond = file.fileType;
            filePathSecond = file.filePath;
            fileSizeSecond = file.fileSize;
            fileHashSecond = file.fileHash;
            if (file.thumbnail) {
              thumbnailSecond = file.thumbnail;
            }
          } else {
            // console.log("=== index : "+index+", file : "+JSON.stringify(file));
            fileNameThird = file.fileName;
            fileTypeThird = file.fileType;
            filePathThird = file.filePath;
            fileSizeThird = file.fileSize;
            fileHashThird = file.fileHash;
            if (file.thumbnail) {
              thumbnailThird = file.thumbnail;
            }
          }

        // Hash값 체크
        // const fileRepo = await this.fileRepository.find({ where:{fileHash} });
        // if(fileRepo && fileRepo.length){
        //   throw new ConflictException("동일한 파일 존재");
        // }
        })

        let fileInfo = {fileNameFirst, filePathFirst, fileSizeFirst, fileTypeFirst, fileHashFirst, thumbnailFirst,
          fileNameSecond, filePathSecond, fileSizeSecond, fileTypeSecond, fileHashSecond, thumbnailSecond,
          fileNameThird, filePathThird, fileSizeThird, fileTypeThird, fileHashThird, thumbnailThird};

        const newFile = queryRunner.manager.create(FileAsset, fileInfo);
        await queryRunner.manager.save<FileAsset>(newFile);
        modifyAssetDto['fileNo'] = newFile.fileNo;
        // console.log("===  fileNo : "+newFile.fileNo);
        // console.log("modifyAssetDto : "+JSON.stringify(modifyAssetDto));
      }
     
      // console.log("=============== modifyAssetDto :"+JSON.stringify(modifyAssetDto));
      await queryRunner.manager.update(Asset, assetNo, modifyAssetDto);

      await queryRunner.commitTransaction();
     
    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 에셋 정보 삭제 
   * 
   * @param user 
   * @param assetNo 
   */
  async delete(user: User, assetNo: number): Promise<any> {
    
    try {

      const userNo = user.userNo;
      const assetInfo = await this.assetRepository.findOne({ where:{assetNo, userNo} });

      if (!assetInfo) {
        throw new NotFoundException("Data Not found. : 에셋");
      }

      if (assetInfo.state === "S4" || assetInfo.state === "S5") {
        const statetInfo = await this.stateRepository.findOne({ where:{state : assetInfo.state} });
        if (statetInfo) {
          throw new NotFoundException("Already on "+statetInfo.stateDesc+".");
        }
      }

      const productNo = assetInfo.productNo;
      const nftMintInfo = await this.nftMintRepository.findOne({ where:{assetNo, productNo} });
      if (!nftMintInfo) {
        throw new NotFoundException("Data Not found. : NFT 민트 정보");
      }

      const tokenId = assetInfo.tokenId;
      if(tokenId){

        // nftService.createBurn 호출
        const nftBurnInfo: CreateBurnDto = {assetNo, productNo, issuedTo: '', tokenId, state: ''};
        this.nftService.createBurn(user, nftBurnInfo);
        
        // console.log("===== nftBurnInfo : "+ JSON.stringify(nftBurnInfo));
      }else{
      // 에셋 상태 정보 수정(민트 안된 에셋). 
      const data = { useYn: 'N' };
      await this.assetRepository.update(assetNo, data);
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 에셋 판매중지하기
   * 
   * @param user 
   * @param assetNo 
   */
  async updateStop(user: User, assetNo: number): Promise<void> {

    try {

      const userNo = user.userNo;
      const assetInfo = await this.assetRepository.findOne({ where:{assetNo, userNo} });

      if (!assetInfo) {
        throw new NotFoundException("Data Not found. : 에셋");
      }

      // 에셋 상태 정보 수정
      const data = { state: 'S3' };
      await this.assetRepository.update(assetNo, data);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 에셋 정보 조회 (마이페이지)
   * 
   * @param user 
   * @param assetNo 
   * @returns 
   */
  async getMyInfo(user: User, assetNo: number): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {
      const userNo = user.userNo;
      const asset = await this.assetRepository.findOne({ where:{assetNo, userNo} });
      if (!asset) {
        throw new NotFoundException("Data Not found. : 에셋");
      }

      // const mintInfo = await this.nftMintRepository.findOne({ where:{assetNo} });
      let assetInfo = null;

      const sql = this.assetRepository.createQueryBuilder('asset')
                      .leftJoin(State, 'state', 'asset.state = state.state')
                      .leftJoin(Product, 'product', 'asset.product_no = product.product_no')
                      .leftJoin(FileAsset, 'fileAsset', 'asset.file_no = fileAsset.file_no')
                      .leftJoin(File, 'file', 'product.file_no = file.file_no')
                      .leftJoin(NftMint, 'mint', 'asset.token_id = mint.token_id')
                      .leftJoin(NftTransfer, 'transfer', 'asset.token_id = transfer.token_id')
                      .select('asset.asset_no', 'assetNo')
                      .addSelect("asset.reg_addr", 'assetRegAddr')
                      .addSelect("asset.reg_name", 'assetRegName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.ad_target", 'adTarget')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.ad_type", 'adType')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect("product.product_no", 'productNo')
                      .addSelect("product.reg_addr", 'productRegAddr')
                      .addSelect('product.reg_name', 'productRegName')
                      .addSelect('product.product_name', 'productName')
                      .addSelect('asset.price', 'price')
                      .addSelect('asset.state', 'state')
                      .addSelect('state.state_desc', 'stateDesc')
                      .addSelect('asset.asset_desc', 'assetDesc')
                      .addSelect('asset.start_dttm', 'startDttm')
                      .addSelect('asset.end_dttm', 'endDttm')
                      .addSelect('asset.reg_dttm', 'regDttm')
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
                      .addSelect('mint.tx_id', 'nftTxId')
                      .addSelect('mint.token_id', 'nftTokenId')
                      .addSelect("transfer.from_addr", 'nftSellerAddr')
                      .addSelect("transfer.to_addr", 'nftBuyerAddr')
                      .where("asset.asset_no = :assetNo", { assetNo });
                      // .andWhere("nftMint.use_yn = 'N'")
                      // .andWhere("nftMint.burn_yn = 'N'");

      //console.log("assetNo : "+assetNo);
      // if (mintInfo) { 
      //         sql
      //             .innerJoin(NftMint, 'nftMint', 'asset.asset_no = nftMint.asset_no ')
      //             .addSelect("nftMint.contract_id", 'contractAddr')
      //             .addSelect("ARRAY_AGG(nftMint.token_idx)", 'tokenIdAry')
      //             .addSelect("ARRAY_AGG(nftMint.purchase_addr)", 'ownerAddrAry');

      //   assetInfo = await sql.groupBy(`asset.asset_no, assetState.state_no, file.file_no, user.user_no, nftMint.contract_id`)
      //                        .getRawOne();
      // }else{
        assetInfo = await sql.groupBy(`asset.asset_no, product.product_no, product.reg_addr, product.reg_name, 
          product.product_name, state.state_desc, file.file_name_first,
          file.file_path_first, file.thumbnail_first, fileAsset.file_no, mint.tx_id, mint.token_id,
          transfer.from_addr, transfer.to_addr`)
                           .getRawOne();

      // }

      return assetInfo;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 에셋 정보 조회
   * 
   * @param assetNo 
   * @returns 
   */
  async getInfo(assetNo: number): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {
      const asset = await this.assetRepository.findOne({ where:{assetNo} });
      if (!asset) {
        throw new NotFoundException("Data Not found. : 에셋");
      }

      // const mintInfo = await this.nftMintRepository.findOne({ where:{assetNo} });
      let assetInfo = null;
      
      const sql = this.assetRepository.createQueryBuilder('asset')
                      // .leftJoin(State, 'state', 'asset.state = state.state')
                      .leftJoin(Product, 'product', 'asset.product_no = product.product_no')
                      .leftJoin(FileAsset, 'fileAsset', 'asset.file_no = fileAsset.file_no')
                      .leftJoin(NftMint, 'mint', 'asset.token_id = mint.token_id')
                      .leftJoin(NftTransfer, 'transfer', 'asset.token_id = transfer.token_id')
                      .select('asset.asset_no', 'assetNo')
                      .addSelect("asset.reg_addr", 'assetRegAddr')
                      .addSelect("asset.reg_name", 'assetRegName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.ad_target", 'adTarget')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.ad_type", 'adType')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect("product.product_no", 'productNo')
                      .addSelect("product.reg_addr", 'productRegAddr')
                      .addSelect('product.reg_name', 'productRegName')
                      .addSelect('product.product_name', 'productName')
                      .addSelect('asset.price', 'price')
                      .addSelect('asset.asset_desc', 'assetDesc')
                      .addSelect('asset.start_dttm', 'startDttm')
                      .addSelect('asset.end_dttm', 'endDttm')
                      .addSelect('asset.reg_dttm', 'regDttm')
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
                      .addSelect('mint.tx_id', 'nftTxId')
                      .addSelect('mint.token_id', 'nftTokenId')
                      .addSelect("transfer.from_addr", 'nftSellerAddr')
                      .addSelect("transfer.to_addr", 'nftBuyerAddr')
                      .where("asset.asset_no = :assetNo", { assetNo });
                      // .andWhere("nftMint.use_yn = 'N'")
                      // .andWhere("nftMint.burn_yn = 'N'");

      //console.log("assetNo : "+assetNo);
      // if (mintInfo) { 
      //         sql
      //             .innerJoin(NftMint, 'nftMint', 'asset.asset_no = nftMint.asset_no ')
      //             .addSelect("nftMint.contract_id", 'contractAddr')
      //             .addSelect("ARRAY_AGG(nftMint.token_idx)", 'tokenIdAry')
      //             .addSelect("ARRAY_AGG(nftMint.purchase_addr)", 'ownerAddrAry');

      //   assetInfo = await sql.groupBy(`asset.asset_no, assetState.state_no, file.file_no, user.user_no, nftMint.contract_id`)
      //                        .getRawOne();
      // }else{
        assetInfo = await sql.groupBy(`asset.asset_no, product.product_no, product.reg_addr, product.reg_name,
           product.product_name, fileAsset.file_no, mint.token_id, mint.tx_id, transfer.from_addr, transfer.to_addr`)
                           .getRawOne();

      // }

      return assetInfo;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 에셋 정보 Metadata 조회
   * 
   * @param user
   * @param assetNo 
   * @returns 
   */
    // async getMetadataInfo(assetNo: number): Promise<any> {

    //   const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
  
    //   try {
  
    //     const sql = this.assetRepository.createQueryBuilder('asset')
    //                   .innerJoin(File, 'file', 'asset.file_no = file.file_no')
    //                   .select('asset.asset_name', 'name')
    //                   .addSelect('asset.desc', 'description')
    //                   .addSelect("concat('"  + serverDomain  + "/', file.file_path)", 'image')
    //                   // .addSelect("concat('"  + serverDomain  + "/', file.thumbnail)", 'thumbnail')
    //                   .where("asset.asset_no = :assetNo", { assetNo })
  
    //     const metadata = await sql.getRawOne();
    
    //     return metadata;
  
    //   } catch (e) {
    //     this.logger.error(e);
    //     throw e;
    //   }
    // }

  /**
   * 에셋 목록 조회
   * 
   * @param getAssetDto
   * @returns 
   */
  async getAssetList(getAssetDto: GetAssetDto): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getAssetDto.getOffset();
    const take = getAssetDto.getLimit();
    const advertiser = getAssetDto.advertiser;
    const adTarget = getAssetDto.adTarget;
    const creator = getAssetDto.creator;
    const state = getAssetDto.state;
    const startDttm = getAssetDto.startDttm;
    const endDttm = getAssetDto.endDttm;
    const word = getAssetDto.word;

    // let options = `asset.use_yn='Y'`;
    let options = `asset.use_yn='Y' AND asset.token_id IS NOT NULL AND asset.token_id != '' AND asset.sold_yn='N'`;
    if (advertiser) {
      options += ` and product.reg_name like '%${advertiser}%'`;
    }
    if (creator) {
      options += ` and asset.reg_name like '%${creator}%'`;
    }
    if (adTarget == 1) {
      options += ` and asset.ad_target = 1`;
    }else if (adTarget == 2) {
      options += ` and asset.ad_target = 2`;
    }else if (adTarget == 3) {
      options += ` and asset.ad_target = 3`;
    }

    if (startDttm) {
      if(endDttm){
        const endDttm = new Date(getAssetDto['endDttm']);
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and asset.start_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        options += ` and asset.end_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }else{
        options += ` and asset.start_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
      }
    }else{
      if(endDttm){
        const endDttm = new Date(getAssetDto['endDttm']);
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and asset.end_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }
    }

    if (state) {
      options += ` and asset.state = '${state}'`;
    }else{
      options += ` and asset.state='S2'`;
    }

    if (word) {
        options += ` and asset.asset_desc like '%${word}%'`;
    }
  
    console.log("options : "+options);
    console.log("skip : "+skip);
    console.log("take : "+take);

    try {
      const sql = this.assetRepository.createQueryBuilder('asset')
                            // .leftJoin(State, 'state', 'asset.state = state.state')
                      .leftJoin(Product, 'product', 'asset.product_no = product.product_no')
                      .leftJoin(FileAsset, 'fileAsset', 'asset.file_no = fileAsset.file_no')
                            // .innerJoin(NftMint, 'nftMint', 'asset.asset_no = nftMint.asset_no')
                      .select('asset.asset_no', 'assetNo')
                      // .addSelect("asset.reg_addr", 'regAddr')
                      .addSelect("asset.reg_name", 'assetRegName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.ad_target", 'adTarget')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.ad_type", 'adType')
                      .addSelect("asset.type_def", 'typeDef')
                      // .addSelect('product.reg_name', 'productRegName')
                      // .addSelect('product.product_name', 'productName')
                      .addSelect('asset.price', 'price')
                      .addSelect('asset.token_id', 'tokenId')
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
                      
      const list = await sql.orderBy('asset.asset_no', getAssetDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .groupBy(`asset.asset_no, product.reg_name, product.product_name, fileAsset.file_no`)
                            .offset(skip)
                            .limit(take)
                            .getRawMany();

      const totalCount = await sql.getCount(); 
      // console.log("totalCount : "+totalCount);
      // console.log("list : "+list.length);

      return new PageResponse(totalCount, getAssetDto.pageSize, list);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

    /**
   * 에셋 목록 조회 (마이페이지)
   * 
   * @param user 
   * @param getAssetDto
   * @returns 
   */
    async getAssetMyList(user: User, getAssetDto: GetAssetDto): Promise<any> {

      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
      const skip = getAssetDto.getOffset();
      const take = getAssetDto.getLimit();
      const advertiser = getAssetDto.advertiser;
      const adTarget = getAssetDto.adTarget;
      const creator = getAssetDto.creator;
      const state = getAssetDto.state;
      const startDttm = getAssetDto.startDttm;
      const endDttm = getAssetDto.endDttm;
      const word = getAssetDto.word;
      const userNo = user.userNo;
  
      let options = `1 =1 `;
      if (advertiser) {
        options += ` and product.reg_name like '%${advertiser}%'`;
      }
      if (creator) {
        options += ` and asset.reg_name like '%${creator}%'`;
      }
      if (adTarget == 1) {
        options += ` and asset.ad_target = 1`;
      }else if (adTarget == 2) {
        options += ` and asset.ad_target = 2`;
      }else if (adTarget == 3) {
        options += ` and asset.ad_target = 3`;
      }
  
      if (startDttm) {
        if(endDttm){
          const endDttm = new Date(getAssetDto['endDttm']);
          const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
          options += ` and asset.start_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
          options += ` and asset.end_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
        }else{
          options += ` and asset.start_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        }
      }else{
        if(endDttm){
          const endDttm = new Date(getAssetDto['endDttm']);
          const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
          options += ` and asset.end_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
        }
      }
  
      if (state) {
        options += ` and asset.state = '${state}'`;
      }
      if (word) {
          options += ` and asset.asset_desc like '%${word}%'`;
      }
    
      // console.log("options : "+options);
      // console.log("skip : "+skip);
      // console.log("take : "+take);

  
      try {
          const sql = this.assetRepository.createQueryBuilder('asset')
                          .leftJoin(State, 'state', 'asset.state = state.state')
                          .leftJoin(Product, 'product', 'asset.product_no = product.product_no')
                          .leftJoin(FileAsset, 'fileAsset', 'asset.file_no = fileAsset.file_no')
                          // .innerJoin(NftMint, 'nftMint', 'asset.asset_no = nftMint.asset_no')
                          .select('asset.asset_no', 'assetNo')
                          // .addSelect("asset.reg_addr", 'regAddr')
                          .addSelect("asset.reg_name", 'assetRegName')
                          .addSelect("asset.asset_name", 'assetName')
                          .addSelect("asset.ad_target", 'adTarget')
                          .addSelect("asset.metaverse_name", 'metaverseName')
                          .addSelect("asset.ad_type", 'adType')
                          .addSelect("asset.type_def", 'typeDef')
                          .addSelect('product.reg_name', 'productRegName')
                          .addSelect('product.product_name', 'productName')
                          .addSelect('asset.price', 'price')
                          .addSelect('asset.token_id', 'tokenId')
                          .addSelect('asset.state', 'state')
                          .addSelect('state.state_desc', 'stateDsec')
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

        sql.andWhere("asset.user_no = :userNo", { userNo });
                         
        const list = await sql.orderBy('asset.asset_no', getAssetDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                                .offset(skip)
                                .limit(take)
                                .groupBy(`state.state_desc, asset.asset_no, product.reg_name, product.product_name, fileAsset.file_no`)
                                .getRawMany();
  
        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getAssetDto.pageSize, list);
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    }

}