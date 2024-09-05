import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MetaverseController } from './metaverse.controller';
import { MetaverseProviders } from './metaverse.provider';
import { MetaverseService } from './metaverse.service';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
  //   JwtModule,
  ],
  controllers: [MetaverseController],
  providers: [...MetaverseProviders, MetaverseService, ResponseMessage],
  exports: [MetaverseService],
})
export class MetaverseModule { }