import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { TourSchedule } from './entities/tour-schedule.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ToursSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Tour)
    private tourRepository: Repository<Tour>,
    @InjectRepository(TourSchedule)
    private scheduleRepository: Repository<TourSchedule>,
  ) {}

  async onModuleInit() {
    try {
      // Check if schedules already exist
      const existingSchedules = await this.scheduleRepository.count();
      if (existingSchedules > 0) {
        console.log(`✅ Tour schedules already seeded (${existingSchedules} schedules), skipping...`);
        return;
      }

      const dataFile = path.join(process.cwd(), 'tours-data.json');
      if (fs.existsSync(dataFile)) {
        const toursData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

        for (const tourData of toursData) {
          // Find existing tour in database
          const existingTour = await this.tourRepository.findOne({
            where: { tourCode: tourData.tourCode },
          });

          if (existingTour && tourData.schedules && Array.isArray(tourData.schedules)) {
            // Save schedules for existing tour
            for (const scheduleData of tourData.schedules) {
              const existingSchedule = await this.scheduleRepository.findOne({
                where: { id: scheduleData.id },
              });
              if (!existingSchedule) {
                await this.scheduleRepository.save({
                  id: scheduleData.id,
                  tourId: existingTour.id,
                  startDate: scheduleData.startDate,
                  endDate: scheduleData.endDate,
                  timeSlot: scheduleData.timeSlot,
                  roundName: scheduleData.roundName,
                  maxCapacity: scheduleData.maxCapacity,
                  currentBooked: scheduleData.currentBooked || 0,
                });
              }
            }
          }
        }

        const totalSchedules = await this.scheduleRepository.count();
        console.log(`✅ Seeded ${totalSchedules} tour schedules from tours-data.json`);
      }
    } catch (error) {
      console.error('❌ Error seeding tours:', error);
    }
  }
}
