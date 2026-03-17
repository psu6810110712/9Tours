import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Tour } from '../tours/entities/tour.entity';
import { TourSchedule } from '../tours/entities/tour-schedule.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(TourSchedule)
    private readonly scheduleRepo: Repository<TourSchedule>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: dto.bookingId, userId },
      });

      if (!booking) {
        throw new NotFoundException('ไม่พบรายการจองนี้');
      }

      const allowedStatuses = [BookingStatus.CONFIRMED, BookingStatus.SUCCESS];
      if (!allowedStatuses.includes(booking.status)) {
        throw new ConflictException('สามารถรีวิวได้เฉพาะรายการจองที่ได้รับการยืนยันหรือสำเร็จแล้วเท่านั้น');
      }

      const existing = await manager.findOne(Review, {
        where: { bookingId: dto.bookingId },
      });
      if (existing) {
        throw new ConflictException('คุณรีวิวการจองนี้แล้ว');
      }

      const schedule = await manager.findOne(TourSchedule, {
        where: { id: booking.scheduleId },
      });
      if (!schedule) {
        throw new NotFoundException('ไม่พบข้อมูลรอบเดินทางของการจองนี้แล้ว');
      }

      const review = manager.create(Review, {
        bookingId: dto.bookingId,
        userId,
        tourId: schedule.tourId,
        rating: dto.rating,
        comment: dto.comment,
      });
      await manager.save(Review, review);

      const raw = await manager
        .createQueryBuilder(Review, 'r')
        .select('AVG(r.rating)', 'avg')
        .addSelect('COUNT(r.id)', 'count')
        .where('r.tour_id = :tourId', { tourId: schedule.tourId })
        .getRawOne<{ avg: string; count: string }>();
      const { avg, count } = raw ?? { avg: '0', count: '0' };

      await manager.update(Tour, schedule.tourId, {
        rating: parseFloat(parseFloat(avg ?? '0').toFixed(2)),
        reviewCount: parseInt(count ?? '0', 10),
      });

      return review;
    });
  }

  async findByTour(
    tourId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ data: Review[]; total: number }> {
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { tourId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['user'],
    });

    return { data, total };
  }

  async getReviewedBookingIds(bookingIds: number[]): Promise<Set<number>> {
    if (bookingIds.length === 0) return new Set();
    const reviews = await this.reviewRepo.find({
      where: { bookingId: In(bookingIds) },
      select: ['bookingId'],
    });
    return new Set(reviews.map((r) => r.bookingId));
  }
}
