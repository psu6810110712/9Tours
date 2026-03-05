import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TourView } from './entities/tour-view.entity';
import { DashboardStatsDaily } from './entities/dashboard-stats-daily.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Tour } from '../tours/entities/tour.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TourView, DashboardStatsDaily, Booking, User, Tour])],
    providers: [DashboardService],
    controllers: [DashboardController],
})
export class AnalyticsModule { }
