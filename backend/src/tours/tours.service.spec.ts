import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ToursService } from './tours.service';
import { Tour } from './entities/tour.entity';
import { TourSchedule } from './entities/tour-schedule.entity';
import { BehaviorEvent } from '../analytics/entities/behavior-event.entity';

describe('ToursService', () => {
  let service: ToursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToursService,
        { provide: getRepositoryToken(Tour), useValue: {} },
        { provide: getRepositoryToken(TourSchedule), useValue: {} },
        { provide: getRepositoryToken(BehaviorEvent), useValue: {} },
      ],
    }).compile();

    service = module.get<ToursService>(ToursService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
