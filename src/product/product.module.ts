import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProductController } from './product.controller';
import { ProductProviders } from './product.provider';
import { ProductService } from './product.service';
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
  controllers: [ProductController],
  providers: [...ProductProviders, ProductService, ResponseMessage],
  exports: [ProductService],
})
export class ProductModule { }