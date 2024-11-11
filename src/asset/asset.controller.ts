import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe, UploadedFiles } from '@nestjs/common';
import { AssetService } from './asset.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/multer.options';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { SharpPipe } from '../common/sharp.pipe';
import { CreateAssetDto } from '../dtos/create_asset.dto';
import { ModifyAssetDto } from '../dtos/modify_asset.dto';
import { GetAssetDto } from '../dtos/get_asset.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('asset')
@ApiTags('에셋 API')
export class AssetController {
  private logger = new Logger('AssetController');

  constructor(
    private responseMessage: ResponseMessage,
    private assetService: AssetService
  ) { }

  /**
   * 에셋 정보 등록
   * 
   * @param user 
   * @param files 
   * @param createAssetDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 3 }], multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 정보 등록', description: '에셋 정보를 등록한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '파일 미입력' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '동일한 파일 존재' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        resultCode: 200,
        resultMessage: 'SUCCESS',
        data: {
          "assetNo": 1
        }
      }
    }
  })
  async create(@GetUser() user: User, @UploadedFiles(SharpPipe) files: Express.Multer.File[], @Body(ValidationPipe) createAssetDto: CreateAssetDto): Promise<any> {
    console.log("++++++++++++++++++++++");
    fileLogger.info('asset-create');
    fileLogger.info(user);
    fileLogger.info(createAssetDto);
    const asset: any = await this.assetService.create(user, files, createAssetDto);
    return this.responseMessage.response(asset);
  }

  /** 
   * 에셋 정보 수정(판매 전 & NFT 발행 전만 가능)  
   * 
   * @param user 
   * @param assetNo 
   * @param files 
   * @param modifyAssetS1Dto 
   * @returns 
   */
  @Put('/:assetNo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 3 }], multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 정보 수정', description: '에셋 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 제품 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '동일한 파일 존재' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modify(@GetUser() user: User, @Param('assetNo') assetNo: number,
    @UploadedFiles(SharpPipe) files: Express.Multer.File[],
    @Body(ValidationPipe) modifyAssetDto: ModifyAssetDto): Promise<void> {
      fileLogger.info('asset-update');
      fileLogger.info(user);
      fileLogger.info(`assetNo: ${assetNo}`);
      fileLogger.info(modifyAssetDto);
    await this.assetService.update(user, assetNo, files, modifyAssetDto);
    return this.responseMessage.response(null);
  }

    /**
   * 에셋 판매중지하기
   * 
   * @param user 
   * @param assetNo 
   * @param modifyAssetS3Dto 
   * @returns 
   */
    @Put('/stop/:assetNo')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '에셋 판매중지하기', description: '에셋 판매중지를 한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
    @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
    async modifyStateS3(@GetUser() user: User, @Param('assetNo') assetNo: number): Promise<void> {
      fileLogger.info('asset-update state');
      fileLogger.info(user);
      fileLogger.info(`assetNo: ${assetNo}`);
      await this.assetService.updateStop(user, assetNo);
      return this.responseMessage.response(null);
    }

  /**
   * 에셋 정보 삭제
   * 
   * @param user 
   * @param assetNo 
   * @returns 
   */
  @Delete('/:assetNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 정보 삭제', description: '에셋 정보를 삭제한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  async remove(@GetUser() user: User, @Param('assetNo') assetNo: number): Promise<any> {
    fileLogger.info('asset-delete');
    fileLogger.info(user);
    fileLogger.info(`assetNo: ${assetNo}`);
    await this.assetService.delete(user, assetNo);
    return this.responseMessage.response(null);
  }

  /**
   * 에셋 상태 정보 수정
   * 
   * @param user 
   * @param assetNo 
   * @param state 
   * @returns 
   */
  /*
  @Put('/state/:assetNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 상태 정보 수정', description: '에셋 상태 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modifyState(@GetUser() user: User, @Param('assetNo') assetNo: number, @Param('state') state: string): Promise<void> {
    fileLogger.info('asset-update state');
    fileLogger.info(user);
    fileLogger.info(`assetNo: ${assetNo}`);
    fileLogger.info(`state: ${state}`);
    await this.assetService.updateState(user, assetNo, state);
    return this.responseMessage.response(null);
  }
*/
  
