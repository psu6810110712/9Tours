import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { Tour } from './entities/tour.entity';
import { TourSchedule } from './entities/tour-schedule.entity';
import { ToursSeederService } from './tours.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([Tour, TourSchedule])],
  controllers: [ToursController],
  providers: [ToursService, ToursSeederService],
})
export class ToursModule {}
