import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DidController } from './did.controller';
import { DidProviders } from './did.provider';
import { DidService } from './did.service';
import { ResponseMessage } from '../common/response';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    DatabaseModule,
    HttpModule,
  //   JwtModule,
  ],
  controllers: [DidController],
  providers: [...DidProviders, DidService, ResponseMessage],
  exports: [DidService],
})
export class DidModule { }