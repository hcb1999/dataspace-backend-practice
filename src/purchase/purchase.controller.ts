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
      "resultMessage": "SUCCESS",
      "data": {
        "pageSize": 10,
        "totalCount": 2,
        "totalPage": 1,
          "list": [
            {
              "state": "P3",
              "price": 0.333,
              "purchaseNo": 1,
              "saleUserName": "data1",
              "marketDataName": "스미트불편신고 상위 지역 3",
              "marketDataDesc": "용도지역(주거지역, 상업지역)별 스마트불편신고(불법주정차, 불법광고물, 쓰레기, 장애인주차구역위반) 상위 20% 밀도 분석. 국토교통부 공간빅데이터 분석플랫폼 수요분석과제 3",
              "marketProductType": "데이터서비스 3",
              "marketLanguage": "한국어",
              "marketKeyword": "공간,불편신고,빅데이터,상업지역,용도지역,주거지역,표준분석 3",
              "marketLandingPage": "http://geobigdata.go.kr/portal/case/demandView.do?proj_seq=83",
              "marketSubject": "건설에너지 3",
              "marketIssuer": "공간빅데이터분석 3",
              "stateDesc": "결제완료",
              "payDttm": "2025-12-08 22:20:27",
              "purchaseCnt": 3,
              "saleCnt": 0,
              "inventoryCnt": 3,
              "fileNameFirst": "white_shoes.png",
              "fileUrlFirst": "https://dataspace.authrium.com/api/file/20251208/1765194739790.png",
              "thumbnailFirst": "https://dataspace.authrium.com/api/thumbnail/20251208/1765194739790.png",
              "fileNameSecond": "",
              "fileUrlSecond": "https://dataspace.authrium.com/api/",
              "thumbnailSecond": "https://dataspace.authrium.com/api/",
              "fileNameThird": "",
              "fileUrlThird": "https://dataspace.authrium.com/api/",
              "thumbnailThird": "https://dataspace.authrium.com/api/"
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
          "data": {
            "price": 0.333,
            "purchaseNo": 1,
            "marketNo": 3,
            "saleAccount": "0xa0f11f677eb697d93488b0614e3261820beeb051",
            "saleAccountUrl": "http://www-dev.avataroad.com:6100/accounts/0xa0f11f677eb697d93488b0614e3261820beeb051",
            "saleUserName": "data1",
            "purchaseAccount": "dataBuyer_walletaddress",
            "purchaseAccountUrl": "http://www-dev.avataroad.com:6100/accounts/dataBuyer_walletaddress",
            "purchaseUserName": "dataBuyer",
            "marketDataName": "스미트불편신고 상위 지역 3",
            "marketDataDesc": "용도지역(주거지역, 상업지역)별 스마트불편신고(불법주정차, 불법광고물, 쓰레기, 장애인주차구역위반) 상위 20% 밀도 분석. 국토교통부 공간빅데이터 분석플랫폼 수요분석과제 3",
            "marketProductType": "데이터서비스 3",
            "marketLanguage": "한국어",
            "marketKeyword": "공간,불편신고,빅데이터,상업지역,용도지역,주거지역,표준분석 3",
            "marketLandingPage": "http://geobigdata.go.kr/portal/case/demandView.do?proj_seq=83",
            "marketSubject": "건설에너지 3",
            "marketIssuer": "공간빅데이터분석 3",
            "stateDesc": "결제완료",
            "payDttm": "2025-12-08 22:20:27",
            "purchaseCnt": 3,
            "saleCnt": 0,
            "inventoryCnt": 3,
            "fromTokenId": "1",
            "toTokenId": "3",
            "fileNameFirst": "white_shoes.png",
            "fileUrlFirst": "https://dataspace.authrium.com/api/file/20251208/1765194739790.png",
            "thumbnailFirst": "https://dataspace.authrium.com/api/thumbnail/20251208/1765194739790.png",
            "fileNameSecond": "",
            "fileUrlSecond": "https://dataspace.authrium.com/api/",
            "thumbnailSecond": "https://dataspace.authrium.com/api/",
            "fileNameThird": "",
            "fileUrlThird": "https://dataspace.authrium.com/api/",
            "thumbnailThird": "https://dataspace.authrium.com/api/",
            "nftContractAddress": "0x761Ed130443265a1C0124180C0411fd1745272b1",
            "nftContractAddressUrl": "http://www-dev.avataroad.com:6100/address/0x761Ed130443265a1C0124180C0411fd1745272b1",
            "nftTxId": "0xc1234567890_txid_1",
            "nftTxIdUrl": "http://www-dev.avataroad.com:6100/tx/0xc1234567890_txid_1",
            "tokenInfo": [
              {
                "tokenId": "1",
                "ownerAccount": "dataBuyer_walletaddress",
                "ownerAccountUrl": "http://www-dev.avataroad.com:6100/accounts/dataBuyer_walletaddress"
              },
              {
                "tokenId": "2",
                "ownerAccount": "dataBuyer_walletaddress",
                "ownerAccountUrl": "http://www-dev.avataroad.com:6100/accounts/dataBuyer_walletaddress"
              },
              {
                "tokenId": "3",
                "ownerAccount": "dataBuyer_walletaddress",
                "ownerAccountUrl": "http://www-dev.avataroad.com:6100/accounts/dataBuyer_walletaddress"
              }
            ]
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
