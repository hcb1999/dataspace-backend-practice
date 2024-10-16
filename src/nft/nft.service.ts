import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository, UpdateResult, Like, Between, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Asset } from '../entities/asset.entity';
import { State } from '../entities/state.entity';
import { NftWallet } from '../entities/nft_wallet.entity';
import { NftMint } from '../entities/nft_mint.entity';
import { NftTransfer } from '../entities/nft_transfer.entity';
import { NftBurn } from '../entities/nft_burn.entity';
import { CreateMintDto } from '../dtos/create_mint.dto';
import { GetMintBurnDto } from '../dtos/get_mint_burn.dto';
import { CreateTransferDto } from '../dtos/create_transfer.dto';
import { GetTransferDto } from '../dtos/get_transfer.dto';
import { CreateBurnDto } from '../dtos/create_burn.dto';
import { PageResponse } from 'src/common/page.response';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
import { ClientProxy } from '@nestjs/microservices'
import { HttpService } from '@nestjs/axios'; 


@Injectable()
export class NftService {
  private logger = new Logger('NftService');

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
    // private readonly amqpConnection: AmqpConnection

    
    @Inject('ASSET_REPOSITORY')
    private assetRepository: Repository<Asset>,

    @Inject('NFT_MINT_REPOSITORY')
    private nftMintRepository: Repository<NftMint>,

    @Inject('NFT_TRANSFER_REPOSITORY')
    private nftTransferRepository: Repository<NftTransfer>,

    @Inject('NFT_BURN_REPOSITORY')
    private nftBurnRepository: Repository<NftBurn>,

    @Inject('NFT_WALLET_REPOSITORY')
    private nftWalletRepository: Repository<NftWallet>,

    @Inject('DATA_SOURCE')
    private dataSource: DataSource,

    // @InjectQueue('transaction')
    // private readonly transactionQueue: Queue,

