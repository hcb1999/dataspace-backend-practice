import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { jwtConstants } from '../common/config';
import { ResponseMessage } from '../common/response';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from '../user/user.module';
import { NftModule } from '../nft/nft.module';

@Module({
  imports: [
    HttpModule,
    UserModule,
    NftModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
        secret: jwtConstants.SECRET,
        signOptions: { expiresIn: jwtConstants.EXPIRATION_TIME },
    }),
  ],
  providers: [AuthService, JwtStrategy, ResponseMessage],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule]
})
export class AuthModule { }
