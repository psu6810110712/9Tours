import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BehaviorEvent } from '../analytics/entities/behavior-event.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ToursController } from './tours.controller';
import { TourSchedule } from './entities/tour-schedule.entity';
import { Tour } from './entities/tour.entity';
import { ToursService } from './tours.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tour, TourSchedule, BehaviorEvent, Booking])],
  controllers: [ToursController],
  providers: [ToursService],
  exports: [ToursService],
})
export class ToursModule {}
