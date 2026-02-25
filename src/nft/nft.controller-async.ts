import { Body, Controller, HttpStatus, Post, Get, ValidationPipe, UseGuards, Query, Param, Logger, Inject } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/response';
import { ResponseMetadata } from 'src/common/responseMetadata';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { NftService } from './nft.service';
import { CreateAlMintDto } from '../dtos/create_al_mint.dto';
import { CreateAlTransferDto } from '../dtos/create_al_transfer.dto';
import { CreateDidVcDto } from '../dtos/create_did_vc.dto';
import { CreateMintDto } from '../dtos/create_mint.dto';
import { GetMintBurnDto } from '../dtos/get_mint_burn.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { GetTransferDto } from '../dtos/get_transfer.dto';
import { CreateBurnDto } from '../dtos/create_burn.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { MessagePattern, Ctx, Payload, RmqContext} from '@nestjs/microservices';
import { Contract , Wallet, ethers, providers } from "ethers";
import { NftGateway } from './nft.gateway'; // WebSocket Gateway
import { NftMint } from '../entities/nft_mint.entity';
import { NftWallet } from '../entities/nft_wallet.entity';
import { NftTransfer } from '../entities/nft_transfer.entity';
import { NftBurn } from '../entities/nft_burn.entity';
import { File } from '../entities/file.entity';
import { Market } from '../entities/market.entity';
import { Purchase } from '../entities/purchase.entity';
import { DidWallet } from '../entities/did_wallet.entity';
import { DidService } from '../did/did.service';
import { createVC, parseVC } from 'src/common/vc-utils';
// import { ARODEVNFTCollection, ARODEVNFTCollection__factory } from './typechain-types';
import { Channel, Message } from 'amqplib';
import { DataSource, Repository } from 'typeorm';

@Controller('nft')
@ApiTags('NFT API')
export class NftController {

  private logger = new Logger('NftController');
  // private provider: providers.JsonRpcProvider;
  // private contractAddress: string;
  // private knftCollection: Contract;
  // private retryCount = 0;

  constructor(
    private configService: ConfigService,
    private responseMessage: ResponseMessage,
    // private responseMetadata: ResponseMetadata,
    private nftService: NftService,
    private didService: DidService,

    private readonly nftGateway: NftGateway,
   
    @Inject('PURCHASE_REPOSITORY')
    private purchaseRepository: Repository<Purchase>,

    @Inject('MARKET_REPOSITORY')
    private marketRepository: Repository<Market>,

    @Inject('NFT_WALLET_REPOSITORY')
    private nftWalletRepository: Repository<NftWallet>,

    // @Inject('NFT_MINT_REPOSITORY')
    // private nftMintRepository: Repository<NftMint>,

    @Inject('NFT_TRANSFER_REPOSITORY')
    private nftTransferRepository: Repository<NftTransfer>,

    // @Inject('NFT_BURN_REPOSITORY')
    // private nftBurnRepository: Repository<NftBurn>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,

    // @Inject('RABBITMQ_SERVICE')
    // private client: ClientProxy

  ) {}


