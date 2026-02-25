import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { NftModule } from './nft/nft.module';
import { PurchaseModule } from './purchase/purchase.module';
import { StateModule } from './state/state.module';
import { UserModule } from './user/user.module';
import { MarketModule } from './market/market.module';
import { DidModule } from './did/did.module';
import { WebhookModule } from './webhook/webhook.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
// import { BullModule } from '@nestjs/bull';


@Module({
  imports: [
    AuthModule,
    NftModule,
    PurchaseModule,
    StateModule,
    UserModule,
    MarketModule,
    DidModule,
    WebhookModule,
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
