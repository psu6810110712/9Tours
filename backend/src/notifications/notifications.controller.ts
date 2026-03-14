import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.notificationsService.findAllForUser(req.user.id);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    const count = await this.notificationsService.countUnread(req.user.id);
    return { count };
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    await this.notificationsService.markAsRead(+id, req.user.id);
    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }
}