  @MessagePattern('mintsSale')
  // async handleMint(@Payload() 
  //   data: { nftMintNo: number, assetNo: number, productNo: number, ownerAddress: string }
  //   ,
  //   @Ctx() context: RmqContext
  // ): Promise<boolean> {
  async handleMintsSale(@Payload() 
    data: { createMintDto: CreateMintDto, issuerDid: string, ownerAddress: string }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleMintsSale started...`);
        
    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
      // originalMsg를 Message 타입으로 변환
    const message = originalMsg as Message;

    // Authledger /mint 호출
    const marketNo = data.createMintDto.marketNo;
    const assetNo = data.createMintDto.assetNo;
    const productNo = data.createMintDto.productNo;
    const issueCnt = data.createMintDto.issueCnt;
    const issuerDid = data.issuerDid;
    const ownerAddress = data.ownerAddress;

    // console.log(`marketNo: ${marketNo}`);
    // console.log(`assetNo: ${assetNo}`);
    // console.log(`productNo: ${productNo}`);
    // console.log(`issueCnt: ${issueCnt}`);
    // console.log(`issuerDid: ${issuerDid}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    let tokenIdAry: any;
      
    try {
      this.logger.log(`processMintsSaleTransaction started... Before mintTx`);

      // console.log("===== mintsSale  issuerDid : "+issuerDid);         
      // console.log("===== mintsSale  issueCnt : "+issueCnt);         
      const createAlMintDto: CreateAlMintDto = {
        issuerDid,
        issueCnt
      }
      
      console.log("===== mintsSale  createAlMintDto : "+JSON.stringify(createAlMintDto));
      const result: any = await this.nftService.alMint(createAlMintDto);
      if(!result) {
        throw new Error('오스레저 mint error');
      }

      // console.log("===== mintsSale  result : "+JSON.stringify(result));
      const contractAddress = result.contractAddress;
      const txId = result.txId;
      const tokenIdAry = result.tokenIds;
      // console.log("===== mintsSale  tokenIdAry : "+tokenIdAry);

      // Mint 상태 업데이트를 위해 tokenId가 설정될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, parseInt(process.env.TIME_INTERVAL))); // 예시로 5초 대기 (너무 길지 않게 조절)

      if (!tokenIdAry) {
        throw new Error('Token IDs not received'); // 이벤트에서 tokenId가 설정되지 않았을 경우 예외 처리
      }

      this.logger.log(`processMintsSaleTransaction started... After mintTx`);
      const todayKST = new Date();
      const year = todayKST.getFullYear();
      const month = String(todayKST.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
      const day = String(todayKST.getDate()).padStart(2, '0');
      const startDateString = `${year}-${month}-${day}`;  
      const startDate = new Date(startDateString);

      const market = await this.marketRepository.findOne({ where:{marketNo} });
      if (market) {
        let marketInfo = { fromTokenId: tokenIdAry[0], toTokenId: tokenIdAry[tokenIdAry.length - 1] }; 
        if(market.startDttm = startDate){
          marketInfo['state'] = 'S2' ;
        }
        // console.log("===== marketInfo : "+JSON.stringify(marketInfo));
        await queryRunner.manager.update(Market, marketNo, marketInfo);
      } 

      for (const tokenId of tokenIdAry) {
        const mintInfo = { productNo, assetNo, issuedTo: market.regAddr, tokenId, 
          state: 'B4', txId: txId, contractId: contractAddress, contractNo: 0,
          marketNo};
        const newMint = queryRunner.manager.create(NftMint, mintInfo);
        await queryRunner.manager.save<NftMint>(newMint);
        // console.log(`Inserted mintInfo with tokenId: ${tokenId}`);
      } 

      await queryRunner.commitTransaction();

    } catch (error) {
      // this.logger.error(`Error in handleMint`);
      this.logger.error(`Error in handleMintTransaction: ${error.message}`);
      // let nftMintInfo = {};
      let errorMsg = error.message;

      await queryRunner.rollbackTransaction();
      
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Mint',
        assetNo,
        productNo,
        marketNo,
        error: errorMsg,
      });

      channel.ack(message);

      return;

    } finally {
      await queryRunner.release();
    }

    const queryRunner2 = this.dataSource.createQueryRunner();
    await queryRunner2.connect();
    await queryRunner2.startTransaction();

