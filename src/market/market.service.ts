import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between } from 'typeorm';
import { Market } from '../entities/market.entity';
import { EContract } from '../entities/contract.entity';
import { Purchase } from '../entities/purchase.entity';
import { Product } from "../entities/product.entity";
import { Asset } from '../entities/asset.entity';
import { State } from '../entities/state.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { User } from '../entities/user.entity';
import { DidWallet } from '../entities/did_wallet.entity';
import { ProductService } from '../product/product.service';
import { UserService } from '../user/user.service';
import { AssetService } from '../asset/asset.service';
import { ContractService } from '../contract/contract.service';
import { NftService } from '../nft/nft.service';
import { DidService } from '../did/did.service';
import { ConfigService } from '@nestjs/config';
import { CreateMarketDto} from '../dtos/create_market.dto';
import { ModifyMarketDto } from '../dtos/modify_market.dto';
import { GetMarketDto } from '../dtos/get_market.dto';
import { DeleteMarketSaleJwtDto} from '../dtos/delete_market_sale_jwt.dto';
import { DeleteMarketSaleDto} from '../dtos/delete_market_sale.dto';
import { CreateMintDto } from '../dtos/create_mint.dto';
import { CreateMarketSaleDto} from '../dtos/create_market_sale.dto';
import { CreateProductDto } from '../dtos/create_product.dto';
import { CreateUserDto } from '../dtos/create_user.dto';
import { CreateDidUserDto } from '../dtos/create_did_user.dto';
import { CreateDidWalletDto } from '../dtos/create_did_wallet.dto';
import { CreateAssetDto } from '../dtos/create_asset.dto';
import { CreateBurnDto } from '../dtos/create_burn.dto';
import { CreateContractDto } from '../dtos/create_contract.dto';
import { NftWallet } from '../entities/nft_wallet.entity';
import { NftMint } from "../entities/nft_mint.entity";
import { NftTransfer } from "../entities/nft_transfer.entity";
import { CreateDidAcdgDto } from '../dtos/create_did_acdg.dto';
import { CreateDidAciDto } from '../dtos/create_did_aci.dto';
import { CreateDidAcrDto } from '../dtos/create_did_acr.dto';
import { createVC, parseVC } from 'src/common/vc-utils';
import { PageResponse } from 'src/common/page.response';
import { token } from 'src/nft/typechain-types/@openzeppelin/contracts';

@Injectable()
export class MarketService {
  private logger = new Logger('MarketService');

