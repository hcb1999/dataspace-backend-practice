import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MarketController } from './market.controller';
import { MarketProviders } from './market.provider';
import { MarketService } from './market.service';
import { UserModule } from '../user/user.module';
import { NftModule } from '../nft/nft.module';
import { DidModule } from '../did/did.module';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    NftModule,
    DidModule,
  //   JwtModule,
  ],
  controllers: [MarketController],
  providers: [...MarketProviders, MarketService, ResponseMessage],
  exports: [MarketService],
})
export class MarketModule { }