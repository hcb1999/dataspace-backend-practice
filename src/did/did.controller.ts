import { Controller, Get, Post, Body, Put, Param, Query, Logger, Req, UseGuards, UseInterceptors, UploadedFile, HttpStatus, Delete, ValidationPipe, UploadedFiles } from '@nestjs/common';
import { DidService } from './did.service';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// import { GetUser } from '../auth/get_user.decorator';
// import { User } from '../entities/user.entity';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/response';
import { CreateDidUserDto } from '../dtos/create_did_user.dto';
import { CreateDidWalletDto } from '../dtos/create_did_wallet.dto';
import { CreateDidAcdgDto } from '../dtos/create_did_acdg.dto';
import { CreateDidAciDto } from '../dtos/create_did_aci.dto';
import { CreateDidAcrDto } from '../dtos/create_did_acr.dto';
import { GetDidAcmDto } from '../dtos/get_did_acm.dto';
import { GetDidAcdDto } from '../dtos/get_did_acd.dto';
import fileLogger from '../common/logger';
import * as moment from 'moment-timezone';

@Controller('did')
@ApiTags('DID API')
export class DidController {
  private logger = new Logger('DidController');

  constructor(
    private responseMessage: ResponseMessage,
    private didService: DidService
  ) { }

  /**
   * 사용자 연결인증
   * 
   * @param createDidUserDto 
   * @returns 
   */
    @Post("/user")
    // @UseGuards(JwtAuthGuard)
    // @ApiBearerAuth('access-token')
    @ApiOperation({ summary: '사용자 연결인증', description: '사용자 연결인증을 한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async createUser(@Body(ValidationPipe) createDidUserDto: CreateDidUserDto): Promise<any> {
      console.log("++++++++++++++++++++++");
      fileLogger.info('did-createUser');
      fileLogger.info(createDidUserDto);
      const result: any = await this.didService.createUser(createDidUserDto);
      return this.responseMessage.response(result);
    }

  /**
   * 아바타 가상지갑 생성
   * 
   * @param createDidWalletDto 
   * @returns 
   */
   @Post("/wallet")
   @ApiOperation({ summary: '아바타 가상지갑 생성', description: '아바타 가상지갑을 생성한다.' })
   @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
   @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
   @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
   async createWallet(@Body(ValidationPipe) createDidWalletDto: CreateDidWalletDto): Promise<any> {
     console.log("++++++++++++++++++++++");
     fileLogger.info('did-createWallet');
      fileLogger.info(createDidWalletDto);
     const result: any = await this.didService.createWallet(createDidWalletDto);
     return this.responseMessage.response(result);
   }
 
  /**
   * 아바타 크리덴셜 DID 생성
   * 
   * @param createDidAcdDto 
   * @returns 
   */
    @Post("/acdg")
    @ApiOperation({ summary: '아바타 크리덴셜 DID 생성', description: '아바타 크리덴셜 DID를 생성한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async createAcdg(@Body(ValidationPipe) createDidAcdgDto: CreateDidAcdgDto): Promise<any> {
      console.log("++++++++++++++++++++++");
      fileLogger.info('did-createAcdg');
      fileLogger.info(createDidAcdgDto);
      const result: any = await this.didService.createAcdg(createDidAcdgDto);
      return this.responseMessage.response(result);
    }
 
      
  /**
   * 아바타 크리덴셜 발급
   * 
   * @param createDidAciDto 
   * @returns 
   */
   @Post("/aci")
   @ApiOperation({ summary: '아바타 크리덴셜 발급', description: '아바타 크리덴셜을 발급한다.' })
   @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
   @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
   @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
   async createAci(@Body(ValidationPipe) createDidAciDto: CreateDidAciDto): Promise<any> {
     console.log("++++++++++++++++++++++");
     fileLogger.info('did-createAci');
     fileLogger.info(createDidAciDto);
     const result: any = await this.didService.createAci(createDidAciDto);
     return this.responseMessage.response(result);
   }
  
  /**
   * 아바타 크리덴셜 등록
   * 
   * @param createDidAcrDto 
   * @returns 
   */
  @Post("/acr")
  @ApiOperation({ summary: '아바타 크리덴셜 등록', description: '아바타 크리덴셜을 등록한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
  async createAcr(@Body(ValidationPipe) createDidAcrDto: CreateDidAcrDto): Promise<any> {
    console.log("++++++++++++++++++++++");
    fileLogger.info('did-createAcr');
    fileLogger.info(createDidAcrDto);
    const result: any = await this.didService.createAcr(createDidAcrDto);
    return this.responseMessage.response(result);
  }

  /**
   * 아바타 크리덴셜 메타정보 조회
   * 
   * @param getDidAcmDto 
   * @returns 
   */
    @Post('/acm')
    @ApiOperation({ summary: '아바타 크리덴셜 메타정보 조회', description: '아바타 크리덴셜 메타정보를 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async getAcm(@Body(ValidationPipe) getDidAcmDto: GetDidAcmDto): Promise<any> {
      console.log("++++++++++++++++++++++");
      fileLogger.info('did-getAcm');
      fileLogger.info(getDidAcmDto);
      const result = await this.didService.getAcm(getDidAcmDto);
      return this.responseMessage.response(result);
    }

  /**
   * 아바타 크리덴셜 상세정보 조회
   * 
   * @param getDidAcdDto 
   * @returns 
   */
    @Post('/acd')
    @ApiOperation({ summary: '아바타 크리덴셜 상세정보 조회', description: '아바타 크리덴셜 상세정보를 조회한다.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'DID 서버 에러' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '데이터 없음' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '필수입력 오류' })
    async getAcd(@Body(ValidationPipe) getDidAcdDto: GetDidAcdDto): Promise<any> {
      console.log("++++++++++++++++++++++");
      fileLogger.info('did-getAcd');
      fileLogger.info(getDidAcdDto);
      const result = await this.didService.getAcd(getDidAcdDto);
      // console.log("result: ",JSON.stringify(result));
      return this.responseMessage.response(result);
    }
}