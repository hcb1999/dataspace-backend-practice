import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { jwtConstants } from '../common/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: jwtConstants.SECRET,
    });
  }

  async validate(payload: any) {
    // console.log('payload => ', payload);
    const user: User = await this.authService.validateUser(payload.userNo);

    if (user == null) {
      throw new UnauthorizedException();
    }

    return user;
  }
}