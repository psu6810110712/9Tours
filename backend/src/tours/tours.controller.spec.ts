import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';
import { Tour } from './entities/tour.entity';
import { TourSchedule } from './entities/tour-schedule.entity';
import { BehaviorEvent } from '../analytics/entities/behavior-event.entity';

describe('ToursController', () => {
  let controller: ToursController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToursController],
      providers: [
        ToursService,
        { provide: getRepositoryToken(Tour), useValue: {} },
        { provide: getRepositoryToken(TourSchedule), useValue: {} },
        { provide: getRepositoryToken(BehaviorEvent), useValue: {} },
      ],
    }).compile();

    controller = module.get<ToursController>(ToursController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
