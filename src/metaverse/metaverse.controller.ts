import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe } from '@nestjs/common';
import { MetaverseService } from './metaverse.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { MetaverseDto } from '../dtos/metaverse.dto';
import { GetMetaverseDto } from '../dtos/get_metaverse.dto';
import fileLogger from '../common/logger';

@Controller('metaverse')
@ApiTags('메타버스 API')
export class MetaverseController {
  private logger = new Logger('MetaverseController');

  constructor(
    private responseMessage: ResponseMessage,
    private metaverseService: MetaverseService
  ) { }

  /**
   * 메타버스 정보 등록
   * 
   * @param user 
   * @param metaverseDto 
   * @returns 
   */
  @Post("/")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '메타버스 정보 등록', description: '메타버스 정보를 등록한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '중복 에러' })
  @ApiCreatedResponse({ description: '성공', schema: { example: { resultCode: HttpStatus.CREATED, resultMessage: 'SUCCESS' } } })
  async create(@GetUser() user: User, @Body(ValidationPipe) metaverseDto: MetaverseDto): Promise<void> {
    fileLogger.info('metaverse-create');
    fileLogger.info(user);
    fileLogger.info(metaverseDto);
    await this.metaverseService.create(user, metaverseDto);
    return this.responseMessage.response(null);
  }

  /**
   * 메타버스 정보 수정
   * 
   * @param user 
   * @param metaverseNo  
   * @param metaverseDto 
   * @returns 
   */
  @Put('/:metaverseNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '메타버스 정보 수정', description: '메타버스 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음 또는 등록된 메타버스 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '중복 에러' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async modify(@GetUser() user: User, @Param('metaverseNo') metaverseNo: number,
    @Body(ValidationPipe) metaverseDto: MetaverseDto): Promise<void> {
      fileLogger.info('metaverse-update');
      fileLogger.info(user);
      fileLogger.info(`metaverseNo: ${metaverseNo}`);
      fileLogger.info(metaverseDto);
    await this.metaverseService.update(user, metaverseNo, metaverseDto);
    return this.responseMessage.response(null);
  }

  /**
   * 메타버스 정보 삭제
   * 
   * @param user 
   * @param metaverseNo 
   * @returns 
   */
  @Delete('/:metaverseNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '메타버스 정보 삭제', description: '메타버스 정보를 삭제한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async remove(@GetUser() user: User, @Param('metaverseNo') metaverseNo: number): Promise<void> {
    fileLogger.info('metaverse-delete');
    fileLogger.info(user);
    fileLogger.info(`metaverseNo: ${metaverseNo}`);
    await this.metaverseService.delete(user, metaverseNo);
    return this.responseMessage.response(null);
  }

  /**
   * 메타버스 목록 조회
   * 
   * @param user 
   * @param getMetaverseDto 
   * @returns 
   */
  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '메타버스 목록 조회', description: '메타버스 목록을 조회한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        resultCode: 200,
        resultMessage: 'SUCCESS',
        data: {
          "pageSize": 10,
          "totalCount": 3,
          "totalPage": 1,
          "list": [
            {
              "metaverseNo": 3,
              "metaverseName": "K-POP 월드"
            },
            {
              "metaverseNo": 2,
              "metaverseName": "제페토"
            },
            {
              "metaverseNo": 1,
              "metaverseName": "로블록스"
            }
          ]
        }
      }
    }
  })
  async getMetaverseList(@GetUser() user: User, @Query() getMetaverseDto: GetMetaverseDto): Promise<void> {
    const metaverseList = await this.metaverseService.getMetaverseList(user, getMetaverseDto);
    return this.responseMessage.response(metaverseList);
  }

}