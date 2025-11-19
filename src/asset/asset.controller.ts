import { Controller, Get, Post, Body, Put, Patch, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe, UploadedFiles } from '@nestjs/common';
import { AssetService } from './asset.service';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiCreatedResponse, ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { GetAssetListDto } from '../dtos/get_asset_list.dto';
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
   * 에셋 NFT MINT & VC 발급
   * 
   * @param user 
   * @param files 
   * @param createAssetDto 
   * @returns 
   */
  @Post("/nft/:assetNo")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 NFT MINT & 등록증명 VC 발급', description: '에셋 NFT MINT & 등록증명 VC를 발급한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 제품 없음' })
  async createNftVc(@GetUser() user: User, @Param('assetNo') assetNo: number): Promise<any> {
    console.log("++++++++++++++++++++++");
    fileLogger.info('asset-createNft');
    fileLogger.info(user);
    fileLogger.info(`assetNo: ${assetNo}`);
    await this.assetService.createNftVc(user, assetNo);
    return this.responseMessage.response(null);
  }

  /**
   * 에셋등록증명 VC 발급 & 등록
   * 
   * @param user 
   * @param files 
   * @param createAssetDto 
   * @returns 
   */
  @ApiExcludeEndpoint()
  @Post("/vc/:assetNo")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋등록증명 VC 발급', description: '에셋등록증명 VC를 발급한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.GATEWAY_TIMEOUT, description: 'DID 서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 제품 없음' })
  async createVc(@GetUser() user: User, @Param('assetNo') assetNo: number): Promise<any> {
    console.log("++++++++++++++++++++++");
    fileLogger.info('asset-createVc');
    fileLogger.info(user);
    fileLogger.info(`assetNo: ${assetNo}`);
    await this.assetService.createVc(user, assetNo);
    return this.responseMessage.response(null);
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
   * 에셋 판매 상태 변경
   * 
   * @param user 
   * @param assetNo 
   * @returns 
   */
  @Patch('/:assetNo/state/:state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 판매 상태 변경', description: '에셋 판매 상태를 변경한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  @ApiParam({
  name: 'state',
  description: '에셋 판매 상태 (1: 판매전, 2: 판매중, 3: 판매중지, 4: 판매종료, 5: 판매완료)',
  })
  async modifyState(
    @GetUser() user: User, 
    @Param('assetNo') assetNo: number,
    @Param('state') state: number
  ): Promise<void> {
    fileLogger.info('asset-update state');
    fileLogger.info(user);
    fileLogger.info(`assetNo: ${assetNo}`);
    fileLogger.info(`state: ${state}`);
    await this.assetService.updateState(user, assetNo, state);
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
    // @Put('/stop/:assetNo')
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    // @ApiOperation({ summary: '에셋 판매중지하기', description: '에셋 판매중지를 한다.' })
    // @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
    // @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
    // async modifyStateS3(@GetUser() user: User, @Param('assetNo') assetNo: number): Promise<void> {
    //   fileLogger.info('asset-update state');
    //   fileLogger.info(user);
    //   fileLogger.info(`assetNo: ${assetNo}`);
    //   await this.assetService.updateStop(user, assetNo);
    //   return this.responseMessage.response(null);
    // }

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
        "resultMessage": "SUCCESS",
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
              "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
              "adTarget": 3,
              "metaverseName": "K-POP 월드",
              "adType": 2,
              "typeDef": "K-티셔츠",
              "stateDsec": "판매완료",
              "tokenId": "16",
              "fileNameFirst": "test1.jpg",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241030/1730247629590.jpg",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/thumbnail/20241030/1730247629590.jpg",
              "fileNameSecond": "671f001eb1daf0aac58c4924.glb",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241030/1730247629591.glb",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/",
              "assetVcId": "asset_vc_id-1",
              "fileNameThird": "",
              "fileUrlThird": "https://kapi-dev.avataroad.com/",
              "thumbnailThird": "https://kapi-dev.avataroad.com/"
            },
            {
              "price": 0.3,
              "assetNo": 80,
              "assetRegName": "크리에이터 1",
              "assetName": "테스트 굿즈1용 에셋1",
              "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
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
              "thumbnailThird": "https://kapi-dev.avataroad.com/",
              "assetVcId": "asset_vc_id-2",
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
   * 에셋 목록 조회(에셋 번호 리스트)
   * 
   * @param user 
   * @param getAssetDto 
   * @returns 
   */
  @Post('/list')
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
        "resultMessage": "SUCCESS",
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
              "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
              "adTarget": 3,
              "metaverseName": "K-POP 월드",
              "adType": 2,
              "typeDef": "K-티셔츠",
              "stateDsec": "판매완료",
              "tokenId": "16",
              "fileNameFirst": "test1.jpg",
              "fileUrlFirst": "https://kapi-dev.avataroad.com/file/20241030/1730247629590.jpg",
              "thumbnailFirst": "https://kapi-dev.avataroad.com/thumbnail/20241030/1730247629590.jpg",
              "fileNameSecond": "671f001eb1daf0aac58c4924.glb",
              "fileUrlSecond": "https://kapi-dev.avataroad.com/file/20241030/1730247629591.glb",
              "thumbnailSecond": "https://kapi-dev.avataroad.com/",
              "assetVcId": "asset_vc_id-1",
              "fileNameThird": "",
              "fileUrlThird": "https://kapi-dev.avataroad.com/",
              "thumbnailThird": "https://kapi-dev.avataroad.com/"
            },
            {
              "price": 0.3,
              "assetNo": 80,
              "assetRegName": "크리에이터 1",
              "assetName": "테스트 굿즈1용 에셋1",
              "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
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
              "thumbnailThird": "https://kapi-dev.avataroad.com/",
              "assetVcId": "asset_vc_id-2",
            }
          ]
        }
      }
    }
  })
  async getAssetListbyNoList(@Body() getAssetDto: GetAssetListDto): Promise<any> {
    fileLogger.info('asset-list');
    fileLogger.info(`assetIds: ${getAssetDto.assetIds}`);
    const assetList = await this.assetService.getAssetListNoList(getAssetDto.assetIds);
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
          "resultMessage": "SUCCESS",
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
                "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
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
                "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
                "assetVcId": "asset_vc_id-1"
              },
              {
                "price": 6000,
                "state": "S2",
                "assetNo": 4,
                "assetRegName": "크리에이터 1",
                "assetName": "블링원 테스트 굿즈4",
                "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
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
                "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
                "assetVcId": "asset_vc_id-2"
              },
              {
                "price": 5000,
                "state": "S1",
                "assetNo": 3,
                "assetRegName": "크리에이터 1",
                "assetName": "블링원 테스트 굿즈4",
                "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
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
                "thumbnailThird": "https://kapi-dev.avataroad.com/thumbnail/20241029/1730181159415.png",
                "assetVcId": "asset_vc_id-3"
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
        "resultMessage": "SUCCESS",
        "data": {
          "price": 0.3,
          "state": "S5",
          "assetNo": 80,
          "assetRegAccount": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
          "assetRegAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x90f79bf6eb2c4f870365e785982e1f101e93b906",
          "assetRegName": "크리에이터 1",
          "assetName": "테스트 굿즈1용 에셋1",
          "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
          "adTarget": 3,
          "metaverseName": "K-POP 월드",
          "adType": 1,
          "typeDef": "K-셔츠",
          "productNo": 56,
          "productRegAccount": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
          "productRegAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
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
          "assetVcId": "asset_vc_id-1",
          "nftContractAddress": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
          "nftContractAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/contracts/0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
          "nftTxId": "0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
          "nftTxIdUrl": "http://besu-dev-explorer.avataroad.com:8081/transactions/0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
          "nftTokenId": "1",
          "nftSellerAccount": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
          "nftSellerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
          "nftBuyerAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          "nftBuyerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
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
          "resultMessage": "SUCCESS",
          "data": {
            "price": 0.3,
            "assetNo": 80,
            "assetRegAccount": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
            "assetRegAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x90f79bf6eb2c4f870365e785982e1f101e93b906",
            "assetRegName": "크리에이터 1",
            "assetName": "테스트 굿즈1용 에셋1",
            "assetUrl": "https://models.readyplayer.me/67297568c3dc4167f549fb73.glb",
            "adTarget": 3,
            "metaverseName": "K-POP 월드",
            "adType": 1,
            "typeDef": "K-셔츠",
            "productNo": 56,
            "productRegAccount": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
            "productRegAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
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
            "assetVcId": "asset_vc_id-2",
            "nftContractAddress": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
            "nftContractAddressUrl": "http://besu-dev-explorer.avataroad.com:8081/contracts/0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
            "nftTxId": "0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
            "nftTxIdUrl": "http://besu-dev-explorer.avataroad.com:8081/transactions/0x4819c16029da30f44e31151dc0462c41bb8eda2a6d1e333107fd400aee56c9c7",
            "nftSellerAccount": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
            "nftSellerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
            "nftBuyerAccount": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "nftBuyerAccountUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
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

  /**
   * 에셋 크리덴셜 상세정보 조회
   * 
   * @param getDidAcdDto 
   * @returns 
   */
    @Get('/acd/:assetNo')
    @ApiOperation({ summary: '에셋 크리덴셜 상세정보 조회', description: '에셋 크리덴셜 상세정보를 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async getAcd(@Param('assetNo') assetNo: number): Promise<any> {
      const result = await this.assetService.getAcd(assetNo);
      return this.responseMessage.response(result);
    }

}