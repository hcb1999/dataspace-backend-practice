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
import { CreateMarketResaleDto} from '../dtos/create_market_resale.dto';
import { GetMarketDto } from '../dtos/get_market.dto';
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
   * 마켓 데이터 판매 등록
   * 
   * @param user 
   * @param createSaleDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 3 }], multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '마켓 데이터 판매 등록', description: '마켓 데이터 판매 정보를 등록한다.' })
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
  async creat(
    @GetUser() user: User, 
    @UploadedFiles(SharpPipe) files: Express.Multer.File[], 
    @Body(ValidationPipe) createMarketDto: CreateMarketDto
  ): Promise<any> {
    fileLogger.info('market-create');
    fileLogger.info(user);
    fileLogger.info(createMarketDto);
    const market: any = await this.marketService.create(user, files, createMarketDto);
    return this.responseMessage.response(market);
  }

  /**
   * 마켓 데이터 판매 정보 수정
   * 
   * @param user 
   * @param marketNo 
   * @param modifyMarketDto 
   * @returns 
   */
  @Put('/:marketNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 3 }], multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '마켓 데이터 판매 정보 수정', description: '마켓 데이터 판매 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 광고제품 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modify(
    @GetUser() user: User, 
    @Param('marketNo') marketNo: number, 
    //@UploadedFiles(SharpPipe) files: Express.Multer.File[],
    @Body(ValidationPipe) modifyMarketDto: ModifyMarketDto): Promise<void> {
    fileLogger.info('market-update');
    fileLogger.info(user);
    fileLogger.info(`marketNo: ${marketNo}`);
    fileLogger.info(modifyMarketDto);
   // await this.marketService.update(user, marketNo, files, modifyMarketDto);
    await this.marketService.update(user, marketNo, modifyMarketDto);

    return this.responseMessage.response(null);
  }

  /**
   * 마켓 데이터 판매 정보 삭제
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
   * 사용자 데이터 재판매 등록
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
  async recreate(@GetUser() user: User, 
    @Body(ValidationPipe) createMarketResaleDto: CreateMarketResaleDto
  ): Promise<any> {
    fileLogger.info('market-resale-create');
    fileLogger.info(user);
    fileLogger.info(createMarketResaleDto);
    const market: any = await this.marketService.recreate(user, createMarketResaleDto);
    return this.responseMessage.response(market);
    return null;
  }

  /**
   * 마켓 데이터 판매 목록 조회
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
      "resultMessage": "SUCCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 3,
        "totalPage": 1,
        "list": [
          {
            "state": "S2",
            "price": 0.333,
            "marketNo": 3,
            "marketVcType": "5",
            "marketDoi": "10.23633/ownWindow.10003",
            "marketDataName": "스미트불편신고 상위 지역 3",
            "saleAccount": "0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleAccountUrl": "http://72.155.88.116:6100/accounts/0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleUserName": "data1",
            "stateDesc": null,
            "issueCnt": 1,
            "saleCnt": 0,
            "inventoryCnt": 1,
            "startDttm": "2025-12-08 20:48:51",
            "endDttm": "2026-12-08 20:48:51",
            "fileNameFirst": "white_shoes.png",
            "fileUrlFirst": "https://dataspace.authrium.com/api/file/20251208/1765194739790.png",
            "thumbnailFirst": "https://dataspace.authrium.com/api/thumbnail/20251208/1765194739790.png",
            "fileNameSecond": "",
            "fileUrlSecond": "https://dataspace.authrium.com/api/",
            "thumbnailSecond": "https://dataspace.authrium.com/api/",
            "fileNameThird": "",
            "fileUrlThird": "https://dataspace.authrium.com/api/",
            "thumbnailThird": "https://dataspace.authrium.com/api/",
            "marketVcId": null
          },
          {
            "state": "S2",
            "price": 0.0007,
            "marketNo": 2,
            "marketVcType": "5",
            "marketDoi": "10.23633/ownWindow.10002",
            "marketDataName": "1",
            "saleAccount": "0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleAccountUrl": "http://72.155.88.116:6100/accounts/0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleUserName": "data1",
            "stateDesc": null,
            "issueCnt": 1,
            "saleCnt": 0,
            "inventoryCnt": 1,
            "startDttm": "2025-12-08 20:42:19",
            "endDttm": "2025-12-08 20:42:19",
            "fileNameFirst": "white_shoes.png",
            "fileUrlFirst": "https://dataspace.authrium.com/api/file/20251208/1765182267314.png",
            "thumbnailFirst": "https://dataspace.authrium.com/api/thumbnail/20251208/1765182267314.png",
            "fileNameSecond": "",
            "fileUrlSecond": "https://dataspace.authrium.com/api/",
            "thumbnailSecond": "https://dataspace.authrium.com/api/",
            "fileNameThird": "",
            "fileUrlThird": "https://dataspace.authrium.com/api/",
            "thumbnailThird": "https://dataspace.authrium.com/api/",
            "marketVcId": null
          },
          {
            "state": "S2",
            "price": 0.00001,
            "marketNo": 1,
            "marketVcType": "5",
            "marketDoi": "10.23633/ownWindow.10001",
            "marketDataName": "스미트불편신고 상위 지역",
            "saleAccount": "0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleAccountUrl": "http://72.155.88.116:6100/accounts/0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleUserName": "data1",
            "stateDesc": null,
            "issueCnt": 3,
            "saleCnt": 0,
            "inventoryCnt": 0,
            "startDttm": "2025-12-08 15:23:21",
            "endDttm": "2026-12-08 15:23:21",
            "fileNameFirst": null,
            "fileUrlFirst": "https://dataspace.authrium.com/api/",
            "thumbnailFirst": "https://dataspace.authrium.com/api/",
            "fileNameSecond": null,
            "fileUrlSecond": "https://dataspace.authrium.com/api/",
            "thumbnailSecond": "https://dataspace.authrium.com/api/",
            "fileNameThird": null,
            "fileUrlThird": "https://dataspace.authrium.com/api/",
            "thumbnailThird": "https://dataspace.authrium.com/api/",
            "marketVcId": null
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
   * 마켓 데이터 판매 목록 조회 (마이페이지)
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
      "resultMessage": "SUCCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 3,
        "totalPage": 1,
        "list": [
          {
            "state": "S2",
            "price": 0.333,
            "marketNo": 3,
            "marketVcType": "5",
            "marketDoi": "10.23633/ownWindow.10003",
            "marketDataName": "스미트불편신고 상위 지역 3",
            "saleAccount": "0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleAccountUrl": "http://72.155.88.116:6100/accounts/0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleUserName": "data1",
            "stateDesc": null,
            "issueCnt": 1,
            "saleCnt": 0,
            "inventoryCnt": 1,
            "startDttm": "2025-12-08 20:48:51",
            "endDttm": "2026-12-08 20:48:51",
            "fileNameFirst": "white_shoes.png",
            "fileUrlFirst": "https://dataspace.authrium.com/api/file/20251208/1765194739790.png",
            "thumbnailFirst": "https://dataspace.authrium.com/api/thumbnail/20251208/1765194739790.png",
            "fileNameSecond": "",
            "fileUrlSecond": "https://dataspace.authrium.com/api/",
            "thumbnailSecond": "https://dataspace.authrium.com/api/",
            "fileNameThird": "",
            "fileUrlThird": "https://dataspace.authrium.com/api/",
            "thumbnailThird": "https://dataspace.authrium.com/api/",
            "marketVcId": null
          },
          {
            "state": "S2",
            "price": 0.0007,
            "marketNo": 2,
            "marketVcType": "5",
            "marketDoi": "10.23633/ownWindow.10002",
            "marketDataName": "1",
            "saleAccount": "0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleAccountUrl": "http://72.155.88.116:6100/accounts/0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleUserName": "data1",
            "stateDesc": null,
            "issueCnt": 1,
            "saleCnt": 0,
            "inventoryCnt": 1,
            "startDttm": "2025-12-08 20:42:19",
            "endDttm": "2025-12-08 20:42:19",
            "fileNameFirst": "white_shoes.png",
            "fileUrlFirst": "https://dataspace.authrium.com/api/file/20251208/1765182267314.png",
            "thumbnailFirst": "https://dataspace.authrium.com/api/thumbnail/20251208/1765182267314.png",
            "fileNameSecond": "",
            "fileUrlSecond": "https://dataspace.authrium.com/api/",
            "thumbnailSecond": "https://dataspace.authrium.com/api/",
            "fileNameThird": "",
            "fileUrlThird": "https://dataspace.authrium.com/api/",
            "thumbnailThird": "https://dataspace.authrium.com/api/",
            "marketVcId": null
          },
          {
            "state": "S2",
            "price": 0.00001,
            "marketNo": 1,
            "marketVcType": "5",
            "marketDoi": "10.23633/ownWindow.10001",
            "marketDataName": "스미트불편신고 상위 지역",
            "saleAccount": "0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleAccountUrl": "http://72.155.88.116:6100/accounts/0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleUserName": "data1",
            "stateDesc": null,
            "issueCnt": 3,
            "saleCnt": 0,
            "inventoryCnt": 0,
            "startDttm": "2025-12-08 15:23:21",
            "endDttm": "2026-12-08 15:23:21",
            "fileNameFirst": null,
            "fileUrlFirst": "https://dataspace.authrium.com/api/",
            "thumbnailFirst": "https://dataspace.authrium.com/api/",
            "fileNameSecond": null,
            "fileUrlSecond": "https://dataspace.authrium.com/api/",
            "thumbnailSecond": "https://dataspace.authrium.com/api/",
            "fileNameThird": null,
            "fileUrlThird": "https://dataspace.authrium.com/api/",
            "thumbnailThird": "https://dataspace.authrium.com/api/",
            "marketVcId": null
          }
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
   * 마켓 데이터 판매 상세 정보 조회
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
          "resultMessage": "SUCCESS",
          "data": {
            "price": 0.3,
            "marketNo": 23,
            "marketVcType": "5",
            "marketDoi": "10.23633/ownWindow.10001",
            "contractNo": 132,
            "productNo": 56,
            "assetNo": 80,
            "saleAccount": "0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
            "saleAccountUrl": "http://72.155.88.116:6100/accounts/0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
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
            "nftContractAddress": "0xEC1e30e371c41a1cd53651D0e62fF9f65b509278",
            "nftContractAddressUrl": "http://72.155.88.116:6100/address/0xEC1e30e371c41a1cd53651D0e62fF9f65b509278",
            "nftTxId": "0x8e70f174fa86caef861c52d36d2f5f6f203e93569f6fb13c02d7cbfc3d632aa5",
            "nftTxIdUrl": "http://72.155.88.116:6100/tx/0x8e70f174fa86caef861c52d36d2f5f6f203e93569f6fb13c02d7cbfc3d632aa5",
            "tokenInfo": [
              {
                "tokenId": "2",
                "ownerAccount": "0xa0f11f677eb697d93488b0614e3261820beeb051",
                "ownerAccountUrl": "http://72.155.88.116:6100/accounts/0xa0f11f677eb697d93488b0614e3261820beeb051"              },
              {
                "tokenId": "3",
                "ownerAccount": "0xa0f11f677eb697d93488b0614e3261820beeb051",
                "ownerAccountUrl": "http://72.155.88.116:6100/accounts/0xa0f11f677eb697d93488b0614e3261820beeb051"
              },
              {
                "tokenId": "4",
                "ownerAccount": "0xa0f11f677eb697d93488b0614e3261820beeb051",
                "ownerAccountUrl": "http://72.155.88.116:6100/accounts/0xa0f11f677eb697d93488b0614e3261820beeb051"
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
   * 마켓 데이터 판매 상세 정보 조회 (마이페이지)
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
          "marketVcType": "5",
          "marketDoi": "10.23633/ownWindow.10001",
          "contractNo": 132,
          "productNo": 56,
          "assetNo": 80,
          "saleAccount": "0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
          "saleAccountUrl": "http://72.155.88.116:6100/accounts/0xc6baec171e4dd98ef8e03e76c9c6a73b685e2016",
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
          "nftContractAddress": "0xEC1e30e371c41a1cd53651D0e62fF9f65b509278",
          "nftContractAddressUrl": "http://72.155.88.116:6100/address/0xEC1e30e371c41a1cd53651D0e62fF9f65b509278",
          "nftTxId": "0x8e70f174fa86caef861c52d36d2f5f6f203e93569f6fb13c02d7cbfc3d632aa5",
          "nftTxIdUrl": "http://72.155.88.116:6100/tx/0x8e70f174fa86caef861c52d36d2f5f6f203e93569f6fb13c02d7cbfc3d632aa5",
          "tokenInfo": [
            {
              "tokenId": "2",
              "ownerAccount": "0xa0f11f677eb697d93488b0614e3261820beeb051",
              "ownerAccountUrl": "http://72.155.88.116:6100/accounts/0xa0f11f677eb697d93488b0614e3261820beeb051"
            },
            {
              "tokenId": "3",
              "ownerAccount": "0xa0f11f677eb697d93488b0614e3261820beeb051",
              "ownerAccountUrl": "http://72.155.88.116:6100/accounts/0xa0f11f677eb697d93488b0614e3261820beeb051"
            },
            {
              "tokenId": "4",
              "ownerAccount": "0xa0f11f677eb697d93488b0614e3261820beeb051",
              "ownerAccountUrl": "http://72.155.88.116:6100/accounts/0xa0f11f677eb697d93488b0614e3261820beeb051"
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
   * 마켓 데이터 판매 상태 변경
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
   * 마켓 데이터 NFT MINT & VC 발급
   * 
   * @param user 
   * @param marketNo 
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

  /**
   * 마켓 데이터 VC 조회
   * 
   * @param user 
   * @param marketNo 
   * @returns 
   */
  @Get('/vc/:marketNo')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '마켓 데이터 VC 정보 조회', description: '마켓 데이터 VC 정보를 조회한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCCESS",
        "data": {
          "dataId": "AL_DS_NFT-59",
          "issuerDid": "did:dataspace:HEVYMbM5R3EpKQ1BfLAiLe",
          "dataName": "췌장암 Imputation 데이터",
          "dataDesc": "국립암센터의 췌장암 Imputation 데이터",
          "productType": "데이터서비스",
          "language": "한국어",
          "keyWord": "암,췌장암,Cancer,Imputation,Imputation 데이터",
          "doi": "10.23633/ownWindow.10001",
          "subject": "건강의료복지",
          "issuer": "국립암센터",
          "doiUrl": "https://doi.org/10.23633/ownWindow.10001",
          "registrantEmail": "finalseller@naver.com",
          "registrantWalletAddress": "0xae4bb159be554d7ea244254adef2d0909e46ea40",
          "dataPrice": "0.000001",
          "txId": "0xf25518b1a6f61850ba6be0e5b0e11338cc462308d5de3e1ce8612b32b56ef8db",
          "contractAddress": "0xEC1e30e371c41a1cd53651D0e62fF9f65b509278",
          "imageURL": "https://dataspace.authrium.com/api/",
          "registrationDate": "2025-12-11T09:59:04Z"
        }
      }
    }
  })
  async getVcInfo(@GetUser() user: User, @Param('marketNo') marketNo: number): Promise<any> {
    const vc = await this.marketService.getVcInfo(user, marketNo);
    return this.responseMessage.response({
      ...vc,
      // regDttm: moment(vc.registrationDate).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    });  

  }

}
