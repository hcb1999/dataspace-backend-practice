import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AssetController } from './asset.controller';
import { AssetProviders } from './asset.provider';
import { AssetService } from './asset.service';
import { NftModule } from '../nft/nft.module';
import { DidModule } from '../did/did.module';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
    NftModule,
    DidModule,
  //   JwtModule,
  ],
  controllers: [AssetController],
  providers: [...AssetProviders, AssetService, ResponseMessage],
  exports: [AssetService],
})
export class AssetModule { }