  /**
   * 에셋 목록 조회
   * 
   * @param user 
   * @param getAssetDto 
   * @returns 
   */
  @Get('/')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 목록 조회', description: '에셋 목록을 조회한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCESS",
        "data": {
          "pageSize": 10,
          "totalCount": 2,
          "totalPage": 1,
          "list": [
            {
              "price": 0.2,
              "assetNo": 81,
              "assetRegName": "엔터사 2",
              "assetName": "bling t-shirt",
              "adTarget": 3,
              "metaverseName": "K-POP 월드",
              "adType": 2,
              "typeDef": "K-티셔츠",
              "stateDsec": "판매완료",
              "tokenId": "16",
              "fileNameFirst": "ë¸ë§ì êµ¿ì¦ í°ìì¸ .jpg",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241030/1730247629590.jpg",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/thumbnail/20241030/1730247629590.jpg",
              "fileNameSecond": "671f001eb1daf0aac58c4924.glb",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241030/1730247629591.glb",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/",
              "fileNameThird": "",
              "fileUrlThird": "https://kapi-dev.avataroad.com/",
              "thumbnailThird": "https://kapi-dev.avataroad.com/"
            },
            {
              "price": 0.3,
              "assetNo": 80,
              "assetRegName": "크리에이터 1",
              "assetName": "테스트 굿즈1용 에셋1",
              "adTarget": 3,
              "metaverseName": "K-POP 월드",
              "adType": 1,
              "typeDef": "K-셔츠",
              "stateDsec": "판매완료",
              "tokenId": "1",
              "fileNameFirst": "test1.glb",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241029/1730181477342.glb",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/",
              "fileNameSecond": "test1.png",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241029/1730181477345.png",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181477345.png",
              "fileNameThird": "test1-1.glb",
              "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181477346.glb",
              "thumbnailThird": "https://kapi-dev.avataroad.com/"
            }
          ]
        }
      }
    }
  })
  async getAssetList(@Query() getAssetDto: GetAssetDto): Promise<any> {
    const assetList = await this.assetService.getAssetList(getAssetDto);
    return this.responseMessage.response(assetList);
  }

    /**
   * 에셋 목록 조회 (마이페이지)
   * 
   * @param user 
   * @param getAssetDto 
   * @returns 
   */
    @Get('/mypage')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '에셋 목록 조회', description: '에셋 목록을 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    @ApiOkResponse({
      description: '성공',
      schema: {
        example: {
          "resultCode": 200,
          "resultMessage": "SUCESS",
          "data": {
            "pageSize": 10,
            "totalCount": 3,
            "totalPage": 1,
            "list": [
              {
                "price": 7000,
                "state": "S2",
                "assetNo": 5,
                "assetRegName": "크리에이터 1",
                "assetName": "블링원 테스트 굿즈4",
                "adTarget": 3,
                "metaverseName": "K-POP 월드",
                "adType": 1,
                "typeDef": "K-셔츠",
                "productRegName": "엔터사 1",
                "productName": "블링원 테스트 굿즈4",
                "stateDsec": "판매중",
                "fileNameFirst": "blingone_4.png",
                "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299062.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299062.png",
                "fileNameSecond": "blingone_3.png",
                "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299074.png",
                "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299074.png",
                "fileNameThird": "test1.png",
                "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
                "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png"
              },
              {
                "price": 6000,
                "state": "S2",
                "assetNo": 4,
                "assetRegName": "크리에이터 1",
                "assetName": "블링원 테스트 굿즈4",
                "adTarget": 3,
                "metaverseName": "K-POP 월드",
                "adType": 6,
                "typeDef": "K-가슴",
                "productRegName": "엔터사 1",
                "productName": "블링원 테스트 굿즈4",
                "stateDsec": "판매중",
                "fileNameFirst": "blingone_4.png",
                "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
                "fileNameSecond": "blingone_3.png",
                "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
                "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png",
                "fileNameThird": "test1.png",
                "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
                "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png"
              },
              {
                "price": 5000,
                "state": "S1",
                "assetNo": 3,
                "assetRegName": "크리에이터 1",
                "assetName": "블링원 테스트 굿즈4",
                "adTarget": 3,
                "metaverseName": "K-POP 월드",
                "adType": 5,
                "typeDef": "K-어꺠",
                "productRegName": "엔터사 1",
                "productName": "블링원 테스트 굿즈4",
                "stateDsec": "판매전",
                "fileNameFirst": "blingone_4.png",
                "fileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205892.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205892.png",
                "fileNameSecond": "blingone_3.png",
                "fileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205917.png",
                "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205917.png",
                "fileNameThird": "test1.png",
                "fileUrlThird": "https://kapi-dev.avataroad.com/file/20241029/1730181159415.png",
                "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png"
              }
            ]
          }
        }
      }
    })
    async getAssetMyList(@GetUser() user: User, @Query() getAssetDto: GetAssetDto): Promise<any> {
      const assetList = await this.assetService.getAssetMyList(user, getAssetDto);
      return this.responseMessage.response(assetList);
    }

      /**
   * 에셋 상세 정보 조회 (마이페이지)
   * 
   * @param user 
   * @param assetNo 
   * @returns 
   */
  @Get('/mypage/:assetNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 정보 조회', description: '에셋 정보를 조회한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCESS",
        "data": {
          "price": 0.3,
          "state": "S5",
          "assetNo": 80,
          "assetRegAddr": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
          "assetRegName": "크리에이터 1",
          "assetName": "테스트 굿즈1용 에셋1",
          "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
          "adTarget": 3,
          "metaverseName": "K-POP 월드",
          "adType": 1,
          "typeDef": "K-셔츠",
          "productNo": 56,
          "productRegAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          "productRegName": "엔터사 1",
          "productName": "테스트 굿즈1",
          "stateDesc": "판매완료",
          "assetDesc": "테스트 굿즈1용 에셋1",
          "startDttm": "2024-10-29 09:00:00",
          "endDttm": "2024-12-31 09:00:00",
          "regDttm": "2024-10-29 14:57:57",
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
  })
  async getMyInfo(@GetUser() user: User, @Param('assetNo') assetNo: number): Promise<any> {
    const asset = await this.assetService.getMyInfo(user, assetNo);

    return this.responseMessage.response({
      ...asset,
      startDttm: moment(asset.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      endDttm: moment(asset.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      regDttm: moment(asset.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
    });  
    
  }

    /**
   * 에셋 상세 정보 조회
   * 
   * @param assetNo 
   * @returns 
   */
    @Get('/:assetNo')
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '에셋 정보 조회', description: '에셋 정보를 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiOkResponse({
      description: '성공',
      schema: {
        example: {
          "resultCode": 200,
          "resultMessage": "SUCESS",
          "data": {
            "price": 0.3,
            "assetNo": 80,
            "assetRegAddr": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
            "assetRegName": "크리에이터 1",
            "assetName": "테스트 굿즈1용 에셋1",
            "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
            "adTarget": 3,
            "metaverseName": "K-POP 월드",
            "adType": 1,
            "typeDef": "K-셔츠",
            "productNo": 56,
            "productRegAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "productRegName": "엔터사 1",
            "productName": "테스트 굿즈1",
            "assetDesc": "테스트 굿즈1용 에셋1",
            "startDttm": "2024-10-29 09:00:00",
            "endDttm": "2024-12-31 09:00:00",
            "regDttm": "2024-10-29 14:57:57",
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
            "nftSellerAddr": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
            "nftSellerAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
            "nftBuyerAddr": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "nftBuyerAddrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          }
        }
      }
    })
    async getInfo(@Param('assetNo') assetNo: number): Promise<any> {
      const asset = await this.assetService.getInfo(assetNo);

      return this.responseMessage.response({
        ...asset,
        startDttm: moment(asset.startDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        endDttm: moment(asset.endDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        regDttm: moment(asset.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
      });  

    }
}