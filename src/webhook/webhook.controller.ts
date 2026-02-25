import { Controller, Post, Req, Body, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { ResponseMessage } from '../common/response';
import { Request } from 'express';

@Controller('webhook')
@ApiTags('웹훅 API')
export class WebhookController {
  private logger = new Logger('WebhookController');

  constructor(
    private responseMessage: ResponseMessage,
    private webhookService: WebhookService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Webhook 처리' })
  @ApiResponse({ status: 200, description: 'Webhook 처리 성공' })
  @ApiBody({
    schema: {
      example: {
          "resultCode" : "200",
          "resultMessage" : "SUCCESS",
          "data" : {
            "did" : "did:wesharing:HBUfSs9HHqxMkiWmcfS4Z6",
            "smcWalletAddress" : "0x1234567890FGHHJJJsfhskhfs987492rshfsh",
            "vcType" : "1",
            "orgId" : "54",
            "keyValue" : "10",
          }   
       },
    },
  })
  // @ApiBody({
  //   schema: {
  //     example: {
  //         "resultCode" : "200",
  //         "resultMessage" : "SUCCESS",
  //         "data" : {
  //           "did" : "did:wesharing:HBUfSs9HHqxMkiWmcfS4Z6",
  //           "smcWalletAddress" : "0x1234567890FGHHJJJsfhskhfs987492rshfsh",
  //           "vcType" : "1",
  //         }   
  //      },
  //   },
  // })
  async handleWebhook(
    @Req() req: Request,
    @Body() body: any,
  ) {
      // fileLogger.info('webhook-create');
      // fileLogger.info(body);
      console.log('webhook-create');
      console.log(body);
      console.log(body.data);

      try {

          // ✅ body에 따라 내부 로직 처리
          // await this.webhookService.handleWebhook(body.data);
          
          // return { received: true };
          return { received:  body.data };
            
        } catch (error) {
          this.logger.error(
            `Webhook processing failed: ${error.message}`,
            error.stack,
          );
          throw new BadRequestException('Webhook processing failed');
        }
    }  

}
