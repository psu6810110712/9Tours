import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TourView } from './entities/tour-view.entity';
import { DashboardStatsDaily } from './entities/dashboard-stats-daily.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Tour } from '../tours/entities/tour.entity';
import { BehaviorEvent } from './entities/behavior-event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Module({
    imports: [TypeOrmModule.forFeature([TourView, DashboardStatsDaily, Booking, User, Tour, BehaviorEvent])],
    providers: [DashboardService, EventsService, OptionalJwtAuthGuard],
    controllers: [DashboardController, EventsController],
})
export class AnalyticsModule { }
