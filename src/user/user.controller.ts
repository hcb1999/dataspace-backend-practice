import { Body, Controller, Get, HttpStatus, Logger, Put, Delete, UseGuards, Post, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get_user.decorator';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseMessage } from 'src/common/response';
import { CreateUserDto } from '../dtos/create_user.dto';
import { ModifyUserDto } from '../dtos/modify_user.dto';
import { UserNickChkDto } from '../dtos/user_nickchk.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('user')
@ApiTags('사용자 API')
export class UserController {
  private logger = new Logger('UserController');

  constructor(
    private responseMessage: ResponseMessage,
    private userService: UserService
  ) { }

  /**
   * 닉네임 중복 확인
   * 
   * @param userNickChkDto 
   * @returns true/false
   */
  @Post('/nickchk')
  @ApiOperation({ summary: '닉네임 중복 확인', description: '사용자의 닉네임이 중복되었는지 확인한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  async nicknameChk(@Body(ValidationPipe) userNickChkDto: UserNickChkDto): Promise<any> {
    fileLogger.info('user-nickchk');
    fileLogger.info(userNickChkDto);
    const data: any = await this.userService.nicknameChk(userNickChkDto);
    return this.responseMessage.response(data);
  }

  /**
   * 사용자 정보 수정 
   * 
   * @param user 
   * @param modifyUserDto 
   * @returns 
   */
  @Put('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용자 정보 수정', description: '사용자 정보를 수정한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '사용자 정보 없음' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '중복 에러' })
  @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  async update(@GetUser() user: User, @Body(ValidationPipe) modifyUserDto: ModifyUserDto): Promise<void> {
    fileLogger.info('user-update');
    fileLogger.info(user);
    fileLogger.info(modifyUserDto);
    await this.userService.update(user, modifyUserDto);
    return this.responseMessage.response(null);
  }

  /**
   * 사용자 정보 조회
   * 
   * @param user 
   * @returns 
   */
  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용자 정보 조회', description: '사용자 정보를 조회한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '사용자 정보 없음' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        resultCode: 200,
        resultMessage: 'SUCCESS',
        "data": {
          "userNo": 1,
          "userName": null,
          "phone": null,
          "email": null,
          "password": null,
          "birth": null,
          "gender": null,
          "nickName": "테스트유저0",
          "billchainId": null,
          "kakaoId": null,
          "useGlbUrl": null,
          "purchaseNo": null,
          "useYn": "Y",
          "regDttm": "2024-09-04 21:04:04",
          "updDttm": "2024-09-04 21:04:04",
          "addr": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
          "addrUrl": "http://besu-dev-explorer.avataroad.com:8081/accounts/0x90f79bf6eb2c4f870365e785982e1f101e93b906"
        }
      }
    }
  })
  async getInfo(@GetUser() user: User): Promise<void> {
    const userInfo = await this.userService.getInfo(user);
    // return this.responseMessage.response(userInfo);
    return this.responseMessage.response({
      ...userInfo,
      regDttm: moment(userInfo.regDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      updDttm: moment(userInfo.updDttm).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
    });
  }

  /**
   * 사용자 정보 삭제
   * 
   * @param user 
   * @param metaverseNo 
   * @returns 
   */
    // @Delete('/')
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    // @ApiOperation({ summary: '사용자 정보 삭제', description: '사용자 정보를 삭제한다.' })
    // @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
    // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '권한없은 사용자' })
    // @ApiOkResponse({ description: '성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
    // async remove(@GetUser() user: User): Promise<void> {
    //   fileLogger.info('user-delete');
    //   fileLogger.info(user);
    //   await this.userService.delete(user);
    //   return this.responseMessage.response(null);
    // }
  
}