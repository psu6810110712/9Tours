import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToursService } from './tours.service';
import { BehaviorEvent } from '../analytics/entities/behavior-event.entity';

describe('ToursService', () => {
  let service: ToursService;
  let repo: Repository<BehaviorEvent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToursService,
        {
          provide: getRepositoryToken(BehaviorEvent),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ToursService>(ToursService);
    repo = module.get<Repository<BehaviorEvent>>(getRepositoryToken(BehaviorEvent));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of tours', () => {
      const result = service.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return null if tour not found', () => {
      expect(service.findOne(999999)).toBeNull();
    });
  });
});
