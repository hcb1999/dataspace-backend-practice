import { Body, Controller, HttpStatus, Post, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/response';
import { ConfirmEmailVerificationDto, RequestEmailVerificationDto } from './dtos/email-verification.dto';
import { EmailVerificationService } from './email-verification.service';
import { NcMailService } from './nc-mail.service';

@Controller('v1/mails')
@ApiTags('메일 API')
export class NcMailController {
  constructor(
    private readonly responseMessage: ResponseMessage,
    private readonly ncMailService: NcMailService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('/')
  @ApiOperation({
    summary: '이메일 인증 코드 발송(이메일만 입력)',
    description: '이메일을 입력받아 인증 코드를 생성하고 메일로 발송한다.',
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiOkResponse({ description: '성공' })
  async send(@Body(ValidationPipe) dto: RequestEmailVerificationDto): Promise<any> {
    const { email, code, expiresAt } = this.emailVerificationService.requestCode(dto.email);

    await this.ncMailService.sendNCMail(
      [{ address: email, type: 'R' }],
      'Dataspace 이메일 인증 코드',
      `인증번호는 ${code} 입니다.\n(유효시간: 5분)`,
      false,
      false,
    );

    return this.responseMessage.response({ requested: true, expiresAt });
  }

  @Post('/verification/confirm')
  @ApiOperation({
    summary: '이메일 인증 코드 확인',
    description: '이메일과 인증코드를 입력받아 검증한다.',
  })
  @ApiOkResponse({ description: '성공' })
  async confirmVerification(@Body(ValidationPipe) dto: ConfirmEmailVerificationDto): Promise<any> {
    const result = this.emailVerificationService.confirmCode(dto.email, dto.code);
    return this.responseMessage.response(result);
  }
}

