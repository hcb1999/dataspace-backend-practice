import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe, UploadedFiles } from '@nestjs/common';
import { DidService } from './did.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// import { GetUser } from '../auth/get_user.decorator';
// import { User } from '../entities/user.entity';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { CreateDidUserDto } from '../dtos/create_did_user.dto';
import { GetDidUserDto } from '../dtos/get_did_user.dto';
import { CreateDidVcDto } from '../dtos/create_did_vc.dto';
import { GetDidVcDto } from '../dtos/get_did_vc.dto';
import { GetUserNicknameDto } from '../dtos/get_user_nickname.dto';
import fileLogger from '../common/logger';

@Controller('did')
@ApiTags('DID API')
export class DidController {
  private logger = new Logger('DidController');

  constructor(
    private responseMessage: ResponseMessage,
    private didService: DidService
  ) { }
 

  /**
   * 사용자 DID issue 요청
   * 
   * @param createDidUserDto 
   * @returns 
   */
    @Post("/al-issue")
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '사용자 DID issue 요청', description: '사용자 DID issue를 요청한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async issueUser(@Body(ValidationPipe) createDidUserDto: CreateDidUserDto): Promise<any> {
      console.log("++++++++++++++++++++++");
      fileLogger.info('did-issueUser');
      fileLogger.info(createDidUserDto);
      const result: any = await this.didService.createUser(createDidUserDto);
      return this.responseMessage.response(result);
    }

  /**
   * 사용자 DID verify 요청
   * 
   * @param getUserDto 
   * @returns 
   */
    @Post("/al-verify")
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '사용자 DID verify 요청', description: '사용자 DID verify 요청을 한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async verifyUser(@Body(ValidationPipe) getDidUserDto: GetDidUserDto): Promise<any> {
      console.log("++++++++++++++++++++++");
      fileLogger.info('did-verifyUser');
      fileLogger.info(getDidUserDto);
      const result: any = await this.didService.verifyUser(getDidUserDto);
      return this.responseMessage.response(result);
    }

  /**
   * VC issue 요청
   * 
   * @param createDidUserDto 
   * @returns 
   */
    @Post("/al-vc-issue")
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'VC issue 요청', description: 'VC issue를 요청한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async issueVC(@Body(ValidationPipe) createDidVcDto: CreateDidVcDto): Promise<any> {
      console.log("++++++++++++++++++++++");
      fileLogger.info('did-issueVC');
      fileLogger.info(createDidVcDto);
      const result: any = await this.didService.createVC(createDidVcDto);
      return this.responseMessage.response(result);
    }

  /**
   * VC verify 요청
   * 
   * @param getUserDto 
   * @returns 
   */
    @Post("/al-vc-verify")
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'VC verify 요청', description: 'VC verify 요청을 한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async verifyVC(@Body(ValidationPipe) getDidVcDto: GetDidVcDto): Promise<any> {
      console.log("++++++++++++++++++++++");
      fileLogger.info('did-verifyVC');
      fileLogger.info(getDidVcDto);
      const result: any = await this.didService.verifyVC(getDidVcDto);
      return this.responseMessage.response(result);
    }

}