import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ContractController } from './contract.controller';
import { ContractProviders } from './contract.provider';
import { ContractService } from './contract.service';
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
  controllers: [ContractController],
  providers: [...ContractProviders, ContractService, ResponseMessage],
  exports: [ContractService],
})
export class ContractModule { }