    @Inject('RABBITMQ_SERVICE') 
    private client: ClientProxy,

  ){
    // // ClientProxy 초기화
    // this.client = ClientProxyFactory.create({
    //   transport: Transport.RMQ,
    //     options: {
    //       urls: ['amqp://avataroad:avataroad@localhost:5672'], // RabbitMQ 서버 URL 확인
    //       queue: 'transaction_test5_queue', // 큐 이름 확인
    //       noAck: true,
    //       queueOptions: {
    //         durable: true,
    //         deadLetterExchange: 'dlx_exchange',
    //         deadLetterRoutingKey: 'dlx_routing_key',
    //       },
    //     },
    // });
    
  }


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
    
        //  비즈니스 로직 처리 

        // 원래는 asset에서 처리하는 부분인데, 여기서는 NFT Controller 때문에 사용.
        const assetNo = createMintDto.assetNo;
        const productNo = createMintDto.productNo;
        const ownerAddress = user.nftWalletAddr;
        const mint = await this.nftMintRepository.findOne({ where:{assetNo, productNo} });
        let nftMintNo = 0;
        if (!mint) {
          const mintInfo = {productNo, assetNo, issuedTo: ownerAddress, tokenId: null, state: 'B1'};
          // console.log("===== mintInfo : "+JSON.stringify(mintInfo));
          const newMint = queryRunner.manager.create(NftMint, mintInfo);
          const result = await queryRunner.manager.save<NftMint>(newMint);
          nftMintNo = result.nftMintNo;
        }else{
          nftMintNo = mint.nftMintNo;
        }

        await queryRunner.commitTransaction();   
  
        // MQ로 Mint 트랜잭션 처리 요청
        const wallet = await this.nftWalletRepository.findOne({ where:{addr: ownerAddress} });
        let ownerPKey: string;
        if (wallet) {
          ownerPKey = wallet.pkey;
        } 

        const data = { nftMintNo, assetNo, productNo, ownerAddress, ownerPKey };
        console.log('Sending data:', data);
        this.client.emit('mint', data);        

    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {    
      await queryRunner.release();
    }
}

  /**
   * NFT 이전
   * @param user
   * @param createTransferDto 
   * @returns 
   */
  async createTransfer(user: User, createTransferDto: CreateTransferDto): Promise<void> {
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        // 원래는 purchase나 purchase_asset에서 처리하는 부분인데, 여기서는 NFT Controller 때문에 사용.
        const purchaseAssetNo = createTransferDto.purchaseAssetNo;        
        const purchaseNo = createTransferDto.purchaseNo;
        const fromAddr = createTransferDto.fromAddr.toLowerCase();
        const toAddr = createTransferDto.toAddr.toLowerCase();
        const assetNo = createTransferDto.assetNo;
        const productNo = createTransferDto.productNo;
        const tokenId = createTransferDto.tokenId;
        let nftTransferNo = 0;
        const transfer = await this.nftTransferRepository.findOne({ where:{assetNo, productNo, tokenId, toAddr: user.nftWalletAddr} });
        if (!transfer) {
          const transferInfo = {productNo, assetNo, purchaseAssetNo, purchaseNo, 
            fromAddr, toAddr, tokenId, state: 'B5'};
          // console.log("===== transferInfo : "+JSON.stringify(transferInfo));
          const newTransfer = queryRunner.manager.create(NftTransfer, transferInfo);
          const result = await queryRunner.manager.save<NftTransfer>(newTransfer);
          nftTransferNo = result.nftTransferNo;
        }   

        await queryRunner.commitTransaction();  

        // MQ로 Transfer 트랜잭션 처리 요청
        const ownerAddress = toAddr;     // 살 사람
        const sellerAddress = fromAddr;  // 팔 사람
        const wallet1 = await this.nftWalletRepository.findOne({ where:{addr: ownerAddress} });
        let ownerPKey: string;
        if (wallet1) {
          ownerPKey = wallet1.pkey;
        }
        const wallet2 = await this.nftWalletRepository.findOne({ where:{addr: sellerAddress} });
        let sellerPKey: string;
        if (wallet2) {
          sellerPKey = wallet2.pkey;          
        }
        const asset = await this.assetRepository.findOne({ where:{assetNo} });
        let price: number;
        if (asset) {
          price = asset.price;
        }

        // MQ로 Transfer 전송 트랜잭션 처리 요청
        // await this.queueTransferTransaction(nftTransferNo, parseInt(tokenId), price, ownerAddress, ownerPKey, sellerAddress, sellerPKey);
        const data = { nftTransferNo, tokenId: parseInt(tokenId), price, ownerAddress, ownerPKey,
           sellerAddress, sellerPKey, purchaseAssetNo, purchaseNo };
        console.log('Sending data:', data);
        this.client.emit('transfer', data);    

    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {    
      await queryRunner.release();
    }
  }  

  /**
   * NFT 소각(Nft Mint 정보 삭제 수정 및 NftBurn 저장)
   * @param user
   * @param createBurnDto 
   * @returns 
   */
  async createBurn(user: User, createBurnDto: CreateBurnDto): Promise<void> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        //  비즈니스 로직 처리 

        // 원래는 asset에서 처리하는 부분인데, 여기서는 NFT Controller 때문에 사용.
        const assetNo = createBurnDto.assetNo;
        const productNo = createBurnDto.productNo;
        const tokenId = createBurnDto.tokenId;
        const ownerAddress = user.nftWalletAddr;
        let nftBurnNo = 0;
        let nftMintNo = 0;
        const burn = await this.nftBurnRepository.findOne({ where:{assetNo, productNo} });
        if (!burn) {
          const burnInfo = {productNo, assetNo, issuedTo: user.nftWalletAddr, tokenId, state: 'B13'};
          // console.log("===== burnInfo : "+JSON.stringify(burnInfo));
          const newBurn = queryRunner.manager.create(NftBurn, burnInfo);
          const result = await queryRunner.manager.save<NftBurn>(newBurn);
          nftBurnNo = result.nftBurnNo;
        }  
        const mint = await this.nftMintRepository.findOne({ where:{assetNo, productNo} });
        if (mint) {
          nftMintNo = mint.nftMintNo;
        }   

        await queryRunner.commitTransaction();  
              
        // MQ로 Burn 트랜잭션 처리 요청
        const wallet = await this.nftWalletRepository.findOne({ where:{addr: ownerAddress} });
        let ownerPKey: string;
        if (wallet) {
          ownerPKey = wallet.pkey;
        }

        const data = { nftBurnNo, nftMintNo, assetNo, productNo, tokenId: parseInt(tokenId), ownerAddress, ownerPKey };
        console.log('Sending data:', data);
        this.client.emit('burn', data); 

    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {    
      await queryRunner.release();
    }
  } 

