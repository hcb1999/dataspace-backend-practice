import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { DidService } from '../did/did.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { CompleteQrLoginSessionDto } from './dtos/qr-login.dto';

type QrSessionStatus = 'pending' | 'approved' | 'expired';

type QrSession = {
  id: string;
  status: QrSessionStatus;
  createdAt: number;
  expiresAt: number;
  walletDid?: string;
  email?: string;
  nickname?: string;
  accessToken?: string;
};

@Injectable()
export class QrLoginService {
  private readonly sessions = new Map<string, QrSession>();
  private readonly ttlMs = 1000 * 60 * 3; // 3 minutes

  constructor(
    private readonly didService: DidService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  createSession() {
    const id = randomUUID();
    const now = Date.now();
    const session: QrSession = {
      id,
      status: 'pending',
      createdAt: now,
      expiresAt: now + this.ttlMs,
    };
    this.sessions.set(id, session);
    return {
      sessionId: id,
      expiresAt: session.expiresAt,
      // 앱에서 파싱하기 쉽게 prefix 형태로 제공 (앱은 sessionId만 추출해도 됨)
      qrPayload: `dataspace-qr-login:${id}`,
    };
  }

  getStatus(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException('QR session not found.');

    const now = Date.now();
    if (session.status === 'pending' && now > session.expiresAt) {
      session.status = 'expired';
      this.sessions.set(sessionId, session);
    }

    if (session.status === 'approved') {
      return {
        status: session.status,
        accessToken: session.accessToken,
        nickName: session.nickname,
        email: session.email,
      };
    }

    return {
      status: session.status,
      expiresAt: session.expiresAt,
    };
  }

  async completeSession(sessionId: string, body: CompleteQrLoginSessionDto) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException('QR session not found.');

    const now = Date.now();
    if (session.status !== 'pending') {
      throw new BadRequestException(`QR session is not pending. status=${session.status}`);
    }
    if (now > session.expiresAt) {
      session.status = 'expired';
      this.sessions.set(sessionId, session);
      throw new BadRequestException('QR session expired.');
    }

    // ✅ 기존 로그인처럼 "email -> DB의 walletDid -> AuthLedger verify" 순으로 가입증명 수행
    const email = body.email;

    const userInfo = await this.userService.getOneByEmail(email);
    if (!userInfo) {
      throw new NotFoundException('User(email) not found.');
    }

    const didWallet = await this.userService.getDidWallet(userInfo.userNo);
    if (!didWallet?.walletDid) {
      throw new UnauthorizedException('Registered walletDid not found for this user.');
    }

    const verified = await this.didService.verifyUser({ walletDid: didWallet.walletDid });
    if (!verified?.email) {
      throw new UnauthorizedException('DID verify failed.');
    }
    if (verified.email !== email) {
      throw new UnauthorizedException('DID proof email does not match.');
    }

    // 기존 /auth 는 AuthLedger DID verify까지 수행해서 현재 환경에서는 실패할 수 있어,
    // QR 완료는 "email 기반"으로 바로 토큰 발급한다.
    const accessToken = this.jwtService.sign({ userNo: userInfo.userNo });

    const updated: QrSession = {
      ...session,
      status: 'approved',
      walletDid: didWallet.walletDid,
      email,
      nickname: (userInfo as any).nickName || (userInfo as any).nickname,
      accessToken,
    };
    this.sessions.set(sessionId, updated);

    // 앱에서도 토큰을 바로 사용할 수 있도록 accessToken을 응답으로 전달
    return {
      status: 'approved',
      accessToken,
      email,
      nickName: (userInfo as any).nickName || (userInfo as any).nickname,
    };
  }
}

