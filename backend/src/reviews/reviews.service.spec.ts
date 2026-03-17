import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Tour } from '../tours/entities/tour.entity';
import { TourSchedule } from '../tours/entities/tour-schedule.entity';

const USER_ID = 'user-uuid-1';
const BOOKING_ID = 10;
const SCHEDULE_ID = 5;
const TOUR_ID = 3;

const mockBooking = {
  id: BOOKING_ID,
  userId: USER_ID,
  scheduleId: SCHEDULE_ID,
  status: BookingStatus.SUCCESS,
};

const mockSchedule = { id: SCHEDULE_ID, tourId: TOUR_ID };

const makeManager = (overrides: Partial<Record<string, jest.Mock>> = {}) => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ avg: '4.5', count: '2' }),
  };

  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    ...overrides,
  };
};

const makeDataSource = (manager: ReturnType<typeof makeManager>) => ({
  transaction: jest.fn().mockImplementation((cb: (m: any) => Promise<any>) => cb(manager)),
});

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepo: { findAndCount: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    reviewRepo = {
      findAndCount: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: getRepositoryToken(Booking), useValue: {} },
        { provide: getRepositoryToken(TourSchedule), useValue: {} },
        { provide: DataSource, useValue: makeDataSource(makeManager()) },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('create', () => {
    const dto = { bookingId: BOOKING_ID, rating: 5, comment: 'Great tour!' };

    it('should create a review and update tour averages', async () => {
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(mockBooking)    // booking lookup
          .mockResolvedValueOnce(null)           // no existing review
          .mockResolvedValueOnce(mockSchedule),  // schedule lookup
        create: jest.fn().mockReturnValue({ ...dto, userId: USER_ID, tourId: TOUR_ID }),
        save: jest.fn().mockResolvedValue({ id: 1, ...dto, userId: USER_ID, tourId: TOUR_ID }),
        update: jest.fn().mockResolvedValue(undefined),
      });
      const ds = makeDataSource(manager);

      const module = await Test.createTestingModule({
        providers: [
          ReviewsService,
          { provide: getRepositoryToken(Review), useValue: reviewRepo },
          { provide: getRepositoryToken(Booking), useValue: {} },
          { provide: getRepositoryToken(TourSchedule), useValue: {} },
          { provide: DataSource, useValue: ds },
        ],
      }).compile();
      const svc = module.get<ReviewsService>(ReviewsService);

      const result = await svc.create(USER_ID, dto);

      expect(manager.save).toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalledWith(Tour, TOUR_ID, {
        rating: 4.5,
        reviewCount: 2,
      });
      expect(result).toMatchObject({ tourId: TOUR_ID });
    });

    it('should throw NotFoundException when booking not found', async () => {
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValueOnce(null),
      });
      const ds = makeDataSource(manager);

      const module = await Test.createTestingModule({
        providers: [
          ReviewsService,
          { provide: getRepositoryToken(Review), useValue: reviewRepo },
          { provide: getRepositoryToken(Booking), useValue: {} },
          { provide: getRepositoryToken(TourSchedule), useValue: {} },
          { provide: DataSource, useValue: ds },
        ],
      }).compile();

      await expect(
        module.get<ReviewsService>(ReviewsService).create(USER_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when booking status is neither confirmed nor success', async () => {
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValueOnce({
          ...mockBooking,
          status: BookingStatus.PENDING_PAYMENT,
        }),
      });
      const ds = makeDataSource(manager);

      const module = await Test.createTestingModule({
        providers: [
          ReviewsService,
          { provide: getRepositoryToken(Review), useValue: reviewRepo },
          { provide: getRepositoryToken(Booking), useValue: {} },
          { provide: getRepositoryToken(TourSchedule), useValue: {} },
          { provide: DataSource, useValue: ds },
        ],
      }).compile();

      await expect(
        module.get<ReviewsService>(ReviewsService).create(USER_ID, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when review already exists', async () => {
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(mockBooking)
          .mockResolvedValueOnce({ id: 99 }),
      });
      const ds = makeDataSource(manager);

      const module = await Test.createTestingModule({
        providers: [
          ReviewsService,
          { provide: getRepositoryToken(Review), useValue: reviewRepo },
          { provide: getRepositoryToken(Booking), useValue: {} },
          { provide: getRepositoryToken(TourSchedule), useValue: {} },
          { provide: DataSource, useValue: ds },
        ],
      }).compile();

      await expect(
        module.get<ReviewsService>(ReviewsService).create(USER_ID, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when schedule not found', async () => {
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(mockBooking)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
      });
      const ds = makeDataSource(manager);

      const module = await Test.createTestingModule({
        providers: [
          ReviewsService,
          { provide: getRepositoryToken(Review), useValue: reviewRepo },
          { provide: getRepositoryToken(Booking), useValue: {} },
          { provide: getRepositoryToken(TourSchedule), useValue: {} },
          { provide: DataSource, useValue: ds },
        ],
      }).compile();

      await expect(
        module.get<ReviewsService>(ReviewsService).create(USER_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTour', () => {
    it('should return paginated reviews for a tour', async () => {
      const reviews = [{ id: 1, tourId: TOUR_ID, rating: 5, comment: 'Great!' }];
      reviewRepo.findAndCount.mockResolvedValue([reviews, 1]);

      const result = await service.findByTour(TOUR_ID, 10, 0);

      expect(reviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tourId: TOUR_ID }, take: 10, skip: 0 }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should use default limit and offset', async () => {
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findByTour(TOUR_ID);

      expect(reviewRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 0 }),
      );
    });
  });

  describe('getReviewedBookingIds', () => {
    it('should return a Set of reviewed booking ids', async () => {
      reviewRepo.find.mockResolvedValue([{ bookingId: 1 }, { bookingId: 2 }]);

      const result = await service.getReviewedBookingIds([1, 2, 3]);

      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(false);
    });

    it('should return empty Set for empty input', async () => {
      const result = await service.getReviewedBookingIds([]);
      expect(result.size).toBe(0);
      expect(reviewRepo.find).not.toHaveBeenCalled();
    });
  });
});