/*  
    // Mint 트랜잭션을 메시지 큐에 추가
    async queueMintTransaction(nftMintNo: number, assetNo: number, productNo: number, ownerAddress:string, ownerPKey:string) {
      // console.log("queueMintTransaction started...");
      await this.transactionQueue.add('processMintTransaction', {
        nftMintNo,
        assetNo,
        productNo,
        ownerAddress,
        ownerPKey
      });
      // console.log("Job added to queue!");
    }

    // Transfer 전송을 위한 메시지 큐 추가
    async queueTransferTransaction(nftTransferNo: number, tokenId: number, price: number, 
      ownerAddress: string, ownerPKey: string, sellerAddress: string, sellerPKey: string) {
      await this.transactionQueue.add('processTransferTransaction', {
        nftTransferNo,
        tokenId,
        price,
        ownerAddress,
        ownerPKey,
        sellerAddress,
        sellerPKey
      });
      // console.log("Job added to Transfer queue!");
    }

    // Burn 트랜잭션을 메시지 큐에 추가
    async queueBurnTransaction(nftBurnNo: number, nftMintNo: number, assetNo: number, productNo: number, tokenId: number, ownerAddress:string, ownerPKey:string) {
      await this.transactionQueue.add('processBurnTransaction', {
        nftBurnNo,
        nftMintNo,
        assetNo,
        productNo,
        tokenId,
        ownerAddress,
        ownerPKey
      });
    }
*/

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

     // Register 비즈니스 로직 처리
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
     // MQ 호출


    return token;
  }

  // 그 전에 사용자 지갑주소 등록시 배수에 사용자별 NFT 지갑 생성으로 Private Key를 만들어 놔야함.
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
 * NFT Mint 목록 조회
 * @param user 
 * @param getMintBurnDto 
 */
  async getMintList(user: User, getMintBurnDto: GetMintBurnDto): Promise<any> {

      // const userAddr = user.nftWalletAddr;
      const skip = getMintBurnDto.getOffset();
      const take = getMintBurnDto.getLimit();
      const assetNo = getMintBurnDto.assetNo;
      const productNo = getMintBurnDto.productNo;
      const tokenId = getMintBurnDto.tokenId;
    
      let options = `1 = 1`;
      if (assetNo) {
        options += ` and nftMint.asset_no = ${assetNo}`;
      }
      if (productNo) {
        options += ` and nftMint.product_no = ${productNo}`;
      }
      if (tokenId) {
        options += ` and nftMint.token_Id = ${tokenId}`;
      }
      // console.log("options : "+options);
  
      try {
        const sql = this.nftMintRepository.createQueryBuilder('nftMint')
                        .leftJoin(State, 'state', 'nftMint.state = state.state')
                        .select('nftMint.nft_mint_no', 'nftMintNo')
                        .addSelect('nftMint.asset_no', 'assetNo')
                        .addSelect('nftMint.product_no', 'productNo')
                        .addSelect('nftMint.issued_to', 'issuedTo')
                        .addSelect('nftMint.token_id', 'tokenId')
                        .addSelect('nftMint.state', 'state')
                        .addSelect('state.state_desc', 'stateDsec')
                        .where(options);
                        
        const list = await sql.orderBy('nftMint.nft_mint_no', getMintBurnDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                              .skip(skip)
                              .take(take)
                              .getRawMany();
  
        const totalCount = await sql.getCount(); 
  
        return new PageResponse(totalCount, getMintBurnDto.pageSize, list);
  
    } catch(e) {
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
  async gettokenMetadata(user: User, tokenId: string): Promise<any> {

    const serverDomain = this.configService.get<string>('SERVER_DOMAIN');

    try {

      // 에셋 정보 조회
      const mintInfo = await this.nftMintRepository.findOne({ where:{tokenId} });
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
  
  /**
   * NFT Transfer 목록 조회
   * @param user 
   * @param getTransferDto 
   */
  async getTransferList(user: User, getTransferDto: GetTransferDto): Promise<any> {

    // const userAddr = user.nftWalletAddr;
    const skip = getTransferDto.getOffset();
    const take = getTransferDto.getLimit();
    const purchaseAssetNo = getTransferDto.purchaseAssetNo;
    const purchaseNo = getTransferDto.purchaseNo;
    const fromAddr = getTransferDto.fromAddr;
    const toAddr = getTransferDto.toAddr;
    const assetNo = getTransferDto.assetNo;
    const productNo = getTransferDto.productNo;
    const tokenId = getTransferDto.tokenId;
  
    let options = `1 = 1`;
    if (purchaseAssetNo) {
      options += ` and nftTransfer.purchase_asset_no = ${purchaseAssetNo}`;
    }
    if (purchaseNo) {
      options += ` and nftTransfer.purchase_no = ${purchaseNo}`;
    }
    if (fromAddr) {
      options += ` and nftTransfer.from_addr = ${fromAddr}`;
    }
    if (toAddr) {
      options += ` and nftTransfer.to_addr = ${toAddr}`;
    }
    if (assetNo) {
      options += ` and nftTransfer.asset_no = ${assetNo}`;
    }
    if (productNo) {
      options += ` and nftTransfer.product_no = ${productNo}`;
    }
    if (tokenId) {
      options += ` and nftTransfer.token_Id = ${tokenId}`;
    }
    // console.log("options : "+options);

    try {
      const sql = this.nftTransferRepository.createQueryBuilder('nftTransfer')
                      .leftJoin(State, 'state', 'nftTransfer.state = state.state')
                      .select('nftTransfer.nft_transfer_no', 'nfttransfertNo')
                      .addSelect('nftTransfer.purchase_asset_no', 'purchaseAssetNo')
                      .addSelect('nftTransfer.purchase_no', 'purchaseNo')
                      .addSelect('nftTransfer.from_addr', 'fromAddr')
                      .addSelect('nftTransfer.to_addr', 'toAddr')
                      .addSelect('nftTransfer.asset_no', 'assetNo')
                      .addSelect('nftTransfer.product_no', 'productNo')
                      .addSelect('nftTransfer.token_id', 'tokenId')
                      .addSelect('nftTransfer.state', 'state')
                      .addSelect('state.state_desc', 'stateDsec')
                      .where(options);
                      
      const list = await sql.orderBy('nftTransfer.nft_transfer_no', getTransferDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .skip(skip)
                            .take(take)
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getTransferDto.pageSize, list);


    } catch(e) {
      this.logger.error(e);
      throw e;
    }
  }

   /**
 * NFT Burn 목록 조회
 * @param user 
 * @param getMintBurnDto 
 */
   async getBurnList(user: User, getMintBurnDto: GetMintBurnDto): Promise<any> {
    
    // const userAddr = user.nftWalletAddr;
    const skip = getMintBurnDto.getOffset();
    const take = getMintBurnDto.getLimit();
    const assetNo = getMintBurnDto.assetNo;
    const productNo = getMintBurnDto.productNo;
    const tokenId = getMintBurnDto.tokenId;
  
    let options = `1 = 1`;
    if (assetNo) {
      options += ` and nftBurn.asset_no = ${assetNo}`;
    }
    if (productNo) {
      options += ` and nftBurn.product_no = ${productNo}`;
    }
    if (tokenId) {
      options += ` and nftBurn.token_Id = ${tokenId}`;
    }
    // console.log("options : "+options);

    try {
      const sql = this.nftBurnRepository.createQueryBuilder('nftBurn')
                      .leftJoin(State, 'state', 'nftBurn.state = state.state')
                      .select('nftBurn.nft_burn_no', 'nftBurnNo')
                      .addSelect('nftBurn.asset_no', 'assetNo')
                      .addSelect('nftBurn.product_no', 'productNo')
                      .addSelect('nftBurn.issued_to', 'issuedTo')
                      .addSelect('nftBurn.token_id', 'tokenId')
                      .addSelect('nftBurn.state', 'state')
                      .addSelect('state.state_desc', 'stateDsec')
                      .where(options);
                      
      const list = await sql.orderBy('nftBurn.nft_burn_no', getMintBurnDto['sortOrd'] == 'asc' ? 'ASC' : 'DESC')
                            .skip(skip)
                            .take(take)
                            .getRawMany();

      const totalCount = await sql.getCount(); 

      return new PageResponse(totalCount, getMintBurnDto.pageSize, list);

  } catch(e) {
    this.logger.error(e);
    throw e;
  }
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

  // DLQ1에서 메시지를 가져옵니다 (최대 10개씩)
  async fetchDlqMessage(count: number) {
    // RabbitMQ HTTP API를 사용하여 DLQ에서 메시지를 가져옵니다.
    const url = process.env.MQ_URL+'/api/queues/%2F/dlq1/get';
    const auth = { username: process.env.MQ_USERNAME, password: process.env.MQ_PASSWORD };

    const data = {
      count: count,                // 가져올 메시지 수
      requeue: false,          // 가져온 메시지를 다시 큐에 넣지 않음
      encoding: 'auto',
      ackmode: 'ack_requeue_false',
    };

    const response = await this.httpService.post(url, data, { auth }).toPromise();
    return response.data.length ? response.data : [];
  }

  // 메시지를 다시 transaction_queue로 보냅니다
  async retryDlqMessage(message: any) {
    if (!message) {
      throw new Error('DLQ에서 가져온 메시지가 없습니다.');
    }

    // 메시지를 transaction_test_queue 다시 보냄
    const url = process.env.MQ_URL+'/api/exchanges/%2F/amq.default/publish';
    const auth = { username: process.env.MQ_USERNAME, password: process.env.MQ_PASSWORD };

    const data = {
      properties: message.properties,
      routing_key: 'transaction_queue',  // 다시 보낼 큐
      payload: message.payload,          // 가져온 메시지 payload 그대로
      payload_encoding: 'string',
    };

    await this.httpService.post(url, data, { auth }).toPromise();
    console.log('메시지를 재발송했습니다.');

    // 재발송 후 ACK 전송
    // await this.ackDlqMessage(message);
  }

  // 메시지를 다시 transaction_queue로 보냅니다
  async ackDlqMessage(message: any) {
    const url = process.env.MQ_URL+'/api/queues/%2F/dlq1/ack';
    const auth = { username: process.env.MQ_USERNAME, password: process.env.MQ_PASSWORD };

    const data = {
      delivery_tag: message.delivery_tag,  // 가져온 메시지의 delivery tag
      multiple: false,
    };

    await this.httpService.post(url, data, { auth }).toPromise();
    console.log('메시지에 대해 ACK를 보냈습니다.');
  }

}
