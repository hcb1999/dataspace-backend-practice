import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between, In } from 'typeorm';
import { Purchase } from '../entities/purchase.entity';
import { Market } from '../entities/market.entity';
import { State } from '../entities/state.entity';
import { File } from '../entities/file.entity';
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

    @Inject('MARKET_REPOSITORY')
    private marketRepository: Repository<Market>,

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

      const marketNo = createPurchaseDto.marketNo;
      const purchaseCnt = createPurchaseDto.purchaseCnt;
      
      const marketInfo = await this.marketRepository.findOne({ where:{marketNo} });
      if (!marketInfo) {
        throw new NotFoundException("Data Not found. : 마켓 판매 정보");
      }
      if(!((purchaseCnt > 0) && (purchaseCnt <= marketInfo.inventoryCnt)) ){
        throw new NotFoundException("Data Not found. : 마켓 판매 정보의 재고 수량 확인");
      }
      
      const contractNo = 0;
      const productNo = 0;
      const assetNo = 0;
      const fromAddr = marketInfo.saleAddr;
      const toAddr = user.nftWalletAccount;

      const tokenId = (parseInt(marketInfo.fromTokenId) + marketInfo.saleCnt).toString();
      // console.log("marketInfo.fromTokenId : "+ marketInfo.fromTokenId);
      // console.log("marketInfo.saleCnt : "+ marketInfo.saleCnt);
      // console.log("marketInfo.fromTokenId + marketInfo.saleCnt : "+ marketInfo.fromTokenId + marketInfo.saleCnt);
      // console.log("tokenId : "+ tokenId);
      const fromTokenId = tokenId;
      const toTokenId = (parseInt(tokenId) + purchaseCnt -1).toString();
      createPurchaseDto['saleAddr'] = fromAddr;
      createPurchaseDto['saleUserName'] = marketInfo.saleUserName;
      createPurchaseDto['purchaseAddr'] = toAddr;
      createPurchaseDto['purchaseUserName'] = user.nickName;
      
      createPurchaseDto['fromTokenId'] = fromTokenId;
      createPurchaseDto['toTokenId'] = toTokenId;
      createPurchaseDto['inventoryCnt'] = purchaseCnt;
     
      console.log("===== createPurchaseDto : "+ JSON.stringify(createPurchaseDto));
      const newPurchase = queryRunner.manager.create(Purchase, createPurchaseDto);
      const result = await queryRunner.manager.save<Purchase>(newPurchase);
      const purchaseNo = result.purchaseNo;

      await queryRunner.commitTransaction();

      // nftService.createMarketTransfer 호출 호출
      // for TEST comment
      const nftTransferInfo: CreateTransferDto = {contractNo, marketNo, purchaseNo, fromAddr, toAddr, 
        assetNo, productNo, tokenId, purchaseCnt, state: ''};
      this.nftService.createMarketTransfer(user, nftTransferInfo);
      
    console.log("===== nftTransferInfo : "+ JSON.stringify(nftTransferInfo));

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
      const purchaseAddr = user.nftWalletAccount;
      const purchase = await this.purchaseRepository.findOne({ where:{purchaseNo, purchaseAddr} });
      if (!purchase) {
        throw new NotFoundException("Data Not found. : 사용자 구매 정보");
      }

      const sql = this.purchaseRepository.createQueryBuilder('purchase')
                      .innerJoin(Market, 'market', 'market.market_no = purchase.market_no')
                      .innerJoin(State, 'state', 'state.state = purchase.state')
                      .leftJoin(File, 'file', 'file.file_no = market.file_no')
                      .leftJoin(NftTransfer, 'transfer',
                      'purchase.purchase_no = transfer.purchase_no AND purchase.from_token_id = transfer.token_id')
                      .select('purchase.purchase_no', 'purchaseNo')
                      .addSelect("market.market_no", 'marketNo')    
                      .addSelect('purchase.sale_addr', 'saleAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || purchase.sale_addr`, 'saleAccountUrl')
                      .addSelect('purchase.sale_user_name', 'saleUserName')
                      .addSelect('purchase.purchase_addr', 'purchaseAccount')
                      .addSelect(`'${process.env.BC_EXPLORER}accounts/'  || purchase.purchase_addr`, 'purchaseAccountUrl')
                      .addSelect('purchase.purchase_user_name', 'purchaseUserName')
                      .addSelect("market.market_data_name", 'marketDataName')
                      .addSelect("market.market_data_desc", 'marketDataDesc')
                      .addSelect("market.market_product_type", 'marketProductType')
                      .addSelect("market.market_language", 'marketLanguage')
                      .addSelect("market.market_keyword", 'marketKeyword')
                      .addSelect("market.market_doi", 'marketDoi')
                      .addSelect("market.market_doi_url", 'marketDoiUrl')
                      .addSelect("market.market_subject", 'marketSubject')
                      .addSelect("market.market_issuer", 'marketIssuer')
                      .addSelect("market.price", 'price')
                      .addSelect('state.state_desc', 'stateDesc')   
                      .addSelect('purchase.pay_dttm', 'payDttm')                      
                      .addSelect('purchase.purchase_cnt', 'purchaseCnt')                      
                      .addSelect('purchase.sale_cnt', 'saleCnt')                      
                      .addSelect('purchase.inventory_cnt', 'inventoryCnt')                      
                      .addSelect('purchase.from_token_id', 'fromTokenId')     
                      .addSelect('purchase.to_token_id', 'toTokenId')     
                      .addSelect("file.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("file.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_second)", 'thumbnailSecond')
                      .addSelect("file.file_name_third", 'fileNameThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_third)", 'fileUrlThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_third)", 'thumbnailThird')
                      .addSelect('transfer.contract_id', 'nftContractAddress')
                      .addSelect(`'${process.env.BC_EXPLORER}address/' || transfer.contract_id`, 'nftContractAddressUrl')
                      .addSelect('transfer.tx_id', 'nftTxId')
                      .addSelect(`'${process.env.BC_EXPLORER}tx/'  || transfer.tx_id`, 'nftTxIdUrl')
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
        ...(transferList || []).map(item => ({ tokenId: item.token_id, ownerAccount: item.to_addr,
           ownerAccountUrl: `${process.env.BC_EXPLORER}accounts/${item.to_addr}` })),
        ...(mintList || []).map(item => ({ tokenId: item.token_id, ownerAccount: item.issued_to,
          owneAccountUrl: `${process.env.BC_EXPLORER}accounts/${item.issued_to}` }))
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
      const purchaseAddr = user.nftWalletAccount;

      let options = `purchase.purchase_addr = '${purchaseAddr}' and purchase.state = 'P3'`;
      if (word) {
        options += ` and ( market.market_data_name like '%${word}%' ) `; 
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
                      .innerJoin(Market, 'market', 'market.market_no = purchase.market_no')
                      .innerJoin(State, 'state', 'state.state = purchase.state')
                      .leftJoin(File, 'file', 'file.file_no = market.file_no')
                      .select('purchase.purchase_no', 'purchaseNo')
                      .addSelect('purchase.sale_user_name', 'saleUserName')
                      .addSelect("market.market_data_name", 'marketDataName')
                      .addSelect("market.market_data_desc", 'marketDataDesc')
                      .addSelect("market.market_product_type", 'marketProductType')
                      .addSelect("market.market_language", 'marketLanguage')
                      .addSelect("market.market_keyword", 'marketKeyword')
                      .addSelect("market.market_doi", 'marketDoi')
                      .addSelect("market.market_subject", 'marketSubject')
                      .addSelect("market.market_issuer", 'marketIssuer')
                      .addSelect("market.price", 'price')                      
                      .addSelect('purchase.state', 'state')      
                      .addSelect('state.state_desc', 'stateDesc')                      
                      .addSelect('purchase.pay_dttm', 'payDttm')     
                      .addSelect('purchase.purchase_cnt', 'purchaseCnt')                      
                      .addSelect('purchase.sale_cnt', 'saleCnt')                      
                      .addSelect('purchase.inventory_cnt', 'inventoryCnt')                    
                      .addSelect("file.file_name_first", 'fileNameFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_first)", 'fileUrlFirst')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_first)", 'thumbnailFirst')
                      .addSelect("file.file_name_second", 'fileNameSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_second)", 'fileUrlSecond')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_second)", 'thumbnailSecond')
                      .addSelect("file.file_name_third", 'fileNameThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.file_path_third)", 'fileUrlThird')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_third)", 'thumbnailThird')
                      .where(options)
                      // .andWhere("nftMint.use_yn = 'N'")
                      // .andWhere("nftMint.burn_yn = 'N'");

      const list = await sql.orderBy('purchase.purchase_no', getPurchaseDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .offset(skip)
                            .limit(take)
                            // .groupBy(`purchase.purchase_no, market.price, market.market_data_name, market.market_data_desc,
                            //     market.market_product_type, market.market_language, market.market_keyword, 
                            //     market.market_landing_page, market.market_subject, market.market_issuer,
                            //     state.state_desc, market.vc_id, file.file_name_first,  
                            //     file.file_path_first, file.thumbnail_first, file.file_name_second,
                            //     file.file_path_second, file.thumbnail_second, file.file_name_third,
                            //     file.file_path_third, file.thumbnail_third`)
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getPurchaseDto.pageSize, list);

    } catch(e) {
      this.logger.error(e);
      throw e;
    }
  }
}
