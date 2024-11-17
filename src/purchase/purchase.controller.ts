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
        "totalCount": 2,
        "totalPage": 1,
        "list": [
          {
            "price": 0.1,
            "purchaseNo": 50,
            "saleUserName": "엔터사 1",
            "marcketAssetName": "테스트 굿즈1용 에셋1",
            "assetName": "테스트 굿즈1용 에셋1",
            "assetDesc": "테스트 굿즈1용 에셋1",
            "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-셔츠",
            "stateDesc": "결재완료",
            "payDttm": "2024-10-29 16:59:48",
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
            "price": 0.1,
            "purchaseNo": 49,
            "saleUserName": "엔터사 1",
            "marcketAssetName": "테스트 굿즈1용 에셋1",
            "assetName": "테스트 굿즈1용 에셋1",
            "assetDesc": "테스트 굿즈1용 에셋1",
            "metaverseName": "K-POP 월드",
            "typeDef": "K-셔츠",
            "stateDesc": "결재완료",
            "payDttm": "2024-10-29 15:10:07",
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
              "price": 0.1,
              "purchaseNo": 50,
              "purchaseAssetNo": 132,
              "saleAddr": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
              "saleAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x90f79bf6eb2c4f870365e785982e1f101e93b906",
              "saleUserName": "크리에이터 2",
              "purchaseAddr": "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
              "purchaseAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
              "purchaseUserName": "사용자 2",
              "marcketAsetName": "테스트 굿즈1용 에셋1",
              "assetName": "테스트 굿즈1용 에셋1",
              "assetDesc": "테스트 굿즈1용 에셋1",
              "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
              "metaverseName": "K-POP 월드",
              "typeDef": "K-셔츠",
              "stateDesc": "결재완료",
              "payDttm": "2024-10-29 16:59:48",
              "fromTokenId": "7",
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
                  "tokenId": "7",
                  "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                },
                {
                  "tokenId": "8",
                  "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                },
                {
                  "tokenId": "9",
                  "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                },
                {
                  "tokenId": "10",
                  "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                },
                {
                  "tokenId": "11",
                  "ownerAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                  "ownerAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
                }
              ] 
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
