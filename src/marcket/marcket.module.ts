import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MarcketController } from './marcket.controller';
import { MarcketProviders } from './marcket.provider';
import { MarcketService } from './marcket.service';
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
  controllers: [MarcketController],
  providers: [...MarcketProviders, MarcketService, ResponseMessage],
  exports: [MarcketService],
})
export class MarcketModule { }