import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe } from '@nestjs/common';
import { AssetTypeService } from './asset_type.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { CreateAssetTypeDto } from '../dtos/create_asset_type.dto';
import { ModifyAssetTypeDto } from '../dtos/modify_asset_type.dto';
import { GetAssetTypeDto } from '../dtos/get_asset_type.dto';
import fileLogger from '../common/logger';

@Controller('assetType')
@ApiTags('에셋타입 API')
export class AssetTypeController {
  private logger = new Logger('AssetTypeController');
  
  constructor(
    private responseMessage: ResponseMessage,
    private assetTypeService: AssetTypeService
  ) { }

  /**
   * 에셋 타입 등록
   * 
   * @param user 
   * @param createAssetTypeDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 타입 등록', description: '에셋 타입을 등록한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiCreatedResponse({ description: '성공', schema: { example: { resultCode: HttpStatus.CREATED, resultMessage: 'SUCCESS' } } })
  async create(@GetUser() user: User, @Body(ValidationPipe) createAssetTypeDto: CreateAssetTypeDto): Promise<void> {
    fileLogger.info('assetType-create');
    fileLogger.info(user);
    fileLogger.info(createAssetTypeDto);
    await this.assetTypeService.create(user, createAssetTypeDto);
    return this.responseMessage.response(null);
  }

  /**
   * 에셋 타입 정보 수정
   * 
   * @param user 
   * @param typeNo 
   * @param modifyAssetTypeDto 
   * @returns 
   */
  @Put('/:typeNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 타입 정보 수정', description: '에셋 타입 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 에셋 타입 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modify(@GetUser() user: User, @Param('typeNo') typeNo: number,
    @Body(ValidationPipe) modifyAssetTypeDto: ModifyAssetTypeDto): Promise<void> {
      fileLogger.info('assetType-update');
      fileLogger.info(user);
      fileLogger.info(`aeesttypeNo: ${typeNo}`);
      fileLogger.info(modifyAssetTypeDto);
    await this.assetTypeService.update(user, typeNo, modifyAssetTypeDto);
    return this.responseMessage.response(null);
  }

  /**
   * 에셋 타입 정보 삭제
   * 
   * @param user 
   * @param typeNo 
   * @returns 
   */
  @Delete('/:typeNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 타입 정보 삭제', description: '에셋 타입 정보를 삭제한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async remove(@GetUser() user: User, @Param('typeNo') typeNo: number): Promise<void> {
    fileLogger.info('assetType-delete');
    fileLogger.info(user);
    fileLogger.info(`aeesttypeNo: ${typeNo}`);
    await this.assetTypeService.delete(user, typeNo);
    return this.responseMessage.response(null);
  }

  /**
   * 에셋 타입 목록 조회
   * 
   * @param user 
   * @param GetAssetTypeDto 
   * @returns 
   */
  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '에셋 타입 목록 조회', description: '에셋 타입 목록을 조회한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '중복 에러' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        resultCode: 200,
        resultMessage: 'SUCCESS',
        data: {
          "pageSize": 10,
          "totalCount": 9,
          "totalPage": 1,
          "list": [
            {
              "typeNo": 9,
              "metaverseNo": 1,
              "typeDef": "장비",
              "assetTypeDesc": null
            },
            {
              "typeNo": 8,
              "metaverseNo": 1,
              "typeDef": "허리",
              "assetTypeDesc": null
            },
            {
              "typeNo": 7,
              "metaverseNo": 1,
              "typeDef": "등",
              "assetTypeDesc": null
            },
            {
              "typeNo": 6,
              "metaverseNo": 1,
              "typeDef": "가슴",
              "assetTypeDesc": null
            },
            {
              "typeNo": 5,
              "metaverseNo": 1,
              "typeDef": "어깨",
              "assetTypeDesc": null
            },
            {
              "typeNo": 4,
              "metaverseNo": 1,
              "typeDef": "머리",
              "assetTypeDesc": null
            },
            {
              "typeNo": 3,
              "metaverseNo": 1,
              "typeDef": "바지",
              "assetTypeDesc": null
            },
            {
              "typeNo": 2,
              "metaverseNo": 1,
              "typeDef": "티셔츠",
              "assetTypeDesc": null
            },
            {
              "typeNo": 1,
              "metaverseNo": 1,
              "typeDef": "셔츠",
              "assetTypeDesc": null
            }
          ]
        }
      }
    }
  })
  async getAssetList(@GetUser() user: User, @Query() getAssetTypeDto: GetAssetTypeDto): Promise<void> {
    const assetTypeList = await this.assetTypeService.getAssetTypeList(user, getAssetTypeDto);
    return this.responseMessage.response(assetTypeList);
  }

}