import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';

type VerificationEntry = {
  codeHash: string;
  expiresAt: number;
  requestedAt: number;
  attempts: number;
};

@Injectable()
export class EmailVerificationService {
  private readonly store = new Map<string, VerificationEntry>();

  private readonly ttlMs = 1000 * 60 * 5; // 5 minutes
  private readonly minResendIntervalMs = 1000 * 20; // 20 seconds
  private readonly maxAttempts = 5;

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hash(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private generateCode() {
    // 6-digit numeric
    const n = Math.floor(Math.random() * 900000) + 100000;
    return String(n);
  }

  requestCode(rawEmail: string) {
    const email = this.normalizeEmail(rawEmail);
    const now = Date.now();

    const existing = this.store.get(email);
    if (existing && now - existing.requestedAt < this.minResendIntervalMs) {
      throw new HttpException('Please wait before requesting another code.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.generateCode();
    const entry: VerificationEntry = {
      codeHash: this.hash(code),
      expiresAt: now + this.ttlMs,
      requestedAt: now,
      attempts: 0,
    };
    this.store.set(email, entry);
    return { email, code, expiresAt: entry.expiresAt };
  }

  confirmCode(rawEmail: string, code: string) {
    const email = this.normalizeEmail(rawEmail);
    const entry = this.store.get(email);
    if (!entry) throw new UnauthorizedException('Invalid code.');

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(email);
      throw new UnauthorizedException('Code expired.');
    }

    if (entry.attempts >= this.maxAttempts) {
      this.store.delete(email);
      throw new HttpException('Too many attempts.', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.attempts += 1;
    this.store.set(email, entry);

    const ok = this.hash(code) === entry.codeHash;
    if (!ok) throw new UnauthorizedException('Invalid code.');

    // success: consume entry
    this.store.delete(email);
    return { verified: true };
  }
}

