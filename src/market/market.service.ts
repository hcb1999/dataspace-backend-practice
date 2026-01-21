import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { Market } from '../entities/market.entity';
import { Purchase } from '../entities/purchase.entity';
import { State } from '../entities/state.entity';
import { File } from '../entities/file.entity';
import { User } from '../entities/user.entity';
import { DidWallet } from '../entities/did_wallet.entity';
import { UserService } from '../user/user.service';
import { NftService } from '../nft/nft.service';
import { DidService } from '../did/did.service';
import { ConfigService } from '@nestjs/config';
import { CreateMarketDto} from '../dtos/create_market.dto';
import { ModifyMarketDto } from '../dtos/modify_market.dto';
import { GetMarketDto } from '../dtos/get_market.dto';
import { CreateMarketResaleDto} from '../dtos/create_market_resale.dto';
import { CreateMintDto } from '../dtos/create_mint.dto';
import { CreateUserDto } from '../dtos/create_user.dto';
import { CreateDidUserDto } from '../dtos/create_did_user.dto';
import { CreateDidWalletDto } from '../dtos/create_did_wallet.dto';
import { CreateBurnDto } from '../dtos/create_burn.dto';
import { NftWallet } from '../entities/nft_wallet.entity';
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
// import { createVC, parseVC } from 'src/common/vc-utils';
import { PageResponse } from 'src/common/page.response';
import { CreateDidVcDto } from '../dtos/create_did_vc.dto';
import { GetDidVcDto } from '../dtos/get_did_vc.dto';

@Injectable()
export class MarketService {
  private logger = new Logger('MarketService');

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private nftService: NftService,
    private didService: DidService,

    @Inject('MARKET_REPOSITORY')
    private marketRepository: Repository<Market>,

    @Inject('PURCHASE_REPOSITORY')
    private purchaseRepository: Repository<Purchase>,

    @Inject('STATE_REPOSITORY')
    private stateRepository: Repository<State>,

    @Inject('NFT_WALLET_REPOSITORY')
    private nftWalletRepository: Repository<NftWallet>,

    @Inject('DID_WALLET_REPOSITORY')
    private didWalletRepository: Repository<DidWallet>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