    try{
      console.log("Authledger /vc등록 호출 시작...");
      // Authledger /vc등록 호출  // issue count 만큼 등록증 요청
      const nftMintUrl = this.configService.get<string>('NFT_MINT_URL');
      const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

      console.log("nftMintUrl: "+nftMintUrl);
      console.log("serverDomain: "+serverDomain);
      // 1. 아바타 크리덴셜 DID 생성 요청
      const sql1 = this.marketRepository.createQueryBuilder('market')
                  // .leftJoin(State, 'state', 'asset.state = state.state')
                      .leftJoin(File, 'file', 'market.file_no = file.file_no')
                      .leftJoin(NftMint, 'nftMint', 'market.from_token_id = nftMint.token_id')
                      .leftJoin(DidWallet, 'didWallet', 'market.user_no = didWallet.user_no')
                      .leftJoin(User, 'user', 'market.user_no = user.user_no')                     
                      .select('market.market_no', 'marketNo')
                      .addSelect('market.market_sc_type', 'marketScType')
                      .addSelect('market.market_vc_type', 'marketVcType')
                      .addSelect('user.email', 'email')
                      .addSelect('market.reg_addr', 'regAddr')
                      .addSelect('market.market_data_name', 'marketDataName')
                      .addSelect('market.market_data_desc', 'marketDataDesc')
                      .addSelect('market.market_product_type', 'marketProductType')
                      .addSelect('market.market_language', 'marketLanguage')
                      .addSelect('market.market_keyword', 'marketKeyword')
                      .addSelect('market.market_doi', 'marketDoi')
                      .addSelect('market.market_subject', 'marketSubject')
                      .addSelect('market.market_issuer', 'marketIssuer')
                      .addSelect('market.market_doi_url', 'marketDoiUrl')
                      .addSelect('market.price', 'price')
                      .addSelect('market.reg_dttm', 'regDttm')
                      // .addSelect("didWallet.jwt", 'jwt')
                      .addSelect("didWallet.wallet_did", 'did')
                      // .addSelect("user.email", 'email')
                      .addSelect("nftMint.tx_id", 'txId')
                      .addSelect("nftMint.contract_id", 'contractId')
                      .addSelect("concat('"  + serverDomain  + "/', file.thumbnail_first)", 'imageUrl')                      
                      .where("market.market_no = :marketNo", { marketNo });

      // const didInfo = await sql.groupBy(`asset.asset_no, didWallet.user_no, user.user_no, nftMint.token_id,           
      //   nftMint.tx_id, product.product_no, fileAsset.thumbnail_first`)
      //                     .getRawOne();

      const didInfo = await sql1.getRawOne();
      console.log("didInfo: "+JSON.stringify(didInfo));
      const dataspace = this.configService.get<string>('DID_DATASPACE');

      // 데이터 크리덴셜 발급 요청
      console.log("createDidVcDto 1: "+issuerDid)
      console.log("createDidVcDto 2: "+didInfo.did)
      const createDidVcDto: CreateDidVcDto = {
        "walletDid": issuerDid,
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

      // console.log("createDidVcDto: "+JSON.stringify(createDidVcDto));
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
      const updateResult = await queryRunner2.manager.update(Market, { marketNo }, modifyMarket);
      console.log(`===== modifyMarket update affected: ${updateResult.affected}`);

      await queryRunner2.commitTransaction();

      this.logger.log(`Mint & VC Issue transaction 완료를 client에게 전송`);
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'success',
        type: 'Mint & VC Issue',
        assetNo,
        productNo,
        marketNo,
        tokenIdAry,
      });
  
