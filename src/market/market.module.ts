import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MarketController } from './market.controller';
import { MarketProviders } from './market.provider';
import { MarketService } from './market.service';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { AssetModule } from '../asset/asset.module';
import { ContractModule } from '../contract/contract.module';
import { NftModule } from '../nft/nft.module';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
    ProductModule,
    UserModule,
    AssetModule,
    ContractModule,
    NftModule,
  //   JwtModule,
  ],
  controllers: [MarketController],
  providers: [...MarketProviders, MarketService, ResponseMessage],
  exports: [MarketService],
})
export class MarketModule { }