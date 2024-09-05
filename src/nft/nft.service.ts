import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between, In } from 'typeorm';
import { NftHttpService } from './nft.httpService';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import * as FormData from 'form-data'
import { join } from 'path';
import fs = require('fs');
import { ReadStream, createReadStream, readFileSync } from 'fs';
import path from 'path';
import { User } from '../entities/user.entity';
import { NftWallet } from '../entities/nft_wallet.entity';
import { NftMint } from '../entities/nft_mint.entity';
import { NftTransfer } from '../entities/nft_transfer.entity';
import { NftBurn } from '../entities/nft_burn.entity';
import { CreateMintDto } from '../dtos/create_mint.dto';
import { GetMintDto } from '../dtos/get_mint.dto';
import { CreateMintCallBackDto } from '../dtos/create_mint_callback.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { GetTransferDto } from '../dtos/get_transfer.dto';
import { v4 as uuid } from 'uuid';
import { CreateTransferCallBackDto } from '../dtos/create_transfer_callback.dto';
import { CreateBurnDto } from '../dtos/create_burn.dto';
import { CreateBurnCallBackDto } from '../dtos/create_burn_callback.dto';
import { ApiBasicAuth } from '@nestjs/swagger';
import { PageResponse } from 'src/common/page.response';
import { Asset } from "../entities/asset.entity";
import { File } from '../entities/file.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class NftService {
  private logger = new Logger('NftService');

  constructor(
    private configService: ConfigService,
    private nftHttpService: NftHttpService,

    // @InjectRepository(NftTokenRepository)
    // private nftTokenRepository: NftTokenRepository,

    @Inject('NFT_WALLET_REPOSITORY')
    private nftWalletRepository: Repository<NftWallet>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

    @Inject('NFT_TRANSFER_REPOSITORY')
    private nftTransferRepository: Repository<NftTransfer>,

    @Inject('NFT_BURN_REPOSITORY')
    private nftBurnRepository: Repository<NftBurn>,

    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ){}

  /**
   * NFT 토큰생성
   * 
   * @returns 
   */
  async createToken(): Promise<string> {    
    const accessKey = this.configService.get<string>('nft.accessKey');
    const secretKey = this.configService.get<string>('nft.secretKey');
    const expiresIn = this.configService.get<number>('nft.expiresIn');

    let token = '';
/*
    const nftTokenInfo = await this.nftTokenRepository.findOne({where:{nftTokenNo:1}});

    const path: string = '/svc/v2/auth-tokens';  
    const response: any = await this.nftHttpService.sendHttpRequest(path, createAuthTokenDto, "");
    console.log('auth-tokens response == ', response);
      
    if(response.result){
      const tokenInfo = {
        authTokenId: response.data.authToken.authTokenId,
        accountId: response.data.authToken.accountId,
        iamUserId: response.data.authToken.iamUserId,
        token: response.data.authToken.token,
        expiryAt: response.data.authToken.expiryAt
      }

      if(!nftTokenInfo){
        const newToken = await this.nftTokenRepository.create(tokenInfo);
        await this.nftTokenRepository.save(newToken);

        token = response.data.authToken.token; // token값
      } else {
        const nftTokenNo = nftTokenInfo.nftTokenNo;
        const newToken = JSON.parse(JSON.stringify(tokenInfo));
        await this.nftTokenRepository.update(nftTokenNo, newToken); 

        token = response.data.authToken.token; // token값
      }    
    }
*/
    return token;
  }

  /**
   * NFT 지갑 생성
   * 
   * @param userNo 
   * @param createDeoaDto 
   */
  async createWallet(user:User): Promise<void> {    
    // async createWallet(userNo:number, createDeoaDto: CreateDeoaDto): Promise<void> {
    /* 
    createDeoaDto.environmentId = this.configService.get<string>('nft.environmentId');
  
    const nftWalletInfo = await this.nftWalletRepository.findOne({where:{userNo}});
    if(!nftWalletInfo){
      const token = await this.createToken();
      const path: string = '/tx/v2.0/wallets';
      const response: any = await this.nftHttpService.sendHttpRequest(path, createDeoaDto, token);
      console.log('createWallet response => ', response);

      if(response.result){
        const walletInfo = {
          userNo: userNo,
          walletId: response.data.walletId,
          address: response.data.address
        }

        const wallet = await this.nftWalletRepository.create(walletInfo);
        await this.nftWalletRepository.save(wallet);
      }
    }
  */
  }

  /**
   * 미디어 생성
   * 
   * @param mediaType 
   * @param mediaNo 
   * @param filePath 
   * @returns 
   */
  async createMedia(mediaType:string, mediaNo: number, filePath:string): Promise<any> {    
    const token = await this.createToken();
    const path: string = '/svc/v2/nft/media';    // walletId
    const form: FormData = new FormData();
    
    //form.append('file', filestream); // 파일 업로드
    form.append('file', createReadStream(filePath));

    const response: any = await this.nftHttpService.sendHttpFormRequest(path, form, token);
    console.log('createMedia response => ', response);
    let mediaInfo = {
      mediaId: '',
      orgFileName: '',
      mimeType: '',
      size: 0,
      mediaUrl: ''
    }

    if(response.result){
      mediaInfo = {
        mediaId: response.data.id,
        orgFileName: response.data.originalFilename,
        mimeType: response.data.mimetype,
        size: response.data.size,
        mediaUrl: response.data.mediaUrl
      }
/*
      const media = await this.nftMediaRepository.create(mediaInfo);
      await this.nftMediaRepository.save(media);

      if(mediaType === 'product'){
        const prodNo = mediaNo;
        const mediaId = mediaInfo.mediaId;
        const mediaProductInfo = {prodNo, mediaId}

        console.log('mediaProductInfo => ', mediaProductInfo);
        
        const mediaProductList = await this.nftMediaProductRepository.find({where:{prodNo, useYn:'Y'}});
        if(mediaProductList){
          for(var i=0; i< mediaProductList.length; i++){
            const mediaProdKey = {prodNo, mediaId: mediaProductList[i].mediaId}
            await this.nftMediaProductRepository.update(mediaProdKey, {useYn:'N'}); 
          }
        }

        const mediaProduct = await this.nftMediaProductRepository.create(mediaProductInfo);
        await this.nftMediaProductRepository.save(mediaProduct);

      } else if(mediaType === 'item'){
        const itemNo = mediaNo;
        const mediaId = mediaInfo.mediaId;
        const mediaItemInfo = {itemNo, mediaId}

        const mediaItemList = await this.nftMediaItemRepository.find({where:{itemNo, useYn:'Y'}});
        if(mediaItemList){
          for(var i=0; i< mediaItemList.length; i++){
            const mediaItemKey = {itemNo, mediaId: mediaItemList[i].mediaId}
            await this.nftMediaItemRepository.update(mediaItemKey, {useYn:'N'}); 
          }
        }

        const mediaItem = await this.nftMediaItemRepository.create(mediaItemInfo);
        await this.nftMediaItemRepository.save(mediaItem);

      } else if(mediaType === 'avatar'){
        const avatarNo = mediaNo;
        const mediaId = mediaInfo.mediaId;
        const mediaAvatarInfo = {avatarNo, mediaId}

        const mediaAvatarList = await this.nftMediaAvatarRepository.find({where:{avatarNo, useYn:'Y'}});
        if(mediaAvatarList){
          for(var i=0; i< mediaAvatarList.length; i++){
            const mediaAvatarKey = {avatarNo, mediaId: mediaAvatarList[i].mediaId}
            await this.nftMediaAvatarRepository.update(mediaAvatarKey, {useYn:'N'}); 
          }
        }

        const mediaAvatar = await this.nftMediaAvatarRepository.create(mediaAvatarInfo);
        await this.nftMediaAvatarRepository.save(mediaAvatar);

      } else if(mediaType === 'video'){
        const videoNo = mediaNo;
        const mediaId = mediaInfo.mediaId;
        const mediaVideoInfo = {videoNo, mediaId}

        const mediaVideoList = await this.nftMediaVideoRepository.find({where:{videoNo, useYn:'Y'}});
        if(mediaVideoList){
          for(var i=0; i< mediaVideoList.length; i++){
            const mediaVideoKey = {videoNo, mediaId: mediaVideoList[i].mediaId}
            await this.nftMediaVideoRepository.update(mediaVideoKey, {useYn:'N'}); 
          }
        }

        const mediaVideo = await this.nftMediaVideoRepository.create(mediaVideoInfo);
        await this.nftMediaVideoRepository.save(mediaVideo);
        
      }
    }  
*/
    return mediaInfo;
  }

  }
  /**
   * 메타데이터 생성
   * 
   * @param createMetaDataDto 
   * @returns 
   */
