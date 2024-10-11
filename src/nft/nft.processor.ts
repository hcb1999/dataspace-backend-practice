import { Inject, Logger, Injectable, Controller} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
// import { Process, Processor } from '@nestjs/bull';
// import { Job } from 'bull';
import { MessagePattern, Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import { Contract , Wallet, ethers, providers } from "ethers";
import { NftGateway } from './nft.gateway'; // WebSocket Gateway
import { NftMint } from '../entities/nft_mint.entity';
import { NftTransfer } from '../entities/nft_transfer.entity';
import { NftBurn } from '../entities/nft_burn.entity';
import { Asset } from '../entities/asset.entity';
import { KNFTCollection, KNFTCollection__factory } from './typechain-types';

@Injectable()
@Controller()
export class NftProcessor {
  private logger = new Logger('NftProcessor');
  // private provider: ethers.providers.JsonRpcProvider;
  private provider: providers.JsonRpcProvider;
  private contractAddress: string;
  // private contractAbi: any;
  private knftCollection: Contract;

  constructor(
    // private readonly productService: ProductService,
    // private readonly assetService: AssetService,
    private readonly nftGateway: NftGateway,
    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

    @Inject('NFT_TRANSFER_REPOSITORY')
    private nftTransferRepository: Repository<NftTransfer>,

    @Inject('NFT_BURN_REPOSITORY')
    private nftBurnRepository: Repository<NftBurn>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,

    @Inject('RABBITMQ_SERVICE') 
    private client: ClientProxy

  ) {
    // 이더리움 네트워크에 연결
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    // this.contractAbi = process.env.CONTRACT_ABI;
  }

  // 블록체인과 계약 인스턴스를 생성하는 메서드
  // createContractInstance(wallet: Wallet): Contract {
  //   // return new ethers.Contract(this.contractAddress, this.contractAbi, wallet);
  // }

  // TypeChain을 이용하여 Contract 인스턴스 생성
  createContractInstance(wallet: Wallet): KNFTCollection {
    return KNFTCollection__factory.connect(this.contractAddress, wallet.connect(this.provider));
  }

  @MessagePattern({ cmd: 'mint' })
  async handleMint(
    data: { nftMintNo: number, assetNo: number, productNo: number, ownerAddress: string, ownerPKey: string }
  ) {

    console.log(`handleMint started...`);

    // const channel = context.getChannelRef();
    // const originalMsg = context.getMessage();

    // const maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    // const retryCount = originalMsg.properties.headers['x-retry'] || 0;

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
      this.logger.log(`Contract instance created successfully: ${this.knftCollection}`);
    } catch (error) {
      // this.logger.error(`Error creating contract instance: ${error.message}`);
    }
   
    // 토큰 ID와 상태 업데이트를 위한 변수를 선언
    let tokenId: string;
    // let mintStatus: string;
  
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
      this.logger.log(`Mint transaction sent: ${mintTx.hash}`);
  
      await mintTx.wait();
  
      // Mint 상태 업데이트를 위해 tokenId가 설정될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, parseInt(process.env.TIME_INTERVAL))); // 예시로 5초 대기 (너무 길지 않게 조절)
  
      if (!tokenId) {
        throw new Error('Token ID not received'); // 이벤트에서 tokenId가 설정되지 않았을 경우 예외 처리
      }

      const asset = await this.assetRepository.findOne({ where:{assetNo, productNo} });
      if (asset) {
        const assetNo = asset.assetNo;
        const assetInfo = { tokenId }; // mint 상태 및 tokenId로 업데이트
        await queryRunner.manager.update(Asset, assetNo, assetInfo);
      }   
  
      const nftMintInfo = { state: 'B4', tokenId }; // mint 상태 및 tokenId로 업데이트
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
  
      // 성공적으로 처리되면 메시지를 확인
      // channel.ack(originalMsg);

    } catch (error) {
      // this.logger.error(`Error in handleMintTransaction: ${error.message}`);
      this.logger.error(`Error in handleMintTransaction`);
      let nftMintInfo = {};
      let errorMsg = 'Unexpected error occurred';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        this.logger.error(`Blockchain network error: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';        
        nftMintInfo = { state: 'B99' };
      } else if (error.code === 'TRANSACTION_ERROR') {
        // 트랜잭션 관련 오류
        this.logger.error(`Transaction error: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input';        
        nftMintInfo = { state: 'B3' };
      } else {
        // 다른 일반적인 오류 처리
        this.logger.error(`Unexpected error in handleMintTransaction: ${error.message}`);
        nftMintInfo = { state: 'B3' };
      }
      await queryRunner.manager.update(NftMint, nftMintNo, nftMintInfo);
      await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Mint',
        assetNo,
        productNo,
        error: errorMsg,
      });

      // if (retryCount >= maxRetries) {
      //   // 최대 재시도 횟수를 넘겼다면 DLQ로 전송
      //   channel.nack(originalMsg, false, false); // 메시지를 재처리하지 않고 DLQ로 보냄
      //   this.client.send({ cmd: 'dlq' }, data).toPromise();
      // } else {
      //   // 재시도 횟수를 늘려 다시 전송
      //   originalMsg.properties.headers['x-retry'] = retryCount + 1;
      //   channel.nack(originalMsg, false, true); // 메시지를 다시 큐에 넣어 재시도
      // }

    } finally {
      await queryRunner.release();
    }
  }

  @MessagePattern({ cmd: 'transfer' })
  async handleTransfer(data: { nftTransferNo: number, tokenId: number, price: number, 
    ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string },
    @Ctx() context: RmqContext
  ) {

    console.log(`handleTransfer started...`);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    const retryCount = originalMsg.properties.headers['x-retry'] || 0;

    const nftTransferNo = data.nftTransferNo;
    const tokenId = data.tokenId;
    const price = data.price;
    const ownerAddress = data.ownerAddress;
    const ownerPKey = data.ownerPKey;
    const sellerAddress = data.sellerAddress;
    const sellerPKey = data.sellerPKey;

    // console.log(`nftTransferNo: ${nftTransferNo}`);
    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`sellerAddress: ${sellerAddress}`);
    // console.log(`sellerPKey: ${sellerPKey}`);

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
        ownerPKey, sellerAddress, sellerPKey);
    });

    try {
      // const amountInWei = ethers.utils.parseEther(price.toString());
      // console.log("=== 1 === Amount in Wei:", amountInWei.toString());
      const ethTransferTx = await contract.transferEther(tokenId, amountInWei, sellerAddress, {
        value: amountInWei // 여기에서 value가 보내는 이더 값
      });
      this.logger.log(`ETH Transfer sent: ${ethTransferTx.hash}`);

      await ethTransferTx.wait();

      channel.ack(originalMsg); // 성공적으로 처리되면 메시지를 확인

    } catch (error) {
      // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
      this.logger.error(`Error in handleEtherTransfer`);
      let nftTransferInfo = {};
      let errorMsg = 'Unexpected error occurred';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        this.logger.error(`Blockchain network error: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';
        nftTransferInfo = { state: 'B99' };
      } else if (error.code === 'TRANSACTION_ERROR') {
        // 트랜잭션 관련 오류
        this.logger.error(`Transaction error: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input';
        nftTransferInfo = { state: 'B8' };
      } else {
        // 다른 일반적인 오류 처리
        this.logger.error(`Unexpected error in handleMintTransaction: ${error.message}`);
        nftTransferInfo = { state: 'B8' };
      }
      await queryRunner.manager.update(NftTransfer, nftTransferNo, nftTransferInfo);
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

      if (retryCount >= maxRetries) {
        // 최대 재시도 횟수를 넘겼다면 DLQ로 전송
        channel.nack(originalMsg, false, false); // 메시지를 재처리하지 않고 DLQ로 보냄
        this.client.send({ cmd: 'dlq' }, data).toPromise();
      } else {
        // 재시도 횟수를 늘려 다시 전송
        originalMsg.properties.headers['x-retry'] = retryCount + 1;
        channel.nack(originalMsg, false, true); // 메시지를 다시 큐에 넣어 재시도
      }

    }finally {
      await queryRunner.release();
    }
  }

  async handleNFTTransfer(nftTransferNo: number, tokenId: number, price: number, amountInWei: ethers.BigNumber, 
    ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string) {

    console.log(`handleNFTTransfer started...`);

    // console.log(`nftTransferNo: ${nftTransferNo}`);
    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    console.log(`sellerAddress: ${sellerAddress}`);
    console.log(`sellerPKey: ${sellerPKey}`);

    let contract: any;
    const fromWallet = new ethers.Wallet(sellerPKey).connect(this.provider);
    
    try {
      console.log(`sellerPKey: ${sellerPKey}`);
      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully: ${contract.address}`);

      const balance = await this.provider.getBalance(sellerAddress);

      // 잔액을 Ether 단위로 변환 (기본 단위는 Wei)
      const balanceInEth = ethers.utils.formatEther(balance);
    
      console.log(`지갑 ${sellerAddress}의 잔액: ${balance} Wei ${balanceInEth} ETH`);

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
      this.logger.log(`Token Transfer transaction sent: ${nftTransferTx.hash}`);

      await nftTransferTx.wait();

      const nftTransferInfo = {state: 'B12'};
      await queryRunner.manager.update(NftTransfer, nftTransferNo, nftTransferInfo);
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
      let nftTransferInfo = {};
      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        this.logger.error(`Blockchain network error: ${error.message}`);
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'Transfer-Token',
          tokenId,
          price,
          ownerAddress,
          sellerAddress,
          error: 'Blockchain is unreachable',
        });
        nftTransferInfo = { state: 'B99' };
      } else if (error.code === 'TRANSACTION_ERROR') {
        // 트랜잭션 관련 오류
        this.logger.error(`Transaction error: ${error.message}`);
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'Transfer-Token',
          tokenId,
          price,
          ownerAddress,
          sellerAddress,
          error: 'Transaction failed due to invalid input',
        });
        nftTransferInfo = { state: 'B9' };
      } else {
        // 다른 일반적인 오류 처리
        this.logger.error(`Unexpected error in handleMintTransaction: ${error.message}`);
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'Transfer-Token',
          tokenId,
          price,
          ownerAddress,
          sellerAddress,
          error: 'Unexpected error occurred',
        });
        nftTransferInfo = { state: 'B9' };
      }
      await queryRunner.manager.update(NftTransfer, nftTransferNo, nftTransferInfo);
      await queryRunner.commitTransaction();

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
        if (error.code === 'NETWORK_ERROR') {
          // 블록체인에 문제가 발생한 경우
          this.logger.error(`Blockchain network error: ${error.message}`);
          this.nftGateway.sendTransactionResult(ownerAddress, {
            status: 'failed',
            type: 'RecvTransfer-Ether',
            tokenId,
            price,
            ownerAddress,
            sellerAddress,
            error: 'Blockchain is unreachable',
          });
        } else if (error.code === 'TRANSACTION_ERROR') {
          // 트랜잭션 관련 오류
          this.logger.error(`Transaction error: ${error.message}`);
          this.nftGateway.sendTransactionResult(ownerAddress, {
            status: 'failed',
            type: 'RecvTransfer-Ether',
            tokenId,
            price,
            ownerAddress,
            sellerAddress,
            error: 'Transaction failed due to invalid input',
          });
        } else {
          // 다른 일반적인 오류 처리
          this.logger.error(`Unexpected error in handleMintTransaction: ${error.message}`);
          this.nftGateway.sendTransactionResult(ownerAddress, {
            status: 'failed',
            type: 'RecvTransfer-Ether',
            tokenId,
            price,
            ownerAddress,
            sellerAddress,
            error: 'Unexpected error occurred',
          });
        }
        // const nftTransferInfo = {state: 'B8'};
        // await this.nftTransferRepository.update(nftTransferNo, nftTransferInfo);

        // throw error;
        return;
      }
    }finally {
      await queryRunner.release();
    }
  }

  @MessagePattern({ cmd: 'burn' })
  async handleBurn(data: { nftBurnNo: number, nftMintNo: number, assetNo: number, productNo: number, tokenId: number, ownerAddress: string, ownerPKey: string },
    @Ctx() context: RmqContext
  ) {

    console.log(`handleBurn started...`);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    const retryCount = originalMsg.properties.headers['x-retry'] || 0;

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

      const nftBurnInfo = {state: 'B16'};
      await queryRunner.manager.update(NftBurn, nftBurnNo, nftBurnInfo);

      const nftMintInfo = {state: 'B16'};
      await queryRunner.manager.update(NftMint, nftMintNo, nftMintInfo);
      await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'success',
        type: 'Burn',
        assetNo,
        productNo,
        tokenId,
      });

      // 성공적으로 처리되면 메시지를 확인
      channel.ack(originalMsg); 

    } catch (error) {
      // this.logger.error(`Error in handleBurnTransaction: ${error.message}`);
      this.logger.error(`Error in handleBurnTransaction`);
      let nftBurnInfo = {};
      let errorMsg = 'Unexpected error occurred';

      if (error.code === 'NETWORK_ERROR') {
        // 블록체인에 문제가 발생한 경우
        this.logger.error(`Blockchain network error: ${error.message}`);
        errorMsg = 'Blockchain is unreachable';
        nftBurnInfo = { state: 'B99' };
      } else if (error.code === 'TRANSACTION_ERROR') {
        // 트랜잭션 관련 오류
        this.logger.error(`Transaction error: ${error.message}`);
        errorMsg = 'Transaction failed due to invalid input';
        nftBurnInfo = { state: 'B15' };
      } else {
        // 다른 일반적인 오류 처리
        this.logger.error(`Unexpected error in handleMintTransaction: ${error.message}`);
        nftBurnInfo = { state: 'B15' };
      }
      await queryRunner.manager.update(NftBurn, nftBurnNo, nftBurnInfo);
      await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Burn',
        assetNo,
        productNo,
        tokenId,
        error: errorMsg,
      });     
      
      if (retryCount >= maxRetries) {
        // 최대 재시도 횟수를 넘겼다면 DLQ로 전송
        channel.nack(originalMsg, false, false); // 메시지를 재처리하지 않고 DLQ로 보냄
        this.client.send({ cmd: 'dlq' }, data).toPromise();
      } else {
        // 재시도 횟수를 늘려 다시 전송
        originalMsg.properties.headers['x-retry'] = retryCount + 1;
        channel.nack(originalMsg, false, true); // 메시지를 다시 큐에 넣어 재시도
      }
   
    }finally {
      await queryRunner.release();
    }
  }

  /*
  @Process('processMintTransaction')
  async handleMintTransaction(job: Job<{ nftMintNo: number, assetNo: number, productNo: number, ownerAddress: string, ownerPKey: string }>) {
    const { nftMintNo, assetNo, productNo, ownerAddress, ownerPKey } = job.data;

    console.log(`nftMintNo: ${nftMintNo}`);
    console.log(`assetNo: ${assetNo}`);
    console.log(`productNo: ${productNo}`);
    console.log(`ownerAddress: ${ownerAddress}`);
    console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`provider: ${JSON.stringify(this.provider, null, 2)}`);

    console.log(`processMintTransaction started...`);
      // const wallet = new ethers.Wallet(walletPrivateKey).connect(this.provider);
    const fromWallet = new ethers.Wallet(ownerPKey).connect(this.provider);
    // console.log(`processMintTransaction started... fromWallet : ${JSON.stringify(fromWallet, null, 2)}`);
    
    let contract: any;
    try {

      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully: ${this.knftCollection}`);
    } catch (error) {
      // this.logger.error(`Error creating contract instance: ${error.message}`);
    }
   
    // 토큰 ID와 상태 업데이트를 위한 변수를 선언
    let tokenId: string;
    // let mintStatus: string;
  
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    // 이벤트 리스너 추가
    // this.knftCollection.on('NewMintNFT', async (owner, assetName, createdTime) => {
    //   console.log(`New Mint NFT event received: Owner: ${owner}, Asset Name: ${assetName}, Created Time: ${createdTime}`);
  
    //   tokenId = assetName.split('_').pop(); 
    //   console.log(`processMintTransaction tokenId : `+tokenId);
    //   // mintStatus = 'success'; 
  
    //   // 클라이언트에 알리기
    //   // this.nftGateway.sendTransactionResult(ownerAddress, {
    //   //   status: mintStatus,
    //   //   type: 'Mint',
    //   //   assetNo,
    //   //   productNo,
    //   //   event: {
    //   //     owner,
    //   //     assetName, // 전체 assetName을 전달
    //   //     tokenId, // 추가된 토큰 ID
    //   //     createdTime: createdTime.toNumber(), // uint32에서 숫자로 변환
    //   //   },
    //   // });
  
    //   // DB 업데이트
    //   // try {
    //   //   const nftMintInfo = { state: 'Minted', tokenId }; // 상태 및 토큰 ID 업데이트
    //   //   await this.nftMintRepository.update(nftMintNo, nftMintInfo); // 데이터베이스 업데이트
    //   // } catch (error) {
    //   //   console.error('Error updating NFT mint information:', error);
    //   // }
    // });
  
    // 이벤트 리스너 추가 - NewMintNFT(owner, assetName, createdTime)
    contract.on('NewMintNFT', (owner: any, assetName: any, createdTime: any, event: any) => {
      this.logger.log(`NewMintNFT Event: Owner: ${owner}, AssetName: ${assetName}, CreatedTime: ${createdTime}`);

      tokenId = assetName.split('_').pop(); 
      this.logger.log(`processMintTransaction tokenId : `+tokenId);
    });

    try {
      this.logger.log(`processMintTransaction started... Before mintTx`);
      const mintTx = await contract.mintNFT(assetNo, productNo);
      this.logger.log(`Mint transaction sent: ${mintTx.hash}`);
  
      await mintTx.wait();
  
      // Mint 상태 업데이트를 위해 tokenId가 설정될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, parseInt(process.env.TIME_INTERVAL))); // 예시로 5초 대기 (너무 길지 않게 조절)
  
      if (!tokenId) {
        throw new Error('Token ID not received'); // 이벤트에서 tokenId가 설정되지 않았을 경우 예외 처리
      }

      const asset = await this.assetRepository.findOne({ where:{assetNo, productNo} });
      if (asset) {
        const assetNo = asset.assetNo;
        const assetInfo = { tokenId }; // mint 상태 및 tokenId로 업데이트
        await queryRunner.manager.update(Asset, assetNo, assetInfo);
      }   
  
      const nftMintInfo = { state: 'B4', tokenId }; // mint 상태 및 tokenId로 업데이트
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
      // this.nftGateway.sendEventNotification("Mint",{
      //   status: 'success',
      //   type: 'Mint',
      //   assetNo,
      //   productNo,
      //   tokenId,
      // });
  
    } catch (error) {
      // this.logger.error(`Error in handleMintTransaction: ${error.message}`);
      this.logger.error(`Error in handleMintTransaction`);
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Mint',
        assetNo,
        productNo,
      });
      const nftMintInfo = { state: 'B3' };
      await queryRunner.manager.update(NftMint, nftMintNo, nftMintInfo);
      await queryRunner.commitTransaction();
      // throw error;
      return;
    } finally {
      await queryRunner.release();
    }
  }

  @Process('processTransferTransaction')
  async handleTransferTransaction(job: Job<{ nftTransferNo: number, tokenId: number, price: number, 
    ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string }>) {
    const { nftTransferNo, tokenId, price, ownerAddress, ownerPKey, sellerAddress, sellerPKey } = job.data;

    // console.log(`nftTransferNo: ${nftTransferNo}`);
    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    // console.log(`sellerAddress: ${sellerAddress}`);
    // console.log(`sellerPKey: ${sellerPKey}`);

    console.log(`processTransferTransaction started...`);
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
        ownerPKey, sellerAddress, sellerPKey);
    });

    try {
      // const amountInWei = ethers.utils.parseEther(price.toString());
      // console.log("=== 1 === Amount in Wei:", amountInWei.toString());
      const ethTransferTx = await contract.transferEther(tokenId, amountInWei, sellerAddress, {
        value: amountInWei // 여기에서 value가 보내는 이더 값
      });
      this.logger.log(`ETH Transfer sent: ${ethTransferTx.hash}`);

      await ethTransferTx.wait();

    } catch (error) {
      // this.logger.error(`Error in handleEtherTransfer: ${error.message}`);
      this.logger.error(`Error in handleEtherTransfer`);
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Transfer-Ether',
        tokenId,
        price,
        ownerAddress,
        sellerAddress,
      });
      const nftTransferInfo = {state: 'B8'};
      await queryRunner.manager.update(NftTransfer, nftTransferNo, nftTransferInfo);
      await queryRunner.commitTransaction();
      // throw error;
      return;
    }finally {
      await queryRunner.release();
    }
  }

  async handleNFTTransfer(nftTransferNo: number, tokenId: number, price: number, amountInWei: ethers.BigNumber, 
    ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string) {

    // console.log(`nftTransferNo: ${nftTransferNo}`);
    // console.log(`tokenId: ${tokenId}`);
    // console.log(`price: ${price}`);
    // console.log(`ownerAddress: ${ownerAddress}`);
    // console.log(`ownerPKey: ${ownerPKey}`);
    console.log(`sellerAddress: ${sellerAddress}`);
    console.log(`sellerPKey: ${sellerPKey}`);

    console.log(`handleNFTTransfer started...`);
    let contract: any;
    const fromWallet = new ethers.Wallet(sellerPKey).connect(this.provider);
    
    try {
      console.log(`sellerPKey: ${sellerPKey}`);
      // NFT 계약 인스턴스 생성
      contract = this.createContractInstance(fromWallet);
      // this.knftCollection = this.createContractInstance(fromWallet);
      this.logger.log(`Contract instance created successfully: ${contract.address}`);

      const balance = await this.provider.getBalance(sellerAddress);

      // 잔액을 Ether 단위로 변환 (기본 단위는 Wei)
      const balanceInEth = ethers.utils.formatEther(balance);
    
      console.log(`지갑 ${sellerAddress}의 잔액: ${balance} Wei ${balanceInEth} ETH`);

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
      this.logger.log(`Token Transfer transaction sent: ${nftTransferTx.hash}`);

      await nftTransferTx.wait();

      const nftTransferInfo = {state: 'B12'};
      await queryRunner.manager.update(NftTransfer, nftTransferNo, nftTransferInfo);
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
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Transfer-Token',
        tokenId,
        price,
        ownerAddress,
        sellerAddress,
      });
      const nftTransferInfo = {state: 'B9'};
      await queryRunner.manager.update(NftTransfer, nftTransferNo, nftTransferInfo);
      await queryRunner.commitTransaction();

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
        this.nftGateway.sendTransactionResult(ownerAddress, {
          status: 'failed',
          type: 'RecvTransfer-Ether',
          tokenId,
          price,
          ownerAddress,
          sellerAddress,
        });
        // const nftTransferInfo = {state: 'B8'};
        // await this.nftTransferRepository.update(nftTransferNo, nftTransferInfo);

        // throw error;
        return;
      }
    }finally {
      await queryRunner.release();
    }
  }

  @Process('processBurnTransaction')
  async handleBurnTransaction(job: Job<{ nftBurnNo: number, nftMintNo: number, assetNo: number, productNo: number, tokenId: number, ownerAddress: string, ownerPKey: string }>) {
    const { nftBurnNo, nftMintNo, assetNo, productNo, tokenId, ownerAddress, ownerPKey } = job.data;

    console.log(`processBurnTransaction started...`);
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

      const nftBurnInfo = {state: 'B16'};
      await queryRunner.manager.update(NftBurn, nftBurnNo, nftBurnInfo);

      const nftMintInfo = {state: 'B16'};
      await queryRunner.manager.update(NftMint, nftMintNo, nftMintInfo);
      await queryRunner.commitTransaction();

      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'success',
        type: 'Burn',
        assetNo,
        productNo,
        tokenId,
      });

    } catch (error) {
      // this.logger.error(`Error in handleBurnTransaction: ${error.message}`);
      this.logger.error(`Error in handleBurnTransaction`);
      this.nftGateway.sendTransactionResult(ownerAddress, {
        status: 'failed',
        type: 'Burn',
        assetNo,
        productNo,
        tokenId,
      });
      const nftBurnInfo = {state: 'B15'};
      await queryRunner.manager.update(NftBurn, nftBurnNo, nftBurnInfo);
      await queryRunner.commitTransaction();
      // throw error;
      return;
    }finally {
      await queryRunner.release();
    }
  }
*/

}
