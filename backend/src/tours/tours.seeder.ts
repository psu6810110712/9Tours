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
      const isProduction = process.env.NODE_ENV === 'production';
      const shouldSeedOnStartup = process.env.SEED_TOURS_ON_STARTUP !== 'false';
      if (isProduction || !shouldSeedOnStartup) {
        console.log('⏭️ Skip tours seeding (production or disabled by SEED_TOURS_ON_STARTUP=false)');
        return;
      }

      const existingTours = await this.tourRepository.count();
      if (existingTours > 0) {
        console.log(`✅ Tours already seeded (${existingTours} tours), skipping...`);
        return;
      }

      const dataFile = path.join(process.cwd(), 'tours-data.json');
      if (fs.existsSync(dataFile)) {
        const toursData = JSON.parse(fs.readFileSync(dataFile, 'utf-8')) as any[];

        // ใช้ transaction เพื่อให้ import สำเร็จทั้งชุดหรือ rollback ทั้งชุด
        await this.tourRepository.manager.transaction(async (manager) => {
          const tourRepo = manager.getRepository(Tour);
          const scheduleRepo = manager.getRepository(TourSchedule);

          for (const tourData of toursData) {
            const savedTour = await tourRepo.save(tourRepo.create({
              tourCode: tourData.tourCode,
              name: tourData.name,
              description: tourData.description,
              tourType: tourData.tourType,
              categories: tourData.categories || [],
              price: Number(tourData.price || 0),
              childPrice: tourData.childPrice !== undefined && tourData.childPrice !== null
                ? Number(tourData.childPrice)
                : null,
              minPeople: tourData.minPeople !== undefined && tourData.minPeople !== null
                ? Number(tourData.minPeople)
                : null,
              maxPeople: tourData.maxPeople !== undefined && tourData.maxPeople !== null
                ? Number(tourData.maxPeople)
                : null,
              originalPrice: tourData.originalPrice !== undefined && tourData.originalPrice !== null
                ? Number(tourData.originalPrice)
                : null,
              images: tourData.images || [],
              highlights: tourData.highlights || [],
              itinerary: tourData.itinerary || [],
              transportation: tourData.transportation || '',
              duration: tourData.duration || '',
              region: tourData.region || '',
              province: tourData.province || '',
              accommodation: tourData.accommodation || null,
              rating: Number(tourData.rating || 0),
              reviewCount: Number(tourData.reviewCount || 0),
              isActive: tourData.isActive !== false,
            }));

            if (Array.isArray(tourData.schedules)) {
              for (const scheduleData of tourData.schedules) {
                await scheduleRepo.save(scheduleRepo.create({
                  id: scheduleData.id,
                  tourId: savedTour.id,
                  startDate: scheduleData.startDate,
                  endDate: scheduleData.endDate,
                  timeSlot: scheduleData.timeSlot || null,
                  roundName: scheduleData.roundName || null,
                  maxCapacity: Number(scheduleData.maxCapacity || 0),
                  currentBooked: Number(scheduleData.currentBooked || 0),
                }));
              }
            }
          }
        });

        const totalTours = await this.tourRepository.count();
        const totalSchedules = await this.scheduleRepository.count();
        console.log(`✅ Seeded ${totalTours} tours and ${totalSchedules} schedules from tours-data.json`);
      } else {
        console.warn('⚠️ tours-data.json not found, skip tours seed');
      }
    } catch (error) {
      console.error('❌ Error seeding tours:', error);
    }
  }
}