/*
  async createMetaData(createMetaDataDto: CreateMetaDataDto): Promise<any> {  

    const token = await this.createToken();  
    const path: string = '/svc/v2/nft/metadata';    // metadata
    createMetaDataDto.maxMintLimit = 1;
    const response: any = await this.nftHttpService.sendHttpRequest(path, createMetaDataDto, token);
    console.log('createMetaData response => ', response);

    let mediaId = '';
    if(createMetaDataDto.image){
      mediaId = createMetaDataDto.image
    } else if(createMetaDataDto.media){
      mediaId = createMetaDataDto.media
    }

    let metadataInfo = null;
    if(response.result){
      metadataInfo = {
        metadataId: response.data.id,
        name: createMetaDataDto.name,
        createdBy: createMetaDataDto.createdBy,
        meidaId: mediaId,
        description: createMetaDataDto.description,
        maxMintLimit: createMetaDataDto.maxMintLimit,
        image: response.data.image,
        imageHash: response.data.imageHash,
        media: response.data.media,
        mediaHash: response.data.mediaHash,
        editionMax: response.data.editionMax,
        createdAt: response.data.createdAt,
        baseUri: response.data.baseUri
      }

      // const metadata = await this.nftMetaDataRepository.create(metadataInfo);
      // await this.nftMetaDataRepository.save(metadata);
    }

    return metadataInfo;

  }
*/

  /**
   * NFT Mint 생성
   * 
   * @param createMintDto 
   * @returns 
   */
  async createMint(user: User, createMintDto: CreateMintDto): Promise<void> {  

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      /*
      const userAddr = user.nftWalletAddr;
      const contractId = createMintDto.contractId;           

      const separatedValuesDto:string[] = createMintDto.tokenIdAry[0].split('_');
      const assetNoDto = parseInt(separatedValuesDto[0] || ''); 
      const productNoDto = parseInt(separatedValuesDto[1] || ''); 

      const productInfo = await queryRunner.manager.findOneBy(Product, {productNo:productNoDto, assetNo:assetNoDto});
      if (!productInfo) {
        throw new NotFoundException("Data Not found.");
      }
      
      if(productInfo.mintedYn === 'N') {
        let mint={};
        let assetNo=0;
        let productNo=0;
        let idx='';
        let separatedValues=[];  

      // 상품 정보 수정
        let data = { mintedYn: 'Y' }
        await queryRunner.manager.update(Product, {productNo:productNoDto, assetNo:assetNoDto}, data);

        for (const value of createMintDto.tokenIdAry) {
          separatedValues = value.split('_');
          assetNo = separatedValues[0] || ''; 
          productNo = separatedValues[1] || ''; 
          idx = separatedValues[2] || ''; 

          const mintInfo = await this.nftMintRepository.findOne({ where:{assetNo, productNo, tokenIdx:idx} });
          if (mintInfo) {
            // console.log("====== can't insert mint : "+JSON.stringify(mintInfo));
            break;
          }else{
            mint = {contractId, productNo, assetNo, issuedTo:userAddr, tokenIdx:idx, purchaseAddr:userAddr}
            // console.log("===== mint : "+JSON.stringify(mint));
            const newMint = queryRunner.manager.create<NftMint>(NftMint, mint);
            await queryRunner.manager.save<NftMint>(newMint);
          }    
        }

        await queryRunner.commitTransaction();   
      }
      */
      return null;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
        await queryRunner.release();
    }
  }

  /*
  async createMint(createMintDto: CreateMintDto): Promise<void> {  
    const domain = this.configService.get<string>('server.domain');
    const contractId = this.configService.get<string>('nft.contractId');
    createMintDto['callbackUrl'] = domain + '/nft/mint/token/callback';

    const token = await this.createToken();  
    const path: string = '/svc/v2/nft/contracts/' + contractId + '/tokens';
    console.log('createMint path => ', path );
    const response: any = await this.nftHttpService.sendHttpRequest(path, createMintDto, token);
    console.log('CreateMint response => ', response);
    
    createMintDto['contractId'] = contractId;
    // const mint = await this.nftMintRepository.create(createMintDto);
    // await this.nftMintRepository.save(mint);
    
    return response;
  }
 */

 /**
 * NFT Mint 목록 조회
 * @param user 
 * @param getMintDto 
 */
  async getMintList(user: User, getMintDto: GetMintDto): Promise<any> {
    try {
      const userAddr = user.nftWalletAddr;
      const skip = getMintDto.getOffset();
      const take = getMintDto.getLimit();
      const assetNo = getMintDto.assetNo;
      const tokenIdx = getMintDto.tokenIdx;
    
      const sql = this.nftMintRepository.createQueryBuilder()
                            .select('nft_mint_no', 'nftMintNo')
                            .addSelect('asset_no', 'assetNo')
                            .addSelect('issued_to', 'issuedTo')
                            .addSelect('token_idx', 'tokenIdx')
                            .addSelect('use_yn', 'useYn')
                            .where("issued_to = :userAddr", { userAddr });

      if (assetNo) {
        sql.andWhere('asset_no = :assetNo', { assetNo });
      }

      if (tokenIdx) {
        sql.andWhere('token_idx = :tokenIdx', { tokenIdx });
      }

      const list = await sql.orderBy('nft_mint_no', getMintDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .skip(skip)
                            .take(take)
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getMintDto.pageSize, list);

    } catch(e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 발행될 NFT token index 조회
   * 
   * @param user
   * @param count 
   * @returns 
   */
  async gettokenNewIdx(user: User, count: number): Promise<any> {

    try {
      let idxArray:number[] = [];

      // 민트 정보 조회
      const mintInfo = await this.nftMintRepository.findOne({ where:{}, order: { nftMintNo: 'DESC'} });
      let initTokenIdx = Number(mintInfo.tokenIdx);

      let i = 0;
      for (i; i < count; i++) {
        idxArray.push(++initTokenIdx); 
      }

      const  tokenIdAry = idxArray;
      return {tokenIdAry};

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 발행된 NFT token index 조회
   * 
   * @param user
   * @param assetNo 
   * @returns 
   */
  async gettokenIdx(user: User, assetNo: number): Promise<any> {

    try {

      // 민트 정보 조회
      const mintInfo = await this.nftMintRepository.findOne({ where:{assetNo, useYn:'N', burnYn:'N'}, order: { nftMintNo: 'ASC'} });
      if (!mintInfo) {
        throw new NotFoundException("Nft Mint Data Not found.");
      }

      return {tokenIdx : mintInfo.tokenIdx};

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 발행된 NFT token indexes 조회
   * 
   * @param user
   * @param assetNo 
   * @param productNo 
   * @param count 
   * @returns 
   */
    async tokenidx(user: User, assetNo: number, productNo: number, count: number): Promise<any> {

      try {

        let idxArray:string[] = [];
        // 민트 정보 조회
        const mintInfo = await this.nftMintRepository.findOne({ where:{assetNo, productNo, useYn:'N', burnYn:'N'} });
        if (!mintInfo) {
          throw new NotFoundException("Nft Mint Data Not found.");
        }

        // const userAddr = user.nftWalletAddr;
        const sql = this.nftMintRepository.createQueryBuilder()
                              .select('nft_mint_no', 'mintNo')
                              .addSelect('token_idx', 'tokenIdx')
                              .where("asset_no = :assetNo", { assetNo })
                              .where("product_no = :productNo", { productNo })
                              .andWhere("use_yn = :useYn", { useYn : 'N'})
                              .andWhere("burn_yn = :burnYn", { burnYn : 'N'})
  
        const list = await sql.orderBy('nft_mint_no', 'ASC')
                              .limit(count)
                              .getRawMany();

         // const tokenidxes = list.map(item => parseInt(item.mintNo)+"_"+parseInt(item.tokenIdx, 10));
        // console.log("============= tokenidxes"+JSON.stringify(tokenidxes));

         for (const tokenidx of list) {
          idxArray.push(tokenidx.tokenIdx); 
        }

        const  tokenIdAry = idxArray;
        return {tokenIdAry};
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    }

    /**
   * 발행된 NFT token indexes 조회
   * 
   * @param user
   * @param assetNo 
   * @param productNo 
   * @param count 
   * @returns 
   */
    async tokenidxes(user: User, assetNo: number, productNo: number, count: number): Promise<any> {

      try {
  
        // 민트 정보 조회
        const mintInfo = await this.nftMintRepository.findOne({ where:{assetNo, productNo, useYn:'N', burnYn:'N'} });
        if (!mintInfo) {
          throw new NotFoundException("Nft Mint Data Not found.");
        }

        // const userAddr = user.nftWalletAddr;
        const sql = this.nftMintRepository.createQueryBuilder()
                              .select('nft_mint_no', 'mintNo')
                              .addSelect('token_idx', 'tokenIdx')
                              .where("asset_no = :assetNo", { assetNo })
                              .where("product_no = :productNo", { productNo })
                              .andWhere("use_yn = :useYn", { useYn : 'N'})
                              .andWhere("burn_yn = :burnYn", { burnYn : 'N'})
  
        const list = await sql.orderBy('nft_mint_no', 'ASC')
                              .limit(count)
                              .getRawMany();

         // const tokenidxes = list.map(item => parseInt(item.mintNo)+"_"+parseInt(item.tokenIdx, 10));
        // console.log("============= tokenidxes"+JSON.stringify(tokenidxes));

        return list ;
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    }

  /**
   * 발행된 NFT token 정보 조회
   * 
   * @param user
   * @param tokenIdxes
   * @returns 
   */
  async getMints(tokenIdxes: string[]): Promise<any> {

    try {

      // 민트 정보 조회
      const list = await this.nftMintRepository.find({
        where: {
          tokenIdx: In(tokenIdxes),
        },
      });

      // console.log("============ mintInfo : "+JSON.stringify(list));
      return list;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * 발행된 NFT token index의 Metadata 조회
   * 
   * @param user
   * @param tokenIdx 
   * @returns 
   */
  async gettokenMetadata(user: User, tokenIdx: string): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {

      // 에셋 정보 조회
      const mintInfo = await this.nftMintRepository.findOne({ where:{tokenIdx} });
      if (!mintInfo) {
        throw new NotFoundException("NFT Token Index Not found.");
      }

      const assetNo = mintInfo.assetNo;
      // console.log("assetNo : "+assetNo);

      const assetInfo = await this.assetRepository.findOne({ where:{assetNo} });
      if (!assetInfo) {
        throw new NotFoundException("Asset with NFT Token Index Not found.");
      }

      // const metadata = await this.assetService.getMetadataInfo(mintInfo.assetNo);
      // if (!metadata) {
      //   throw new NotFoundException("Metadata not found.");
      // }

      const sql = this.assetRepository.createQueryBuilder('asset')
                      .innerJoin(File, 'file', 'asset.file_no = file.file_no')
                      .select('asset.asset_name', 'name')
                      .addSelect('asset.desc', 'description')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path)", 'image')
                      // .addSelect("concat('"  + serverDomain  + "/', file.thumbnail)", 'thumbnail')
                      .where("asset.asset_no = :assetNo", { assetNo })

      const metadata = await sql.getRawOne();
      // console.log("metadata : "+JSON.stringify(metadata));

      return {description:metadata.description, name:metadata.name, image:metadata.image};

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async createMintCallBack(createMintCallBackDto: CreateMintCallBackDto): Promise<void> {  
    const contractId = this.configService.get<string>('nft.contractId');
    const response: any = JSON.parse(JSON.stringify(createMintCallBackDto.data));
    console.log('createMintCallBackDto response ==> ', response);

    const issuedTo = response.token.issuedTo;
    const metadataId = response.token.metadata.id;

    const tokenId = response.token.tokenId;
    const resData = JSON.stringify(createMintCallBackDto.data);
    const mintData = {tokenId, resData};

    // this.nftMintRepository.update({contractId, metadataId, issuedTo}, mintData);
  }  

  /**
   * NFT 이전
   * @param user
   * @param createTransferDto 
   * @returns 
   */
  async createTransfer(user: User, createTransferDto: CreateTransferDto): Promise<void> {
    try {
      // delete createTransferDto.environmentId;
      // delete createTransferDto.contractAddress;
      // delete createTransferDto.callbackUrl;
      // delete createTransferDto.resData;
      const newTransfer = this.nftTransferRepository.create(createTransferDto);
      await this.nftTransferRepository.save(newTransfer);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }  

  /**
   * NFT Transfer 목록 조회
   * @param user 
   * @param getTransferDto 
   */
  async getTransferList(user: User, getTransferDto: GetTransferDto): Promise<any> {
    try {
      /*
      const userAddr = user.nftWalletAddr;
      const fromAddr = getTransferDto.fromAddr;
      const toAddr = getTransferDto.toAddr;
      const purchaseNo = getTransferDto.purchaseNo;
      const skip = getTransferDto.getOffset();
      const take = getTransferDto.getLimit();
    
      const sql = this.nftTransferRepository.createQueryBuilder('nftTransfer')
                            // .innerJoin(PurchaseToken, 'purchaseToken', 'nftTransfer.purchase_no = purchaseToken.purchase_no')
                            // .select('nftTransfer.nft_transfer_no', 'nftTransferNo')
                            .addSelect('nftTransfer.purchase_no', 'purchaseNo')
                            .addSelect('nftTransfer.from_addr', 'fromAddr')
                            .addSelect('nftTransfer.to_addr', 'toAddr')
                            // .addSelect("ARRAY_AGG(purchaseToken.token_idx)", 'tokenIdAry')
                            // .addSelect('token_idx', 'tokenIdx')
                            .where("1= 1");

      if (purchaseNo) {
        sql.andWhere('nftTransfer.purchase_no = :purchaseNo', { purchaseNo });
      }

      if (fromAddr) {
        sql.andWhere('nftTransfer.from_addr = :fromAddr', { fromAddr });
      }

      if (toAddr) {
        sql.andWhere('nftTransfer.to_addr = :toAddr', { toAddr });
      }

      const list = await sql.orderBy('nftTransfer.nft_transfer_no', getTransferDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .skip(skip)
                            .take(take)
                            .groupBy(`nftTransfer.nft_transfer_no`)   
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getTransferDto.pageSize, list);
      */
     return null;

    } catch(e) {
      this.logger.error(e);
      throw e;
    }
  }
  async transferToken(createTransferDto: CreateTransferDto): Promise<void> {
    const domain = this.configService.get<string>('server.domain');
    const environmentId = this.configService.get<string>('nft.environmentId');  
    const contractAddress = this.configService.get<string>('nft.contractAddress');
    const txId = uuid();

    createTransferDto['environmentId'] = environmentId;
    createTransferDto['contractAddress'] = contractAddress;
    createTransferDto['txId'] = txId;
    createTransferDto['callbackUrl'] = domain + '/nft/transfer/token/callback';
  
    const token = await this.createToken();  
    const path: string = '/svc/v2/nft/token/transfer';
    const response: any = await this.nftHttpService.sendHttpRequest(path, createTransferDto, token);
    console.log('createMetaData response => ', response);

    // transfer token 저장
    // const transferToken = await this.nftTransferRepository.create(createTransferDto);
    // await this.nftTransferRepository.save(transferToken);

    return response;
  }  

  async createTransferCallBack(createTransferCallBackDto: CreateTransferCallBackDto): Promise<void> {  
    console.log('createTransferCallBack ==> ', createTransferCallBackDto);

    let result = 'N';
    if(createTransferCallBackDto.result){
      result = 'Y';
    }  

    const data: any = JSON.parse(JSON.stringify(createTransferCallBackDto.data));
    const txId = data.txId;
    const resData = JSON.stringify(createTransferCallBackDto.data);

    // await this.nftTransferRepository.update(txId, {result, resData});
  }
  
  /**
   * NFT 소각(Nft Mint 정보 삭제 수정 및 NftBurn 저장)
   * @param user
   * @param createBurnDto 
   * @returns 
   */
  async createBurn(user: User, createBurnDto: CreateBurnDto): Promise<void> {
    try {
      // NFT 민트 정보 Update
       const assetNo = createBurnDto.assetNo;
       const mintInfo = await this.nftMintRepository.find({ where:{assetNo, useYn:'N', burnYn:'N'}, order: { nftMintNo: 'ASC'} });
       if (!mintInfo) {
         throw new NotFoundException("Nft Mint Data Not found.");
       }

       let idxArray=[];  // 소각되어야 하는 token Indexes
       const data = {burnYn: 'Y'};
       for (const mint of mintInfo) {
        // console.log("========== value : "+value.tokenIdx);
        idxArray.push(mint.tokenIdx);   
        // console.log("========== nftMintNo : "+nftMintNo+", idx : "+idx);
        await this.nftMintRepository.update(mint.nftMintNo, data);
      }

      // delete createBurnDto.environmentId;
      // delete createBurnDto.contractAddress;
      // delete createBurnDto.callbackUrl;
      // delete createBurnDto.resData;
      const newBurn = this.nftBurnRepository.create(createBurnDto);
      await this.nftBurnRepository.save(newBurn);
      
      // idxArray로 contract burn 호출

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  } 

    /**
   * 사용되지않은 NFT token index 조회
   * 
   * @param user
   * @param assetNo 
   * @returns 
   */
    async getBurntokenIdx(user: User, assetNo: number): Promise<any> {

      try {
  
         // 민트 정보 조회
         const mintInfo = await this.nftMintRepository.findOne({ where:{assetNo} });
         if (!mintInfo) {
           throw new NotFoundException("Nft Mint Data Not found.");
         }
 
         // const userAddr = user.nftWalletAddr;
         const sql = this.nftMintRepository.createQueryBuilder()
                               .select('nft_mint_no', 'mintNo')
                               .addSelect('token_idx', 'tokenIdx')
                               .where("asset_no = :assetNo", { assetNo })
                               .andWhere("use_yn = :useYn", { useYn : 'N'})
                               .andWhere("burn_yn = :burnYn", { burnYn : 'N'})
   
         const list = await sql.orderBy('nft_mint_no', 'ASC')
                               .getRawMany();
 
          // const tokenidxes = list.map(item => parseInt(item.mintNo)+"_"+parseInt(item.tokenIdx, 10));
         // console.log("============= tokenidxes"+JSON.stringify(tokenidxes));
 
         return list ;
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    }
  
  /**
   * 사용되지않은 NFT token index 조회
   * 
   * @param user
   * @param assetNo 
   * @returns 
   */
  async getBurntokenIdxes(user: User, assetNo: number): Promise<any> {

    try {

      let idxArray:string[] = [];
       // 민트 정보 조회
       const mintInfo = await this.nftMintRepository.findOne({ where:{assetNo} });
       if (!mintInfo) {
         throw new NotFoundException("Nft Mint Data Not found.");
       }

       // const userAddr = user.nftWalletAddr;
       const sql = this.nftMintRepository.createQueryBuilder()
                             .select('nft_mint_no', 'mintNo')
                             .addSelect('token_idx', 'tokenIdx')
                             .where("asset_no = :assetNo", { assetNo })
                             .andWhere("use_yn = :useYn", { useYn : 'N'})
                             .andWhere("burn_yn = :burnYn", { burnYn : 'N'})
 
       const list = await sql.orderBy('nft_mint_no', 'ASC')
                             .getRawMany();

        // const tokenidxes = list.map(item => parseInt(item.mintNo)+"_"+parseInt(item.tokenIdx, 10));
       // console.log("============= tokenidxes"+JSON.stringify(tokenidxes));

       for (const tokenidx of list) {
          idxArray.push(tokenidx.tokenIdx); 
        }

        const  tokenIdAry = idxArray;
        return {tokenIdAry};

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async createBurnCallBack(createTransferCallBackDto: CreateTransferCallBackDto): Promise<void> {  
    console.log('createBurnCallBack ==> ', createTransferCallBackDto);

    let result = 'N';
    if(createTransferCallBackDto.result){
      result = 'Y';
    }  

    const data: any = JSON.parse(JSON.stringify(createTransferCallBackDto.data));
    const txId = data.txId;
    const resData = JSON.stringify(createTransferCallBackDto.data);

    // await this.nftTransferRepository.update(txId, {result, resData});
  }

  /**
   * NFT Wallet 정보
   * 
   * @param userNo 
   * @returns 
   */
  async getWalletInfo(userNo: number): Promise<any> {
    // return await this.nftWalletRepository.findOne({where:{userNo}});
  }

  /**
   * NFT Wallet 정보 (광고주)
   * 
   * @param userNo 
   * @returns 
   */
  async getAdvWalletInfo(videoNo: number): Promise<any> {
    // return await this.nftWalletRepository.getAdvWalletInfo(videoNo);
  }

  /**
   * NFT 발급정보 (아이템)
   * @param itemNo
   * @param issuedTo 
   * @returns 
   */
  async getItemMintInfo(itemNo: number, issuedTo: string): Promise<any> {
    const contractId = this.configService.get<string>('nft.contractId');
    // return await this.nftMintRepository.getItemMintInfo(itemNo, issuedTo, contractId);
  }

  /**
   * NFT 발급정보 (광고 제품)
   * @param prodNo
   * @param issuedTo 
   * @returns 
   */
  async getProductMintInfo(prodNo: number, issuedTo: string): Promise<any> {
    const contractId = this.configService.get<string>('nft.contractId');
    // return await this.nftMintRepository.getProductMintInfo(prodNo, issuedTo, contractId);
  }

  /**
   * NFT 발급정보 (광고 아바타)
   * @param avatarNo
   * @param issuedTo 
   * @returns 
   */
  async getAvatarMintInfo(avatarNo: number, issuedTo: string): Promise<any> {
    const contractId = this.configService.get<string>('nft.contractId');
    // return await this.nftMintRepository.getAvatarMintInfo(avatarNo, issuedTo, contractId);
  }

  /**
   * NFT 발급정보 (광고 영상)
   * @param videoNo
   * @param issuedTo 
   * @returns 
   */
  async getVideoMintInfo(videoNo: number, issuedTo: string): Promise<any> {
    const contractId = this.configService.get<string>('nft.contractId');
    // return await this.nftMintRepository.getVideoMintInfo(videoNo, issuedTo, contractId);
  }

  async getOne(userNo: number): Promise<NftWallet> {
    try {
        const ret = await this.nftWalletRepository.findOne({ where:{userNo} });

        return ret;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async getOneByAddress(addr: string): Promise<NftWallet> {
    try {
        const ret = await this.nftWalletRepository.findOne({ where:{addr} });

        return ret;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
