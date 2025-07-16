import { Body, Controller, HttpStatus, Post, Get, ValidationPipe, UseGuards, Query, Param, Logger, Inject } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/response';
import { ResponseMetadata } from 'src/common/responseMetadata';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { NftService } from './nft.service';
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
import { Asset } from '../entities/asset.entity';
import { FileAsset } from '../entities/file_asset.entity';
import { Product } from '../entities/product.entity';
import { EContract } from '../entities/contract.entity';
import { Market } from '../entities/market.entity';
import { Purchase } from '../entities/purchase.entity';
import { DidWallet } from '../entities/did_wallet.entity';
import { DidService } from '../did/did.service';
import { CreateDidAcdgDto } from '../dtos/create_did_acdg.dto';
import { CreateDidAciDto } from '../dtos/create_did_aci.dto';
import { CreateDidAcrDto } from '../dtos/create_did_acr.dto';
import { createVC, parseVC } from 'src/common/vc-utils';
import { ARODEVNFTCollection, ARODEVNFTCollection__factory } from './typechain-types';
import { Channel, Message } from 'amqplib';
import { DataSource, Repository } from 'typeorm';

@Controller('nft')
@ApiTags('NFT API')
export class NftController {

  private logger = new Logger('NftController');
  private provider: providers.JsonRpcProvider;
  private contractAddress: string;
  // private knftCollection: Contract;
  // private retryCount = 0;

  constructor(
    private configService: ConfigService,
    private responseMessage: ResponseMessage,
    private responseMetadata: ResponseMetadata,
    private nftService: NftService,
    private didService: DidService,


    private readonly nftGateway: NftGateway,

    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('CONTRACT_REPOSITORY')
    private contractRepository: Repository<EContract>,
   
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

  ) {
    // 이더리움 네트워크에 연결
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.contractAddress = process.env.CONTRACT_ADDRESS;
  }
 
  /*
  @Post("/mint")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Mint', description: 'NFT Mint' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createMint(@GetUser() user: User, @Body(ValidationPipe) createMintDto: CreateMintDto): Promise<any> {
    fileLogger.info('mint-create');
    fileLogger.info(user);
    fileLogger.info(createMintDto);
    await this.nftService.createMint(user,createMintDto);
    const result = {message: 'Minting process started'};
    return this.responseMessage.response(result);
  }
 
  @Post("/transfer")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Transfer', description: 'NFT Transfer' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createTransfer(@GetUser() user: User, @Body(ValidationPipe) createTransferDto: CreateTransferDto): Promise<any> {
    await this.nftService.createTransfer(user, createTransferDto);
    const result = {message: 'Transfer process started'};
    return this.responseMessage.response(result);
  }

  @Post("/transferNmint")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Transfer and Mint', description: 'NFT Transfer and Mint' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createTransferNMint(@GetUser() user: User, @Body(ValidationPipe) createTransferDto: CreateTransferDto): Promise<any> {
    fileLogger.info('transferNmint-create');
    fileLogger.info(user);
    fileLogger.info(createTransferDto);
    await this.nftService.createTransferNMint(user,createTransferDto);
    const result = {message: 'TransferNMinting process started'};
    return this.responseMessage.response(result);
  }

  @Post("/burn")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'NFT Burn', description: 'NFT Burn' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  async createBurn(@GetUser() user: User, @Body() createBurnDto: CreateBurnDto): Promise<any> {
    await this.nftService.createBurn(user, createBurnDto);
    const result = {message: 'Burn process started'};
    return this.responseMessage.response(result);
  }
*/

  /**
   * MINT 목록 조회
   * @param user 
   * @param getMintBurnDto 
   * @returns 
   */
  // @Get('/mint')
  // // @UseGuards(JwtAuthGuard)
  // // @ApiBearerAuth('access-token')
  // @ApiOperation({ summary: '에셋 민팅 목록 조회', description: '에셋 민팅 목록을 조회한다.' })
  // @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  // @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  // @ApiOkResponse({ description: '성공',
  //   schema: {example: { 
  //     "resultCode": 200,
  //     "resultMessage": "SUCESS",
  //     "data": {
  //       "pageSize": 10,
  //       "totalCount": 1,
  //       "totalPage": 1,
  //       "list": [
  //         {
  //           "price": 6000,
  //           "purchaseNo": 2,
  //           "saleUserName": "엔터사 1",
  //           "assetName": "블링원 테스트 굿즈4",
  //           "assetDesc": "굿즈 26번에 대한 에셋입니다.",
  //           "metaverseName": "K-POP 월드",
  //           "typeDef": "K-가슴",
  //           "stateDesc": "결재중",
  //           "payDttm": "2024-09-04 21:05:59",
  //           "fileNameFirst": "blingone_4.png",
  //           "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
  //           "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
  //           "fileNameSecond": "blingone_3.png",
  //           "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
  //           "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
  //         }
  //       ]
  //     }
  //   }}})
  // async getMintList(@GetUser() user: User, @Query() getMintBurnDto: GetMintBurnDto ): Promise<void> {
  //   const mintList = await this.nftService.getMintList(user, getMintBurnDto);

  //   const updatedList = mintList.list.map((item: any) => ({
  //     ...item,
  //     updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //   }));
  
  //   return this.responseMessage.response({
  //     ...mintList,
  //     list: updatedList
  //   });

  // }

  /**
   * TRANSFER 목록 조회
   * @param user 
   * @param getTransferDto 
   * @returns 
   */
  // @Get('/transfer')
  // // @UseGuards(JwtAuthGuard)
  // // @ApiBearerAuth('access-token')
  // @ApiOperation({ summary: '에셋 트랜스퍼 목록 조회', description: '에셋 트랜스퍼 목록을 조회한다.' })
  // @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  // @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  // @ApiOkResponse({ description: '성공',
  //   schema: {example: { 
  //     "resultCode": 200,
  //     "resultMessage": "SUCESS",
  //     "data": {
  //       "pageSize": 10,
  //       "totalCount": 1,
  //       "totalPage": 1,
  //       "list": [
  //         {
  //           "price": 6000,
  //           "purchaseNo": 2,
  //           "saleUserName": "엔터사 1",
  //           "assetName": "블링원 테스트 굿즈4",
  //           "assetDesc": "굿즈 26번에 대한 에셋입니다.",
  //           "metaverseName": "K-POP 월드",
  //           "typeDef": "K-가슴",
  //           "stateDesc": "결재중",
  //           "payDttm": "2024-09-04 21:05:59",
  //           "fileNameFirst": "blingone_4.png",
  //           "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
  //           "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
  //           "fileNameSecond": "blingone_3.png",
  //           "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
  //           "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
  //         }
  //       ]
  //     }
  //   }}})
  // async getTransferList(@GetUser() user: User, @Query() getTransferDto: GetTransferDto ): Promise<void> {
  //   const transferList = await this.nftService.getTransferList(user, getTransferDto);

  //   const updatedList = transferList.list.map((item: any) => ({
  //     ...item,
  //     updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //   }));
  
  //   return this.responseMessage.response({
  //     ...transferList,
  //     list: updatedList
  //   });

  // }

  /**
   * BURN 목록 조회
   * @param user 
   * @param getMintBurnDto 
   * @returns 
   */
  // @Get('/burn')
  // // @UseGuards(JwtAuthGuard)
  // // @ApiBearerAuth('access-token')
  // @ApiOperation({ summary: '에셋 버닝 목록 조회', description: '에셋 버닝 목록을 조회한다.' })
  // @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  // @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  // @ApiOkResponse({ description: '성공',
  //   schema: {example: { 
  //     "resultCode": 200,
  //     "resultMessage": "SUCESS",
  //     "data": {
  //       "pageSize": 10,
  //       "totalCount": 1,
  //       "totalPage": 1,
  //       "list": [
  //         {
  //           "price": 6000,
  //           "purchaseNo": 2,
  //           "saleUserName": "엔터사 1",
  //           "assetName": "블링원 테스트 굿즈4",
  //           "assetDesc": "굿즈 26번에 대한 에셋입니다.",
  //           "metaverseName": "K-POP 월드",
  //           "typeDef": "K-가슴",
  //           "stateDesc": "결재중",
  //           "payDttm": "2024-09-04 21:05:59",
  //           "fileNameFirst": "blingone_4.png",
  //           "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
  //           "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
  //           "fileNameSecond": "blingone_3.png",
  //           "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
  //           "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
  //         }
  //       ]
  //     }
  //   }}})
  // async getBurnList(@GetUser() user: User, @Query() getMintBurnDto: GetMintBurnDto ): Promise<void> {
  //   const burnList = await this.nftService.getBurnList(user, getMintBurnDto);

  //   const updatedList = burnList.list.map((item: any) => ({
  //     ...item,
  //     updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //   }));
  
  //   return this.responseMessage.response({
  //     ...burnList,
  //     list: updatedList
  //   });