    @Inject('NFT_TRANSFER_REPOSITORY')
    private nftTransferRepository: Repository<NftTransfer>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,
  ) {}


  /**
   *  마켓 데이터 판매 등록
   * 
   * @param user 
   * @param files
   * @param createMarketSaleDto 
   */
  async create(
    user: User,
    files: any,
    createMarketDto: CreateMarketDto
  ): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
    //  const marketVcType = await this.marketRepository.findOne({ where:{userNo: user.userNo, marketVcType: createMarketDto.marketVcType} });
     // if (marketVcType) {
      //  throw new NotFoundException(`Data already founded. : 마켓 테이터 판매 정보 vcType ${createMarketDto.marketVcType}`);
     // }
      // const userNo = user.userNo;
      // const regName = user.nickName;
      // const regAddr = user.nftWalletAccount;
      // const marketDataName = createMarketDto.marketDataName;
      // const marketDataDesc = createMarketDto.marketDataDesc;
      // const marketProductType = createMarketDto.marketProductType;
      // const marketLanguage = createMarketDto.marketLanguage;
      // const marketKeyword = createMarketDto.marketKeyword;
      // const marketDoi = createMarketDto.marketDoi;
      // const marketSubject = createMarketDto.marketSubject;
      // const marketIssuer = createMarketDto.marketIssuer;
      // const marketDoiUrl = createMarketDto.marketDoiUrl;
      // const saleUserName = user.nickName;
      // const saleAddr = user.nftWalletAccount;
      // const price = createMarketDto.price;
      // const startDttm = createMarketDto.startDttm;
      // const endDttm = createMarketDto.endDttm;
      // const issueCnt = createMarketDto.issueCnt;
  
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
        // 마켓 데이터 파일 정보 저장
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

        const newFile = queryRunner.manager.create(File, fileInfo);
        await queryRunner.manager.save<File>(newFile);
        createMarketDto['fileNo'] = newFile.fileNo;
        // console.log("===  fileNo : "+newFile.fileNo);
        // console.log("modifyAssetDto : "+JSON.stringify(modifyAssetDto));
      }

      // 마켓 데이터 정보 저장
      createMarketDto['userNo'] = user.userNo;
      createMarketDto['regName'] = user.nickName;
      createMarketDto['regAddr'] = user.nftWalletAccount;
      createMarketDto['saleUserName'] = user.nickName;
      createMarketDto['saleAddr'] = user.nftWalletAccount;
      createMarketDto['inventoryCnt'] = createMarketDto.issueCnt;

      console.log("createMarketDto: "+JSON.stringify(createMarketDto));
      const market = await this.createSale(user, createMarketDto);
      console.log("market: "+JSON.stringify(market));

      const timeIntaval = this.configService.get<number>('TIME_INTERVAL_DB');
      const maxRetries = this.configService.get<number>('MAX_RETRIES');    

      let retries = 0;
      let marketInfo = null;

      while (!marketInfo && retries < maxRetries) {
        marketInfo = await this.marketRepository.findOne({
          where: { marketNo: market.marketNo },
          // where: { marketNo: 7 },
        });
      
        if (!marketInfo) {
          retries++;
          console.log(`⏳ 마켓 정보가 없음. ${retries}번째 재시도 중...`);
          await new Promise((resolve) => setTimeout(resolve, timeIntaval));
        }
      }
      
      if (!marketInfo) {
        throw new Error('❌ 마켓 정보를 찾을 수 없습니다.');
      }

      await queryRunner.commitTransaction();

      return { marketNo: marketInfo.marketNo };

      // return null;

    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

    /**
   *  사용자 에셋 판매 등록용 엔터사 에셋 판매 등록
   * 
   * @param user 
   * @param createMarketDto 
   */
  async createSale(user: User, createMarketDto: CreateMarketDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Market 저장
      console.log("===== data : "+ JSON.stringify(createMarketDto));
      delete createMarketDto.files;
      const newMarket = queryRunner.manager.create(Market, createMarketDto);
      const result = await queryRunner.manager.save<Market>(newMarket);
      const marketNo = result.marketNo;

      await queryRunner.commitTransaction();

      // nftService.createMarketMint 호출
      // for TEST comment
      const address = user.nftWalletAccount;
      const nftMintInfo: CreateMintDto = {assetNo: 0, productNo: 0, issuedTo: address, 
        issueCnt: createMarketDto.issueCnt, tokenId: null, state: 'B1', marketNo};
      this.nftService.createMarketMintSale(user, nftMintInfo);

      return { marketNo };

    } catch (e) {
      // await queryRunner.rollbackTransaction();
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 마켓 데이터 판매 정보 수정(민트전)
   * 
   * @param user
   * @param marketNo 
   * @param files
   * @param modifyMarketDto 
   */
  //  async update(user: User, marketNo: number, files: any, modifyMarketDto: ModifyMarketDto): Promise<void> {

  async update(user: User, marketNo: number, modifyMarketDto: ModifyMarketDto): Promise<void> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const userNo = user.userNo;
      const marketInfo = await this.marketRepository.findOne({ where:{marketNo, userNo} });
      if (!marketInfo) {
        throw new NotFoundException("Data Not found. : 마켓 테이터 판매 정보");
      }
/*
      if (marketInfo.state !== "S1") {
        const statetInfo = await this.stateRepository.findOne({ where:{state : marketInfo.state} });
        if (statetInfo) {
          throw new NotFoundException("Already on "+statetInfo.stateDesc+".");
        }
      }
        */
/*
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

        const newFile = queryRunner.manager.create(File, fileInfo);
        await queryRunner.manager.save<File>(newFile);
        modifyMarketDto['fileNo'] = newFile.fileNo;
        console.log("===  fileNo : "+newFile.fileNo);
        console.log("modifyAssetDto : "+JSON.stringify(modifyMarketDto));
      }
*/
      modifyMarketDto['inventoryCnt'] = modifyMarketDto.issueCnt;
      delete modifyMarketDto.files;
      await queryRunner.manager.update(Market, marketNo, modifyMarketDto);

      await queryRunner.commitTransaction();

    } catch (e) {
      this.logger.error(e);
      throw e;
    }finally {
      await queryRunner.release();
    }
  }  

  /**
   * 마켓 데이터 판매 정보 삭제
   *
   * @param user
   * @param marketNo
   */
  async delete(user: User, marketNo: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const marketInfo = await this.marketRepository.findOne({ where:{marketNo, saleAddr: user.nftWalletAccount} });
      if (!marketInfo) {
        throw new NotFoundException('Data Not found. : 마켓 에셋 판매 정보');
      }

      if (marketInfo.state === 'S4' || marketInfo.state === 'S5') {
        const statetInfo = await this.stateRepository.findOne({
          where: { state: marketInfo.state },
        });
        if (statetInfo) {
          throw new NotFoundException(
            'Already on ' + statetInfo.stateDesc + '.',
          );
        }
      }

      let data = { useYn: 'N', state: 'S4' };
      await this.marketRepository.update(marketNo, data);

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
   * @param createMarketResaleDto 
   */
  async recreate(user: User, createMarketResaleDto: CreateMarketResaleDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      const purchaseNo = createMarketResaleDto.purchaseNo;
      // const price = createMarketDto.price;
      const issueCnt = createMarketResaleDto.issueCnt;
      const startDttm = createMarketResaleDto.startDttm;
      // const endDttm = createMarketDto.endDttm;
      // const marketDataName = createMarketDto.marketDataName;
    
      const purchaseInfo = await this.purchaseRepository.findOne({ where:{purchaseNo} });
      if (!purchaseInfo) {
        throw new NotFoundException('Data Not found. : 사용자 에셋 구매 정보');
      }
      const marketInfo = await this.marketRepository.findOne({ where:{marketNo: purchaseInfo.marketNo} });
      if (!marketInfo) {
        throw new NotFoundException('Data Not found. : 엔터사 구매 에셋 정보');
      }

      // Market 저장
      const fromTokenId = (parseInt(purchaseInfo.fromTokenId) + purchaseInfo.saleCnt).toString();
      // console.log("===== fromTokenId : "+ fromTokenId);
      const toTokenId = (parseInt(fromTokenId) + issueCnt-1).toString();
      // console.log("===== toTokenId : "+ toTokenId);
      createMarketResaleDto['fromTokenId'] = fromTokenId;
      createMarketResaleDto['toTokenId'] = toTokenId;
      createMarketResaleDto['resaleYn'] = 'Y';
      createMarketResaleDto['saleAddr'] = user.nftWalletAccount;
      createMarketResaleDto['saleUserName'] = user.nickName;
      createMarketResaleDto['inventoryCnt'] = issueCnt;
      createMarketResaleDto['userNo'] = user.userNo;
      createMarketResaleDto['regAddr'] = user.nftWalletAccount;
      createMarketResaleDto['regName'] = user.nickName;
      createMarketResaleDto['fileNo'] = marketInfo.fileNo;
      // 재판매 시 원본의 스키마 타입(scType)을 복사 (사용자 선택값)
      (createMarketResaleDto as any)['marketScType'] = marketInfo.marketScType;
      createMarketResaleDto['vcId'] = marketInfo.vcId;

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
      createMarketResaleDto['state'] = state;
      // delete createMarketResaleDto.files;
  
      // let data = { marketDataName, marketAssetDesc: createMarketDto.marketAssetDesc,
      //   saleAddr: user.nftWalletAccount, saleUserName: user.nickName, 
      //   creatroTokenId, resaleYn: 'Y', fromTokenId, toTokenId, price, issueCnt, inventoryCnt: issueCnt, 
      //   startDttm, endDttm, state, purchaseNo};
      // console.log("===== data : "+ JSON.stringify(data));

      console.log("===== createMarketDto : "+ JSON.stringify(createMarketResaleDto));
      const newMarket = queryRunner.manager.create(Market, createMarketResaleDto);
      const result = await queryRunner.manager.save<Market>(newMarket);
      const marketNo = result.marketNo;

      // purchase 수정
      const saleCnt = purchaseInfo.saleCnt + issueCnt;
      const inventoryCnt = purchaseInfo.purchaseCnt - saleCnt;
      let data1 = { resaleYn: 'Y', saleCnt, inventoryCnt};
      // console.log("===== data1 : "+ JSON.stringify(data1));
      await this.purchaseRepository.update(purchaseNo, data1);

      await queryRunner.commitTransaction();

      return { marketNo };

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
   * @param marketNo 
   * @returns 
   */
  async getInfo(marketNo: number): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {
      const market = await this.marketRepository.findOne({ where:{marketNo} });
      if (!market) {                         
        throw new NotFoundException("Data Not found. : 마켓 에셋 판매 정보");
      }

      const sql = this.marketRepository.createQueryBuilder('market')
                      .leftJoin(File, 'file', 'file.file_no = market.file_no')
                      .leftJoin(NftTransfer, 'transfer', 'market.from_token_id = transfer.token_id')
                      .leftJoin(State, 'state', 'market.state = state.state')
                      .select('market.market_no', 'marketNo')
                      .addSelect('market.market_sc_type', 'marketScType')
                      .addSelect('market.market_vc_type', 'marketVcType')
                      .addSelect("market.market_doi", 'marketDoi')
                      .addSelect("market.market_data_name", 'marketDataName')
                      .addSelect("market.market_data_desc", 'marketDataDesc')
                      .addSelect("market.market_product_type", 'marketProductType')
                      .addSelect("market.market_language", 'marketLanguage')
                      .addSelect("market.market_keyword", 'marketKeyword')
                      .addSelect("market.market_doi_url", 'marketDoiUrl')
                      .addSelect("market.market_subject", 'marketSubject')
                      .addSelect("market.market_issuer", 'marketIssuer')
                      .addSelect('market.sale_addr', 'saleAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || market.sale_addr`, 'saleAccountUrl')
                      .addSelect('market.sale_user_name', 'saleUserName')
                      .addSelect("market.price", 'price')
                      .addSelect('market.start_dttm', 'startDttm')
                      .addSelect('market.end_dttm', 'endDttm')
                      .addSelect('market.issue_cnt', 'issueCnt')                      
                      .addSelect('market.sale_cnt', 'saleCnt')                      
                      .addSelect('market.inventory_cnt', 'inventoryCnt') 
                      .addSelect('market.from_token_id', 'fromTokenId')     
                      .addSelect('market.to_token_id', 'toTokenId')    
                      .addSelect("file.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("file.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_second)", 'thumbnailSecond')
                      .addSelect("file.file_name_third", 'fileNameThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_third)", 'fileUrlThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_third)", 'thumbnailThird')
                      .addSelect('market.vc_id', 'marketVcId')
                      .addSelect("transfer.contract_id", 'nftContractAddress')
                      .addSelect(`'${process.env.BC_EXPLORER}address/' || transfer.contract_id`, 'nftContractAddressUrl')
                      .addSelect('transfer.tx_id', 'nftTxId')
                      .addSelect('state.state', 'state')
                      .addSelect(`'${process.env.BC_EXPLORER}tx/'  || transfer.tx_id`, 'nftTxIdUrl')
                      .where("market.market_no = :marketNo", { marketNo })

      const marketInfo = await sql.getRawOne();

      if(marketInfo.fromTokenId && marketInfo.toTokenId){
        const fromTokenId =  parseInt(marketInfo.fromTokenId);
        const toTokenId =  parseInt(marketInfo.toTokenId);
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
          ...(transferList || []).map(item => ({ tokenId: item.token_id, ownerAccount: item.to_addr,
            ownerAccountUrl: `${process.env.BC_EXPLORER}accounts/${item.to_addr}` })),
          ...(mintList || []).map(item => ({ tokenId: item.token_id, ownerAccount: item.issued_to, 
            ownerAccountUrl: `${process.env.BC_EXPLORER}accounts/${item.issued_to}` }))
        ];
      
        const sortedCombinedList = combinedList.sort((a, b) => {
          return a.tokenId - b.tokenId; 
        });
      
        marketInfo.tokenInfo = sortedCombinedList;
      }

      return marketInfo;

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }  

  /**
   * 판매 목록 조회
   * @param getMarketDto 
   */
  async getSaleList(getMarketDto: GetMarketDto): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getMarketDto.getOffset();
    const take = getMarketDto.getLimit();
    const marketDataName = getMarketDto.marketDataName;
    const marketDataDesc = getMarketDto.marketDataDesc;
    const marketProductType = getMarketDto.marketProductType;
    const marketLanguage = getMarketDto.marketLanguage;
    const marketKeyword = getMarketDto.marketKeyword;
    const marketDoi = getMarketDto.marketDoi;
    const marketSubject = getMarketDto.marketSubject;
    const marketIssuer = getMarketDto.marketIssuer;
    const marketDoiUrl = getMarketDto.marketDoiUrl;

    let options = `market.use_yn='Y' and market.state='S2'`;
    if (marketDataName) {
        options += ` and ( market.market_data_name like '%${marketDataName}%' ) `;
    }
    if (marketDataDesc) {
        options += ` and ( market.market_data_desc like '%${marketDataDesc}%' ) `;
    }
    if (marketProductType) {
        options += ` and ( market.market_product_type like '%${marketProductType}%' ) `;
    }
    if (marketLanguage) {
        options += ` and ( market.market_language like '%${marketLanguage}%' ) `;
    }
    if (marketKeyword) {
        options += ` and ( market.market_keyword like '%${marketKeyword}%' ) `;
    }
    if (marketDoi) {
        options += ` and ( market.market_doi like '%${marketDoi}%' ) `;
    }
    if (marketSubject) {
        options += ` and ( market.market_subject like '%${marketSubject}%' ) `;
    }
    if (marketIssuer) {
        options += ` and ( market.market_issuer like '%${marketIssuer}%' ) `;
    }
    if (marketDoiUrl) {
        options += ` and ( market.market_doi_url like '%${marketDoiUrl}%' ) `;
    }

    // console.log("options : "+options);

    try {
        const sql = this.marketRepository.createQueryBuilder('market')
                      .leftJoin(File, 'file', 'file.file_no = market.file_no')
                      .leftJoin(State, 'state', 'state.state = market.state')
                      .select('market.market_no', 'marketNo')
                      .addSelect('market.market_sc_type', 'marketScType')
                      .addSelect('market.market_vc_type', 'marketVcType')
                      .addSelect("market.market_doi", 'marketDoi')
                      .addSelect("market.market_data_name", 'marketDataName')
                      .addSelect('market.sale_addr', 'saleAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || market.sale_addr`, 'saleAccountUrl')
                      .addSelect('market.sale_user_name', 'saleUserName')
                      .addSelect('market.state', 'state')
                      .addSelect('state.state_desc', 'stateDesc')
                      .addSelect("market.price", 'price')
                      .addSelect('market.issue_cnt', 'issueCnt')                      
                      .addSelect('market.sale_cnt', 'saleCnt')                      
                      .addSelect('market.inventory_cnt', 'inventoryCnt')
                      .addSelect('market.start_dttm', 'startDttm')
                      .addSelect('market.end_dttm', 'endDttm')
                      .addSelect("file.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("file.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_second)", 'thumbnailSecond')
                      .addSelect("file.file_name_third", 'fileNameThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_third)", 'fileUrlThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_third)", 'thumbnailThird')
                      .addSelect('market.vc_id', 'marketVcId')
                      .where(options);


        const list = await sql.orderBy('market.market_no', getMarketDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .offset(skip)
                              .limit(take)
                              // .groupBy(`market.market_no, market.price, market.market_data_name, market.market_data_desc,
                              //   market.market_product_type, market.market_language, market.market_keyword, 
                              //   market.market_doi, market.market_subject, market.market_issuer,
                              //   state.state_desc, market.vc_id, file.file_name_first,
                              //   file.file_path_first, file.thumbnail_first, file.file_name_second,
                              //   file.file_path_second, file.thumbnail_second, file.file_name_third,
                              //   file.file_path_third, file.thumbnail_third`)
                              .getRawMany();

        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getMarketDto.pageSize, list);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

    /**
   * 판매 정보 조회 (마이페이지)
   * @param user
   * @param marketNo 
   * @returns 
   */
    async getMyInfo(user: User, marketNo: number): Promise<any> {

      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
  
      try {
        // console.log("marketNo: "+marketNo);
        const saleAddr = user.nftWalletAccount;
        const market = await this.marketRepository.findOne({ where:{marketNo, saleAddr} });
        if (!market) {                         
          throw new NotFoundException("Data Not found. : 마켓 에셋 판매 정보");
        }
  
        const sql = this.marketRepository.createQueryBuilder('market')
                        .leftJoin(File, 'file', 'file.file_no = market.file_no')
                        .leftJoin(State, 'state', 'state.state = market.state')
                        .leftJoin(NftTransfer, 'transfer', 'market.from_token_id = transfer.token_id')
                        // .leftJoin(Purchase, 'purchase', 'market.contract_no = ANY(market.contract_no)')
                        .select('market.market_no', 'marketNo')
                        .addSelect('market.market_vc_type', 'marketVcType')
                        .addSelect("market.market_doi", 'marketDoi')
                        .addSelect("market.market_data_name", 'marketDataName')
                        .addSelect("market.market_data_desc", 'marketDataDesc')
                        .addSelect("market.market_product_type", 'marketProductType')
                        .addSelect("market.market_language", 'marketLanguage')
                        .addSelect("market.market_keyword", 'marketKeyword')
                        .addSelect("market.market_subject", 'marketSubject')
                        .addSelect("market.market_issuer", 'marketIssuer')
                        .addSelect("market.market_doi_url", 'marketDoiUrl')
                        .addSelect('market.sale_addr', 'saleAccount')
                        .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || market.sale_addr`, 'saleAccountUrl')
                        .addSelect('market.sale_user_name', 'saleUserName')
                        .addSelect("market.price", 'price')
                        .addSelect('market.start_dttm', 'startDttm')
                        .addSelect('market.end_dttm', 'endDttm')
                        .addSelect('market.reg_dttm', 'regDttm')
                        .addSelect('market.use_yn', 'useYn')
                        .addSelect('market.state', 'state')                        
                        .addSelect('state.state_desc', 'stateDesc')
                        .addSelect('market.issue_cnt', 'issueCnt')                      
                        .addSelect('market.sale_cnt', 'saleCnt')                      
                        .addSelect('market.inventory_cnt', 'inventoryCnt') 
                        .addSelect('market.from_token_id', 'fromTokenId')     
                        .addSelect('market.to_token_id', 'toTokenId')     
                        .addSelect("file.file_name_first", 'fileNameFirst')
                        .addSelect("concat('"  + serverDomain  + "/', file.file_path_first)", 'fileUrlFirst')
                        .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_first)", 'thumbnailFirst')
                        .addSelect("file.file_name_second", 'fileNameSecond')
                        .addSelect("concat('"  + serverDomain  + "/', file.file_path_second)", 'fileUrlSecond')
                        .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_second)", 'thumbnailSecond')
                        .addSelect("file.file_name_third", 'fileNameThird')
                        .addSelect("concat('"  + serverDomain  + "/', file.file_path_third)", 'fileUrlThird')
                        .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_third)", 'thumbnailThird')
                        .addSelect('market.vc_id', 'marketVcId')
                        .addSelect("transfer.contract_id", 'nftContractAddress')
                        .addSelect(`'${process.env.BC_EXPLORER}address/' || transfer.contract_id`, 'nftContractAddressUrl')
                        .addSelect('transfer.tx_id', 'nftTxId')
                        .addSelect(`'${process.env.BC_EXPLORER}tx/'  || transfer.tx_id`, 'nftTxIdUrl')
                        .where("market.market_no = :marketNo", { marketNo })
  
        const marketInfo = await sql.getRawOne();

        if(marketInfo.fromTokenId && marketInfo.toTokenId){
          const fromTokenId =  parseInt(marketInfo.fromTokenId);
          const toTokenId =  parseInt(marketInfo.toTokenId);
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
            ...(transferList || []).map(item => ({ tokenId: item.token_id, ownerAccount: item.to_addr,
              ownerAccountUrl: `${process.env.BC_EXPLORER}accounts/${item.to_addr}` })),
            ...(mintList || []).map(item => ({ tokenId: item.token_id, ownerAccount: item.issued_to,
              ownerAccountUrl: `${process.env.BC_EXPLORER}accounts/${item.issued_to}` }))
          ];
        
          const sortedCombinedList = combinedList.sort((a, b) => {
            return a.tokenId - b.tokenId; 
          });
          
          marketInfo.tokenInfo = sortedCombinedList;
        }
                                                                          
        return marketInfo;
  
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    } 
  
  /**
   * 판매 목록 조회 (마이페이지)
   * @param user 
   * @param getMarketDto 
   */
  async getSaleMyList(user: User, getMarketDto: GetMarketDto): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
    const skip = getMarketDto.getOffset();
    const take = getMarketDto.getLimit();
    const marketDataName = getMarketDto.marketDataName;
    const marketDataDesc = getMarketDto.marketDataDesc;
    const marketProductType = getMarketDto.marketProductType;
    const marketLanguage = getMarketDto.marketLanguage;
    const marketKeyword = getMarketDto.marketKeyword;
    const marketSubject = getMarketDto.marketSubject;
    const marketDoi = getMarketDto.marketDoi;
    const marketIssuer = getMarketDto.marketIssuer;
    const marketDoiUrl = getMarketDto.marketDoiUrl;
    const purchaseAddr = user.nftWalletAccount;
    const startDttm = getMarketDto.startDttm;
    const endDttm = getMarketDto.endDttm;
    const state = getMarketDto.state;

    let options = `market.sale_addr = '${purchaseAddr}'`;
    if (marketDataName) {
        options += ` and ( market.market_data_name like '%${marketDataName}%' ) `;
    }
    if (marketDataDesc) {
        options += ` and ( market.market_data_desc like '%${marketDataDesc}%' ) `;
    }
    if (marketProductType) {
        options += ` and ( market.market_product_type like '%${marketProductType}%' ) `;
    }
    if (marketLanguage) {
        options += ` and ( market.market_language like '%${marketLanguage}%' ) `;
    }
    if (marketKeyword) {
        options += ` and ( market.market_keyword like '%${marketKeyword}%' ) `;
    }
    if (marketSubject) {
        options += ` and ( market.market_subject like '%${marketSubject}%' ) `;
    }
    if (marketDoi) {
        options += ` and ( market.market_doi like '%${marketDoi}%' ) `;
    }
    if (marketIssuer) {
        options += ` and ( market.market_issuer like '%${marketIssuer}%' ) `;
    }
    if (marketDoiUrl) {
        options += ` and ( market.market_doi_url like '%${marketDoiUrl}%' ) `;
    }
    if (state) {
      options += ` and market.state = '${state}'`;
    }
    if (startDttm) {
      if(endDttm){
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and market.reg_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
        options += ` and market.reg_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }else{
        options += ` and market.reg_dttm  >= TO_TIMESTAMP('${startDttm.toISOString().slice(0, 10)}', 'YYYY-MM-DD') `;
      }
    }else{
      if(endDttm){
        const endTime = new Date(endDttm.getTime() + 24 * 60 * 60 * 1000);
        options += ` and market.reg_dttm < TO_TIMESTAMP('${endTime.toISOString().slice(0, 10)}', 'YYYY-MM-DD')`;
      }
    }

    // console.log("options : "+options);

    try {
        const sql = this.marketRepository.createQueryBuilder('market')
                      .leftJoin(File, 'file', 'file.file_no = market.file_no')
                      .leftJoin(State, 'state', 'state.state = market.state')
                      .select('market.market_no', 'marketNo')
                      .addSelect("market.market_doi", 'marketDoi')
                      .addSelect("market.market_vc_type", 'marketVcType')
                      .addSelect('market.market_data_name', 'marketDatatName')
                      .addSelect('market.sale_addr', 'saleAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || market.sale_addr`, 'saleAccountUrl')
                      .addSelect('market.sale_user_name', 'saleUserName')                     
                      .addSelect("market.market_data_desc", 'marketDataDesc')
                      .addSelect("market.price", 'price')
                      .addSelect('market.issue_cnt', 'issueCnt')                      
                      .addSelect('market.sale_cnt', 'saleCnt')                      
                      .addSelect('market.inventory_cnt', 'inventoryCnt')                       
                      .addSelect('market.start_dttm', 'startDttm')
                      .addSelect('market.end_dttm', 'endDttm')
                      .addSelect('market.state', 'state')
                      .addSelect('state.state_desc', 'stateDesc')
                      .addSelect("file.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("file.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_second)", 'thumbnailSecond')
                      .addSelect("file.file_name_third", 'fileNameThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_third)", 'fileUrlThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_third)", 'thumbnailThird')
                      .addSelect('market.vc_id', 'marketVcId')
                      .where(options);

        const list = await sql.orderBy('market.market_no', getMarketDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .offset(skip)
                              .limit(take)
                              // .groupBy(`market.market_no, market.price, market.market_data_name, market.market_data_desc,
                              //   market.market_product_type, market.market_language, market.market_keyword, 
                              //   market.market_doi, market.market_subject, market.market_issuer,
                              //   state.state_desc, market.vc_id, file.file_name_first,
                              //   file.file_path_first, file.thumbnail_first, file.file_name_second,
                              //   file.file_path_second, file.thumbnail_second, file.file_name_third,
                              //   file.file_path_third, file.thumbnail_third`)
                              .getRawMany();

        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getMarketDto.pageSize, list);

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }  

  /**
   * 마켓 판매 상태 변경
   *
   * @param user
   * @param marketNo
   */
  async updateState(user: User, marketNo: number, state: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userNo = user.userNo;
      const marketInfo = await this.marketRepository.findOne({
        where: { marketNo, saleAddr: user.nftWalletAccount },
      });
      if (!marketInfo) {
        throw new NotFoundException('Data Not found. : 마켓 에셋 판매 정보');
      }

      // 마켓 판매 상태 정보 수정
      let data = { state: 'S'+state };
      await this.marketRepository.update(marketNo, data);

      await queryRunner.commitTransaction();

    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 데이터 NFT MINT & VC 발급
   * 
   * @param marketNo 
   */
  async createNftVc(marketNo: number): Promise<any> {

    try {

      const marketInfo = await this.marketRepository.findOne({ where:{marketNo} });
      if (!marketInfo) {
        throw new NotFoundException("Data Not found. : 마켓 정보");
      }

      let user = await this.userService.getOneByNickname(marketInfo.saleUserName);
      user.nftWalletAccount = marketInfo.saleAddr;
      if(!marketInfo.fromTokenId){
        // nft MINT & VC 발급
        console.log("nft MINT & VC 발급");
        // nftService.createMarketMint 호출
        const address = user.nftWalletAccount;
        console.log("user : "+JSON.stringify(user));
        const nftMintInfo: CreateMintDto = {assetNo: marketNo, productNo: marketNo,
          issuedTo: marketInfo.saleAddr, issueCnt: marketInfo.issueCnt, tokenId: null, state: 'B1', marketNo};
        this.nftService.createMarketMintSale(user, nftMintInfo);
      }else{
        // VC 발급
        console.log("VC 발급");
        await this.createVc(user, marketInfo.marketNo);
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  } 
  
  /**
   * 데이터 등록증명 VC 발급 & 등록
   * 
   * @param assetNo 
   */
  async createVc(user: User, marketNo: number): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');
      const dataspace = this.configService.get<string>('DID_DATASPACE');
      
       // ETRI API 호출
      // 1. 아바타 크리덴셜 DID 생성 요청
      const sql = this.marketRepository.createQueryBuilder('market')
                      .leftJoin(File, 'file', 'file.file_no = market.file_no')
                      .leftJoin(NftMint, 'mint', 'market.from_token_id = mint.token_id')
                      .leftJoin(User, 'user', 'market.user_no = user.user_no')
                      .leftJoin(DidWallet, 'didWallet', 'didWallet.user_no = user.user_no')                    
                      .select('market.market_no', 'marketNo')
                      .addSelect('didWallet.wallet_did', 'walletDid')
                      .addSelect('market.market_sc_type', 'marketScType')
                      .addSelect('market.market_data_name', 'marketDatatName')
                      .addSelect('market.market_data_desc', 'marketDatatDesc')
                      .addSelect("market.market_product_type", 'marketProductType')
                      .addSelect("market.market_language", 'marketLanguage')
                      .addSelect("market.market_keyword", 'marketKeyword')
                      .addSelect("market.market_doi", 'marketDoi')
                      .addSelect("market.market_subject", 'marketSubject')
                      .addSelect("market.market_issuer", 'marketIssuer')
                      .addSelect("market.market_doi_url", 'marketDoiUrl')
                      .addSelect('market.reg_addr', 'regAddr')
                      .addSelect('user.email', 'regEmail')
                      .addSelect("market.price", 'price')
                      .addSelect("market.price", 'price')
                      .addSelect('market.reg_dttm', 'regDttm')
                      .addSelect("mint.contract_id", 'contractId')
                      .addSelect("mint.tx_id", 'txId')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_first)", 'imageUrl')
                      .where("market.market_no = :marketNo", { marketNo });

      const didInfo = await sql
                          // .groupBy(`market.market_no, user.user_no, mint.token_id, 
                          //           mint.tx_id, file.thumbnail_first`)
                          .getRawOne();
      
      // 데이터 크리덴셜 발급 요청
      const createDidVcDto: CreateDidVcDto = {
        "walletDid": didInfo.walletDid,
        "issuerDid": dataspace,
        "scType": didInfo.marketScType,
        "dataId": "AL_DS_NFT-"+marketNo,
        "dataName": didInfo.marketDataName,
        "dataDesc": didInfo.marketDataDesc,
        "productType": didInfo.marketProductType,
        "language": didInfo.marketLanguage,
        "keyWord": didInfo.marketKeyword,
        "doi": didInfo.marketDoi,
        "subject": didInfo.marketSubject,
        "issuer": didInfo.marketIssuer,
        "doiUrl": didInfo.marketDoiUrl,
        "dataPrice": String(didInfo.price),
        "registrantEmail": didInfo.email,
        "registrantWalletAddress": didInfo.regAddr,
        "txId": didInfo.txId,
        "contractAddress": didInfo.contractId,
        "imageURL": didInfo.imageUrl,
        "registrationDate": didInfo.regDttm.toISOString().split('.')[0] + 'Z'
      };

      let issueVcInfo = null;
      issueVcInfo = await this.didService.createVC(createDidVcDto);
      if (!issueVcInfo) {
        throw new Error('VC 등록 오류 - vc');
      }

      console.log("issueVcInfo: "+JSON.stringify(issueVcInfo))
      // const parsed = parseVC(issueVcInfo);    
      const modifyMarket: any = {
        state: 'S2', 
        vcId: createDidVcDto.dataId,
        // vcIssuerName: issueVcInfo.did,
        // vcIssuerLogo: issueVcInfo.vcIssuerLogo, 
        // vcTypeName: issueVcInfo.vcTypeName,         
      }
      
      // 오스레저 응답에서 받은 vcType을 market_vc_type에 저장
      if (issueVcInfo && issueVcInfo.vcType) {
        modifyMarket.marketVcType = issueVcInfo.vcType;
      }
      
      console.log("===== modifyMarket : "+JSON.stringify(modifyMarket));
      const updateResult = await queryRunner.manager.update(Market, { marketNo }, modifyMarket);
      console.log(`===== modifyMarket update affected: ${updateResult.affected}`);
      
      await queryRunner.commitTransaction();

    } catch (e) {
      this.logger.error(e);
      // throw new GatewayTimeoutException;
      throw e;
    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 마켓 데이터 VC 정보 조회
   * @param user
   * @param marketNo 
   * @returns 
   */
  async getVcInfo(user: User, marketNo: number): Promise<any> {
    try {
      const sql = this.marketRepository.createQueryBuilder('market')
                .leftJoin(NftMint, 'mint', 'mint.token_id = market.from_token_id')
                .leftJoin(NftWallet, 'nftWallet', 'nftWallet.account = mint.issued_to')
                .leftJoin(DidWallet, 'didWallet', 'didWallet.user_no = nftWallet.user_no')
                .select('market.market_no', 'marketNo')
                .addSelect('market.market_vc_type', 'marketVcType')
                .addSelect('didWallet.wallet_did', 'walletDid')
                .where("market.market_no = :marketNo", { marketNo });

      const marketInfo = await sql
                          // .groupBy(`market.market_no, user.user_no, mint.token_id, 
                          //           mint.tx_id, file.thumbnail_first`)
                          .getRawOne();
      console.log("===== getVcInfo marketInfo: "+JSON.stringify(marketInfo));

      // Authledger VC DID verify 요청
      // for TEST
      const getDidVcDto: GetDidVcDto = {walletDid: marketInfo.walletDid, vcType: marketInfo.marketVcType,};
      console.log("===== getVcInfo getDidVcDto: "+JSON.stringify(getDidVcDto));
      const vc = await this.didService.verifyVC(getDidVcDto);
      if (!vc) {      
        throw new NotFoundException('사용자 DID verify 요청 오류');
      }
      return vc;
      
    } catch (e) {
      this.logger.error(e);
      throw e;
    }  
    
  }
  // async getVcInfo(user: User, marketNo: number): Promise<any> {

  //   const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

  //   try {
  //     // console.log("marketNo: "+marketNo);
  //     const saleAddr = user.nftWalletAccount;
  //     const market = await this.marketRepository.findOne({ where:{marketNo, saleAddr} });
  //     if (!market) {                         
  //       throw new NotFoundException("Data Not found. : 마켓 에셋 판매 정보");
  //     }

  //     const sql = this.marketRepository.createQueryBuilder('market')
  //                     .leftJoin(File, 'file', 'file.file_no = market.file_no')
  //                     .leftJoin(NftMint, 'mint', 'market.from_token_id = mint.token_id')
  //                     .leftJoin(User, 'user', 'market.user_no = user.user_no')

  //                     .select(`CONCAT('AL_DS_NFT-', market.market_no)`, 'dataId')
  //                     .addSelect("market.market_data_name", 'dataName')
  //                     .addSelect("market.market_data_desc", 'dataDesc')
  //                     .addSelect("market.market_product_type", 'productType')
  //                     .addSelect("market.market_language", 'language')
  //                     .addSelect("market.market_keyword", 'keyWord')
  //                     .addSelect("market.market_doi", 'doi')
  //                     .addSelect("market.market_subject", 'subject')
  //                     .addSelect("market.market_issuer", 'issuer')
  //                     .addSelect("market.market_doi_url", 'doiUrl')
  //                     .addSelect("market.price", 'dataPrice')
  //                     .addSelect('user.email', 'registrantEmail')
  //                     .addSelect('mint.issued_to', 'registrantWalletAddress')
  //                     .addSelect('mint.tx_id', 'txId')
  //                     .addSelect('mint.contract_id', 'contractAddress')
  //                     .addSelect("concat('"  + serverDomain  + "/', file.file_path_first)", 'imageURL')
  //                     .addSelect('market.reg_dttm', 'registrationDate')

  //                     .where("market.market_no = :marketNo", { marketNo })
                   
  //     const vcInfo = await sql.getRawOne();
                                                                        
  //     return vcInfo;

  //   } catch (e) {
  //     this.logger.error(e);
  //     throw e;
  //   }
  // }

}
