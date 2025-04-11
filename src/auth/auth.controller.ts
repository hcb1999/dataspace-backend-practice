import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, ValidationPipe } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/response';
import { AuthService } from './auth.service';
import { GetUserDto } from '../dtos/get_user.dto';
import { CreateUserDto } from '../dtos/create_user.dto';
import fileLogger from '../common/logger';

@Controller('auth')
@ApiTags('인증 API') 
export class AuthController {
  private logger = new Logger('AuthController');

  constructor(
    private responseMessage: ResponseMessage,
    private authService: AuthService
  ) { }

  /**
   * 사용자 등록 조회 및 등록된 사용자에게 accessToken 재발행
   * 
   * @param getUserDto 
   * @returns accessToken
   */
  @Post('/')
  @ApiOperation({ summary: '사용자 등록 조회 및 등록된 사용자에게 accessToken 재발행', 
    description: '사용자를 등록을 조회하고 등록된 사용자에게는 access-Token을 재발행한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  // @ApiCreatedResponse({ description: '로그인 성공', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCESS",
        "data": {
          "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjEsImlhdCI6MTcyNDY0NDUzMiwiZXhwIjoxNzI0NjQ4MTMyfQ.-BFmJS6gVQJtAfeiBIeDnm8b8KjmdqqdbuzoJpHIvU4"
        }
      }
    }
  })
  async getAccessToken(@Body(ValidationPipe) getUserDto: GetUserDto): Promise<any> {
    fileLogger.info('auth');
    fileLogger.info(getUserDto);
    const accessToken: any = await this.authService.getAccessToken(getUserDto);
    return this.responseMessage.response(accessToken);
  }

  /**
  * 사용자 등록 및 JWT Token 발행
  * 
  * @param userDto 
  * @returns accessToken
  */
  @Post('/register')
  @ApiOperation({ summary: '사용자 등록 및 JWT Token 발행', 
    description: '사용자 정보를 등록하고 JWT Token을 발행한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '중복 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  // @ApiCreatedResponse({ description: '사용자 등록 성공.', schema: { example: { resultCode: 200, resultMessage: 'SUCCESS' } } })
  @ApiOkResponse({
    description: '성공',
    schema: {
      example: {
        "resultCode": 200,
        "resultMessage": "SUCESS",
        "data": {
          "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTm8iOjEsImlhdCI6MTcyNDY0NDQ2NSwiZXhwIjoxNzI0NjQ4MDY1fQ.L-3fo1X9BTObnuH9jF6zXGv5qUR2LfTst4A53xIPy24"
        }
      }
    }
  })
  async register(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<any> {
    fileLogger.info('auth-register');
    fileLogger.info(createUserDto);
    const accessToken: any = await this.authService.register(createUserDto);
    return this.responseMessage.response(accessToken);
  }

}