  // }

/*
  @Post('dlq')
  async retryDlqToQueue() {
    // // 1. DLQ에서 메시지를 가져옵니다.
    // const message = await this.nftService.fetchDlqMessage();

    // if (message) {
    //   // 2. 메시지를 다시 처리할 큐로 보냅니다.
    //   await this.nftService.retryDlqMessage(message);
    //   return 'DLQ 메시지를 재발송하였습니다.';
    // } else {
    //   return 'DLQ에서 가져올 메시지가 없습니다.';
    // }

    let retryCount = 0;
    let messages = [];

    // DLQ가 빌 때까지 10개씩 메시지를 가져옴
    do {
      messages = await this.nftService.fetchDlqMessage(10); // 10개씩 가져오기

      for (const message of messages) {
        await this.nftService.retryDlqMessage(message);
        retryCount++;
      }
    } while (messages.length > 0);

    return { status: 'success', message: `${retryCount}개의 메시지를 재처리했습니다.` };

  }
*/

  // Starting Source
  // TypeChain을 이용하여 Contract 인스턴스 생성
  createContractInstance(wallet: Wallet): ARODEVNFTCollection {
    return ARODEVNFTCollection__factory.connect(this.contractAddress, wallet.connect(this.provider));
  }
  
/*
  @MessagePattern('transferEther')
  // async handleMint(@Payload() 
  //   data: { nftMintNo: number, assetNo: number, productNo: number, ownerAddress: string, ownerPKey: string }
  //   ,
  //   @Ctx() context: RmqContext
  // ): Promise<boolean> {
  async handleTransferEth(@Payload() 
    data: { userNo: number, faucetPKey: string, amount: number, toAddr: string }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleTransferEth started...`);
    // let result = true;
    
    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
      // originalMsg를 Message 타입으로 변환
    const message = originalMsg as Message; 

    // console.log('Context:', context); 
    // console.log('Received data:', JSON.stringify(data)); 
    const userNo = data.userNo;
    const faucetPKey = data.faucetPKey;
    const amount = data.amount;
    const toAddr = data.toAddr;

    console.log(`userNo: ${userNo}`);
    console.log(`ownerPKey: ${faucetPKey}`);
    console.log(`amount: ${amount}`);
    console.log(`toAddr: ${toAddr}`);
    // console.log(`provider: ${JSON.stringify(this.provider, null, 2)}`);

    // const wallet = new ethers.Wallet(walletPrivateKey).connect(this.provider);
    const fromWallet = new ethers.Wallet(faucetPKey).connect(this.provider);
    // console.log(`processMintTransaction started... fromWallet : ${JSON.stringify(fromWallet, null, 2)}`);
    
    let contract: any;
    try {

      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully`);
    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
      // channel.nack(originalMsg, false, false);  // 실패 시 명시적으로 nack 호출
      return;
    }
  
    // // 이벤트 리스너 추가
    // contract.on('NewTransferEther', (eFrom:any, eTo:any, price:any, event:any) => {
    //   this.logger.log(`NewTransferEther Event: Faucet: ${eFrom}, to : ${eTo}, ${price}`);

    // });

    try {
      const amountInWei = ethers.utils.parseEther(amount.toString());
      const ethTransferTx = await contract.transferOnlyEther(amountInWei, toAddr, {
        value: amountInWei // 여기에서 value가 보내는 이더 값
      });
      // this.logger.log(`ETH Transfer sent: ${ethTransferTx.hash}`);

      const receipt = await ethTransferTx.wait();

      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          if (parsedLog.name === "NewTransferEther") {
            const from = parsedLog.args[0];  
            const to = parsedLog.args[1];  
            const amount = parsedLog.args[2];  
            this.logger.log("=== Transfered Only Ether : "+ from + " --->  "+ to  + ",  " +amount +' Ether');
            console.log(`userNo: ${userNo}`);
            const wallet = await this.nftWalletRepository.findOneBy({ userNo });
            console.log("before update wallet: "+JSON.stringify(wallet)); 
            const wallet1 = await this.nftWalletRepository.update({userNo}, {chargedYn: 'Y'});
            console.log("wallet1: "+wallet1); 
            const wallet2 = await this.nftWalletRepository.findOneBy({ userNo });
            console.log("after update wallet2: "+JSON.stringify(wallet2)); 
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }

      channel.ack(message); // 성공적으로 처리되면 메시지를 확인

    } catch (error) {
      // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
      this.logger.error(`Error in handleEtherTransfer`);
      // let nftTransferInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error in handleTransfer: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';
        // nftTransferInfo = { state: 'B99' };
      }  else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Transaction Or Unexpected error in handleTransfer: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftTransferInfo = { state: 'B8' };
      }

      channel.ack(message);

    }
  }
*/

  @MessagePattern('mint')
  // async handleMint(@Payload() 
  //   data: { nftMintNo: number, assetNo: number, productNo: number, ownerAddress: string, ownerPKey: string }
  //   ,
  //   @Ctx() context: RmqContext
  // ): Promise<boolean> {
  async handleMint(@Payload() 
    data: { nftMintNo: number, assetNo: number, productNo: number, ownerAddress: string, ownerPKey: string }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleMint started...`);
    // let result = true;
    
    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
      // originalMsg를 Message 타입으로 변환
    const message = originalMsg as Message; 

    // console.log('Context:', context); 
    // console.log('Received data:', JSON.stringify(data)); 

    const nftMintNo = data.nftMintNo;
    const assetNo = data.assetNo;
    const productNo = data.productNo;
    const ownerAddress = data.ownerAddress;
    const ownerPKey = data.ownerPKey;

    // console.log(`nftMintNo: ${nftMintNo}`);
    // console.log(`assetNo: ${assetNo}`);
    // console.log(`productNo: ${productNo}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`provider: ${JSON.stringify(this.provider, null, 2)}`);

      // const wallet = new ethers.Wallet(walletPrivateKey).connect(this.provider);
    const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
    // console.log(`processMintTransaction started... fromWallet : ${JSON.stringify(fromWallet, null, 2)}`);
    
    let contract: Contract;
    try {

      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully`);
    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
      // channel.nack(originalMsg, false, false);  // 실패 시 명시적으로 nack 호출
      return;
    }
    
    // 토큰 ID와 상태 업데이트를 위한 변수를 선언
    let tokenId: string;
  
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    // // 이벤트 리스너 추가 - NewMintNFT(owner, assetName, createdTime)
    // contract.on('NewMintNFT', (owner: any, assetName: any, createdTime: any, event: any) => {
    //   this.logger.log(`NewMintNFT Event: Owner: ${owner}, AssetName: ${assetName}, CreatedTime: ${createdTime}`);

    //   tokenId = assetName.split('_').pop(); 
    //   this.logger.log(`processMintTransaction tokenId : `+tokenId);
    // });

    try {
      this.logger.log(`processMintTransaction started... Before mintTx`);
      const mintTx = await contract.mintNFT(assetNo, productNo);
      // this.logger.log(`Mint transaction sent: ${mintTx.hash}`);
  
      // 트랜잭션 영수증을 기다린다.
      const receipt  = await mintTx.wait();

      // 영수증에서 이벤트 로그를 찾는다.
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          // 특정 이벤트 이름 확인
          if (parsedLog.name === "NewMintNFT") {
            const assetName = parsedLog.args[1];  // 이벤트에서 반환된 값
            tokenId  = assetName.substring(assetName.lastIndexOf('_')+1);
            this.logger.log("=== mintedTokenId : "+tokenId );
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }      
  
      // console.log(`Mint transaction hash: ${mintTx.hash}`);
      // Mint 상태 업데이트를 위해 tokenId가 설정될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, parseInt(process.env.TIME_INTERVAL))); // 예시로 5초 대기 (너무 길지 않게 조절)
  
      if (!tokenId) {
        throw new Error('Token ID not received'); // 이벤트에서 tokenId가 설정되지 않았을 경우 예외 처리
      }

      this.logger.log(`processMintTransaction started... After mintTx`);
      const todayKST = new Date();
      const year = todayKST.getFullYear();
      const month = String(todayKST.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
      const day = String(todayKST.getDate()).padStart(2, '0');
      const startDateString = `${year}-${month}-${day}`;  
      const startDate = new Date(startDateString);

      let assetInfo = {}; // mint 상태 및 tokenId로 업데이트
      const asset = await this.assetRepository.findOne({ where:{assetNo, productNo} });
      if (asset) {        
        if(asset.startDttm = startDate){
          assetInfo = { tokenId, state: 'S2' }
        }else{
          assetInfo = { tokenId }
        }
        // console.log("===== assetInfo : "+JSON.stringify(assetInfo));
        await queryRunner.manager.update(Asset, assetNo, assetInfo);
      }  
  
      const nftMintInfo = { state: 'B4', tokenId, txId: mintTx.hash }; // mint 상태 및 tokenId로 업데이트
      await queryRunner.manager.update(NftMint, nftMintNo, nftMintInfo);

      await queryRunner.commitTransaction();

    } catch (error) {
      // this.logger.error(`Error in handleMintTransaction: ${error.message}`);
      this.logger.error(`Error in handleMint`);
      // let nftMintInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error in handleMint: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';        
        // nftMintInfo = { state: 'B99' };
        // result = false;
      } else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Transaction Or Unexpected error in handleMint: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftMintInfo = { state: 'B3' };
      }
      await queryRunner.rollbackTransaction();
      await queryRunner.manager.delete(NftMint, nftMintNo);
      // await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Mint',
        assetNo,
        productNo,
        error: errorMsg,
      });

      channel.ack(message);

      return;

    }finally {
      await queryRunner.release();
    }

    const queryRunner2 = this.dataSource.createQueryRunner();
    await queryRunner2.connect();
    await queryRunner2.startTransaction();

    try{
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
      console.log("didInfo: "+JSON.stringify(didInfo));

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
      await queryRunner2.manager.update(Asset, assetNo, modifyAsset);

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

      await queryRunner2.commitTransaction();

      this.logger.log(`Mint & VC Issue transaction 완료를 client에게 전송`);
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'success',
        type: 'Mint & VC Issue',
        assetNo,
        productNo,
        tokenId,
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
  
  @MessagePattern('transfer')
  async handleTransfer(@Payload() 
    data: { nftTransferNo: number, tokenId: number, price: number, 
    ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string,
    contractNo: number }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleTransfer started...`);

    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const message = originalMsg as Message; 
    
