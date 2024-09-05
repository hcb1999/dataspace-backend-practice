import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, HttpStatus, Delete, ValidationPipe } from '@nestjs/common';
import { StateService } from './state.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { CreateStateDto } from '../dtos/create_state.dto';
import { ModifyStateDto } from '../dtos/modify_state.dto';
import { GetStateDto } from '../dtos/get_state.dto';
import fileLogger from '../common/logger';

@Controller('state')
@ApiTags('상태 API')
export class StateController {
  private logger = new Logger('StateController');
  
  constructor(
    private responseMessage: ResponseMessage,
    private stateService: StateService
  ) { }

  /**
   * 상태 정보 등록
   * 
   * @param user 
   * @param createStateDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '상태 정보 등록', description: '상태 정보를 등록한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiCreatedResponse({ description: '성공', schema: { example: { resultCode: HttpStatus.CREATED, resultMessage: 'SUCCESS' } } })
  async create(@GetUser() user: User, @Body(ValidationPipe) createStateDto: CreateStateDto): Promise<void> {
    fileLogger.info('state-create');
    fileLogger.info(user);
    fileLogger.info(createStateDto);
    await this.stateService.create(user, createStateDto);
    return this.responseMessage.response(null);
  }

  /**
   * 상태 정보 수정
   * 
   * @param user 
   * @param stateNo 
   * @param modifyStateDto 
   * @returns 
   */
  @Put('/:stateNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '상태 정보 수정', description: '상태 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 에셋 상태 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '중복 에러' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modify(@GetUser() user: User, @Param('stateNo') stateNo: number,
    @Body(ValidationPipe) modifyStateDto: ModifyStateDto): Promise<void> {
      fileLogger.info('state-update');
      fileLogger.info(user);
      fileLogger.info(`stateNo: ${stateNo}`);
      fileLogger.info(modifyStateDto);
    await this.stateService.update(user, stateNo, modifyStateDto);
    return this.responseMessage.response(null);
  }

  /**
   * 상태 정보 삭제
   * 
   * @param user 
   * @param stateNo 
   * @returns 
   */
  @Delete('/:stateNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '상태 정보 삭제', description: '상태 정보를 삭제한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 에셋 상태 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async remove(@GetUser() user: User, @Param('stateNo') stateNo: number): Promise<void> {
    fileLogger.info('assetstate-delete');
    fileLogger.info(user);
    fileLogger.info(`stateNo: ${stateNo}`);
    await this.stateService.delete(user, stateNo);
    return this.responseMessage.response(null);
  }

  /**
   * 상태 목록 조회
   * 
   * @param user 
   * @param getAssetStateDto 
   * @returns 
   */
  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '상태 목록 조회', description: '상태 목록을 조회한다.' })
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
          "totalCount": 8,
          "totalPage": 1,
          "list": [
            {
              "stateNo": 8,
              "category": "에셋-굿즈상품",
              "state": "S4",
              "ststeDesc": "판매종료"
            },
            {
              "stateNo": 7,
              "category": "에셋-굿즈상품",
              "state": "S3",
              "ststeDesc": "판매중지"
            },
            {
              "stateNo": 6,
              "category": "에셋-굿즈상품",
              "state": "S2",
              "ststeDesc": "판매중"
            },
            {
              "stateNo": 5,
              "category": "에셋-굿즈상품",
              "state": "S1",
              "ststeDesc": "판매전"
            },
            {
              "stateNo": 4,
              "category": "굿즈",
              "state": "N4",
              "ststeDesc": "게시종료"
            },
            {
              "stateNo": 3,
              "category": "굿즈",
              "state": "N3",
              "ststeDesc": "게시중지"
            },
            {
              "stateNo": 2,
              "category": "굿즈",
              "state": "N2",
              "ststeDesc": "게시중"
            },
            {
              "stateNo": 1,
              "category": "굿즈",
              "state": "N1",
              "ststeDesc": "게시전"
            }
          ]
        }
      }
    }
  })
  async getStateList(@GetUser() user: User, @Query() getStateDto: GetStateDto): Promise<void> {
    const stateList = await this.stateService.getStateList(user, getStateDto);
    return this.responseMessage.response(stateList);
  }

}