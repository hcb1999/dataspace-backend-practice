import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe } from '@nestjs/common';
import { PurchaseAssetService } from './purchase_asset.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { CreatePurchaseAssetDto } from '../dtos/create_purchase_asset.dto';
import { ModifyPurchaseAssetDto } from '../dtos/modify_purchase_asset.dto';
import { GetPurchaseAssetDto } from '../dtos/get_purchase_asset.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('purchaseAsset')
@ApiTags('엔터사 구매 API')
export class PurchaseAssetController {
  private logger = new Logger('PurchaseAssetController');

  constructor(
    private responseMessage: ResponseMessage,
    private purchaseAssetService: PurchaseAssetService
  ) {}

  /**
   * 엔터사 에셋 구매 등록
   * 
   * @param user 
   * @param createPurchaseAssetDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '엔터사 에셋 구매 등록', description: '엔터사 에셋 구매 정보를 등록한다.' })
  @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'입력값 오류'})
  @ApiResponse({status:HttpStatus.NOT_FOUND, description:'등록된 에셋 미존재'})
  @ApiResponse({status:HttpStatus.CONFLICT, description:'이미 구매한 에셋'})
  @ApiCreatedResponse({description: '성공', schema: {example: {resultCode: HttpStatus.CREATED,resultMessage: 'SUCCESS'}}})
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCCESS",
        "data": {
          "purchaseAssetNo": 28
        }
      }
    }
  })
  async purchase(@GetUser() user: User, @Body(ValidationPipe) createPurchaseAssetDto: CreatePurchaseAssetDto): Promise<any> {
    fileLogger.info('purchaseAsset-create');
    fileLogger.info(user);
    fileLogger.info(createPurchaseAssetDto);
    const purchaseAsset: any = await this.purchaseAssetService.purchase(user, createPurchaseAssetDto);
    return this.responseMessage.response(purchaseAsset);
  }

 /**
   * 엔터사 구매 상태 정보 수정
   * @param user 
   * @param purchaseAssetNo 
   * @param modifyPurchaseAssetDto 
   * @returns 
   */
  // @Put('/:purchaseAssetNo')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  // @ApiOperation({ summary: '엔터사 구매 상태 정보 수정', description: '엔터사 구매 상태 정보를 수정한다.' })
  // @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  // @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'입력값 오류'})
  // @ApiOkResponse({ description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  // async modifytState(@Param('purchaseAssetNo') purchaseAssetNo: number,
  //   @Body(ValidationPipe) modifyPurchaseAssetDto: ModifyPurchaseAssetDto): Promise<void> {
  //   fileLogger.info('purchaseAsset-update state');
  //   fileLogger.info(`purchaseNo: ${purchaseAssetNo}`);
  //   fileLogger.info(modifyPurchaseAssetDto);
  //   await this.purchaseAssetService.updateState(purchaseAssetNo, modifyPurchaseAssetDto);
  //   return this.responseMessage.response(null);
  // }

  /**
   * 엔터사 구매 목록 조회
   * @param user 
   * @param getPurchaseAssetDto 
   * @returns 
   */
  // @Get('/')
  // // @UseGuards(JwtAuthGuard)
  // // @ApiBearerAuth('access-token')
  // @ApiOperation({ summary: '엔터사 구매 목록 조회', description: '엔터사 구매 목록을 조회한다.' })
  // @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  // @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'필수입력 오류'})
  // @ApiOkResponse({ description: '성공',
  //   schema: {example: { 
  //     "resultCode": 200,
  //     "resultMessage": "SUCESS",
  //     "data": {
  //       "pageSize": 10,
  //       "totalCount": 2,
  //       "totalPage": 1,
  //       "list": [
  //         {
  //           "price": 7000,
  //           "purchaseAssetNo": 3,
  //           "purchaseAddr": "0x12345678900",
  //           "purchaseUserName": "엔터사 1",
  //           "saleAddr": "0x12345678901",
  //           "saleUserName": "크리에이터 1",
  //           "assetName": "블링원 테스트 굿즈4",
  //           "assetDesc": "굿즈 26번에 대한 에셋입니다.",
  //           "metaverseName": "K-POP 월드",
  //           "typeDef": "K-셔츠",
  //           "startDttm": "2024-09-01 09:00:00",
  //           "endDttm": "2024-11-01 09:00:00",
  //           "fileNameFirst": "blingone_4.png",
  //           "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299062.png",
  //           "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299062.png",
  //           "fileNameSecond": "blingone_3.png",
  //           "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299074.png",
  //           "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299074.png"
  //         },
  //         {
  //           "price": 6000,
  //           "purchaseAssetNo": 2,
  //           "purchaseAddr": "0x12345678900",
  //           "purchaseUserName": "엔터사 1",
  //           "saleAddr": "0x12345678901",
  //           "saleUserName": "크리에이터 1",
  //           "assetName": "블링원 테스트 굿즈4",
  //           "assetDesc": "굿즈 26번에 대한 에셋입니다.",
  //           "metaverseName": "K-POP 월드",
  //           "typeDef": "K-가슴",
  //           "startDttm": "2024-09-01 09:00:00",
  //           "endDttm": "2024-11-01 09:00:00",
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
    
