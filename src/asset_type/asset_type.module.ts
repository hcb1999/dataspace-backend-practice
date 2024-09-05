import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AssetTypeController } from './asset_type.controller';
import { AssetTypeProviders } from './asset_type.provider';
import { AssetTypeService } from './asset_type.service';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
  //   JwtModule,
  ],
  controllers: [AssetTypeController],
  providers: [...AssetTypeProviders, AssetTypeService, ResponseMessage],
  exports: [AssetTypeService],
})
export class AssetTypeModule { }