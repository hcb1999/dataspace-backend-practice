import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { CreatePurchaseDto } from '../dtos/create_purchase.dto';
import { ModifyPurchaseDto } from '../dtos/modify_purchase.dto';
import { GetPurchaseDto } from '../dtos/get_purchase.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('purchase')
@ApiTags('사용자 구매 API')
export class PurchaseController {
  private logger = new Logger('PurchaseController');

  constructor(
    private responseMessage: ResponseMessage,
    private purchaseService: PurchaseService
  ) {}

  /**
   * 사용자 에셋 구매 등록
   * 
   * @param user 
   * @param createPurchaseDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용자 에셋 구매 등록', description: '사용자 에셋 구매 정보를 등록한다.' })
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
          "purchaseNo": 2
        }
      }
    }
  })
  async purchase(@GetUser() user: User, @Body(ValidationPipe) createPurchaseDto: CreatePurchaseDto): Promise<any> {
    fileLogger.info('purchase-create');
    fileLogger.info(user);
    fileLogger.info(createPurchaseDto);
    const purchase: any = await this.purchaseService.purchase(user, createPurchaseDto);
    return this.responseMessage.response(purchase);
  }

  /**
   * 사용자 구매 상태 정보 수정
   * @param user 
   * @param purchaseNo 
   * @param state 
   * @param modifyPurchaseDto 
   * @returns 
   */
  // @Put('/:purchaseNo')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  // @ApiOperation({ summary: '사용자 구매 상태 정보 수정', description: '사용자 구매 상태 정보를 수정한다.' })
  // @ApiResponse({status:HttpStatus.INTERNAL_SERVER_ERROR, description:'서버 에러'})
  // @ApiResponse({status:HttpStatus.BAD_REQUEST, description:'입력값 오류'})
  // @ApiOkResponse({ description: '성공', schema: {example: {resultCode: 200,resultMessage: 'SUCCESS'}}})
  // async modifyState(@Param('purchaseNo') purchaseNo: number,
  //   @Body(ValidationPipe) modifyPurchaseDto: ModifyPurchaseDto): Promise<void> {
  //   fileLogger.info('purchase-update state');
  //   fileLogger.info(`purchaseNo: ${purchaseNo}`);
  //   fileLogger.info(ModifyPurchaseDto);
  //   await this.purchaseService.updateState(purchaseNo, modifyPurchaseDto);
  //   return this.responseMessage.response(null);
  // }

  /**
   * 사용자 구매 목록 조회
   * @param user 
   * @param getPurchaseDto 
   * @returns 
   */
  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용자 구매 목록 조회', description: '사용자 구매 목록을 조회한다.' })
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
  async getPurchaseList(@GetUser() user: User, @Query() getPurchaseDto: GetPurchaseDto ): Promise<void> {
    const purchaseList = await this.purchaseService.getPurchaseList(user, getPurchaseDto);

    const updatedList = purchaseList.list.map((item: any) => ({
      ...item,
      payDttm: moment(item.payDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }));
  
    return this.responseMessage.response({
      ...purchaseList,
      list: updatedList
    });

  }

    /**
   * 사용자 구매 상세 정보 조회
   * 
   * @param user 
   * @param productNo 
   * @returns 
   */
    @Get('/:purchaseNo')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '사용자 구매 정보 조회', description: '사용자 구매 정보를 조회한다.' })
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
              "price": 6000,
              "purchaseNo": 2,
              "saleAddr": "0x12345678900",
              "saleUserName": "엔터사 1",
              "purchaseAddr": "0x12345678912",
              "purchaseUserName": "사용자 2",
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
          }
        }
      }
    })
    async getInfo(@GetUser() user: User, @Param('purchaseNo') purchaseNo: number): Promise<any> {
      const purchase = await this.purchaseService.getInfo(user, purchaseNo);
      return this.responseMessage.response({
        ...purchase,
        payDttm: moment(purchase.payDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      });  

    }

}
