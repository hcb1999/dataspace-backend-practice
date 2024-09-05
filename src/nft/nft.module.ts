import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { HttpModule } from '@nestjs/axios'
import { ResponseMessage } from '../common/response';
import { ResponseMetadata } from 'src/common/responseMetadata';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { NftProviders } from './nft.provider';
import { NftHttpService } from './nft.httpService';

@Module({
  imports: [
    DatabaseModule,
    HttpModule,
    // JwtModule,
    ],
  controllers: [NftController],  
  providers: [...NftProviders, NftService, NftHttpService, ResponseMessage, ResponseMetadata],
  exports: [NftService, NftHttpService]
})
export class NftModule {}