  // async getPurchaseList(@Query() getPurchaseAssetDto: GetPurchaseAssetDto ): Promise<void> {
  //   const purchaseAssetList = await this.purchaseAssetService.getPurchaseList(getPurchaseAssetDto);

  //   const updatedList = purchaseAssetList.list.map((item: any) => ({
  //     ...item,
  //       // startDttm: moment(item.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //       // endDttm: moment(item.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //       payDttm: moment(item.payDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //   }));
  
  //   return this.responseMessage.response({
  //     ...purchaseAssetList,
  //     list: updatedList
  //   });

  // }

    /**
   * 엔터사 구매 목록 조회 (마이페이지)
   * @param user 
   * @param getPurchaseAssetDto 
   * @returns 
   */
    @Get('/')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '엔터사 구매 목록 조회', description: '엔터사 구매 목록을 조회한다.' })
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
              "state": "P3",
              "price": 0.3,
              "purchaseAssetNo": 132,
              "purchaseAddr": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
              "purchaseAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
              "purchaseUserName": "엔터사 2",
              "saleAddr": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
              "saleAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x90f79bf6eb2c4f870365e785982e1f101e93b906",
              "saleUserName": "크리에이터 2",
              "assetName": "테스트 굿즈1용 에셋2",
              "assetDesc": "테스트 굿즈1용 에셋2",
              "metaverseName": "K-POP 월드",
              "typeDef": "K-셔츠",
              "payDttm": "2024-10-29 15:01:13",
              "stateDesc": "결재완료",
              "fileNameFirst": "test1.glb",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/",
              "fileNameSecond": "test1.png",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
              "fileNameThird": "test1-1.glb",
              "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181477346.glb",
              "thumbnailThird": "https://kapi-dev.avataroad.com/",
              "regDttm": "2024-10-30 14:41:07"
            },
            {
              "state": "P3",
              "price": 0.3,
              "purchaseAssetNo": 131,
              "purchaseAddr": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
              "purchaseAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
              "purchaseUserName": "엔터사 2",
              "saleAddr": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
              "saleAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x90f79bf6eb2c4f870365e785982e1f101e93b906",
              "saleUserName": "크리에이터 2",
              "assetName": "테스트 굿즈1용 에셋1",
              "assetDesc": "테스트 굿즈1용 에셋1",
              "metaverseName": "K-POP 월드",
              "typeDef": "K-셔츠",
              "payDttm": "2024-10-29 15:01:13",
              "stateDesc": "결재완료",
              "fileNameFirst": "test1.glb",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/",
              "fileNameSecond": "test1.png",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
              "fileNameThird": "test1-1.glb",
              "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181477346.glb",
              "thumbnailThird": "https://kapi-dev.avataroad.com/",
              "regDttm": "2024-10-30 14:41:07"
            }
          ]
        }
      }}})
      
    async getPurchaseMyList(@GetUser() user: User, @Query() getPurchaseAssetDto: GetPurchaseAssetDto ): Promise<void> {
      const purchaseAssetList = await this.purchaseAssetService.getPurchaseMyList(user, getPurchaseAssetDto);
  
      const updatedList = purchaseAssetList.list.map((item: any) => ({
        ...item,
        startDttm: moment(item.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(item.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        regDttm: moment(item.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        payDttm: moment(item.payDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      }));
    
      return this.responseMessage.response({
        ...purchaseAssetList,
        list: updatedList
      });
  
    }

  //   /**
  //  * 엔터사 구매 상세 정보 조회
  //  * 
  //  * @param user 
  //  * @param purchaseAssetNo 
  //  * @returns 
  //  */
  //   @Get('/:purchaseAssetNo')
  //   // @UseGuards(JwtAuthGuard)
  //   // @ApiBearerAuth('access-token')
  //   @ApiOperation({ summary: '엔터사 구매 정보 조회', description: '엔터사 구매 정보를 조회한다.' })
  //   @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  //   @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  //   @ApiOkResponse({
  //     description: '성공',
  //     schema: {
  //       example: {
  //         resultCode: 200,
  //         resultMessage: 'SUCCESS',
  //         data: {
  //           "resultCode": 200,
  //           "resultMessage": "SUCESS",
  //           "data": {
  //             "price": 7000,
  //             "purchaseAssetNo": 3,
  //             "productNo": 26,
  //             "assetNo": 5,
  //             "purchaseAddr": "0x12345678900",
  //             "purchaseUserName": "엔터사 1",
  //             "saleAddr": "0x12345678901",
  //             "saleUserName": "크리에이터 1",
  //             "assetName": "블링원 테스트 굿즈4",
  //             "assetDesc": "굿즈 26번에 대한 에셋입니다.",
  //             "metaverseName": "K-POP 월드",
  //             "typeDef": "K-셔츠",
  //             "fileNameFirst": "blingone_4.png",
  //             "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299062.png",
  //             "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299062.png",
  //             "fileNameSecond": "blingone_3.png",
  //             "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299074.png",
  //             "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299074.png"
  //           }
  //         }
  //       }
  //     }
  //   })
  //   async getInfo(@Param('purchaseAssetNo') purchaseAssetNo: number): Promise<any> {
  //     const purchaseAsset = await this.purchaseAssetService.getInfo(purchaseAssetNo);
  //     return this.responseMessage.response({
  //       ...purchaseAsset,
  //       // startDttm: moment(purchaseAsset.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //       // endDttm: moment(purchaseAsset.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //       payDttm: moment(purchaseAsset.payDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  //     });  

  //   }

  /**
   * 엔터사 구매 상세 정보 조회 (마이페이지)
   * 
   * @param user 
   * @param purchaseAssetNo 
   * @returns 
   */
    @Get('/:purchaseAssetNo')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '엔터사 구매 정보 조회', description: '엔터사 구매 정보를 조회한다.' })
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
              "state": "P3",
              "price": 0.3,
              "purchaseAssetNo": 132,
              "productNo": 56,
              "assetNo": 80,
              "purchaseAddr": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
              "purchaseAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
              "purchaseUserName": "엔터사 2",
              "saleAddr": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
              "saleAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x90f79bf6eb2c4f870365e785982e1f101e93b906",
              "saleUserName": "크리에이터 2",
              "assetName": "테스트 굿즈1용 에셋1",
              "assetDesc": "테스트 굿즈1용 에셋1",
              "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
              "metaverseName": "K-POP 월드",
              "typeDef": "K-셔츠",
              "regDttm": "2024-10-29 15:01:10",
              "payDttm": "2024-10-29 15:01:13",
              "useYn": "Y",
              "stateDesc": "결재완료",
              "fileNameFirst": "test1.glb",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/",
              "fileNameSecond": "test1.png",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
              "fileNameThird": "test1-1.glb",
              "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181477346.glb",
              "thumbnailThird": "https://kapi-dev.avataroad.com/",
              "nftContractAddress": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
              "nftContractAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/contracts/0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
              "nftTxId": "0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
              "nftTxIdUrl": "http://besu-dev-explorer.avataroad.com:8081/transactions/0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
              "nftTokenId": "1",
              "nftSellerAddr": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
              "nftSellerAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
              "nftBuyerAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
              "nftBuyerAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            }
          }
        }
      }
    })
    async getMyInfo(@GetUser() user: User, @Param('purchaseAssetNo') purchaseAssetNo: number): Promise<any> {
      const purchaseAsset = await this.purchaseAssetService.getMyInfo(user, purchaseAssetNo);
      return this.responseMessage.response({
        ...purchaseAsset,
        startDttm: moment(purchaseAsset.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(purchaseAsset.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        regDttm: moment(purchaseAsset.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        payDttm: moment(purchaseAsset.payDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      });  

    }

}