    const nftTransferNo = data.nftTransferNo;
    const tokenId = data.tokenId;
    const price = data.price;
    const ownerAddress = data.ownerAddress;
    const ownerPKey = data.ownerPKey;
    const sellerAddress = data.sellerAddress;
    const sellerPKey = data.sellerPKey;
    const contractNo = data.contractNo;

    // console.log(`nftTransferNo: ${nftTransferNo}`);
    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`sellerAddress: ${sellerAddress}`);
    // console.log(`sellerPKey: ${sellerPKey}`);
    // console.log(`contractNo: ${contractNo}`);

    let contract: Contract;
    const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
    
    try {

      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully: ${contract.address}`);
    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
    }
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    const amountInWei = ethers.utils.parseEther(price.toString());
    // console.log("=== 1 === Amount in Wei:", amountInWei.toString());

    // // 이벤트 리스너 추가
    // contract.once('NewTransferEther', async(buyer: any, seller: any, price: any, event: any) => {
    //   this.logger.log(`NewTransferEther Event: buyer: ${buyer}, seller: ${seller}, price: ${price}`);

    //   await this.handleNFTTransfer( nftTransferNo, tokenId, price, amountInWei, ownerAddress,
    //     ownerPKey, sellerAddress, sellerPKey, contractNo);
    // });

    try {
      // const amountInWei = ethers.utils.parseEther(price.toString());
      // console.log("=== 1 === Amount in Wei:", amountInWei.toString());
      const ethTransferTx = await contract.transferEther(tokenId, amountInWei, sellerAddress, {
        value: amountInWei // 여기에서 value가 보내는 이더 값
      });
      // this.logger.log(`ETH Transfer sent: ${ethTransferTx.hash}`);

      const receipt = await ethTransferTx.wait();

      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          if (parsedLog.name === "NewTransferEther") {
            const from = parsedLog.args[0];  
            const to = parsedLog.args[1];  
            const amount = parsedLog.args[2];  
            this.logger.log("=== Transfered Ether : "+ from + " --->  "+ to  + ",  " +amount +' Ether');

            await this.handleNFTTransfer( nftTransferNo, tokenId, price, amountInWei, ownerAddress,
              ownerPKey, sellerAddress, sellerPKey, contractNo);
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }

      channel.ack(message); // 성공적으로 처리되면 메시지를 확인

    } catch (error) {
      // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
      this.logger.error(`Error in handleEtherTransfer`);
      // let nftTransferInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error in handleTransfer: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';
        // nftTransferInfo = { state: 'B99' };
      }  else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Transaction Or Unexpected error in handleTransfer: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftTransferInfo = { state: 'B8' };
      }
      
      await queryRunner.manager.delete(EContract, contractNo);     
      await queryRunner.manager.delete(NftTransfer, nftTransferNo);
      await queryRunner.commitTransaction();
      
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Transfer-Ether',
        tokenId,
        price,
        ownerAddress,
        sellerAddress,
        error: errorMsg,
      });

      channel.ack(message);

    }finally {
      await queryRunner.release();
    }
  }
  
  async handleNFTTransfer(nftTransferNo: number, tokenId: number, price: number, amountInWei: ethers.BigNumber, 
    ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string,
    contractNo: number) {

    console.log(`handleNFTTransfer started...`);

    // console.log(`nftTransferNo: ${nftTransferNo}`);
    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`sellerAddress: ${sellerAddress}`);
    // console.log(`sellerPKey: ${sellerPKey}`);
    // console.log(`contractNo: ${contractNo}`);
    // console.log(`purchaseNo: ${purchaseNo}`)

    let contract: Contract;
    const fromWallet = new ethers.Wallet(sellerPKey).connect(this.provider);
    
    try {
      // console.log(`sellerPKey: ${sellerPKey}`);
      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully: ${contract.address}`);

      const balance = await this.provider.getBalance(sellerAddress);

      // 잔액을 Ether 단위로 변환 (기본 단위는 Wei)
      const balanceInEth = ethers.utils.formatEther(balance);
    
      // console.log(`지갑 ${sellerAddress}의 잔액: ${balance} Wei ${balanceInEth} ETH`);

    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
    }
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    // contract.on('NewTransferToken', async (seller: any, buyer: any, tokenId: any, event: any) => {
    //     this.logger.log(`NewTransferToken Event: seller: ${seller}, buyer: ${buyer}, tokenId: ${tokenId}`);
    // });

    // contract.once('NewTransferEther', async(seller: any, buyer: any, price: any, event: any) => {
    //   this.logger.log(`NewTransferRevEther Event: seller: ${seller}, buyer: ${buyer}, price: ${price}`);
    // });

    try {
      const nftTransferTx = await contract.transferToken(tokenId, ownerAddress);
      // this.logger.log(`Token Transfer transaction sent: ${nftTransferTx.hash}`);

      const receipt = await nftTransferTx.wait();

      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          if (parsedLog.name === "NewTransferToken") {
            const from = parsedLog.args[0];  
            const to = parsedLog.args[1];  
            const tokenId1 = parsedLog.args[2];  
            this.logger.log('Transfer Token TransactionHash :'+nftTransferTx.hash);
            this.logger.log("=== Transfered Token : "+ from + " --->  "+ to  + ', token ID : ' +tokenId1);
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }

      const nftTransferInfo = {state: 'B12', txId: nftTransferTx.hash};
      await queryRunner.manager.update(NftTransfer, nftTransferNo, nftTransferInfo);

      let data = {state: 'P3'};
      await queryRunner.manager.update(EContract, contractNo, data);
      const contractInfo = await this.contractRepository.findOne({ where:{contractNo} });
      const assetNo = contractInfo.assetNo;
      let data1 = {soldYn: 'Y', state: 'S5'};
      await queryRunner.manager.update(Asset, assetNo, data1);
      
      await queryRunner.commitTransaction();
      
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'success',
        type: 'Transfer',
        tokenId,
        ownerAddress,
        sellerAddress
      });

    } catch (error) {
      // this.logger.error(`Error in handleTokenTransfer: ${error.message}`);
      this.logger.error(`Error in handleTokenTransfer`);
      // let nftTransferInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error in handleNFTTransfer: ${error.message}`);
        errorMsg = 'Blockchain is unreachable'; 
        // nftTransferInfo = { state: 'B99' };
      } else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Unexpected error in handleNFTTransfer: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftTransferInfo = { state: 'B9' };
      }
      
      await queryRunner.rollbackTransaction();
      await queryRunner.manager.delete(EContract, contractNo);            
      await queryRunner.manager.delete(NftTransfer, nftTransferNo);
      
      // await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Transfer-Token',
        tokenId,
        price,
        ownerAddress,
        sellerAddress,
        error: errorMsg,
      });

      try {
        // seller에게서 buyer로 Ether 전송
        // const amountInWei = ethers.utils.parseEther(price.toString());
        // console.log("=== 2 === Amount in Wei:", amountInWei.toString());
        const ethTransferTx = await contract.transferEther(tokenId, amountInWei, ownerAddress, {
          value: amountInWei // 여기에서 value가 보내는 이더 값
        });
        this.logger.log(`ETH RecvTransfer sent: ${ethTransferTx.hash}`);
  
        const receipt = await ethTransferTx.wait();

        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log);
            
            if (parsedLog.name === "NewTransferEther") {
              const from = parsedLog.args[0];  
              const to = parsedLog.args[1];  
              const amount = parsedLog.args[2];  
              this.logger.log("=== Transfered Ether : "+ from + " --->  "+ to  + ",  " +amount +' Ether');
  
              await this.handleNFTTransfer( nftTransferNo, tokenId, price, amountInWei, ownerAddress,
                ownerPKey, sellerAddress, sellerPKey, contractNo);
              break;
            }
          } catch (err) {
            this.logger.log("Error parsing log:", err);
          }
        }
  
      } catch (error) {
        // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
        this.logger.error(`Error in handleEtherRecvTransfer`);
        let errorMsg = '';

        if (error.code === 'NETWORK_ERROR') {
          // 블록체인에 문제가 발생한 경우
          // this.logger.error(`Blockchain network error in handleNFTTransfer: ${error.message}`);
          errorMsg = 'Blockchain is unreachable';
        }  else {
          // 다른 일반적인 오류 처리
          // this.logger.error(`Unexpected error in handleNFTTransfer: ${error.message}`);
          errorMsg = 'Transaction failed due to invalid input Or data';
        }

        // await await queryRunner.manager.delete(EContract, contractNo);
        // await queryRunner.manager.delete(NftTransfer, nftTransferNo);
        // await queryRunner.commitTransaction();

        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'RecvTransfer-Ether',
          tokenId,
          price,
          ownerAddress,
          sellerAddress,
          error: errorMsg,
        });

      }
    }finally {
      await queryRunner.release();
    }
  }

  @MessagePattern('mints')
  // async handleMint(@Payload() 
  //   data: { nftMintNo: number, assetNo: number, productNo: number, ownerAddress: string, ownerPKey: string }
  //   ,
  //   @Ctx() context: RmqContext
  // ): Promise<boolean> {
  async handleMints(@Payload() 
    data: { createMintDto: CreateMintDto, ownerAddress: string, ownerPKey: string }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleMints started...`);
    // let result = true;
    
    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
      // originalMsg를 Message 타입으로 변환
    const message = originalMsg as Message; 

    // console.log('Context:', context); 
    // console.log('Received data:', JSON.stringify(data)); 

    const marketNo = data.createMintDto.marketNo;
    const assetNo = data.createMintDto.assetNo;
    const productNo = data.createMintDto.productNo;
    const issueCnt = data.createMintDto.issueCnt;
    const ownerAddress = data.ownerAddress;
    const ownerPKey = data.ownerPKey;

    // console.log(`marketNo: ${marketNo}`);
    // console.log(`assetNo: ${assetNo}`);
    // console.log(`productNo: ${productNo}`);
    // console.log(`issueCnt: ${issueCnt}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`provider: ${JSON.stringify(this.provider, null, 2)}`);

      // const wallet = new ethers.Wallet(walletPrivateKey).connect(this.provider);
    const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
    // console.log(`processMintTransaction started... fromWallet : ${JSON.stringify(fromWallet, null, 2)}`);
    
    let contract: Contract;
    try {

      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully`);
    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
      // channel.nack(originalMsg, false, false);  // 실패 시 명시적으로 nack 호출
      return;
    }
    
    // 토큰 ID와 상태 업데이트를 위한 변수를 선언
    let tokenIdAry: string[];
  
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    // // 이벤트 리스너 추가 - NewMintNFT(owner, assetName, createdTime)
    // contract.on('NewMintNFTs', (owner: any, assetNames: any, createdTime: any, event: any) => {
    //   this.logger.log(`NewMintNFTs Event: Owner: ${owner}, assetNames: ${assetNames}, CreatedTime: ${createdTime}`);

    //   tokenIdAry = assetNames.map((name: string) => name.split("_").pop() || "");
    //   // this.logger.log("=== mintedTokenIds : "+tokenIdAry);
    // });

    try {
      this.logger.log(`processMintTransaction started... Before mintTx`);
      const mintTx = await contract.mintNFTs(assetNo, productNo, issueCnt);
      // this.logger.log(`Mint transaction sent: ${mintTx.hash}`);
  
      const receipt = await mintTx.wait();
      let tokenIdAry: any;
  
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          if (parsedLog.name === "NewMintNFTs") {
            const assetNames = parsedLog.args[1];  
            tokenIdAry = assetNames.map((name: string) => name.split("_").pop() || "");
            this.logger.log("=== mintedTokenIds : "+tokenIdAry);
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }

      // Mint 상태 업데이트를 위해 tokenId가 설정될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, parseInt(process.env.TIME_INTERVAL))); // 예시로 5초 대기 (너무 길지 않게 조절)

      if (!tokenIdAry) {
        throw new Error('Token IDs not received'); // 이벤트에서 tokenId가 설정되지 않았을 경우 예외 처리
      }

      this.logger.log(`processMintsTransaction started... After mintTx`);
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

      const contractNo = market.contractNo;
      for (const tokenId of tokenIdAry) {
        const mintInfo = { productNo, assetNo, issuedTo: ownerAddress, tokenId, 
          state: 'B4', txId: mintTx.hash, contractNo };
        const newMint = queryRunner.manager.create(NftMint, mintInfo);
        await queryRunner.manager.save<NftMint>(newMint);
        console.log(`Inserted mintInfo with tokenId: ${tokenId}`);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Mint transaction 완료를 client에게 전송`);
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'success',
        type: 'Mint',
        assetNo,
        productNo,
        marketNo,
        tokenIdAry,
      });
  
      // 메시지 처리 완료 후 ack 호출
      channel.ack(message);

    } catch (error) {
      this.logger.error(`Error in handleMint`);
      // this.logger.error(`Error in handleMintTransaction: ${error.message}`);
      // let nftMintInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error in handleMint: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';        
        // nftMintInfo = { state: 'B99' };
        // result = false;
      } else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Transaction Or Unexpected error in handleMint: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftMintInfo = { state: 'B3' };
      }

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

    } finally {
      await queryRunner.release();
      // return result;
    }
  }

  @MessagePattern('mintsSale')
  // async handleMint(@Payload() 
  //   data: { nftMintNo: number, assetNo: number, productNo: number, ownerAddress: string, ownerPKey: string }
  //   ,
  //   @Ctx() context: RmqContext
  // ): Promise<boolean> {
  async handleMintsSale(@Payload() 
    data: { createMintDto: CreateMintDto, ownerAddress: string, ownerPKey: string }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleMintsSale started...`);
    // let result = true;
    
    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
      // originalMsg를 Message 타입으로 변환
    const message = originalMsg as Message; 

    // console.log('Context:', context); 
    // console.log('Received data:', JSON.stringify(data)); 

    const marketNo = data.createMintDto.marketNo;
    const assetNo = data.createMintDto.assetNo;
    const productNo = data.createMintDto.productNo;
    const issueCnt = data.createMintDto.issueCnt;
    const ownerAddress = data.ownerAddress;
    const ownerPKey = data.ownerPKey;

    // console.log(`marketNo: ${marketNo}`);
    // console.log(`assetNo: ${assetNo}`);
    // console.log(`productNo: ${productNo}`);
    // console.log(`issueCnt: ${issueCnt}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`provider: ${JSON.stringify(this.provider, null, 2)}`);

      // const wallet = new ethers.Wallet(walletPrivateKey).connect(this.provider);
    const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
    // console.log(`processMintTransaction started... fromWallet : ${JSON.stringify(fromWallet, null, 2)}`);
    
    let contract: Contract;
    try {

      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully`);
    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
      // channel.nack(originalMsg, false, false);  // 실패 시 명시적으로 nack 호출
      return;
    }
    
    // 토큰 ID와 상태 업데이트를 위한 변수를 선언
    // let tokenIdAry: string[];
  
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    // // 이벤트 리스너 추가 - NewMintNFT(owner, assetName, createdTime)
    // contract.on('NewMintNFTs', (owner: any, assetNames: any, createdTime: any, event: any) => {
    //   this.logger.log(`NewMintNFTs Event: Owner: ${owner}, assetNames: ${assetNames}, CreatedTime: ${createdTime}`);

    //   tokenIdAry = assetNames.map((name: string) => name.split("_").pop() || "");
    //   // this.logger.log("=== mintedTokenIds : "+tokenIdAry);
    // });

    let tokenIdAry: any;
    
    try {
      this.logger.log(`processMintsSaleTransaction started... Before mintTx`);
      const mintTx = await contract.mintNFTs(assetNo, productNo, issueCnt);
      // this.logger.log(`Mint transaction sent: ${mintTx.hash}`);
  
      const receipt = await mintTx.wait();
  
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          if (parsedLog.name === "NewMintNFTs") {
            const assetNames = parsedLog.args[1];  
            tokenIdAry = assetNames.map((name: string) => name.split("_").pop() || "");
            this.logger.log("=== mintedTokenIds : "+tokenIdAry);
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }

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

      const contractNo = market.contractNo;
      for (const tokenId of tokenIdAry) {
        const mintInfo = { productNo, assetNo, issuedTo: ownerAddress, tokenId, 
          state: 'B4', txId: mintTx.hash, contractNo };
        const newMint = queryRunner.manager.create(NftMint, mintInfo);
        await queryRunner.manager.save<NftMint>(newMint);
        console.log(`Inserted mintInfo with tokenId: ${tokenId}`);
      } 

      const data = { soldYn: 'Y',  state: 'S5', tokenId: tokenIdAry[0] };
      await queryRunner.manager.update(Asset, assetNo, data);
      const data1 = { tokenId: tokenIdAry[0] };
      await queryRunner.manager.update(EContract, contractNo, data1);

      await queryRunner.commitTransaction();

    } catch (error) {
      this.logger.error(`Error in handleMint`);
      this.logger.error(`Error in handleMintTransaction: ${error.message}`);
      // let nftMintInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error in handleMint: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';        
        // nftMintInfo = { state: 'B99' };
        // result = false;
      } else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Transaction Or Unexpected error in handleMint: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftMintInfo = { state: 'B3' };
      }

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
      const serverDomain = this.configService.get<string>('SERVER_DOMAIN')

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
      const modifyAsset = {state: 'S5', soldYn: 'Y', vcIssuerName: issueVcInfo.vcIssuerName,
        vcIssuerLogo: issueVcInfo.vcIssuerLogo, vcTypeName: issueVcInfo.vcTypeName, vcId: parsed.credentialId}
      console.log("===== modifyAsset : "+JSON.stringify(modifyAsset));
      await queryRunner2.manager.update(Asset, assetNo, modifyAsset);

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

/*
      const sql = this.assetRepository.createQueryBuilder('asset')
                      // .leftJoin(State, 'state', 'asset.state = state.state')
                      .leftJoin(DidWallet, 'didWallet', 'asset.user_no = didWallet.user_no')
                      .leftJoin(User, 'user', 'asset.user_no = user.user_no')
                      .select('asset.asset_no', 'assetNo')
                      .addSelect('asset.reg_name', 'nickName')
                      .addSelect("didWallet.jwt", 'jwt')
                      .addSelect("didWallet.wallet_did", 'did')
                      .addSelect("user.email", 'email')
                      .where("asset.asset_no = :assetNo", { assetNo });

      const didInfo = await sql.groupBy(`asset.asset_no, didWallet.user_no, user.user_no`)
                          .getRawOne();
      
      const createDidAcdgDto: CreateDidAcdgDto = {jwt: didInfo.jwt, id: didInfo.email, did: didInfo.did};
      const vcDid = await this.didService.createAcdg(createDidAcdgDto);
      if (!vcDid) {
        throw new Error('VC 등록 오류 - did');
      }
      console.log("vcDid: "+JSON.stringify(vcDid))

      
      // 2. 아바타 크리덴셜 발급 요청
      // tokenIdAry[0] 사용
      const createDidAciDto: CreateDidAciDto = {did: didInfo.did, nickName: didInfo.nickName};
      const issueVcInfo = await this.didService.createAci(createDidAciDto);
      if (!issueVcInfo) {
        throw new Error('VC 등록 오류 - vc');
      }
      console.log("issueVcInfo: "+JSON.stringify(issueVcInfo))

      // 3. 아바타 크리덴셜 등록  
      const parsed = parseVC(issueVcInfo.vc);    
      const vc = createVC({
        // credentialId: "https://tmvvca.example.com/vccredential/Daram_ConcertAttendance/6",
        credentialId: parsed.credentialId, 
        issuer: "did:ezid:1vSzrJIcUko6CoXEGOMzpKxdmJuDzn",
        issuanceDate: "2025-03-31T09:14:24Z",
        expirationDate: "2035-07-12T09:14:24Z",
        subjectId: "did:ezid:gj48YMzcdeimDkBbAOCId7ZTiX825r",
        subjectType: "Daram_ConcertAttendance",
        attendanceName: "2025 다람 공연 확인증",
        attendanceDate: "2025-07-11T12:00:00Z",
        attendanceProvider: "다람ENT",
        displayName: "2025 다람 공연 확인증",
        displayImage: "https://tmvvca.dreamsecurity.com:28082/DidVCA/images/tmv/cre_img02_b.png",
        credentialStatusId: "https://tmvvca.dreamsecurity.com:28082/DidVCA/vccredential/status?type=Daram_ConcertAttendance&num=123456",
        verificationMethod: "did:ezid:1vSzrJIcUko6CoXEGOMzpKxdmJuDzn#keys-0",
        challenge: "b1GXQmVawS7dfHTYQeTAezYumEC",
        jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..iUkPXFXhy4Pln-bCi7_aU-dBNSScdlrvG7spa-vrWSBDMoX-xnnRWgPJDVJtdabT4mw1HMc_plRY0JdMt2FdDA",
      });
      
      console.log(vc);
      // const vc = "{\"@context\":[\"https://www.w3.org/2018/credentials/v1\",\"https://www.ezid.com/vc\"],\"id\":\"https://tmvvca.dreamsecurity.com:28082/DidVCA/vccredential/Daram_ConcertAttendance/6\",\"type\":[\"VerifiableCredential\",\"CertificateCredential\"],\"issuer\":\"did:ezid:1vSzrJIcUko6CoXEGOMzpKxdmJuDzn\",\"issuanceDate\":\"2025-03-31T09:14:24Z\",\"expirationDate\":\"2035-07-12T09:14:24Z\",\"credentialStatus\":{\"id\":\"https://tmvvca.dreamsecurity.com:28082/DidVCA/vccredential/status?type=Daram_ConcertAttendance&num=123456\",\"type\":[\"CredentialStatusList2017\"]},\"credentialSubject\":{\"id\":\"did:ezid:gj48YMzcdeimDkBbAOCId7ZTiX825r\",\"type\":[\"Daram_ConcertAttendance\"],\"attendance\":{\"name\":\"2025 다람 공연 확인증\",\"date\":\"2025-07-11T12:00:00Z\",\"provider\":\"다람ENT\"},\"displayName\":\"2025 다람 공연 확인증\",\"displayImage\":\"https://tmvvca.dreamsecurity.com:28082/DidVCA/images/tmv/cre_img02_b.png\"},\"proof\":{\"type\":[\"Ed25519Signature2018\"],\"proofPurpose\":\"assertionMethod\",\"created\":\"2025-03-31T09:14:24Z\",\"verificationMethod\":\"did:ezid:1vSzrJIcUko6CoXEGOMzpKxdmJuDzn#keys-0\",\"challenge\":\"b1GXQmVawS7dfHTYQeTAezYumEC\",\"jws\":\"eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..iUkPXFXhy4Pln-bCi7_aU-dBNSScdlrvG7spa-vrWSBDMoX-xnnRWgPJDVJtdabT4mw1HMc_plRY0JdMt2FdDA\"}}";
      // // 에셋등록증으로 수정
      // const vc = "{\"@context\":[\"https://www.w3.org/2018/credentials/v1\",\"https://www.ezid.com/vc\"],\"id\":\"https://tmvvca.dreamsecurity.com:28082/DidVCA/vccredential/Daram_ConcertAttendance/6\",\"type\":[\"VerifiableCredential\",\"CertificateCredential\"],\"issuer\":\"did:ezid:1vSzrJIcUko6CoXEGOMzpKxdmJuDzn\",\"issuanceDate\":\"2025-03-31T09:14:24Z\",\"expirationDate\":\"2035-07-12T09:14:24Z\",\"credentialStatus\":{\"id\":\"https://tmvvca.dreamsecurity.com:28082/DidVCA/vccredential/status?type=Daram_ConcertAttendance&num=123456\",\"type\":[\"CredentialStatusList2017\"]},\"credentialSubject\":{\"id\":\"did:ezid:gj48YMzcdeimDkBbAOCId7ZTiX825r\",\"type\":[\"Daram_ConcertAttendance\"],\"attendance\":{\"name\":\"2025 다람 공연 확인증\",\"date\":\"2025-07-11T12:00:00Z\",\"provider\":\"다람ENT\"},\"displayName\":\"2025 다람 공연 확인증\",\"displayImage\":\"https://tmvvca.dreamsecurity.com:28082/DidVCA/images/tmv/cre_img02_b.png\"},\"proof\":{\"type\":[\"Ed25519Signature2018\"],\"proofPurpose\":\"assertionMethod\",\"created\":\"2025-03-31T09:14:24Z\",\"verificationMethod\":\"did:ezid:1vSzrJIcUko6CoXEGOMzpKxdmJuDzn#keys-0\",\"challenge\":\"b1GXQmVawS7dfHTYQeTAezYumEC\",\"jws\":\"eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..iUkPXFXhy4Pln-bCi7_aU-dBNSScdlrvG7spa-vrWSBDMoX-xnnRWgPJDVJtdabT4mw1HMc_plRY0JdMt2FdDA\"}}";
      const createDidAcrDto: CreateDidAcrDto = 
        {
          id: didInfo.email,
          jwt: didInfo.jwt,
          did: didInfo.did,
          vc,
          vcIssuerName: issueVcInfo.vcIssuerName,
          vcIssuerLogo: issueVcInfo.vcIssuerLogo,
          vcTypeName: issueVcInfo.vcTypeName
        };
      const vcInfo = await this.didService.createAcr(createDidAcrDto);
      if (!vcInfo) {
        throw new Error('VC 등록 오류 - vc');
      }
      console.log("vcInfo: "+JSON.stringify(vcInfo))

      const assetVcInfo = {vc: createDidAcrDto.vc, vcIssuerName: issueVcInfo.vcIssuerName,
          vcIssuerLogo: issueVcInfo.vcIssuerLogo, vcTypeName: issueVcInfo.vcTypeName, vcId: parsed.credentialId}
      console.log("===== assetVcInfo : "+JSON.stringify(assetVcInfo));
      await queryRunner2.manager.update(Asset, assetNo, assetVcInfo); 
*/
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
      // this.logger.error(`Error in handleMintTransaction: ${error.message}`);
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
    ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleTransfers started...`);

    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const message = originalMsg as Message; 
    
    const assetNo = data.createTransferDto.assetNo;
    const productNo = data.createTransferDto.productNo;
    const tokenId = data.createTransferDto.tokenId;
    const price = data.price * data.createTransferDto.purchaseCnt;
    const ownerAddress = data.ownerAddress;
    const ownerPKey = data.ownerPKey;
    const sellerAddress = data.sellerAddress;
    const sellerPKey = data.sellerPKey;
    const contractNo = data.createTransferDto.contractNo;
    const purchaseNo = data.createTransferDto.purchaseNo;
    const purchaseCnt = data.createTransferDto.purchaseCnt;
    const marketNo = data.createTransferDto.marketNo;

    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`sellerAddress: ${sellerAddress}`);
    // console.log(`sellerPKey: ${sellerPKey}`);
    // console.log(`contractNo: ${contractNo}`);
    // console.log(`purchaseNo: ${purchaseNo}`);
    // console.log(`purchaseCnt: ${purchaseCnt}`);
    // console.log(`marketNo: ${marketNo}`);

    let contract: Contract;
    const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
    
    try {

      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully: ${contract.address}`);
    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
    }
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    const amountInWei = ethers.utils.parseEther(price.toString());
    // console.log("=== 1 === Amount in Wei:", amountInWei.toString());

    // // 이벤트 리스너 추가
    // contract.once('NewTransferEther', async(buyer: any, seller: any, price: any, event: any) => {
    //   this.logger.log(`NewTransferEther Event: buyer: ${buyer}, seller: ${seller}, price: ${price}`);

    //   await this.handleNFTTransfers( parseInt(tokenId), price, purchaseCnt, amountInWei, ownerAddress,
    //     ownerPKey, sellerAddress, sellerPKey, contractNo, purchaseNo, assetNo, productNo, marketNo );
    // });

    try {
      // const amountInWei = ethers.utils.parseEther(price.toString());
      // console.log("=== 1 === Amount in Wei:", amountInWei.toString());
      const ethTransferTx = await contract.transferEther(tokenId, amountInWei, sellerAddress, {
        value: amountInWei // 여기에서 value가 보내는 이더 값
      });
      // this.logger.log(`ETH Transfer sent: ${ethTransferTx.hash}`);

      const receipt = await ethTransferTx.wait();

      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          if (parsedLog.name === "NewTransferEther") {
            const from = parsedLog.args[0];  
            const to = parsedLog.args[1];  
            const amount = parsedLog.args[2];  
            this.logger.log("=== Transfered Ether : "+ from + " --->  "+ to  + ",  " +amount +' Ether');

            await this.handleNFTTransfers( parseInt(tokenId), price, purchaseCnt, amountInWei, ownerAddress,
            ownerPKey, sellerAddress, sellerPKey, contractNo, purchaseNo, assetNo, productNo, marketNo );
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }

      channel.ack(message); // 성공적으로 처리되면 메시지를 확인

    } catch (error) {
      // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
      this.logger.error(`Error in handleEtherTransfer`);
      // let nftTransferInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error in handleTransfer: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';
        // nftTransferInfo = { state: 'B99' };
      }  else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Transaction Or Unexpected error in handleTransfer: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftTransferInfo = { state: 'B8' };
      }
      
      await queryRunner.rollbackTransaction();
      await queryRunner.manager.delete(Purchase, purchaseNo);
      // await queryRunner.commitTransaction();
      
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Transfer-Ether',
        tokenId,
        price,
        ownerAddress,
        sellerAddress,
        error: errorMsg,
      });

      channel.ack(message);

    }finally {
      await queryRunner.release();
    }
  }
  
  async handleNFTTransfers(tokenId: number, price: number, purchaseCnt: number, amountInWei: ethers.BigNumber, 
    ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string,
    contractNo: number, purchaseNo: number, assetNo: number, productNo: number, marketNo: number ) {

    console.log(`handleNFTTransfers started...`);

    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`sellerAddress: ${sellerAddress}`);
    // console.log(`sellerPKey: ${sellerPKey}`);
    // console.log(`contractNo: ${contractNo}`);
    // console.log(`purchaseNo: ${purchaseNo}`)
    // console.log(`purchaseCnt: ${purchaseCnt}`);
    // console.log(`assetNo: ${assetNo}`)
    // console.log(`productNo: ${productNo}`)
    // console.log(`marketNo: ${marketNo}`);

    let contract: Contract;
    const fromWallet = new ethers.Wallet(sellerPKey).connect(this.provider);
    
    try {
      // console.log(`sellerPKey: ${sellerPKey}`);
      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully: ${contract.address}`);

      const balance = await this.provider.getBalance(sellerAddress);

      // 잔액을 Ether 단위로 변환 (기본 단위는 Wei)
      const balanceInEth = ethers.utils.formatEther(balance);
    
      // console.log(`지갑 ${sellerAddress}의 잔액: ${balance} Wei ${balanceInEth} ETH`);

    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
    }
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    // contract.on('NewTransferTokens', async (seller: any, buyer: any, tokenIds: any, event: any) => {
    //     this.logger.log(`NewTransferTokens Event: seller: ${seller}, buyer: ${buyer}, tokenIds: ${tokenIds}`);
    // });

    // contract.once('NewTransferEther', async(seller: any, buyer: any, price: any, event: any) => {
    //   this.logger.log(`NewTransferRevEther Event: seller: ${seller}, buyer: ${buyer}, price: ${price}`);
    // });

    try {

      const tokenIds = Array.from({ length: purchaseCnt }, (_, i) => tokenId + i);
      // console.log("tokenIds : "+tokenIds);
      const nftTransferTx = await contract.transferTokens(tokenIds, ownerAddress);
      // this.logger.log(`Token Transfer transaction sent: ${nftTransferTx.hash}`);

      const receipt = await nftTransferTx.wait();

      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          if (parsedLog.name === "NewTransferTokens") {
            const from = parsedLog.args[0];  
            const to = parsedLog.args[1];  
            const tokenIds1 = parsedLog.args[2];  
            this.logger.log('Transfer Token TransactionHash :'+nftTransferTx.hash);
            this.logger.log("=== Transfered Token : "+ from + " --->  "+ to  + ', token IDs : ' +tokenIds1);
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }

      const fromAddr = sellerAddress.toLowerCase() ;
      const toAddr = ownerAddress.toLowerCase();
      for (const id of tokenIds) {
          const transferInfo = {productNo, assetNo, contractNo, purchaseNo, marketNo,
          fromAddr, toAddr, tokenId: id.toString(), state: 'B12', txId: nftTransferTx.hash};
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
      
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'success',
        type: 'Transfer',
        tokenId,
        ownerAddress,
        sellerAddress
      });

    } catch (error) {
      // this.logger.error(`Error in handleTokenTransfer: ${error.message}`);
      this.logger.error(`Error in handleTokenTransfer`);
      // let nftTransferInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error in handleNFTTransfer: ${error.message}`);
        errorMsg = 'Blockchain is unreachable'; 
        // nftTransferInfo = { state: 'B99' };
      } else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Unexpected error in handleNFTTransfer: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftTransferInfo = { state: 'B9' };
      }
      
      await queryRunner.rollbackTransaction();
      await queryRunner.manager.delete(Purchase, purchaseNo);      
      // await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Transfer-Token',
        tokenId,
        price,
        ownerAddress,
        sellerAddress,
        error: errorMsg,
      });

      try {
        // seller에게서 buyer로 Ether 전송
        // const amountInWei = ethers.utils.parseEther(price.toString());
        // console.log("=== 2 === Amount in Wei:", amountInWei.toString());
        const ethTransferTx = await contract.transferEther(tokenId, amountInWei, ownerAddress, {
          value: amountInWei // 여기에서 value가 보내는 이더 값
        });
        this.logger.log(`ETH RecvTransfer sent: ${ethTransferTx.hash}`);
  
        const receipt = await ethTransferTx.wait();  

        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log);
            
            if (parsedLog.name === "NewTransferEther") {
              const from = parsedLog.args[0];  
              const to = parsedLog.args[1];  
              const amount = parsedLog.args[2];  
              this.logger.log("=== Transfered Ether : "+ from + " --->  "+ to  + ",  " +amount +' Ether');
              break;
            }
          } catch (err) {
            this.logger.log("Error parsing log:", err);
          }
        }
  
      } catch (error) {
        // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
        this.logger.error(`Error in handleEtherRecvTransfer`);
        let errorMsg = '';

        if (error.code === 'NETWORK_ERROR') {
          // 블록체인에 문제가 발생한 경우
          // this.logger.error(`Blockchain network error in handleNFTTransfer: ${error.message}`);
          errorMsg = 'Blockchain is unreachable';
        }  else {
          // 다른 일반적인 오류 처리
          // this.logger.error(`Unexpected error in handleNFTTransfer: ${error.message}`);
          errorMsg = 'Transaction failed due to invalid input Or data';
        }

        // await await queryRunner.manager.delete(EContract, contractNo);
        // await queryRunner.manager.delete(NftTransfer, nftTransferNo);
        // await queryRunner.commitTransaction();

        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'RecvTransfer-Ether',
          tokenId,
          price,
          ownerAddress,
          sellerAddress,
          error: errorMsg,
        });

      }
    }finally {
      await queryRunner.release();
    }
  }
    
  // @MessagePattern('transferNmint')
  // async handleTransferNMint(@Payload() 
  //   data: { nftMintNo: number, tokenId: number, price: number, ownerAddress: string, 
  //     ownerPKey: string, sellerAddress: string, sellerPKey: string,
  //     contractNo: number, purchaseNo: number, assetNo: number, productNo: number }
  //   ,
  //   @Ctx() context: RmqContext
  // ) {

  //   console.log(`handleTransferNMint started...`);

  //   const channel: Channel = context.getChannelRef();
  //   const originalMsg = context.getMessage();
  //   const message = originalMsg as Message; 
    
  //   const nftMintNo = data.nftMintNo;
  //   const tokenId = data.tokenId;
  //   const price = data.price;
  //   const ownerAddress = data.ownerAddress;
  //   const ownerPKey = data.ownerPKey;
  //   const sellerPKey = data.sellerPKey;
  //   const sellerAddress = data.sellerAddress;
  //   const contractNo = data.contractNo;
  //   const purchaseNo = data.purchaseNo;
  //   const assetNo = data.assetNo;
  //   const productNo = data.productNo;

  //   // console.log(`nftMintNo: ${nftMintNo}`);
  //   // console.log(`price: ${price}`);
  //   // console.log(`ownerAddress: ${ownerAddress}`);
  //   // console.log(`ownerPKey: ${ownerPKey}`);
  //   // console.log(`sellerAddress: ${sellerAddress}`);
  //   // console.log(`contractNo: ${contractNo}`);
  //   // console.log(`purchaseNo: ${purchaseNo}`);
  //   // console.log(`assetNo: ${assetNo}`);
  //   // console.log(`productNo: ${productNo}`);

  //   let contract: Contract;
  //   const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
    
  //   try {

  //     // NFT 계약 인스턴스 생성
  //     contract = this.createContractInstance(fromWallet);
  //     this.logger.log(`Contract instance created successfully: ${contract.address}`);
  //   } catch (error) {
  //     this.logger.error(`Error creating contract instance: ${error.message}`);
  //   }
    
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();
  
  //   const amountInWei = ethers.utils.parseEther(price.toString());
  //   // console.log("=== 1 === Amount in Wei:", amountInWei.toString());
  //   // // 이벤트 리스너 추가
  //   contract.once('NewTransferEther', async(buyer: any, seller: any, price: any, event: any) => {
  //     this.logger.log(`NewTransferEther Event: buyer: ${buyer}, seller: ${seller}, price: ${price}`);

  //     await this.handleNFTMint( nftMintNo, tokenId, price, ownerAddress, 
  //       ownerPKey, sellerAddress, sellerPKey, contractNo, purchaseNo, assetNo, productNo  );
  //   });

  //   try {
  //     // const amountInWei = ethers.utils.parseEther(price.toString());
  //     // console.log("=== 1 === Amount in Wei:", amountInWei.toString());
  //     const ethTransferTx = await contract.transferEther(tokenId, amountInWei, sellerAddress, {
  //       value: amountInWei // 여기에서 value가 보내는 이더 값
  //     });
  //     // this.logger.log(`ETH Transfer sent: ${ethTransferTx.hash}`);

  //     await ethTransferTx.wait();

  //     channel.ack(message); // 성공적으로 처리되면 메시지를 확인

  //   } catch (error) {
  //     // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
  //     this.logger.error(`Error in handleEtherTransfer`);
  //     // let nftTransferInfo = {};
  //     let errorMsg = '';

  //     if (error.code === 'NETWORK_ERROR') {
  //       // 블록체인에 문제가 발생한 경우
  //       // this.logger.error(`Blockchain network error in handleTransfer: ${error.message}`);
  //       errorMsg = 'Blockchain is unreachable';
  //       // nftTransferInfo = { state: 'B99' };
  //     }  else {
  //       // 다른 일반적인 오류 처리
  //       // this.logger.error(`Transaction Or Unexpected error in handleTransfer: ${error.message}`);
  //       errorMsg = 'Transaction failed due to invalid input Or data';
  //       // nftTransferInfo = { state: 'B8' };
  //     }
      
  //     await queryRunner.manager.delete(Purchase, purchaseNo);
              
  //     await queryRunner.manager.delete(NftMint, nftMintNo);

  //     await queryRunner.commitTransaction();
      
  //     this.nftGateway.sendTransactionResult(ownerAddress, {
  //       status: 'failed',
  //       type: 'Transfer-Ether',
  //       assetNo,
  //       productNo,
  //       ownerAddress,
  //       sellerAddress,
  //       price,
  //       error: errorMsg,
  //     });

  //     channel.ack(message);

  //   }finally {
  //     await queryRunner.release();
  //   }
  // }

  // async handleNFTMint( nftMintNo: number, tokenId: number, price: number, ownerAddress: string, 
  //   ownerPKey: string, sellerAddress: string, sellerPKey: string,
  //   contractNo: number, purchaseNo: number, assetNo: number, productNo: number ) {

  //   console.log(`handleNFTMint started...`);
  //   // let result = true;

  //   // console.log(`nftMintNo: ${nftMintNo}`);
  //   // console.log(`ownerAddress: ${ownerAddress}`);
  //   // console.log(`ownerPKey: ${ownerPKey}`);
  //   // console.log(`sellerAddress: ${sellerAddress}`);
  //   // console.log(`contractNo: ${contractNo}`);
  //   // console.log(`assetNo: ${assetNo}`);
  //   // console.log(`productNo: ${productNo}`);
  //   // console.log(`price: ${price}`);

  //   let contract: Contract;
  //   const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
    
  //   try {
  //     // console.log(`ownerPKey: ${ownerPKey}`);
  //     // NFT 계약 인스턴스 생성
  //     contract = this.createContractInstance(fromWallet);
  //     // this.knftCollection = this.createContractInstance(fromWallet);
  //     this.logger.log(`Contract instance created successfully: ${contract.address}`);

  //     // const balance = await this.provider.getBalance(ownerAddress);

  //     // // 잔액을 Ether 단위로 변환 (기본 단위는 Wei)
  //     // const balanceInEth = ethers.utils.formatEther(balance);
    
  //     // console.log(`지갑 ${ownerAddress}의 잔액: ${balance} Wei ${balanceInEth} ETH`);

  //   } catch (error) {
  //     this.logger.error(`Error creating contract instance: ${error.message}`);
  //   }
    
  //   // 토큰 ID와 상태 업데이트를 위한 변수를 선언
  //   let tokenId1: string;
  
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();
  
  //   // 이벤트 리스너 추가 - NewMintNFT(owner, assetName, createdTime)
  //   contract.on('NewMintNFT', (owner: any, assetName: any, createdTime: any, event: any) => {
  //     this.logger.log(`NewMintNFT Event: Owner: ${owner}, AssetName: ${assetName}, CreatedTime: ${createdTime}`);

  //     tokenId1 = assetName.split('_').pop(); 
  //     this.logger.log(`processMintTransaction tokenId1 : `+tokenId1);
  //   });

  //   contract.once('NewTransferEther', async(seller: any, buyer: any, price: any, event: any) => {
  //     this.logger.log(`NewTransferRevEther Event: seller: ${seller}, buyer: ${buyer}, price: ${price}`); 
  //   }); 

  //   try {
  //     this.logger.log(`processTransferNMintTransaction started... Before mintTx`);
  //     const mintTx = await contract.mintNFT(assetNo, productNo);
  //     // this.logger.log(`Mint transaction sent: ${mintTx.hash}`);
  
  //     await mintTx.wait();
  
  //     // Mint 상태 업데이트를 위해 tokenId가 설정될 때까지 대기
  //     await new Promise((resolve) => setTimeout(resolve, parseInt(process.env.TIME_INTERVAL))); // 예시로 5초 대기 (너무 길지 않게 조절)
  
  //     if (!tokenId1) {
  //       throw new Error('Token ID not received'); // 이벤트에서 tokenId가 설정되지 않았을 경우 예외 처리
  //     }

  
  //     let data = {state: 'P3', tokenId: tokenId1};
  //     await queryRunner.manager.update(Purchase, purchaseNo, data);
  
  //     const nftMintInfo = { state: 'B4', tokenId: tokenId1, txId: mintTx.hash }; // mint 상태 및 tokenId로 업데이트
  //     await queryRunner.manager.update(NftMint, nftMintNo, nftMintInfo);

  //     let nftTransferNo = 0;
  //     const transfer = await this.nftTransferRepository.findOne({ where:{assetNo, productNo, tokenId: tokenId1, toAddr: ownerAddress} });
  //     if (!transfer) {
  //       const transferInfo = {productNo, assetNo, contractNo, purchaseNo, txId: mintTx.hash, 
  //         fromAddr: sellerAddress, toAddr: ownerAddress, tokenId: tokenId1, state: 'B5'};
  //       // console.log("===== transferInfo : "+JSON.stringify(transferInfo));
  //       const newTransfer = queryRunner.manager.create(NftTransfer, transferInfo);
  //       const result = await queryRunner.manager.save<NftTransfer>(newTransfer);
  //       nftTransferNo = result.nftTransferNo;
  //     } 

  //     await queryRunner.commitTransaction();

  //     this.logger.log(`TransferNmint transaction 완료를 client에게 전송`);
  //     this.nftGateway.sendTransactionResult(ownerAddress, {
  //       status: 'success',
  //       type: 'TransferNmint',
  //       assetNo,
  //       productNo,
  //       ownerAddress,
  //       sellerAddress,
  //       tokenId1
  //     });

  //   } catch (error) {
  //     // this.logger.error(`Error in handleMintTransaction: ${error.message}`);
  //     this.logger.error(`Error in handleMint`);
  //     // let nftMintInfo = {};
  //     let errorMsg = '';

  //     if (error.code === 'NETWORK_ERROR') {
  //       // 블록체인에 문제가 발생한 경우
  //       // this.logger.error(`Blockchain network error in handleMint: ${error.message}`);
  //       errorMsg = 'Blockchain is unreachable';        
  //       // nftMintInfo = { state: 'B99' };
  //       // result = false;
  //     } else {
  //       // 다른 일반적인 오류 처리
  //       // this.logger.error(`Transaction Or Unexpected error in handleMint: ${error.message}`);
  //       errorMsg = 'Transaction failed due to invalid input Or data';
  //       // nftMintInfo = { state: 'B3' };
  //     }
  //     await queryRunner.manager.delete(NftMint, nftMintNo);
  //     await queryRunner.manager.delete(Purchase, purchaseNo);

  //     await queryRunner.commitTransaction();

  //     this.nftGateway.sendTransactionResult(ownerAddress, {
  //       status: 'failed',
  //       type: 'Mint',
  //       assetNo,
  //       productNo,
  //       ownerAddress,
  //       sellerAddress,
  //       error: errorMsg,
  //     });

  //     // seller에게서 buyer로 Ether 전송
  //     let contract1: any;
  //     const fromWallet1 = new ethers.Wallet(sellerPKey).connect(this.provider);
      
  //     try {
  //       // console.log(`ownerPKey: ${ownerPKey}`);
  //       // NFT 계약 인스턴스 생성
  //       contract1 = this.createContractInstance(fromWallet1);
  //       // this.knftCollection = this.createContractInstance(fromWallet);
  //       this.logger.log(`Contract1 instance created successfully: ${contract1.address}`);
  
  //       // const balance = await this.provider.getBalance(sellerAddress);
  
  //       // 잔액을 Ether 단위로 변환 (기본 단위는 Wei)
  //       // const balanceInEth = ethers.utils.formatEther(balance);
      
  //       // console.log(`지갑 ${sellerAddress}의 잔액: ${balance} Wei ${balanceInEth} ETH`);
  
  //     } catch (error) {
  //       this.logger.error(`Error creating contract1 instance: ${error.message}`);
  //     }

  //     try {
  //       const amountInWei = ethers.utils.parseEther(price.toString());
  //       // console.log("=== 2 === Amount in Wei:", amountInWei.toString());
  //       const ethTransferTx = await contract1.transferEther(tokenId, amountInWei, ownerAddress, {
  //         value: amountInWei // 여기에서 value가 보내는 이더 값
  //       });
  //       this.logger.log(`ETH RecvTransfer sent: ${ethTransferTx.hash}`);
  
  //       await ethTransferTx.wait();
  
  //     } catch (error) {
  //       // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
  //       this.logger.error(`Error in handleEtherRecvTransfer`);
  //       let errorMsg = '';

  //       if (error.code === 'NETWORK_ERROR') {
  //         // 블록체인에 문제가 발생한 경우
  //         // this.logger.error(`Blockchain network error in handleNFTTransfer: ${error.message}`);
  //         errorMsg = 'Blockchain is unreachable';
  //       }  else {
  //         // 다른 일반적인 오류 처리
  //         // this.logger.error(`Unexpected error in handleNFTTransfer: ${error.message}`);
  //         errorMsg = 'Transaction failed due to invalid input Or data';
  //       }

  //       // await await queryRunner.manager.delete(EContract, contractNo);
  //       // await queryRunner.manager.delete(NftTransfer, nftTransferNo);
  //       // await queryRunner.commitTransaction();

  //       this.nftGateway.sendTransactionResult(ownerAddress, {
  //         status: 'failed',
  //         type: 'RecvTransfer-Ether',
  //         assetNo,
  //         productNo,
  //         ownerAddress,
  //         sellerAddress,
  //         price,
  //         error: errorMsg,
  //       });

  //     }

  //   } finally {
  //     await queryRunner.release();
  //     // return result;
  //   }
      
  // }

  @MessagePattern('burn')
  async handleBurn(@Payload()
    data: { nftBurnNo: number, nftMintNo: number, assetNo: number, productNo: number, tokenId: number, ownerAddress: string, ownerPKey: string }
    ,
    @Ctx() context: RmqContext
  ) {

    console.log(`handleBurn started...`);

    const channel: Channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const message = originalMsg as Message; 

    const nftBurnNo = data.nftBurnNo;
    const nftMintNo = data.nftMintNo;
    const assetNo = data.assetNo;
    const productNo = data.productNo;
    const tokenId = data.tokenId;
    const ownerAddress = data.ownerAddress;
    const ownerPKey = data.ownerPKey;

    const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
  
    let contract: Contract;
    try {

      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      // this.logger.log(`Contract instance created successfully: ${this.knftCollection}`);
      this.logger.log(`Contract instance created successfully: ${contract.address}`);
    } catch (error) {
      this.logger.error(`Error creating contract instance: ${error.message}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // // 이벤트 리스너 추가 
    // contract.on('NewBurnNFT', (owner: any, tokenId: any, event: any) => {
    //   this.logger.log(`NewBurnNFT Event: Owner: ${owner}, tokenId: ${tokenId}`);
    // });

    try {
      const burnTx = await contract.burnNFT(tokenId);
      this.logger.log(`Burn transaction sent: ${burnTx.hash}`);

      const receipt = await burnTx.wait();

      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          
          if (parsedLog.name === "NewTransferEther") {
            const owner = parsedLog.args[0];  
            const tokenId = parsedLog.args[1];  
            this.logger.log(`NewBurnNFT Event: Owner: ${owner}, tokenId: ${tokenId}`);          
            break;
          }
        } catch (err) {
          this.logger.log("Error parsing log:", err);
        }
      }

      const nftAssetInfo = {useYn: 'N', state: 'S4'};
      await queryRunner.manager.update(Asset, assetNo, nftAssetInfo);

      const nftMintInfo = {state: 'B16', burnYn: 'Y'};
      await queryRunner.manager.update(NftMint, nftMintNo, nftMintInfo);

      const nftBurnInfo = {state: 'B16', txId: burnTx.hash};
      await queryRunner.manager.update(NftBurn, nftBurnNo, nftBurnInfo);

      await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'success',
        type: 'Burn',
        assetNo,
        productNo,
        tokenId,
      });

      // 성공적으로 처리되면 메시지를 확인
      channel.ack(message); 

    } catch (error) {
      // this.logger.error(`Error in handleBurnTransaction: ${error.message}`);
      this.logger.error(`Error in handleBurn`);
      // let nftBurnInfo = {};
      let errorMsg = '';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        // this.logger.error(`Blockchain network error: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';
        // nftBurnInfo = { state: 'B99' };
      } else {
        // 다른 일반적인 오류 처리
        // this.logger.error(`Transaction Or Unexpected error in handleBurn: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input Or data';
        // nftBurnInfo = { state: 'B15' };
      }
      await queryRunner.manager.delete(NftBurn, nftBurnNo);
      await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Burn',
        assetNo,
        productNo,
        tokenId,
        error: errorMsg,
      });     
      
      channel.ack(message);
    
    }finally {
      await queryRunner.release();
    }
  }  

}
