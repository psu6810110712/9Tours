import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const TRACK_EVENT_TYPES = ['page_view', 'cta_click', 'dwell_time'] as const;

export class TrackEventDto {
  @IsString()
  @IsIn(TRACK_EVENT_TYPES)
  eventType: (typeof TRACK_EVENT_TYPES)[number];

  @IsString()
  @MaxLength(255)
  pagePath: string;

  @IsString()
  @MaxLength(64)
  sessionId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  tourId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  elementId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7_200_000)
  dwellMs?: number;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return value as Record<string, unknown>;
  })
  metadata?: Record<string, unknown>;
}
