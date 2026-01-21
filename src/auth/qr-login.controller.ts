import { Body, Controller, Get, HttpStatus, Param, Post, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/response';
import { CompleteQrLoginSessionDto } from './dtos/qr-login.dto';
import { QrLoginService } from './qr-login.service';

@Controller('auth/qr')
@ApiTags('QR 로그인 API')
export class QrLoginController {
  constructor(
    private readonly responseMessage: ResponseMessage,
    private readonly qrLoginService: QrLoginService,
  ) {}

  @Post('/sessions')
  @ApiOperation({ summary: 'QR 로그인 세션 생성', description: '웹에서 QR 코드를 표시하기 위한 세션을 생성한다.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 에러' })
  @ApiOkResponse({ description: '성공' })
  createSession() {
    const session = this.qrLoginService.createSession();
    return this.responseMessage.response(session);
  }

  @Get('/sessions/:sessionId')
  @ApiOperation({ summary: 'QR 로그인 세션 상태 조회', description: '웹에서 폴링하여 로그인 완료 여부를 확인한다.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '세션 없음' })
  @ApiOkResponse({ description: '성공' })
  getStatus(@Param('sessionId') sessionId: string) {
    const status = this.qrLoginService.getStatus(sessionId);
    return this.responseMessage.response(status);
  }

  @Post('/sessions/:sessionId/complete')
  @ApiOperation({
    summary: 'QR 로그인 세션 완료(앱)',
    description: '앱이 QR을 스캔한 후 walletDid를 전달하면 DID verify 후 세션을 승인 상태로 만든다.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '세션 만료/상태 오류' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '세션 없음' })
  @ApiOkResponse({ description: '성공' })
  async complete(
    @Param('sessionId') sessionId: string,
    @Body(new ValidationPipe({ transform: true })) body: CompleteQrLoginSessionDto,
  ) {
    const result = await this.qrLoginService.completeSession(sessionId, body);
    return this.responseMessage.response(result);
  }
}

