import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PurchaseController } from './purchase.controller';
import { PurchaseProviders } from './purchase.provider';
import { PurchaseService } from './purchase.service';
import { AssetModule } from '../asset/asset.module';
import { NftModule } from '../nft/nft.module';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
    // AssetModule,
    NftModule,
  //   JwtModule,
  ],
  controllers: [PurchaseController],
  providers: [...PurchaseProviders, PurchaseService, ResponseMessage],
  exports: [PurchaseService],
})
export class PurchaseModule { }