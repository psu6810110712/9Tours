import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface UploadAttempt {
  key: string;
  at: number;
}

@Injectable()
export class PaymentUploadRateLimitService {
  private readonly attempts = new Map<string, UploadAttempt[]>();
  private readonly windowMs = 10 * 60 * 1000;
  private readonly maxAttempts = 5;

  assertUploadAllowed(userId: string, ipAddress: string) {
    const now = Date.now();
    const key = `${userId}:${ipAddress}`;
    const activeAttempts = (this.attempts.get(key) ?? []).filter((attempt) => now - attempt.at < this.windowMs);

    if (activeAttempts.length >= this.maxAttempts) {
      throw new HttpException(
        'Too many slip upload attempts. Please wait a few minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    activeAttempts.push({ key, at: now });
    this.attempts.set(key, activeAttempts);
  }
}
