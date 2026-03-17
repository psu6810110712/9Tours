import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { TrackEventDto } from './dto/track-event.dto';
import { BehaviorEvent } from './entities/behavior-event.entity';
import { TourView } from './entities/tour-view.entity';

const REDACTED = '[REDACTED]';
const BLOCKED_METADATA_KEYS = new Set([
  'email',
  'phone',
  'password',
  'token',
  'authorization',
  'cookie',
  'address',
  'idCard',
]);

interface EventRequestContext {
  userId?: string;
  anonymousId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(BehaviorEvent)
    private readonly behaviorEventsRepo: Repository<BehaviorEvent>,
    @InjectRepository(TourView)
    private readonly tourViewsRepo: Repository<TourView>,
    private readonly configService: ConfigService,
  ) {}

  async trackEvent(dto: TrackEventDto, context: EventRequestContext) {
    const trackingEnabled = this.configService.get<string>('TRACKING_ENABLED') !== 'false';
    if (!trackingEnabled) {
      return { accepted: false, reason: 'tracking_disabled' as const };
    }

    const event = this.behaviorEventsRepo.create({
      eventType: dto.eventType,
      pagePath: dto.pagePath,
      sessionId: dto.sessionId,
      userId: context.userId ?? null,
      tourId: dto.tourId ?? null,
      elementId: dto.elementId ?? null,
      dwellMs: dto.dwellMs ?? null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      metadata: this.sanitizeMetadata(dto.metadata),
      ipHash: this.hashIp(context.ip),
      userAgent: this.normalizeUserAgent(context.userAgent),
    });

    await this.behaviorEventsRepo.save(event);

    if (dto.eventType === 'page_view' && dto.tourId) {
      const tourView = new TourView();
      tourView.tourId = dto.tourId;
      const parsedUserId = context.userId ? parseInt(context.userId, 10) : null;
      tourView.userId = Number.isNaN(parsedUserId) ? null : parsedUserId;
      tourView.anonymousId = context.anonymousId || null;
      tourView.sessionId = dto.sessionId;
      tourView.browserInfo = this.normalizeUserAgent(context.userAgent) ?? '';
      await this.tourViewsRepo.save(tourView);
    }

    return { accepted: true as const };
  }

  async stitchAnonymousViews(userId: number, anonymousId: string): Promise<number> {
    const result = await this.tourViewsRepo
      .createQueryBuilder()
      .update(TourView)
      .set({
        userId: userId,
        anonymousId: null,
      })
      .where('anonymous_id = :anonymousId', { anonymousId })
      .andWhere('user_id IS NULL')
      .execute();

    return result.affected || 0;
  }

  // PDPA: เก็บเฉพาะข้อมูลที่จำเป็น และตัดข้อมูลส่วนบุคคลที่ไม่ควรบันทึกออก
  private sanitizeMetadata(
    input?: Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (!input) return null;
    const sanitized = this.deepSanitizeObject(input, 0) as Record<string, unknown>;
    const payload = JSON.stringify(sanitized);
    if (payload.length > 2000) {
      return { note: 'metadata_truncated_for_safety' };
    }
    return sanitized;
  }

  private deepSanitizeObject(value: unknown, depth: number): unknown {
    if (depth > 4) return '[TRUNCATED_DEPTH]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return value.slice(0, 500);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 20).map((v) => this.deepSanitizeObject(v, depth + 1));
    if (typeof value !== 'object') return undefined;

    const output: Record<string, unknown> = {};
    for (const [rawKey, rawVal] of Object.entries(value)) {
      const key = rawKey.trim();
      if (!key) continue;
      if (BLOCKED_METADATA_KEYS.has(key)) {
        output[key] = REDACTED;
        continue;
      }
      output[key] = this.deepSanitizeObject(rawVal, depth + 1);
    }
    return output;
  }

  private hashIp(ip?: string | null): string | null {
    if (!ip) return null;
    const salt = this.configService.get<string>('TRACKING_HASH_SALT') || '9tours_default_salt';
    return createHash('sha256').update(`${ip}|${salt}`).digest('hex');
  }

  private normalizeUserAgent(userAgent?: string | null): string | null {
    if (!userAgent) return null;
    return userAgent.slice(0, 255);
  }
}
