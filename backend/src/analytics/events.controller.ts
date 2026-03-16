import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { TrackEventDto } from './dto/track-event.dto';
import { EventsService } from './events.service';

type AuthenticatedRequest = Request & {
  user?: { id?: string };
};

@Controller('analytics')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(OptionalJwtAuthGuard)
  async trackEvent(@Body() dto: TrackEventDto, @Req() req: AuthenticatedRequest) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor?.split(',')[0]?.trim() || req.ip;

    const anonymousId = req.headers['x-anonymous-id'] as string | undefined;

    return this.eventsService.trackEvent(dto, {
      userId: req.user?.id,
      anonymousId: anonymousId || null,
      ip: clientIp,
      userAgent: Array.isArray(req.headers['user-agent'])
        ? req.headers['user-agent'][0]
        : req.headers['user-agent'],
    });
  }
}
