import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac } from 'crypto';

@Injectable()
export class NcMailService {
  private readonly logger = new Logger('NcMailService');

  constructor(private readonly configService: ConfigService) {}

  /**
   * NCP API Gateway Signature v2
   * message = "{method} {url}\n{timestamp}\n{accessKey}"
   */
  async makeMailSignature(
    method: string,
    url: string,
    timestamp: string,
    accessKey: string,
    secretKey: string,
  ): Promise<string> {
    const message = `${method} ${url}\n${timestamp}\n${accessKey}`;
    return createHmac('sha256', secretKey).update(message).digest('base64');
  }

  async sendNCMail(
    recipients: Array<{
      address: string;
      name?: string;
      type: 'R' | 'C' | 'B';
      parameters?: Record<string, string>;
    }>,
    title: string,
    body: string,
    individual: boolean = false,
    advertising: boolean = false,
  ): Promise<any> {
    try {
      const ncMailAccessKey = this.configService.get<string>('NC_MAIL_ACCESS_KEY');
      const ncMailSecretKey = this.configService.get<string>('NC_MAIL_SECRET_KEY');
      const ncMailSenderAddress = this.configService.get<string>('NC_MAIL_SENDER_ADDRESS');
      const ncMailUrl = this.configService.get<string>('NC_MAIL_URL') || 'https://mail.apigw.ntruss.com';

      if (!ncMailAccessKey || !ncMailSecretKey || !ncMailSenderAddress) {
        throw new InternalServerErrorException('NC Mail configuration missing.');
      }

      const timestamp = new Date().getTime().toString();
      const method = 'POST';
      const url = '/api/v1/mails';

      // Signature 생성
      const signature = await this.makeMailSignature(method, url, timestamp, ncMailAccessKey, ncMailSecretKey);

      // 헤더 설정
      const headers = {
        'Content-Type': 'application/json',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': ncMailAccessKey,
        'x-ncp-apigw-signature-v2': signature,
        'x-ncp-lang': 'ko-KR',
      };

      // 요청 데이터
      const payload = {
        senderAddress: ncMailSenderAddress,
        title,
        body,
        recipients,
        individual,
        advertising,
      };

      // API 호출
      const response = await axios.post(`${ncMailUrl}${url}`, payload, { headers });

      this.logger.debug(`네이버 클라우드 메일 전송 성공`);
      return response.data;
    } catch (e: any) {
      this.logger.error(`네이버 클라우드 메일 전송 실패: ${e?.message}`);
      if (e?.response?.data) {
        // 키/시그니처는 포함되지 않으므로 response.data만 로깅
        this.logger.error(`응답 데이터: ${JSON.stringify(e.response.data)}`);
      }
      throw new InternalServerErrorException(`Failed to send NC Mail: ${e?.message}`);
    }
  }
}

