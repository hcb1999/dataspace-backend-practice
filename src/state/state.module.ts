import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StateController } from './state.controller';
import { StateProviders } from './state.provider';
import { StateService } from './state.service';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
  //   JwtModule,
  ],
  controllers: [StateController],
  providers: [...StateProviders, StateService, ResponseMessage],
  exports: [StateService],
})
export class StateModule { }