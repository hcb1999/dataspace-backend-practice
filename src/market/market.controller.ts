import { Controller, Get, Post, Body, Put, Patch, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFiles, HttpStatus, Delete, ValidationPipe } from '@nestjs/common';
import { MarketService } from './market.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiParam, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/multer.options';
import { SharpPipe } from '../common/sharp.pipe';
import { ResponseMessage } from '../common/response';
import { CreateMarketDto} from '../dtos/create_market.dto';
import { ModifyMarketDto } from '../dtos/modify_market.dto';
import { GetMarketDto } from '../dtos/get_market.dto';
import { CreateMarketSaleDto} from '../dtos/create_market_sale.dto';
import { DeleteMarketSaleJwtDto} from '../dtos/delete_market_sale_jwt.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('market')
@ApiTags('마켓 판매 API')
export class MarketController {
  private logger = new Logger('MarketController');

  constructor(
    private responseMessage: ResponseMessage,
    private marketService: MarketService
  ) {}


  /**
   * 엔터사 에셋 판매 등록
   * 
   * @param user 
   * @param createSaleDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '엔터사 에셋 판매 등록', description: '엔터사 에셋 판매 정보를 등록한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'입력값 오류'})
  @ApiResponse({status:HttpStatus.NOT_FOUND, description:'등록된 엔터사 에셋 미존재'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: HttpStatus.CREATED,resultMessage: 'SUCCESS'}}})
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCCESS",
        "data": {
          "marketNo": 28
        }
      }
    }
  })
  async create(@GetUser() user: User, @Body(ValidationPipe) createMarketDto: CreateMarketDto): Promise<any> {
    fileLogger.info('market-create');
    fileLogger.info(user);
    fileLogger.info(createMarketDto);
    const market: any = await this.marketService.create(user, createMarketDto);
    return this.responseMessage.response(market);
  }

  /**
   * 엔터사 에셋 판매 정보 수정
   * 
   * @param user 
   * @param marketNo 
   * @param modifyMarketDto 
   * @returns 
   */
  @Put('/:marketNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '엔터사 에셋 판매 정보 수정', description: '엔터사 에셋 판매 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 광고제품 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modify(@GetUser() user: User, @Param('marketNo') marketNo: number, 
    @Body(ValidationPipe) modifyMarketDto: ModifyMarketDto): Promise<void> {
    fileLogger.info('market-update');
    fileLogger.info(user);
    fileLogger.info(`marketNo: ${marketNo}`);
    fileLogger.info(modifyMarketDto);
    await this.marketService.update(user, marketNo, modifyMarketDto);
    return this.responseMessage.response(null);
  }

  /**
   * 엔터사 에셋 판매 정보 삭제
   * 
   * @param user 
   * @param marketNo 
   * @returns 
   */
  @Delete('/:marketNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '엔터사 에셋 판매 정보 삭제', description: '엔터사 에셋 판매 정보를 삭제한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async remove(@GetUser() user: User, @Param('marketNo') marketNo: number): Promise<void> {
    fileLogger.info('market-delete');
    fileLogger.info(user);
    fileLogger.info(`marketNo: ${marketNo}`);
    await this.marketService.delete(user, marketNo);
    return this.responseMessage.response(null);
  }

  /**
   * 사용자 에셋 재판매 등록
   * 
   * @param user 
   * @param createMarketDto 
   * @returns 
   */
  @Post("/resale")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용자 에셋 재판매 등록', description: '사용자 에셋 재판매 정보를 등록한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'입력값 오류'})
  @ApiResponse({status:HttpStatus.NOT_FOUND, description:'등록된 사용자 에셋 미존재'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: HttpStatus.CREATED,resultMessage: 'SUCCESS'}}})
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCCESS",
        "data": {
          "marketNo": 28
        }
      }
    }
  })
  async recreate(@GetUser() user: User, @Body(ValidationPipe) createMarketDto: CreateMarketDto): Promise<any> {
    fileLogger.info('market-resale-create');
    fileLogger.info(user);
    fileLogger.info(createMarketDto);
    const market: any = await this.marketService.recreate(user, createMarketDto);
    return this.responseMessage.response(market);
  }

  /**
   * 마켓 판매 목록 조회
   * @param user 
   * @param getMarketDto 
   * @returns 
   */
  @Get('/')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '마켓 판매 목록 조회', description: '마켓 판매 목록을 조회한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  @ApiOkResponse({ description: '성공',
    schema: {example: { 
      "resultCode": 200,
      "resultMessage": "SUCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 2,
        "totalPage": 1,
        "list": [
          {
            "price": 0.3,
            "marketNo": 23,
            "contractNo": 132,
            "saleAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleUserName": "엔터사 2",
            "marketAsetName": "테스트 굿즈1용 에셋2",
            "assetName": "테스트 굿즈1용 에셋2",
            "assetDesc": "테스트 굿즈1용 에셋2",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-셔츠",
            "startDttm": "2024-10-29 09:00:00",
            "endDttm": "2024-12-31 09:00:00",
            "fileNameFirst": "test1.glb",
            "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
            "thumbnailFirst": "https://kapi-dev.avataroad.com/",
            "fileNameSecond": "test1.png",
            "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
            "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
            "fileNameThird": "test1.png",
            "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
            "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
            "assetVcId": "asset_vc_id-1"
          },
          {
            "price": 0.3,
            "marketNo": 22,
            "contractNo": 132,
            "saleAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleUserName": "엔터사 1",
            "marketAsetName": "테스트 굿즈1용 에셋1",
            "assetName": "테스트 굿즈1용 에셋1",
            "assetDesc": "테스트 굿즈1용 에셋1",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-셔츠",
            "startDttm": "2024-10-29 09:00:00",
            "endDttm": "2024-12-31 09:00:00",
            "fileNameFirst": "test1.glb",
            "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
            "thumbnailFirst": "https://kapi-dev.avataroad.com/",
            "fileNameSecond": "test1.png",
            "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
            "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
            "fileNameThird": "test1.png",
            "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
            "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
            "assetVcId": "asset_vc_id-2"
          }
        ]
      }
    }}})
    
  async getSaleList(@Query() getMarketDto: GetMarketDto ): Promise<void> {
    const marketList = await this.marketService.getSaleList(getMarketDto);

    const updatedList = marketList.list.map((item: any) => ({
      ...item,
      startDttm: moment(item.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      endDttm: moment(item.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...marketList,
      list: updatedList
    });

  }

    /**
   * 마켓 판매 목록 조회 (마이페이지)
   * @param user 
   * @param getMarketDto 
   * @returns 
   */
    @Get('/mypage')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '마켓 판매 목록 조회', description: '마켓 판매 목록을 조회한다.' })
    @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
    @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
    @ApiOkResponse({ description: '성공',
      schema: {example: { 
        "resultCode": 200,
        "resultMessage": "SUCESS",
        "data": {
          "pageSize": 10,
          "totalCount": 2,
          "totalPage": 1,
          "list": [
            {
              "state": "S5",
              "price": 0.3,
              "marketNo": 23,
              "contractNo": 132,
              "saleAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleUserName": "엔터사 1",
              "marketAssetName": "테스트 굿즈1용 에셋2",
              "assetName": "테스트 굿즈1용 에셋2",
              "assetDesc": "테스트 굿즈1용 에셋2",
              "metaverseName": "K-POP 월드",
              "typeDef": "K-셔츠",
              "startDttm": "2024-10-29 09:00:00",
              "endDttm": "2024-12-31 09:00:00",
              "stateDesc": "판매완료",
              "fileNameFirst": "test1.glb",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/",
              "fileNameSecond": "test1.png",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
              "fileNameThird": "test1.png",
              "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
              "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
              "assetVcId": "asset_vc_id-1",
              "regDttm": "2024-10-29 17:17:38"            
            },
            {
              "state": "S5",
              "price": 0.2,
              "marketNo": 22,
              "contractNo": 132,
              "saleAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleUserName": "엔터사 1",
              "marketAssetName": "테스트 굿즈1용 에셋1",
              "assetName": "테스트 굿즈1용 에셋1",
              "assetDesc": "테스트 굿즈1용 에셋1",
              "metaverseName": "K-POP 월드",
              "typeDef": "K-셔츠",
              "startDttm": "2024-10-29 09:00:00",
              "endDttm": "2024-12-31 09:00:00",
              "stateDesc": "판매완료",
              "fileNameFirst": "test1.glb",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/",
              "fileNameSecond": "test1.png",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
              "fileNameThird": "test1.png",
              "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
              "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
              "assetVcId": "asset_vc_id-2",
              "regDttm": "2024-10-29 17:17:38"            }
          ]
        }
      }}})
      
    async getSaleMyList(@GetUser() user: User, @Query() getMarketDto: GetMarketDto ): Promise<void> {
      const marketList = await this.marketService.getSaleMyList(user, getMarketDto);
  
      const updatedList = marketList.list.map((item: any) => ({
        ...item,
        startDttm: moment(item.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(item.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        regDttm: moment(item.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      }));
    
      return this.responseMessage.response({
        ...marketList,
        list: updatedList
      });
  
    }

    /**
   * 마켓 판매 상세 정보 조회
   * 
   * @param user 
   * @param marketNo 
   * @returns 
   */
    @Get('/:marketNo')
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '마켓 판매 정보 조회', description: '마켓 판매 정보를 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiOkResponse({
      description: '성공',
      schema: {
        example: {
          resultCode: 200,
          resultMessage: 'SUCCESS',
          data: {
            "resultCode": 200,
            "resultMessage": "SUCESS",
            "data": {
              "price": 0.3,
              "marketNo": 23,
              "contractNo": 132,
              "productNo": 56,
              "assetNo": 80,
              "saleAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleUserName": "엔터사 1",
              "marketAssetName": "테스트 굿즈1용 에셋1",
              "assetName": "테스트 굿즈1용 에셋1",
              "assetDesc": "테스트 굿즈1용 에셋1",
              "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
              "metaverseName": "K-POP 월드",
              "typeDef": "K-셔츠",
              "startDttm": "2024-10-29 09:00:00",
              "endDttm": "2024-12-31 09:00:00",
              "fromTokenId": "2",
              "toTokenId": "11",
              "fileNameFirst": "test1.glb",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/",
              "fileNameSecond": "test1.png",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
              "fileNameThird": "test1.png",
              "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
              "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
              "assetVcId": "asset_vc_id-1",
              "nftContractAddress": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
              "nftContractAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/contracts/0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
              "nftTxId": "0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
              "nftTxIdUrl": "http://besu-dev-explorer.avataroad.com:8081/transactions/0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
              "tokenInfo": [
                {
                  "tokenId": "2",
                  "ownerAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                },
                {
                  "tokenId": "3",
                  "ownerAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                },
                {
                  "tokenId": "4",
                  "ownerAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                }
              ]
            }
          }
        }
      }
    })
    async getInfo(@Param('marketNo') marketNo: number): Promise<any> {
      const market = await this.marketService.getInfo(marketNo);
      return this.responseMessage.response({
        ...market,
        startDttm: moment(market.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(market.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      });  

    }

  /**
   * 마켓 판매 상세 정보 조회 (마이페이지)
   * 
   * @param user 
   * @param marketNo 
   * @returns 
   */
    @Get('/mypage/:marketNo')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '마켓 판매 정보 조회', description: '마켓 판매 정보를 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiOkResponse({
      description: '성공',
      schema: {
        example: {
          resultCode: 200,
          resultMessage: 'SUCCESS',
          data: {
            "state": "S5",
            "price": 0.3,
            "marketNo": 23,
            "contractNo": 132,
            "productNo": 56,
            "assetNo": 80,
            "saleAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleUserName": "엔터사 1",
            "marketAssetName": "테스트 굿즈1용 에셋1",
            "assetName": "테스트 굿즈1용 에셋1",
            "assetDesc": "테스트 굿즈1용 에셋1",
            "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-셔츠",
            "startDttm": "2024-10-29 09:00:00",
            "endDttm": "2024-12-31 09:00:00",
            "regDttm": "2024-10-29 15:06:16",
            "useYn": "Y",
            "stateDesc": "판매완료",
            "fromTokenId": "2",
            "toTokenId": "11",
            "fileNameFirst": "test1.glb",
            "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
            "thumbnailFirst": "https://kapi-dev.avataroad.com/",
            "fileNameSecond": "test1.png",
            "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
            "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
            "fileNameThird": "test1.png",
            "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
            "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
            "assetVcId": "asset_vc_id-2",
            "nftContractAddress": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
            "nftContractAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/contracts/0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
            "nftTxId": "0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
            "nftTxIdUrl": "http://besu-dev-explorer.avataroad.com:8081/transactions/0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
            "tokenInfo": [
              {
                "tokenId": "2",
                "ownerAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                "ownerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
              },
              {
                "tokenId": "3",
                "ownerAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                "ownerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
              },
              {
                "tokenId": "4",
                "ownerAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                "ownerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
              }
            ]
          }
        }
      }
    })
    async getMyInfo(@GetUser() user: User, @Param('marketNo') marketNo: number): Promise<any> {
      const market = await this.marketService.getMyInfo(user, marketNo);
      return this.responseMessage.response({
        ...market,
        startDttm: moment(market.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(market.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        regDttm: moment(market.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      });  

    }

    /**
     * 마켓 판매 상태 변경
     * 
     * @param user 
     * @param marketNo 
     * @returns 
     */
    @Patch('/:marketNo/state/:state')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '마켓 판매 상태 변경', description: '마켓 판매 상태를 변경한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
    @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
    @ApiParam({
    name: 'state',
    description: '마켓 판매 상태 (1: 판매전, 2: 판매중, 3: 판매중지, 4: 판매종료, 5: 판매완료)',
    })
    async modifyState(
      @GetUser() user: User, 
      @Param('marketNo') marketNo: number,
      @Param('state') state: number
    ): Promise<void> {
      fileLogger.info('market-update state');
      fileLogger.info(user);
      fileLogger.info(`marketNo: ${marketNo}`);
      fileLogger.info(`state: ${state}`);
      await this.marketService.updateState(user, marketNo, state);
      return this.responseMessage.response(null);
    }

  /**
   * 사용자 JWT Token 삭제
   * 
   * @param user 
   * @param deleteMarketSaleJwtDto 
   * @returns 
   */
  @Post("/sale/delJwt")
  @ApiOperation({ summary: '사용자 JWT Token 삭제', description: '사용자 JWT Token 정보를 삭제한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'입력값 오류'})
  // @ApiResponse({status:HttpStatus.NOT_FOUND, description:'등록된 엔터사 에셋 미존재'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: HttpStatus.CREATED,resultMessage: 'SUCCESS'}}})
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCCESS",
        "data": {
          "marketNo": 28
        }
      }
    }
  })
  async delJwt( @Body(ValidationPipe) deleteMarketSaleJwtDto: DeleteMarketSaleJwtDto): Promise<any> {
    fileLogger.info('market-delJwt');
    fileLogger.info(deleteMarketSaleJwtDto);
    await this.marketService.delJwt(deleteMarketSaleJwtDto);
    return this.responseMessage.response(null);
  }

  /**
   * 사용자 에셋 판매 등록
   * 
   * @param user 
   * @param createMarketSaleDto 
   * @returns 
   */
  @Post("/sale")
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 3 }], multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '사용자 에셋 판매 등록', description: '사용자 에셋 판매 정보를 등록한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'입력값 오류'})
  // @ApiResponse({status:HttpStatus.NOT_FOUND, description:'등록된 엔터사 에셋 미존재'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: HttpStatus.CREATED,resultMessage: 'SUCCESS'}}})
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCCESS",
        "data": {
          "marketNo": 28
        }
      }
    }
  })
  async createAll(@UploadedFiles(SharpPipe) files: Express.Multer.File[], 
    @Body(ValidationPipe) createMarketSaleDto: CreateMarketSaleDto): Promise<any> {
    fileLogger.info('market-createAll');
    fileLogger.info(createMarketSaleDto);
    const market: any = await this.marketService.createAll(files, createMarketSaleDto);
    return this.responseMessage.response(market);
  }

  /**
   * 에셋 NFT MINT & VC 발급
   * 
   * @param user 
   * @param files 
   * @param createAssetDto 
   * @returns 
   */
  @Post("/sale/:marketNo")
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 NFT MINT & 등록증명 VC 발급', description: '에셋 NFT MINT & 등록증명 VC를 발급한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 제품 없음' })
  async createNftVc(@Param('marketNo') marketNo: number): Promise<any> {
    console.log("++++++++++++++++++++++");
    fileLogger.info('market-createNft');
    fileLogger.info(`marketNo: ${marketNo}`);
    await this.marketService.createNftVc(marketNo);
    return this.responseMessage.response(null);
  }

}