  constructor(
    private configService: ConfigService,
    private productService: ProductService,
    private userService: UserService,
    private assetService: AssetService,
    private contractService: ContractService,
    private nftService: NftService,
    private didService: DidService,

    @Inject('MARKET_REPOSITORY')
    private marketRepository: Repository<Market>,

    @Inject('CONTRACT_REPOSITORY')
    private contractRepository: Repository<EContract>,

    @Inject('PURCHASE_REPOSITORY')
    private purchaseRepository: Repository<Purchase>,

    @Inject('PRODUCT_REPOSITORY')
    private productRepository: Repository<Product>,
    
    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

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
   *  엔터사 에셋 판매 등록
   * 
   * @param user 
   * @param createMarketDto 
   */
  async create(user: User, createMarketDto: CreateMarketDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const contractNo = createMarketDto.contractNo;
      const price = createMarketDto.price;
      const issueCnt = createMarketDto.issueCnt;
      const startDttm = createMarketDto.startDttm;
      const endDttm = createMarketDto.endDttm;
      const marketAssetName = createMarketDto.marketAssetName;
    
      const contractInfo = await this.contractRepository.findOne({ where:{contractNo} });
      if (!contractInfo) {
        throw new NotFoundException('Data Not found. : 엔터사 구매 에셋 정보');
      }

      // Market 저장
      const assetNo = contractInfo.assetNo;
      const productNo = contractInfo.productNo;
      const creatroTokenId = contractInfo.tokenId;
      let data = { contractNo, assetNo, productNo, marketAssetName, marketAssetDesc: createMarketDto.marketAssetDesc,
        saleAddr: user.nftWalletAccount, saleUserName: user.nickName, 
        creatroTokenId, price, issueCnt, inventoryCnt: issueCnt, startDttm, endDttm};

      // console.log("===== data : "+ JSON.stringify(data));

      const newMarket = queryRunner.manager.create(Market, data);
      const result = await queryRunner.manager.save<Market>(newMarket);
      const marketNo = result.marketNo;

      await queryRunner.commitTransaction();

      // nftService.createMarketMint 호출
      const address = user.nftWalletAccount;
      const nftMintInfo: CreateMintDto = {assetNo, productNo, issuedTo: address, 
        issueCnt, tokenId: null, state: 'B1', marketNo};
      this.nftService.createMarketMint(user, nftMintInfo);

      return { marketNo };

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
   * @param marketNo 
   * @param modifyMarketDto 
   */
  async update(user: User, marketNo: number, modifyMarketDto: ModifyMarketDto): Promise<void> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        const marketInfo = await this.marketRepository.findOne({ where:{marketNo} });
        if (!marketInfo) {
          throw new NotFoundException("Data Not found. : 마켓 에셋 판매 정보");
        }

        if (marketInfo.state !== "S1") {
          const statetInfo = await this.stateRepository.findOne({ where:{state : marketInfo.state} });
          if (statetInfo) {
            throw new NotFoundException("Already on "+statetInfo.stateDesc+".");
          }
        }

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
   * 엔터사 에셋 판매 정보 삭제
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
   * @param createMarketDto 
   */
  async recreate(user: User, createMarketDto: CreateMarketDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      // 수정하기
      const contractNo = createMarketDto.contractNo;
      const purchaseNo = createMarketDto.purchaseNo;
      const price = createMarketDto.price;
      const issueCnt = createMarketDto.issueCnt;
      const startDttm = createMarketDto.startDttm;
      const endDttm = createMarketDto.endDttm;
      const marketAssetName = createMarketDto.marketAssetName;
    
      const purchaseInfo = await this.purchaseRepository.findOne({ where:{purchaseNo} });
      if (!purchaseInfo) {
        throw new NotFoundException('Data Not found. : 사용자 에셋 구매 정보');
      }
      const contractInfo = await this.contractRepository.findOne({ where:{contractNo} });
      if (!contractInfo) {
        throw new NotFoundException('Data Not found. : 엔터사 구매 에셋 정보');
      }

      // Market 저장
      const assetNo = contractInfo.assetNo;
      const productNo = contractInfo.productNo;
      const creatroTokenId = contractInfo.tokenId;
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
  
      let data = { contractNo, assetNo, productNo, marketAssetName, marketAssetDesc: createMarketDto.marketAssetDesc,
        saleAddr: user.nftWalletAccount, saleUserName: user.nickName, 
        creatroTokenId, resaleYn: 'Y', fromTokenId, toTokenId, price, issueCnt, inventoryCnt: issueCnt, 
        startDttm, endDttm, state, purchaseNo};

      // console.log("===== data : "+ JSON.stringify(data));
      const newMarket = queryRunner.manager.create(Market, data);
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
                      .leftJoin(Asset, 'asset', 'asset.asset_no = market.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .leftJoin(NftTransfer, 'transfer', 'market.from_token_id = transfer.token_id')
                      .select('market.market_no', 'marketNo')
                      .addSelect('market.contract_no', 'contractNo')
                      .addSelect('market.product_no', 'productNo')
                      .addSelect('market.asset_no', 'assetNo')
                      .addSelect('market.market_asset_name', 'marketAssetName')
                      .addSelect('market.market_asset_desc', 'marketAssetDesc')
                      .addSelect('market.sale_addr', 'saleAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || market.sale_addr`, 'saleAccountUrl')
                      .addSelect('market.sale_user_name', 'saleUserName')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.asset_url", 'assetUrl')
                      .addSelect("market.price", 'price')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('market.start_dttm', 'startDttm')
                      .addSelect('market.end_dttm', 'endDttm')
                      .addSelect('market.issue_cnt', 'issueCnt')                      
                      .addSelect('market.sale_cnt', 'saleCnt')                      
                      .addSelect('market.inventory_cnt', 'inventoryCnt') 
                      .addSelect('market.from_token_id', 'fromTokenId')     
                      .addSelect('market.to_token_id', 'toTokenId')    
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
                      // .addSelect('transfer.token_id', 'nftTokenId')
                      // .addSelect("market.sale_addr", 'nftSellerAddr')
                      // .addSelect("market.purchase_addr", 'nftBuyerAddr')
                      .where("market.market_no = :marketNo", { marketNo })
                    // .andWhere("nftMint.use_yn = 'N'")
                    // .andWhere("nftMint.burn_yn = 'N'");

      const marketInfo = await sql.groupBy(``)
                                      .getRawOne();

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
    const word = getMarketDto.word;

    let options = `market.use_yn='Y' and market.state='S2'`;
    if (word) {
        // options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
        options += ` and ( market.market_asset_name like '%${word}%' or asset.asset_desc like '%${word}%'
          or asset.asset_name like '%${word}%' or asset.type_def like '%${word}%' ) `;
    }
  
    // console.log("options : "+options);

    try {
        const sql = this.marketRepository.createQueryBuilder('market')
                      .leftJoin(Asset, 'asset', 'asset.asset_no = market.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .leftJoin(State, 'state', 'state.state = market.state')
                      .select('market.market_no', 'marketNo')
                      .addSelect('market.contract_no', 'contractNo')
                      .addSelect('market.market_asset_name', 'marketAssetName')
                      .addSelect('market.sale_addr', 'saleAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || market.sale_addr`, 'saleAccountUrl')
                      .addSelect('market.sale_user_name', 'saleUserName')
                      .addSelect('market.state', 'state')
                      .addSelect('state.state_desc', 'stateDesc')
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.asset_url", 'assetUrl')
                      .addSelect("market.price", 'price')
                      .addSelect('market.issue_cnt', 'issueCnt')                      
                      .addSelect('market.sale_cnt', 'saleCnt')                      
                      .addSelect('market.inventory_cnt', 'inventoryCnt')
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('market.start_dttm', 'startDttm')
                      .addSelect('market.end_dttm', 'endDttm')
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


        const list = await sql.orderBy('market.market_no', getMarketDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .offset(skip)
                              .limit(take)
                              .groupBy(`market.market_no, market.contract_no, asset.price, asset.asset_name,
                                asset.asset_desc, market.market_asset_name, asset.asset_url, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
                                fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
                                fileAsset.file_path_second, fileAsset.thumbnail_second, fileAsset.file_name_third,
                                fileAsset.file_path_third, fileAsset.thumbnail_third, state.state_desc, asset.vc_id`)
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
                        .leftJoin(Asset, 'asset', 'asset.asset_no = market.asset_no')
                        .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                        .leftJoin(State, 'state', 'state.state = market.state')
                        .leftJoin(NftTransfer, 'transfer', 'market.from_token_id = transfer.token_id')
                        // .leftJoin(Purchase, 'purchase', 'market.contract_no = ANY(market.contract_no)')
                        .select('market.market_no', 'marketNo')
                        .addSelect('market.contract_no', 'contractNo')
                        .addSelect('market.purchase_no', 'purchaseNo')
                        .addSelect('market.product_no', 'productNo')
                        .addSelect('market.asset_no', 'assetNo')
                        .addSelect('market.market_asset_name', 'marketAssetName')
                        .addSelect('market.market_asset_desc', 'marketAssetDesc')
                        .addSelect('market.sale_addr', 'saleAccount')
                        .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || market.sale_addr`, 'saleAccountUrl')
                        .addSelect('market.sale_user_name', 'saleUserName')
                        .addSelect("asset.asset_name", 'assetName')
                        .addSelect("asset.asset_desc", 'assetDesc')
                        .addSelect("asset.asset_url", 'assetUrl')
                        .addSelect("market.price", 'price')
                        .addSelect("asset.metaverse_name", 'metaverseName')
                        .addSelect("asset.type_def", 'typeDef')
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
                        // .addSelect('transfer.token_id', 'nftTokenId')
                        // .addSelect("ARRAY_AGG(purchase.token_id)", 'nftTokenIdAry')
                        // .addSelect("market.sale_addr", 'nftSellerAddr')
                        // .addSelect("market.purchase_addr", 'nftBuyerAddr')
                        .where("market.market_no = :marketNo", { marketNo })
                      // .andWhere("nftMint.use_yn = 'N'")
                      // .andWhere("nftMint.burn_yn = 'N'");
  
        const marketInfo = await sql.groupBy(``)
                                        .getRawOne();

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
    const word = getMarketDto.word;
    const purchaseAddr = user.nftWalletAccount;
    const startDttm = getMarketDto.startDttm;
    const endDttm = getMarketDto.endDttm;
    const state = getMarketDto.state;

    let options = `market.sale_addr = '${purchaseAddr}'`;
    if (word) {
        // options += ` and (asset.asset_desc like '%${word}%' or (asset.type_def like '%${word}%') ) `;
        options += ` and ( market.market_asset_name like '%${word}%' or asset.asset_desc like '%${word}%'
         or asset.asset_name like '%${word}%' or asset.type_def like '%${word}%' ) `;
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
                      .leftJoin(Asset, 'asset', 'asset.asset_no = market.asset_no')
                      .leftJoin(FileAsset, 'fileAsset', 'fileAsset.file_no = asset.file_no')
                      .leftJoin(State, 'state', 'state.state = market.state')
                      .select('market.market_no', 'marketNo')
                      .addSelect('market.contract_no', 'contractNo')
                      .addSelect('market.market_asset_name', 'marketAssetName')
                      .addSelect('market.sale_addr', 'saleAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || market.sale_addr`, 'saleAccountUrl')
                      .addSelect('market.sale_user_name', 'saleUserName')                     
                      .addSelect("asset.asset_name", 'assetName')
                      .addSelect("asset.asset_desc", 'assetDesc')
                      .addSelect("asset.asset_url", 'assetUrl')
                      .addSelect("market.price", 'price')
                      .addSelect('market.issue_cnt', 'issueCnt')                      
                      .addSelect('market.sale_cnt', 'saleCnt')                      
                      .addSelect('market.inventory_cnt', 'inventoryCnt')                       
                      .addSelect("asset.metaverse_name", 'metaverseName')
                      .addSelect("asset.type_def", 'typeDef')
                      .addSelect('market.start_dttm', 'startDttm')
                      .addSelect('market.end_dttm', 'endDttm')
                      .addSelect('market.state', 'state')
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


        const list = await sql.orderBy('market.market_no', getMarketDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .offset(skip)
                              .limit(take)
                              .groupBy(`market.market_no, market.contract_no, asset.price, asset.asset_name,
                                asset.asset_desc, market.market_asset_name, asset.asset_url, asset.metaverse_name, asset.type_def, fileAsset.file_name_first,
                                fileAsset.file_path_first, fileAsset.thumbnail_first, fileAsset.file_name_second,
                                fileAsset.file_path_second, fileAsset.thumbnail_second, fileAsset.file_name_third,
                                fileAsset.file_path_third, fileAsset.thumbnail_third, state.state_desc, asset.vc_id`)
                              .getRawMany();

        const totalCount = await sql.getCount(); 

        return new PageResponse(totalCount, getMarketDto.pageSize, list);

    } catch (e) {
      this.logger.error(e);
      throw e;
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

      const contractNo = createMarketDto.contractNo;
      const price = createMarketDto.price;
      const issueCnt = createMarketDto.issueCnt;
      const startDttm = createMarketDto.startDttm;
      const endDttm = createMarketDto.endDttm;
      const marketAssetName = createMarketDto.marketAssetName;
    
      const contractInfo = await this.contractRepository.findOne({ where:{contractNo} });
      if (!contractInfo) {
        throw new NotFoundException('Data Not found. : 엔터사 구매 에셋 정보');
      }

      // Market 저장
      const assetNo = contractInfo.assetNo;
      const productNo = contractInfo.productNo;
      const creatroTokenId = contractInfo.tokenId;
      let data = { contractNo, assetNo, productNo, marketAssetName, marketAssetDesc: createMarketDto.marketAssetDesc,
        saleAddr: user.nftWalletAccount, saleUserName: user.nickName, 
        creatroTokenId, price, issueCnt, inventoryCnt: issueCnt, startDttm, endDttm};

      // console.log("===== data : "+ JSON.stringify(data));

      const newMarket = queryRunner.manager.create(Market, data);
      const result = await queryRunner.manager.save<Market>(newMarket);
      const marketNo = result.marketNo;

      await queryRunner.commitTransaction();

      // nftService.createMarketMint 호출
      const address = user.nftWalletAccount;
      const nftMintInfo: CreateMintDto = {assetNo, productNo, issuedTo: address, 
        issueCnt, tokenId: null, state: 'B1', marketNo};
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
 *  사용자 JWT Token 삭제
 * 
 * @param deleteMarketSaleJwtDto 
 */
  async delJwt(deleteMarketSaleJwtDto: DeleteMarketSaleJwtDto): Promise<any> {
    
    try {
      const email = deleteMarketSaleJwtDto.email;
   
      // 1. 사용자 체크
      let user = await this.userService.getOneByEmail(email);
      if (!user) {
        throw new NotFoundException('Data Not found. : 사용자 정보');
      }
      console.log("user: "+JSON.stringify(user));
   
      // 2. 사용자의 didWallet 체크
      let didWallet = await this.userService.getDidWallet(user.userNo);
      if (didWallet) {
          await this.didWalletRepository.update({ userNo: user.userNo}, {jwt: null});
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    } 

  }

/**
 *  사용자 에셋 판매 등록
 * 
 * @param user 
 * @param createMarketSaleDto 
 */
  async createAll(files: any,
    createMarketSaleDto: CreateMarketSaleDto): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const email = createMarketSaleDto.email;
      const nickName = createMarketSaleDto.nickName;
      const assetName = createMarketSaleDto.assetName;
      const assetDesc = createMarketSaleDto.assetDesc;
      const assetUrl = createMarketSaleDto.assetUrl;
      const adTarget = createMarketSaleDto.adTarget;
      const adType = createMarketSaleDto.adType;
      const price = createMarketSaleDto.price;
      const startDttm = createMarketSaleDto.startDttm;
      const endDttm = createMarketSaleDto.endDttm;
      const issueCnt = createMarketSaleDto.issueCnt;
   
      // 1. 사용자 체크
      let user = await this.userService.getOneByEmail(email);
      if (user) {
        user.nftWalletAccount = (await this.userService.getWalletAddress(user.userNo)).account;          
      }else{
        const createUserDto: CreateUserDto = {
          email,
          nickName
        }
        user = await this.userService.create(createUserDto);
        user.nftWalletAccount = (await this.userService.getWalletAddress(user.userNo)).account;          
      }
      console.log("user: "+JSON.stringify(user));
   
      let didWallet = await this.userService.getDidWallet(user.userNo);
      if (!didWallet) {
        console.log("market-didWallet이 없어요.");
        // 1.1. 사용자 연결 인증 요청
        const createDidUserDto: CreateDidUserDto = {id: email};
              const userJwt = await this.didService.createUser(createDidUserDto);
              if (!userJwt) {      
                throw new NotFoundException('DID 등록 오류 - jwt');
              }
              console.log("userJwt: "+JSON.stringify(userJwt))

        // 1.2. 아바타 가상자갑 생성 요청
        const createDidWalletDto: CreateDidWalletDto = {nickName, imageUrl: '', id: email, jwt: userJwt.jwt};
        const userDid = await this.didService.createWallet(createDidWalletDto);
        if (!userDid) {
          throw new NotFoundException('DID 등록 오류 - did');
        }      
        console.log("userDid: "+JSON.stringify(userDid))

        // DidWallet 저장
        let didWalletInfo = {userNo: user.userNo, jwt: userJwt.jwt, walletDid: userDid.did};
        // console.log("didWalletInfo : "+JSON.stringify(didWalletInfo));
        const newDidWallet = queryRunner.manager.create(DidWallet, didWalletInfo);
        await queryRunner.manager.save<DidWallet>(newDidWallet);

      }else{
        console.log("market-didWallet이 있어요.");
        if(didWallet.jwt === null || didWallet.jwt === undefined) {
            // 1.1. 사용자 연결 인증 요청
            const createDidUserDto: CreateDidUserDto = {id: email};
              const userJwt = await this.didService.createUser(createDidUserDto);
              if (!userJwt) {      
                throw new NotFoundException('DID 등록 오류 - jwt');
              }
              console.log("userJwt: "+JSON.stringify(userJwt))

          // DidWallet에 JWT수정
          let didWalletInfo = {jwt: userJwt.jwt};
          // console.log("didWalletInfo : "+JSON.stringify(didWalletInfo));
          await queryRunner.manager.update(DidWallet, {userNo: user.userNo}, didWalletInfo);
        }

      }


      // 2. charged 체크
      // Charged 상태 업데이트 될 때까지 대기

      // const timeIntaval = this.configService.get<number>('TIME_INTERVAL_DB');
      // const maxRetries = this.configService.get<number>('MAX_RETRIES');      
       
      // let cRetries = 0;
      // let nftWallet = null;
      // while (cRetries < maxRetries) {
      //   const nftWallet = await this.nftWalletRepository.findOne({ where:{userNo: user.userNo} });
      //   console.log(`⏳ nftWallet. ${JSON.stringify(nftWallet)}`);
      //   if (nftWallet.chargedYn !== 'Y') {
      //     cRetries++;
      //     console.log(`⏳ nftWallet 정보가 없음. ${cRetries}번째 재시도 중...`);
      //     await new Promise((resolve) => setTimeout(resolve, timeIntaval));
      //   }
      // }
      // if (nftWallet.chargedYn !== 'Y') {
      //   throw new NotFoundException('Data Not found. : 계좌의 충전 정보');
      // }

      // 3. 굿즈 등록
      const createProductDto: CreateProductDto = {
        productName: assetName,
        productDesc: assetDesc || assetName,
        state: 'N2',
        startDttm,
        endDttm,
        adTargetFirst: undefined,  
        adTypesFirst: undefined,   
        adTargetSecond: undefined,  
        adTypesSecond: undefined,   
        adTargetThird: undefined,  
        adTypesThird: undefined,
        adTargetFourth: undefined,
        adTypesFourth: undefined,
        files: undefined,      
      };

      // adTarget 값에 따라 설정
      switch (adTarget) {
        case 1:
            createProductDto.adTargetFirst = adTarget;
            createProductDto.adTypesFirst = String(adType);
            break;
        case 2:
            createProductDto.adTargetSecond = adTarget;
            createProductDto.adTypesSecond = String(adType);
            break;
        case 3:
              createProductDto.adTargetThird = adTarget;
              createProductDto.adTypesThird = String(adType);
              break;
        default:
            createProductDto.adTargetSecond = adTarget || 2;
            createProductDto.adTypesSecond = String(adType);
            break;
      }

      console.log("createProductDto: "+JSON.stringify(createProductDto));
      const product = await this.productService.create(user, files, createProductDto);
      console.log("product: "+JSON.stringify(product));

      // 4. 에셋 등록
      const createAssetDto: CreateAssetDto = {
        productNo: product.productNo,
        assetName,
        assetDesc: assetDesc || assetName,
        assetUrl: assetUrl || undefined,
        adTarget: adTarget || 2,
        adType,
        price,
        state: 'S2',
        startDttm,
        endDttm,
        files: undefined,  
      };

      console.log("createAssetDto: "+JSON.stringify(createAssetDto));
      const asset = await this.assetService.createSale(user, files, createAssetDto);
      console.log("asset: "+JSON.stringify(asset));

      // 5. 엔터사 구매 등록
      const createContractDto: CreateContractDto = {
        productNo: product.productNo,
        assetNo: asset.assetNo,
        // productNo: 1,
        // assetNo: 1,
      };

      console.log("createContractDto: "+JSON.stringify(createContractDto));
      const contract = await this.contractService.purchaseSale(user, createContractDto);
      console.log("contract: "+JSON.stringify(contract));
   
      // 6. 엔터사 판매 등록
      const createMarketDto: CreateMarketDto = {
        contractNo: contract.contractNo,
        // contractNo: 4,
        purchaseNo: undefined,
        marketAssetName: assetName,
        marketAssetDesc: assetDesc,
        price,
        issueCnt: issueCnt || 1,
        startDttm,
        endDttm,
      };

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
   * 에셋 NFT MINT & VC 발급
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
        const nftMintInfo: CreateMintDto = {assetNo: marketInfo.assetNo, productNo: marketInfo.productNo,
          issuedTo: marketInfo.saleAddr, issueCnt: marketInfo.issueCnt, tokenId: null, state: 'B1', marketNo};
        this.nftService.createMarketMintSale(user, nftMintInfo);
      }else{
        // VC 발급
        console.log("VC 발급");
        await this.createVc(user, marketInfo.assetNo);
      }

    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  } 
  
  /**
   * 에셋등록증명 VC 발급 & 등록
   * 
   * @param assetNo 
   */
  async createVc(user: User, assetNo: number): Promise<any> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

       // ETRI API 호출
      // 1. 아바타 크리덴셜 DID 생성 요청
      const sql = this.assetRepository.createQueryBuilder('asset')
                  // .leftJoin(State, 'state', 'asset.state = state.state')
                      .leftJoin(Product, 'product', 'asset.product_no = product.product_no')
                      .leftJoin(FileAsset, 'fileAsset', 'asset.file_no = fileAsset.file_no')
                      .leftJoin(NftMint, 'nftMint', 'asset.token_id = nftMint.token_id')
                      .leftJoin(DidWallet, 'didWallet', 'asset.user_no = didWallet.user_no')
                      .leftJoin(User, 'user', 'asset.user_no = user.user_no')
                      .select('asset.asset_no', 'assetNo')
                      .addSelect('asset.reg_name', 'nickName')
                      .addSelect('asset.asset_name', 'assetName')
                      .addSelect('asset.asset_desc', 'assetDesc')
                      .addSelect('asset.asset_desc_kor', 'assetDescKor')
                      .addSelect('asset.metaverse_name', 'metaverseName')
                      .addSelect('asset.type_def', 'typeDef')
                      .addSelect('asset.price', 'price')
                      .addSelect('asset.reg_addr', 'regAddr')
                      .addSelect('asset.asset_url', 'assetUrl')
                      .addSelect('asset.reg_dttm', 'regDttm')
                      .addSelect("didWallet.jwt", 'jwt')
                      .addSelect("didWallet.wallet_did", 'did')
                      .addSelect("user.email", 'email')
                      .addSelect("nftMint.tx_id", 'txId')
                      .addSelect("product.reg_name", 'regName')
                      .addSelect("product.product_name", 'productName')
                      .addSelect("concat('"  + serverDomain  + "/', fileAsset.thumbnail_first)", 'assetUrl')
                      .where("asset.asset_no = :assetNo", { assetNo });

      const didInfo = await sql.groupBy(`asset.asset_no, didWallet.user_no, user.user_no, nftMint.token_id, 
        nftMint.tx_id, product.product_no, fileAsset.thumbnail_first`)
                          .getRawOne();
      
      const createDidAcdgDto: CreateDidAcdgDto = {jwt: didInfo.jwt, id: didInfo.email, did: didInfo.did};
      const vcDid = await this.didService.createAcdg(createDidAcdgDto);
      if (!vcDid) {
        throw new Error('Data Not found.');
      }
      console.log("vcDid: "+JSON.stringify(vcDid))

      // 2. 아바타 크리덴셜 발급 요청
      const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
      const attributes = {
        "assetId": "ARONFT-"+assetNo,
        "registrantNickName": didInfo.nickName,
        "assetName": didInfo.assetName,
        "EntertainmentCorp": didInfo.regName,
        "goodsName": didInfo.productName,
        "metaverseName": didInfo.metaverseName,
        "assetType": didInfo.typeDef,
        "assetDescription": didInfo.assetDesc,
        "assetPrice": String(didInfo.price),
        "registrantEmail": didInfo.email,
        "registrantWalletAddress": didInfo.regAddr,
        "txId": didInfo.txId,
        "contractAddress": contractAddress,
        "imageURL": didInfo.assetUrl,
        "registrationDate": didInfo.regDttm.toISOString().split('.')[0] + 'Z'
      };
      const createDidAciDto: CreateDidAciDto = {did: vcDid.did, attributes, nickName: didInfo.nickName};
      const issueVcInfo = await this.didService.createAci(createDidAciDto);
      if (!issueVcInfo) {
        throw new Error('VC 등록 오류 - vc');
      }
      console.log("issueVcInfo: "+JSON.stringify(issueVcInfo))
      const parsed = parseVC(issueVcInfo.vc);    
      const modifyAsset = {vcIssuerName: issueVcInfo.vcIssuerName,
        vcIssuerLogo: issueVcInfo.vcIssuerLogo, vcTypeName: issueVcInfo.vcTypeName, vcId: parsed.credentialId}
      console.log("===== modifyAsset : "+JSON.stringify(modifyAsset));
      await queryRunner.manager.update(Asset, assetNo, modifyAsset);

      // 3. 아바타 크리덴셜 등록  
      const createDidAcrDto: CreateDidAcrDto = 
        {
          id: didInfo.email,
          jwt: didInfo.jwt,
          did: didInfo.did,
          vc: issueVcInfo.vc,
          vcIssuerName: issueVcInfo.vcIssuerName,
          vcIssuerLogo: issueVcInfo.vcIssuerLogo,
          vcTypeName: issueVcInfo.vcTypeName
        };
      const vcInfo = await this.didService.createAcr(createDidAcrDto);
      if (!vcInfo) {
        throw new Error('VC 등록 오류 - vc');
      }
      console.log("vcInfo: "+JSON.stringify(vcInfo))
      
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
   * 사용자 에셋 판매 삭제
   * 
   * @param deleteMarketSaleDto 
   */
  async deleteAll(deleteMarketSaleDto: DeleteMarketSaleDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const email = deleteMarketSaleDto.email;
      const marketNo = deleteMarketSaleDto.marketNo;
   
      // 1. 사용자 체크
      let user = await this.userService.getOneByEmail(email);
      if (!user) {
        throw new NotFoundException('Data Not found. : 사용자 정보');
      }
      console.log("user: "+JSON.stringify(user));

      // 1. 마켓 판매 삭제
      const marketInfo = await this.marketRepository.findOne({
          where: { marketNo, saleAddr: user.nftWalletAccount },
      });
      if (!marketInfo) {
        throw new Error('❌ 마켓 정보를 찾을 수 없습니다.');
      }else{
         await queryRunner.manager.update(Market, {marketNo}, {state: 'S6'});
      }
      const productNo = marketInfo.productNo;
      const assetNo = marketInfo.assetNo;
      user.nftWalletAccount = marketInfo.saleAddr;

      // 2. 에셋 게시 삭제
      const assetInfo = await this.assetRepository.findOne({
          where: { assetNo},
      });
      if (!assetInfo) {
        throw new Error('❌ 에셋 정보를 찾을 수 없습니다.');
      }else{
         await queryRunner.manager.update(Asset, {assetNo}, {state: 'S6'});
      }

      // 3. 굿즈 게시 삭제
      const productInfo = await this.productRepository.findOne({
          where: { productNo},
      });
      if (!productInfo) {
        throw new Error('❌ 굿즈 정보를 찾을 수 없습니다.');
      }else{
         await queryRunner.manager.update(Product, {productNo}, {state: 'N5'});
      }

      // 4. 소각시킬 tokenId 찾기
      let tokenIds: string[] = [];

      if (marketInfo.issueCnt === marketInfo.saleCnt) {
        console.log("소각시킬 token이 없어요.");
      } else {
        const from = Number(marketInfo.fromTokenId);
        const to = Number(marketInfo.toTokenId);
        const inventoryCnt = Number(marketInfo.inventoryCnt);

        console.log(`from: ${from}, to: ${to}`);

        // Array.from으로 한 줄 생성 (to부터 내려가면서 inventoryCnt 개수)
        // tokenIds = Array.from({ length: inventoryCnt }, (_, i) => to - i);
        tokenIds = Array.from({ length: inventoryCnt }, (_, i) => (to - i).toString());
      }

      console.log("===========   tokenIds:", tokenIds);
      console.log("===========   user:", user);

      await queryRunner.commitTransaction();

      if(tokenIds.length > 0){
        // nftService.createBurns 호출
        const createBurnDto: CreateBurnDto = {
          assetNo,
          productNo,
          tokenIds
        };
        this.nftService.createBurns(user, createBurnDto);
      }   

    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

}
