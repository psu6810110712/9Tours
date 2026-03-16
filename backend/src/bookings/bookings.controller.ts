import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyBookings(@Req() req: any) {
    return this.bookingsService.getMyBookings(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  async findAll() {
    return this.bookingsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/schedule/:scheduleId')
  async findBySchedule(@Param('scheduleId') scheduleId: string) {
    return this.bookingsService.findByScheduleId(+scheduleId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const isAdmin = req.user.role === 'admin';
    return this.bookingsService.findOne(+id, req.user.id, isAdmin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
    @Req() req: any,
  ) {
    return this.bookingsService.updateStatus(+id, updateBookingStatusDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':id/cancel')
  async cancelBooking(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.cancelBooking(+id, req.user.id);
  }
}
