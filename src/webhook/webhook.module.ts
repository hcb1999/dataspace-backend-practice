import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { UserModule } from '../user/user.module'; 
import { MarketModule } from '../market/market.module'; 
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    UserModule,
    MarketModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService, ResponseMessage],
})
export class WebhookModule { }