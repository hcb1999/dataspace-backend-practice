import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { MarketService } from '../market/market.service';
import { PageResponse } from 'src/common/page.response';

@Injectable()
export class WebhookService {
  private logger = new Logger('WebhookService');

  constructor(
    private userService: UserService,
    private marketService: MarketService,
  ) {}

  async handleWebhook(data: any) {
    const orgId = data.orgId;
    console.log(`💰 orgId ${orgId}`);

    if(orgId){
      this.userService.createAsync(data);
    }else{
      this.marketService.createVcAsync(data);

    }

    return { received: true };
  }

}
