import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserController } from './user.controller';
import { UserProviders } from './user.provider';
import { UserService } from './user.service';
import { DidModule } from '../did/did.module';
import { NftModule } from '../nft/nft.module';
import { ResponseMessage } from '../common/response';

@Module({
  imports: [
    DatabaseModule,
    DidModule,
    NftModule,
  ],
  controllers: [UserController],
  providers: [...UserProviders, UserService, ResponseMessage],
  exports: [UserService],
})
export class UserModule { }