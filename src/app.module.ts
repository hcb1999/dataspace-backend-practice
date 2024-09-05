import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssetModule } from './asset/asset.module';
import { AssetTypeModule } from './asset_type/asset_type.module';
import { AuthModule } from './auth/auth.module';
import { MetaverseModule } from './metaverse/metaverse.module';
import { NftModule } from './nft/nft.module';
import { ProductModule } from './product/product.module';
import { PurchaseModule } from './purchase/purchase.module';
import { PurchaseAssetModule } from './purchase_asset/purchase_asset.module';
import { StateModule } from './state/state.module';
import { UserModule } from './user/user.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    AssetModule,
    AssetTypeModule,
    AuthModule,
    MetaverseModule,
    NftModule,
    ProductModule,
    PurchaseModule,
    PurchaseAssetModule,
    StateModule,
    UserModule,
    MulterModule.register({
      storage: memoryStorage()
    }),
    ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
