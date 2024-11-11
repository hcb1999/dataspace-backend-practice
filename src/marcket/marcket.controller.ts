import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe } from '@nestjs/common';
import { MarcketService } from './marcket.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { CreatePurchaseAssetDto } from '../dtos/create_purchase_asset.dto';
import { ModifyPurchaseAssetDto } from '../dtos/modify_purchase_asset.dto';
import { GetPurchaseAssetDto } from '../dtos/get_purchase_asset.dto';
import { CreateMarcketDto} from '../dtos/create_marcket.dto';
import { ModifyMarcketDto } from '../dtos/modify_marcket.dto';
import { GetMarcketDto } from '../dtos/get_marcket.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('marcket')
@ApiTags('마켓 판매 API')
export class MarcketController {
  private logger = new Logger('MarcketController');

  constructor(
    private responseMessage: ResponseMessage,
    private marcketService: MarcketService
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
          "marcketNo": 28
        }
      }
    }
  })
  async create(@GetUser() user: User, @Body(ValidationPipe) createMarcketDto: CreateMarcketDto): Promise<any> {
    fileLogger.info('marcket-create');
    fileLogger.info(user);
    fileLogger.info(createMarcketDto);
    const marcket: any = await this.marcketService.create(user, createMarcketDto);
    return this.responseMessage.response(marcket);
  }

  /**
   * 엔터사 에셋 판매 정보 수정
   * 
   * @param user 
   * @param marcketNo 
   * @param modifyMarcketDto 
   * @returns 
   */
  @Put('/:marcketNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '엔터사 에셋 판매 정보 수정', description: '엔터사 에셋 판매 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 광고제품 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modify(@GetUser() user: User, @Param('marcketNo') marcketNo: number, 
    @Body(ValidationPipe) modifyMarcketDto: ModifyMarcketDto): Promise<void> {
    fileLogger.info('marcket-update');
    fileLogger.info(user);
    fileLogger.info(`marcketNo: ${marcketNo}`);
    fileLogger.info(modifyMarcketDto);
    await this.marcketService.update(user, marcketNo, modifyMarcketDto);
    return this.responseMessage.response(null);
  }

  /**
   * 엔터사 에셋 판매 정보 삭제
   * 
   * @param user 
   * @param marcketNo 
   * @returns 
   */
  @Delete('/:marcketNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '엔터사 에셋 판매 정보 삭제', description: '엔터사 에셋 판매 정보를 삭제한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async remove(@GetUser() user: User, @Param('marcketNo') marcketNo: number): Promise<void> {
    fileLogger.info('marcket-delete');
    fileLogger.info(user);
    fileLogger.info(`marcketNo: ${marcketNo}`);
    await this.marcketService.delete(user, marcketNo);
    return this.responseMessage.response(null);
  }

  /**
   * 사용자 에셋 재판매 등록
   * 
   * @param user 
   * @param createMarcketDto 
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
          "marcketNo": 28
        }
      }
    }
  })
  async recreate(@GetUser() user: User, @Body(ValidationPipe) createMarcketDto: CreateMarcketDto): Promise<any> {
    fileLogger.info('marcket-resale-create');
    fileLogger.info(user);
    fileLogger.info(createMarcketDto);
    const marcket: any = await this.marcketService.recreate(user, createMarcketDto);
    return this.responseMessage.response(marcket);
  }

  /**
   * 마켓 판매 목록 조회
   * @param user 
   * @param getMarcketDto 
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
            "marcketNo": 23,
            "purchaseAssetNo": 132,
            "saleAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleUserName": "엔터사 2",
            "marcketAsetName": "테스트 굿즈1용 에셋2",
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
            "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png"
          },
          {
            "price": 0.3,
            "marcketNo": 22,
            "purchaseAssetNo": 132,
            "saleAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleUserName": "엔터사 1",
            "marcketAsetName": "테스트 굿즈1용 에셋1",
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
            "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png"
          }
        ]
      }
    }}})
    
  async getSaleList(@Query() getMarcketDto: GetMarcketDto ): Promise<void> {
    const marcketList = await this.marcketService.getSaleList(getMarcketDto);

    const updatedList = marcketList.list.map((item: any) => ({
      ...item,
      startDttm: moment(item.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      endDttm: moment(item.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...marcketList,
      list: updatedList
    });

  }

    /**
   * 마켓 판매 목록 조회 (마이페이지)
   * @param user 
   * @param getMarcketDto 
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
              "marcketNo": 23,
              "purchaseAssetNo": 132,
              "saleAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleUserName": "엔터사 1",
              "marcketAssetName": "테스트 굿즈1용 에셋2",
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
              "regDttm": "2024-10-29 17:17:38"            },
            {
              "state": "S5",
              "price": 0.2,
              "marcketNo": 22,
              "purchaseAssetNo": 132,
              "saleAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleUserName": "엔터사 1",
              "marcketAssetName": "테스트 굿즈1용 에셋1",
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
              "regDttm": "2024-10-29 17:17:38"            }
          ]
        }
      }}})
      
    async getSaleMyList(@GetUser() user: User, @Query() getMarcketDto: GetMarcketDto ): Promise<void> {
      const marcketList = await this.marcketService.getSaleMyList(user, getMarcketDto);
  
      const updatedList = marcketList.list.map((item: any) => ({
        ...item,
        startDttm: moment(item.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(item.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        regDttm: moment(item.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      }));
    
      return this.responseMessage.response({
        ...marcketList,
        list: updatedList
      });
  
    }

    /**
   * 마켓 판매 상세 정보 조회
   * 
   * @param user 
   * @param marcketNo 
   * @returns 
   */
    @Get('/:marcketNo')
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
              "marcketNo": 23,
              "purchaseAssetNo": 132,
              "productNo": 56,
              "assetNo": 80,
              "saleAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "saleUserName": "엔터사 1",
              "marcketAssetName": "테스트 굿즈1용 에셋1",
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
              "nftContractAddress": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
              "nftContractAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/contracts/0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
              "nftTxId": "0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
              "nftTxIdUrl": "http://besu-dev-explorer.avataroad.com:8081/transactions/0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
              "tokenInfo": [
                {
                  "tokenId": "2",
                  "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                },
                {
                  "tokenId": "3",
                  "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                },
                {
                  "tokenId": "4",
                  "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                }
              ]
            }
          }
        }
      }
    })
    async getInfo(@Param('marcketNo') marcketNo: number): Promise<any> {
      const marcket = await this.marcketService.getInfo(marcketNo);
      return this.responseMessage.response({
        ...marcket,
        startDttm: moment(marcket.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(marcket.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      });  

    }

  /**
   * 마켓 판매 상세 정보 조회 (마이페이지)
   * 
   * @param user 
   * @param marcketNo 
   * @returns 
   */
    @Get('/mypage/:marcketNo')
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
            "marcketNo": 23,
            "purchaseAssetNo": 132,
            "productNo": 56,
            "assetNo": 80,
            "saleAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "saleUserName": "엔터사 1",
            "marcketAssetName": "테스트 굿즈1용 에셋1",
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
            "nftContractAddress": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
            "nftContractAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/contracts/0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
            "nftTxId": "0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
            "nftTxIdUrl": "http://besu-dev-explorer.avataroad.com:8081/transactions/0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
            "tokenInfo": [
              {
                "tokenId": "2",
                "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
              },
              {
                "tokenId": "3",
                "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
              },
              {
                "tokenId": "4",
                "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
              }
            ]
          }
        }
      }
    })
    async getMyInfo(@GetUser() user: User, @Param('marcketNo') marcketNo: number): Promise<any> {
      const marcket = await this.marcketService.getMyInfo(user, marcketNo);
      return this.responseMessage.response({
        ...marcket,
        startDttm: moment(marcket.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(marcket.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        regDttm: moment(marcket.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      });  

    }


}
