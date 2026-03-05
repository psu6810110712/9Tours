import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { ToursModule } from '../tours/tours.module'; // ✅ Import ToursModule

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), ToursModule], // ✅ เพิ่ม ToursModule ใน imports
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule { }

