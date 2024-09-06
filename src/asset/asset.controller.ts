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
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 2 }], multerOptions))
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
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 2 }], multerOptions))
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
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCESS",
        "data": {
          "tokenIdAry": [
            "20",
            "21",
            "22"
          ]
        }
      }
    }
  })
  async remove(@GetUser() user: User, @Param('assetNo') assetNo: number): Promise<any> {
    fileLogger.info('asset-delete');
    fileLogger.info(user);
    fileLogger.info(`assetNo: ${assetNo}`);
    const burn = await this.assetService.delete(user, assetNo);
    return this.responseMessage.response(burn);
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
          "totalCount": 3,
          "totalPage": 1,
          "list": [
            {
              "price": 7000,
              "assetNo": 5,
              "assetRegName": "크리에이터 1",
              "assetName": "블링원 테스트 굿즈4",
              "adTarget": 3,
              "metaverseName": "K-POP 월드",
              "adType": 7,
              "typeDef": "K-등",
              "productRegName": "테스트유저0",
              "productName": "블링원 테스트 굿즈4",
              "FileNameFirst": "blingone_4.png",
              "FileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299062.png",
              "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299062.png",
              "FileNameSecond": "blingone_3.png",
              "FileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299074.png",
              "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299074.png"
            },
            {
              "price": 6000,
              "assetNo": 4,
              "assetRegName": "크리에이터 1",
              "assetName": "블링원 테스트 굿즈4",
              "adTarget": 3,
              "metaverseName": "K-POP 월드",
              "adType": 6,
              "typeDef": "K-가슴",
              "productRegName": "테스트유저0",
              "productName": "블링원 테스트 굿즈4",
              "FileNameFirst": "blingone_4.png",
              "FileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
              "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
              "FileNameSecond": "blingone_3.png",
              "FileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
              "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
            },
            {
              "price": 5000,
              "assetNo": 3,
              "assetRegName": "크리에이터 1",
              "assetName": "블링원 테스트 굿즈4",
              "adTarget": 3,
              "metaverseName": "K-POP 월드",
              "adType": 5,
              "typeDef": "K-어깨",
              "productRegName": "테스트유저0",
              "productName": "블링원 테스트 굿즈4",
              "FileNameFirst": "blingone_4.png",
              "FileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205892.png",
              "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205892.png",
              "FileNameSecond": "blingone_3.png",
              "FileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205917.png",
              "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205917.png"
            }          ]
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
                "adType": 7,
                "typeDef": "K-등",
                "productRegName": "테스트유저0",
                "productName": "블링원 테스트 굿즈4",
                "FileNameFirst": "blingone_4.png",
                "FileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299062.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299062.png",
                "FileNameSecond": "blingone_3.png",
                "FileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261299074.png",
                "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261299074.png"
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
                "productRegName": "테스트유저0",
                "productName": "블링원 테스트 굿즈4",
                "FileNameFirst": "blingone_4.png",
                "FileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285849.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285849.png",
                "FileNameSecond": "blingone_3.png",
                "FileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261285862.png",
                "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261285862.png"
              },
              {
                "price": 5000,
                "state": "S2",
                "assetNo": 3,
                "assetRegName": "크리에이터 1",
                "assetName": "블링원 테스트 굿즈4",
                "adTarget": 3,
                "metaverseName": "K-POP 월드",
                "adType": 5,
                "typeDef": "K-어깨",
                "productRegName": "테스트유저0",
                "productName": "블링원 테스트 굿즈4",
                "FileNameFirst": "blingone_4.png",
                "FileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205892.png",
                "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205892.png",
                "FileNameSecond": "blingone_3.png",
                "FileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205917.png",
                "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205917.png"
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
          "price": 5000,
          "state": "S2",
          "assetNo": 3,
          "assetRegAddr": "0x12345678901",
          "assetRegName": "크리에이터 1",
          "assetName": "블링원 테스트 굿즈4",
          "adTarget": 3,
          "metaverseName": "K-POP 월드",
          "adType": 5,
          "typeDef": "K-어깨",
          "productRegAddr": "0x12345678900",
          "productRegName": "테스트유저0",
          "productName": "블링원 테스트 굿즈4",
          "stateDesc": "판매중",
          "assetDesc": "굿즈 26번에 대한 에셋입니다.",
          "startDttm": "2024-08-02 09:00:00",
          "endDttm": "2024-11-02 09:00:00",
          "regDttm": "2024-09-02 16:13:25",
          "assetFileNameFirst": "blingone_4.png",
          "assetFileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205892.png",
          "assetthumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205892.png",
          "FileNameSecond": "blingone_3.png",
          "assetFileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205917.png",
          "assetThumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205917.png",
          "productNameFirst": "blingone_4.png",
          "productFileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240830/1725025423591.png",
          "productThumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240830/1725025423591.png"
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
            "price": 5000,
            "assetNo": 3,
            "assetRegAddr": "0x12345678901",
            "assetRegName": "크리에이터 1",
            "assetName": "블링원 테스트 굿즈4",
            "adTarget": 3,
            "metaverseName": "K-POP 월드",
            "adType": 5,
            "typeDef": "K-어깨",
            "productRegAddr": "0x12345678900",
            "productRegName": "테스트유저0",
            "productName": "블링원 테스트 굿즈4",
            "assetDesc": "굿즈 26번에 대한 에셋입니다.",
            "startDttm": "2024-08-02 09:00:00",
            "endDttm": "2024-11-02 09:00:00",
            "regDttm": "2024-09-02 16:13:25",
            "FileNameFirst": "blingone_4.png",
            "FileUrlFirst": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205892.png",
            "thumbnailFirst": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205892.png",
            "FileNameSecond": "blingone_3.png",
            "FileUrlSecond": "http://kapi-dev.avataroad.com:5000/file/20240902/1725261205917.png",
            "thumbnailSecond": "http://kapi-dev.avataroad.com:5000/thumbnail/20240902/1725261205917.png"
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