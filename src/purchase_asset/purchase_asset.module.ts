import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PurchaseAssetController } from './purchase_asset.controller';
import { PurchaseAssetProviders } from './purchase_asset.provider';
import { PurchaseAssetService } from './purchase_asset.service';
import { AssetModule } from '../asset/asset.module';
import { NftModule } from '../nft/nft.module';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
    AssetModule,
    NftModule,
  //   JwtModule,
  ],
  controllers: [PurchaseAssetController],
  providers: [...PurchaseAssetProviders, PurchaseAssetService, ResponseMessage],
  exports: [PurchaseAssetService],
})
export class PurchaseAssetModule { }