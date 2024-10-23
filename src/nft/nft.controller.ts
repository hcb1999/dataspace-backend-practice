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
import { MessagePattern, Ctx, Payload, RmqContext} from '@nestjs/microservices';
import { Contract , Wallet, ethers, providers } from "ethers";
import { NftGateway } from './nft.gateway'; // WebSocket Gateway
import { NftMint } from '../entities/nft_mint.entity';
import { NftTransfer } from '../entities/nft_transfer.entity';
import { NftBurn } from '../entities/nft_burn.entity';
import { Asset } from '../entities/asset.entity';
import { PurchaseAsset } from '../entities/purchase_asset.entity';
import { Purchase } from '../entities/purchase.entity';
import { KNFTCollection, KNFTCollection__factory } from './typechain-types';
import { Channel, Message } from 'amqplib';
import { DataSource, Repository } from 'typeorm';

@Controller('nft')
@ApiTags('NFT API')
export class NftController {

  private logger = new Logger('NftController');
  private provider: providers.JsonRpcProvider;
  private contractAddress: string;
  private knftCollection: Contract;
  // private retryCount = 0;

  constructor(
    private responseMessage: ResponseMessage,
    private responseMetadata: ResponseMetadata,
    private nftService: NftService,

    private readonly nftGateway: NftGateway,

    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('PURCHASE_ASSET_REPOSITORY')
    private purchaseAssetRepository: Repository<PurchaseAsset>,

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

  /**
   * MINT 목록 조회
   * @param user 
   * @param getMintBurnDto 
   * @returns 
   */
  @Get('/mint')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 민팅 목록 조회', description: '에셋 민팅 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 1,
        "totalPage": 1,
        "list": [
          {
            "price": 6000,
            "purchaseNo": 2,
            "saleUserName": "엔터사 1",
            "assetName": "블링원 테스트 굿즈4",
            "assetDesc": "굿즈 26번에 대한 에셋입니다.",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-가슴",
            "stateDesc": "결재중",
            "payDttm": "2024-09-04 21:05:59",
            "fileNameFirst": "blingone_4.png",
            "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
            "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
            "fileNameSecond": "blingone_3.png",
            "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
            "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
          }
        ]
      }
    }}})
  async getMintList(@GetUser() user: User, @Query() getMintBurnDto: GetMintBurnDto ): Promise<void> {
    const mintList = await this.nftService.getMintList(user, getMintBurnDto);

    const updatedList = mintList.list.map((item: any) => ({
      ...item,
      updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...mintList,
      list: updatedList
    });

  }

  /**
   * TRANSFER 목록 조회
   * @param user 
   * @param getTransferDto 
   * @returns 
   */
  @Get('/transfer')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 트랜스퍼 목록 조회', description: '에셋 트랜스퍼 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 1,
        "totalPage": 1,
        "list": [
          {
            "price": 6000,
            "purchaseNo": 2,
            "saleUserName": "엔터사 1",
            "assetName": "블링원 테스트 굿즈4",
            "assetDesc": "굿즈 26번에 대한 에셋입니다.",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-가슴",
            "stateDesc": "결재중",
            "payDttm": "2024-09-04 21:05:59",
            "fileNameFirst": "blingone_4.png",
            "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
            "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
            "fileNameSecond": "blingone_3.png",
            "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
            "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
          }
        ]
      }
    }}})
  async getTransferList(@GetUser() user: User, @Query() getTransferDto: GetTransferDto ): Promise<void> {
    const transferList = await this.nftService.getTransferList(user, getTransferDto);

    const updatedList = transferList.list.map((item: any) => ({
      ...item,
      updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...transferList,
      list: updatedList
    });

  }

  /**
   * BURN 목록 조회
   * @param user 
   * @param getMintBurnDto 
   * @returns 
   */
  @Get('/burn')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 버닝 목록 조회', description: '에셋 버닝 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 1,
        "totalPage": 1,
        "list": [
          {
            "price": 6000,
            "purchaseNo": 2,
            "saleUserName": "엔터사 1",
            "assetName": "블링원 테스트 굿즈4",
            "assetDesc": "굿즈 26번에 대한 에셋입니다.",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-가슴",
            "stateDesc": "결재중",
            "payDttm": "2024-09-04 21:05:59",
            "fileNameFirst": "blingone_4.png",
            "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
            "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
            "fileNameSecond": "blingone_3.png",
            "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
            "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
          }
        ]
      }
    }}})
  async getBurnList(@GetUser() user: User, @Query() getMintBurnDto: GetMintBurnDto ): Promise<void> {
    const burnList = await this.nftService.getBurnList(user, getMintBurnDto);

    const updatedList = burnList.list.map((item: any) => ({
      ...item,
      updDttm: moment(item.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...burnList,
      list: updatedList
    });

  }

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

    // TypeChain을 이용하여 Contract 인스턴스 생성
    createContractInstance(wallet: Wallet): KNFTCollection {
      return KNFTCollection__factory.connect(this.contractAddress, wallet.connect(this.provider));
    }
  
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
     
      // 토큰 ID와 상태 업데이트를 위한 변수를 선언
      let tokenId: string;
    
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
    
      // 이벤트 리스너 추가 - NewMintNFT(owner, assetName, createdTime)
      contract.on('NewMintNFT', (owner: any, assetName: any, createdTime: any, event: any) => {
        this.logger.log(`NewMintNFT Event: Owner: ${owner}, AssetName: ${assetName}, CreatedTime: ${createdTime}`);
  
        tokenId = assetName.split('_').pop(); 
        this.logger.log(`processMintTransaction tokenId : `+tokenId);
      });
  
      try {
        this.logger.log(`processMintTransaction started... Before mintTx`);
        const mintTx = await contract.mintNFT(assetNo, productNo);
        // this.logger.log(`Mint transaction sent: ${mintTx.hash}`);
    
        await mintTx.wait();
    
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

        const asset = await this.assetRepository.findOne({ where:{assetNo, productNo} });
        if (asset) {
          let assetInfo = { }; // mint 상태 및 tokenId로 업데이트
          const assetNo = asset.assetNo;
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
  
        this.logger.log(`Mint transaction 완료를 client에게 전송`);
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'success',
          type: 'Mint',
          assetNo,
          productNo,
          tokenId,
        });
    
        // 메시지 처리 완료 후 ack 호출
        channel.ack(message);
  
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
        await queryRunner.manager.delete(NftMint, nftMintNo);
        await queryRunner.commitTransaction();
  
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'Mint',
          assetNo,
          productNo,
          error: errorMsg,
        });
  
        channel.ack(message);
  
      } finally {
        await queryRunner.release();
        // return result;
      }
    }
  
    @MessagePattern('transfer')
    async handleTransfer(@Payload() 
      data: { nftTransferNo: number, tokenId: number, price: number, 
      ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string,
      purchaseAssetNo: number, purchaseNo: number }
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
      const purchaseAssetNo = data.purchaseAssetNo;
      const purchaseNo = data.purchaseNo;
  
      // console.log(`nftTransferNo: ${nftTransferNo}`);
      // console.log(`tokenId: ${tokenId}`);
      // console.log(`price: ${price}`);
      // console.log(`ownerAddress: ${ownerAddress}`);
      // console.log(`ownerPKey: ${ownerPKey}`);
      // console.log(`sellerAddress: ${sellerAddress}`);
      // console.log(`sellerPKey: ${sellerPKey}`);
      // console.log(`purchaseAssetNo: ${purchaseAssetNo}`);
      // console.log(`purchaseNo: ${purchaseNo}`);
  
      let contract: any;
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
      contract.once('NewTransferEther', async(buyer: any, seller: any, price: any, event: any) => {
        this.logger.log(`NewTransferEther Event: buyer: ${buyer}, seller: ${seller}, price: ${price}`);
  
        await this.handleNFTTransfer( nftTransferNo, tokenId, price, amountInWei, ownerAddress,
          ownerPKey, sellerAddress, sellerPKey, purchaseAssetNo, purchaseNo);
      });
  
      try {
        // const amountInWei = ethers.utils.parseEther(price.toString());
        // console.log("=== 1 === Amount in Wei:", amountInWei.toString());
        const ethTransferTx = await contract.transferEther(tokenId, amountInWei, sellerAddress, {
          value: amountInWei // 여기에서 value가 보내는 이더 값
        });
        // this.logger.log(`ETH Transfer sent: ${ethTransferTx.hash}`);
  
        await ethTransferTx.wait();
  
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
        
        await queryRunner.manager.delete(PurchaseAsset, purchaseAssetNo);
        
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
      purchaseAssetNo: number, purchaseNo: number) {
  
      console.log(`handleNFTTransfer started...`);
  
      // console.log(`nftTransferNo: ${nftTransferNo}`);
      // console.log(`tokenId: ${tokenId}`);
      // console.log(`price: ${price}`);
      // console.log(`ownerAddress: ${ownerAddress}`);
      // console.log(`ownerPKey: ${ownerPKey}`);
      // console.log(`sellerAddress: ${sellerAddress}`);
      // console.log(`sellerPKey: ${sellerPKey}`);
      // console.log(`purchaseAssetNo: ${purchaseAssetNo}`);
      // console.log(`purchaseNo: ${purchaseNo}`)
  
      let contract: any;
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
    
      contract.on('NewTransferToken', async (seller: any, buyer: any, tokenId: any, event: any) => {
          this.logger.log(`NewTransferToken Event: seller: ${seller}, buyer: ${buyer}, tokenId: ${tokenId}`);
      });
  
      contract.once('NewTransferEther', async(seller: any, buyer: any, price: any, event: any) => {
        this.logger.log(`NewTransferRevEther Event: seller: ${seller}, buyer: ${buyer}, price: ${price}`);
      });
  
      try {
        const nftTransferTx = await contract.transferToken(tokenId, ownerAddress);
        // this.logger.log(`Token Transfer transaction sent: ${nftTransferTx.hash}`);
  
        await nftTransferTx.wait();
  
        const nftTransferInfo = {state: 'B12', txId: nftTransferTx.hash};
        await queryRunner.manager.update(NftTransfer, nftTransferNo, nftTransferInfo);

        let data = {state: 'P3'};
        await queryRunner.manager.update(PurchaseAsset, purchaseAssetNo, data);
        const purchaseAsset = await this.purchaseAssetRepository.findOne({ where:{purchaseAssetNo} });
        const assetNo = purchaseAsset.assetNo;
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
        
        await queryRunner.manager.delete(PurchaseAsset, purchaseAssetNo);
              
        await queryRunner.manager.delete(NftTransfer, nftTransferNo);
        
        await queryRunner.commitTransaction();

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
    
          await ethTransferTx.wait();
    
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

          // await await queryRunner.manager.delete(PurchaseAsset, purchaseAssetNo);
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
    
    @MessagePattern('transferNmint')
    async handleTransferNMint(@Payload() 
      data: { nftMintNo: number, tokenId: number, price: number, ownerAddress: string, 
        ownerPKey: string, sellerAddress: string, sellerPKey: string,
        purchaseAssetNo: number, purchaseNo: number, assetNo: number, productNo: number }
      ,
      @Ctx() context: RmqContext
    ) {
  
      console.log(`handleTransferNMint started...`);
  
      const channel: Channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      const message = originalMsg as Message; 
      
      const nftMintNo = data.nftMintNo;
      const tokenId = data.tokenId;
      const price = data.price;
      const ownerAddress = data.ownerAddress;
      const ownerPKey = data.ownerPKey;
      const sellerPKey = data.sellerPKey;
      const sellerAddress = data.sellerAddress;
      const purchaseAssetNo = data.purchaseAssetNo;
      const purchaseNo = data.purchaseNo;
      const assetNo = data.assetNo;
      const productNo = data.productNo;
  
      // console.log(`nftMintNo: ${nftMintNo}`);
      // console.log(`price: ${price}`);
      // console.log(`ownerAddress: ${ownerAddress}`);
      // console.log(`ownerPKey: ${ownerPKey}`);
      // console.log(`sellerAddress: ${sellerAddress}`);
      // console.log(`purchaseAssetNo: ${purchaseAssetNo}`);
      // console.log(`purchaseNo: ${purchaseNo}`);
      // console.log(`assetNo: ${assetNo}`);
      // console.log(`productNo: ${productNo}`);
  
      let contract: any;
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
      contract.once('NewTransferEther', async(buyer: any, seller: any, price: any, event: any) => {
        this.logger.log(`NewTransferEther Event: buyer: ${buyer}, seller: ${seller}, price: ${price}`);
  
        await this.handleNFTMint( nftMintNo, tokenId, price, ownerAddress, 
          ownerPKey, sellerAddress, sellerPKey, purchaseAssetNo, purchaseNo, assetNo, productNo  );
      });
  
      try {
        // const amountInWei = ethers.utils.parseEther(price.toString());
        // console.log("=== 1 === Amount in Wei:", amountInWei.toString());
        const ethTransferTx = await contract.transferEther(tokenId, amountInWei, sellerAddress, {
          value: amountInWei // 여기에서 value가 보내는 이더 값
        });
        // this.logger.log(`ETH Transfer sent: ${ethTransferTx.hash}`);
  
        await ethTransferTx.wait();
  
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
        
        await queryRunner.manager.delete(Purchase, purchaseNo);
                
        await queryRunner.manager.delete(NftMint, nftMintNo);

        await queryRunner.commitTransaction();
        
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'Transfer-Ether',
          assetNo,
          productNo,
          ownerAddress,
          sellerAddress,
          price,
          error: errorMsg,
        });
  
        channel.ack(message);
  
      }finally {
        await queryRunner.release();
      }
    }

    async handleNFTMint( nftMintNo: number, tokenId: number, price: number, ownerAddress: string, 
      ownerPKey: string, sellerAddress: string, sellerPKey: string,
      purchaseAssetNo: number, purchaseNo: number, assetNo: number, productNo: number ) {
  
      console.log(`handleNFTMint started...`);
      // let result = true;
  
      // console.log(`nftMintNo: ${nftMintNo}`);
      // console.log(`ownerAddress: ${ownerAddress}`);
      // console.log(`ownerPKey: ${ownerPKey}`);
      // console.log(`sellerAddress: ${sellerAddress}`);
      // console.log(`purchaseAssetNo: ${purchaseAssetNo}`);
      // console.log(`assetNo: ${assetNo}`);
      // console.log(`productNo: ${productNo}`);
      // console.log(`price: ${price}`);
  
      let contract: any;
      const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
      
      try {
        // console.log(`ownerPKey: ${ownerPKey}`);
        // NFT 계약 인스턴스 생성
        contract = this.createContractInstance(fromWallet);
        // this.knftCollection = this.createContractInstance(fromWallet);
        this.logger.log(`Contract instance created successfully: ${contract.address}`);
  
        // const balance = await this.provider.getBalance(ownerAddress);
  
        // // 잔액을 Ether 단위로 변환 (기본 단위는 Wei)
        // const balanceInEth = ethers.utils.formatEther(balance);
      
        // console.log(`지갑 ${ownerAddress}의 잔액: ${balance} Wei ${balanceInEth} ETH`);
  
      } catch (error) {
        this.logger.error(`Error creating contract instance: ${error.message}`);
      }
      
      // 토큰 ID와 상태 업데이트를 위한 변수를 선언
      let tokenId1: string;
    
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
    
      // 이벤트 리스너 추가 - NewMintNFT(owner, assetName, createdTime)
      contract.on('NewMintNFT', (owner: any, assetName: any, createdTime: any, event: any) => {
        this.logger.log(`NewMintNFT Event: Owner: ${owner}, AssetName: ${assetName}, CreatedTime: ${createdTime}`);
  
        tokenId1 = assetName.split('_').pop(); 
        this.logger.log(`processMintTransaction tokenId1 : `+tokenId1);
      });

      contract.once('NewTransferEther', async(seller: any, buyer: any, price: any, event: any) => {
        this.logger.log(`NewTransferRevEther Event: seller: ${seller}, buyer: ${buyer}, price: ${price}`); 
      }); 
  
      try {
        this.logger.log(`processTransferNMintTransaction started... Before mintTx`);
        const mintTx = await contract.mintNFT(assetNo, productNo);
        // this.logger.log(`Mint transaction sent: ${mintTx.hash}`);
    
        await mintTx.wait();
    
        // Mint 상태 업데이트를 위해 tokenId가 설정될 때까지 대기
        await new Promise((resolve) => setTimeout(resolve, parseInt(process.env.TIME_INTERVAL))); // 예시로 5초 대기 (너무 길지 않게 조절)
    
        if (!tokenId1) {
          throw new Error('Token ID not received'); // 이벤트에서 tokenId가 설정되지 않았을 경우 예외 처리
        }
  
    
        let data = {state: 'P3', tokenId: tokenId1};
        await queryRunner.manager.update(Purchase, purchaseNo, data);
   
        const nftMintInfo = { state: 'B4', tokenId: tokenId1, txId: mintTx.hash }; // mint 상태 및 tokenId로 업데이트
        await queryRunner.manager.update(NftMint, nftMintNo, nftMintInfo);
 
        let nftTransferNo = 0;
        const transfer = await this.nftTransferRepository.findOne({ where:{assetNo, productNo, tokenId: tokenId1, toAddr: ownerAddress} });
        if (!transfer) {
          const transferInfo = {productNo, assetNo, purchaseAssetNo, purchaseNo, 
            fromAddr: sellerAddress, toAddr: ownerAddress, tokenId: tokenId1, state: 'B5'};
          // console.log("===== transferInfo : "+JSON.stringify(transferInfo));
          const newTransfer = queryRunner.manager.create(NftTransfer, transferInfo);
          const result = await queryRunner.manager.save<NftTransfer>(newTransfer);
          nftTransferNo = result.nftTransferNo;
        } 

        await queryRunner.commitTransaction();
  
        this.logger.log(`TransferNmint transaction 완료를 client에게 전송`);
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'success',
          type: 'TransferNmint',
          assetNo,
          productNo,
          ownerAddress,
          sellerAddress,
          tokenId1
        });
  
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
        await queryRunner.manager.delete(NftMint, nftMintNo);
        await queryRunner.manager.delete(Purchase, purchaseNo);

        await queryRunner.commitTransaction();
  
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'Mint',
          assetNo,
          productNo,
          ownerAddress,
          sellerAddress,
          error: errorMsg,
        });

        // seller에게서 buyer로 Ether 전송
        let contract1: any;
        const fromWallet1 = new ethers.Wallet(sellerPKey).connect(this.provider);
        
        try {
          // console.log(`ownerPKey: ${ownerPKey}`);
          // NFT 계약 인스턴스 생성
          contract1 = this.createContractInstance(fromWallet1);
          // this.knftCollection = this.createContractInstance(fromWallet);
          this.logger.log(`Contract1 instance created successfully: ${contract1.address}`);
    
          // const balance = await this.provider.getBalance(sellerAddress);
    
          // 잔액을 Ether 단위로 변환 (기본 단위는 Wei)
          // const balanceInEth = ethers.utils.formatEther(balance);
        
          // console.log(`지갑 ${sellerAddress}의 잔액: ${balance} Wei ${balanceInEth} ETH`);
    
        } catch (error) {
          this.logger.error(`Error creating contract1 instance: ${error.message}`);
        }

        try {
          const amountInWei = ethers.utils.parseEther(price.toString());
          // console.log("=== 2 === Amount in Wei:", amountInWei.toString());
          const ethTransferTx = await contract1.transferEther(tokenId, amountInWei, ownerAddress, {
            value: amountInWei // 여기에서 value가 보내는 이더 값
          });
          this.logger.log(`ETH RecvTransfer sent: ${ethTransferTx.hash}`);
    
          await ethTransferTx.wait();
    
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

          // await await queryRunner.manager.delete(PurchaseAsset, purchaseAssetNo);
          // await queryRunner.manager.delete(NftTransfer, nftTransferNo);
          // await queryRunner.commitTransaction();
  
          this.nftGateway.sendTransactionResult(ownerAddress, {
            status: 'failed',
            type: 'RecvTransfer-Ether',
            assetNo,
            productNo,
            ownerAddress,
            sellerAddress,
            price,
            error: errorMsg,
          });

        }
  
      } finally {
        await queryRunner.release();
        // return result;
      }
        
    }

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
    
      let contract: any;
      try {
  
        // NFT 계약 인스턴스 생성
        contract = this.createContractInstance(fromWallet);
        // this.knftCollection = this.createContractInstance(fromWallet);
        this.logger.log(`Contract instance created successfully: ${this.knftCollection}`);
      } catch (error) {
        this.logger.error(`Error creating contract instance: ${error.message}`);
      }
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      // 이벤트 리스너 추가 
      contract.on('NewBurnNFT', (owner: any, tokenId: any, event: any) => {
        this.logger.log(`NewBurnNFT Event: Owner: ${owner}, tokenId: ${tokenId}`);
      });
  
      try {
        const burnTx = await contract.burnNFT(tokenId);
        this.logger.log(`Burn transaction sent: ${burnTx.hash}`);
  
        await burnTx.wait();
  
        const nftAssetInfo = {useYn: 'N'};
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