      // 메시지 처리 완료 후 ack 호출
      channel.ack(message);

    } catch (error) {
      this.logger.error(`Error in handleMintTransaction: ${error.message}`);
      this.logger.error(`Error in handleMint`);

      let errorMsg = '';

      await queryRunner2.rollbackTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'VC Issue',
        assetNo,
        productNo,
        error: errorMsg,
      });
        
      channel.ack(message);
      
    } finally {
      await queryRunner2.release();
    }

  }
  
  @MessagePattern('transfers')
  async handleTransfers(@Payload() 
    data: { createTransferDto: CreateTransferDto, price: number, 
    sellerDid: string, sellerAddress: string, buyerDid: string, buyerAddress: string }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleTransfers started...`);

    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const message = originalMsg as Message; 
    
    const assetNo = 0;
    const productNo = 0;
    const tokenId = data.createTransferDto.tokenId;
    // const tokenId = Number(data.createTransferDto.tokenId);
    const price = data.price * data.createTransferDto.purchaseCnt;
    const contractNo = 0;
    const purchaseNo = data.createTransferDto.purchaseNo;
    const purchaseCnt = data.createTransferDto.purchaseCnt;
    const marketNo = data.createTransferDto.marketNo;
    const sellerDid = data.sellerDid;
    const sellerAddress = data.sellerAddress;
    const buyerDid = data.buyerDid;
    const buyerAddress = data.buyerAddress;
    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`sellerDid: ${sellerDid}`);
    // console.log(`sellerAddress: ${sellerAddress}`);
    // console.log(`buyerDid: ${buyerDid}`);
    // console.log(`buyerAddress: ${buyerAddress}`);
    // console.log(`purchaseNo: ${purchaseNo}`);
    // console.log(`purchaseCnt: ${purchaseCnt}`);
    // console.log(`marketNo: ${marketNo}`);
  
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    const amountInWei = ethers.utils.parseEther(price.toString());
    // console.log("=== 1 === Amount in Wei:", amountInWei.toString());

    try {
      const startTokenId = Number(tokenId); 
      const tokenIds = Array.from({ length: purchaseCnt }, (_, i) => String(startTokenId + i));
      console.log("tokenIds : "+tokenIds);

      const createAlTransferDto: CreateAlTransferDto = {
        tokenIds,
        amountInWei: amountInWei.toString(),
        sellerDid,
        buyerDid
      }
      const result: any = await this.nftService.alTransfer(createAlTransferDto);
      if(!result) {
        throw new Error('오스레저 transfer error');
      }

      const contractAddress = result.contractAddress;
      const txId = result.txId;
   
      const fromAddr = sellerAddress.toLowerCase() ;
      const toAddr = buyerAddress.toLowerCase();
      for (const id of tokenIds) {
          const transferInfo = {productNo, assetNo, contractNo, purchaseNo, marketNo,
          fromAddr, toAddr, tokenId: id.toString(), state: 'B12', txId: txId, contractId: contractAddress};
          // console.log("===== transferInfo : "+JSON.stringify(transferInfo));
          const newTransfer = queryRunner.manager.create(NftTransfer, transferInfo);
          await queryRunner.manager.save<NftTransfer>(newTransfer);
      }

      const market = await this.marketRepository.findOne({ where:{marketNo} });
      if (market) {
        const saleCnt = market.saleCnt + purchaseCnt;
        const inventoryCnt = market.issueCnt - saleCnt;
        let marketInfo = { saleCnt, inventoryCnt }; 
        if(inventoryCnt == 0){
          marketInfo['state'] = 'S5' ;
        }
        // console.log("===== marketInfo : "+JSON.stringify(marketInfo));

        await queryRunner.manager.update(Market, marketNo, marketInfo);
      }

      const purchase = await this.purchaseRepository.findOne({ where:{purchaseNo} });
      if (purchase) {
        let purchaseInfo = { state: 'P3' }; 
        // console.log("===== purchaseInfo : "+JSON.stringify(purchaseInfo));

        await queryRunner.manager.update(Purchase, purchaseNo, purchaseInfo);
      }
      
      await queryRunner.commitTransaction();
      
      this.logger.log(`Transfer transaction 완료를 client에게 전송`);
      this.nftGateway.sendTransactionResult(buyerAddress, {
        status: 'success',
        type: 'Transfer',
        tokenId,
        buyerAddress,
        sellerAddress
      });
 
      channel.ack(message); // 성공적으로 처리되면 메시지를 확인

    } catch (error) {
      // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
      this.logger.error(`Error in handleEtherTransfer`);
      // let nftTransferInfo = {};
      let errorMsg = error.message;
      
      await queryRunner.rollbackTransaction();
      await queryRunner.manager.delete(Purchase, purchaseNo);
      // await queryRunner.commitTransaction();
      
      this.nftGateway.sendTransactionResult(buyerAddress, {
        status: 'failed',
        type: 'Transfer',
        tokenId,
        price,
        buyerAddress,
        sellerAddress,
        error: errorMsg,
      });

      channel.ack(message);

    }finally {
      await queryRunner.release();
    }
  }

  /**
   * 오스레저에 mint 요청
   * 
   * @param createAlMintDto 
   * @returns 
   */
  @Post("/al-mint")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '오스레저에 mint 요청', description: '오스레저에 mint 요청을 한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  async alMint(@Body(ValidationPipe) createAlMintDto: CreateAlMintDto): Promise<any> {
    console.log("++++++++++++++++++++++");
    fileLogger.info('did-alMint');
    fileLogger.info(createAlMintDto);
    const result: any = await this.nftService.alMint(createAlMintDto);
    return this.responseMessage.response(result);
  }

  /**
   * 오스레저에 transfer 요청
   * 
   * @param createAlTransferDto 
   * @returns 
   */
  @Post("/al-transfer")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '오스레저에 transfer 요청', description: '오스레저에 transfer 요청을 한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  async alTransfer(@Body(ValidationPipe) createAlTransferDto: CreateAlTransferDto): Promise<any> {
    console.log("++++++++++++++++++++++");
    fileLogger.info('did-alTransfer');
    fileLogger.info(createAlTransferDto);
    const result: any = await this.nftService.alTransfer(createAlTransferDto);
    return this.responseMessage.response(result);
  }

}
