import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Tour } from '../tours/entities/tour.entity';
import { User } from '../users/entities/user.entity';
import { TourView } from './entities/tour-view.entity';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  region?: string;
  tourType?: string;
}

const REGION_ALIASES: Record<string, string> = {
  all: 'all',
  north: 'ภาคเหนือ',
  northeast: 'ภาคตะวันออกเฉียงเหนือ',
  central: 'ภาคกลาง',
  east: 'ภาคตะวันออก',
  west: 'ภาคตะวันตก',
  south: 'ภาคใต้',
  'ภาคเหนือ': 'ภาคเหนือ',
  'ภาคตะวันออกเฉียงเหนือ': 'ภาคตะวันออกเฉียงเหนือ',
  'ภาคกลาง': 'ภาคกลาง',
  'ภาคตะวันออก': 'ภาคตะวันออก',
  'ภาคตะวันตก': 'ภาคตะวันตก',
  'ภาคใต้': 'ภาคใต้',
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepo: Repository<Booking>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(TourView)
    private tourViewsRepo: Repository<TourView>,
    @InjectRepository(Tour)
    private toursRepo: Repository<Tour>,
  ) {}

  async getDashboardData(filters: DashboardFilters = {}) {
    const normalizedFilters = this.normalizeFilters(filters);

    const [
      summaryCards,
      topTours,
      bookingsByStatus,
      regionStats,
      provinceStats,
      viewsOverTime,
      bookingsOverTime,
    ] = await Promise.all([
      this.getSummaryCards(normalizedFilters),
      this.getTopTours(normalizedFilters),
      this.getBookingsByStatus(normalizedFilters),
      this.getRegionStats(normalizedFilters),
      this.getProvinceStats(normalizedFilters),
      this.getViewsOverTime(),
      this.getBookingsOverTime(),
    ]);

    const conversionRate = summaryCards.totalViews > 0
      ? Number(((summaryCards.totalBookings / summaryCards.totalViews) * 100).toFixed(1))
      : 0;

    return {
      summaryCards,
      topTours,
      bookingsByStatus,
      regionStats,
      provinceStats,
      viewsOverTime,
      bookingsOverTime,
      conversionRate,
    };
  }

  private normalizeFilters(filters: DashboardFilters): DashboardFilters {
    const region = filters.region ? (REGION_ALIASES[filters.region] ?? filters.region) : undefined;
    return {
      ...filters,
      region,
    };
  }

  private getDateRange(filters: DashboardFilters): { start: Date; end: Date } | null {
    if (!filters.startDate && !filters.endDate) return null;

    const start = filters.startDate
      ? new Date(`${filters.startDate}T00:00:00`)
      : new Date('2000-01-01T00:00:00');

    const end = filters.endDate
      ? new Date(`${filters.endDate}T23:59:59.999`)
      : new Date();

    return { start, end };
  }

  private async getSummaryCards(filters: DashboardFilters) {
    const dateRange = this.getDateRange(filters);

    const revenueQb = this.bookingsRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.totalPrice), 0)', 'total')
      .where('b.status IN (:...statuses)', {
        statuses: [BookingStatus.SUCCESS, BookingStatus.AWAITING_APPROVAL],
      });
    if (dateRange) {
      revenueQb.andWhere('b.createdAt BETWEEN :start AND :end', dateRange);
    }
    const revenueResult = await revenueQb.getRawOne();

    const bookingsQb = this.bookingsRepo.createQueryBuilder('b');
    if (dateRange) {
      bookingsQb.where('b.createdAt BETWEEN :start AND :end', dateRange);
    }
    const totalBookings = await bookingsQb.getCount();

    const viewsQb = this.tourViewsRepo.createQueryBuilder('v');
    if (dateRange) {
      viewsQb.where('v.viewedAt BETWEEN :start AND :end', dateRange);
    }
    const totalViews = await viewsQb.getCount();

    const customersQb = this.usersRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: 'customer' });
    if (dateRange) {
      customersQb.andWhere('u.createdAt BETWEEN :start AND :end', dateRange);
    }
    const totalCustomers = await customersQb.getCount();

    return {
      totalRevenue: Number(revenueResult?.total || 0),
      totalBookings,
      totalViews,
      totalCustomers,
    };
  }

  private applyTourFilters<T extends { andWhere: (query: string, parameters?: Record<string, unknown>) => T }>(qb: T, filters: DashboardFilters) {
    if (filters.region && filters.region !== 'all') {
      qb.andWhere('t.region = :region', { region: filters.region });
    }
    if (filters.tourType && filters.tourType !== 'all') {
      qb.andWhere('t.tourType = :tourType', { tourType: filters.tourType });
    }
    return qb;
  }

  private async getTopTours(filters: DashboardFilters) {
    const qb = this.toursRepo
      .createQueryBuilder('t')
      .where('t.isActive = :active', { active: true });

    this.applyTourFilters(qb, filters);
    qb.orderBy('t.reviewCount', 'DESC').limit(5);

    const tours = await qb.getMany();
    const maxReviews = tours[0]?.reviewCount || 1;

    return tours.map((tour, index) => ({
      rank: index + 1,
      id: tour.id,
      name: tour.name,
      province: tour.province,
      reviewCount: tour.reviewCount || 0,
      popularityPercent: Math.round(((tour.reviewCount || 0) / maxReviews) * 100),
      revenue: (Number(tour.price) || 0) * (tour.reviewCount || 0),
    }));
  }

  private async getBookingsByStatus(filters: DashboardFilters) {
    const statuses = [
      BookingStatus.PENDING_PAYMENT,
      BookingStatus.AWAITING_APPROVAL,
      BookingStatus.SUCCESS,
      BookingStatus.CANCELED,
      BookingStatus.REFUND_PENDING,
      BookingStatus.REFUND_COMPLETED,
    ];

    const dateRange = this.getDateRange(filters);
    const result: Record<string, number> = {};

    for (const status of statuses) {
      const qb = this.bookingsRepo
        .createQueryBuilder('b')
        .where('b.status = :status', { status });
      if (dateRange) {
        qb.andWhere('b.createdAt BETWEEN :start AND :end', dateRange);
      }
      result[status] = await qb.getCount();
    }

    return result;
  }

  private async getRegionStats(filters: DashboardFilters) {
    const qb = this.toursRepo
      .createQueryBuilder('t')
      .select('t.region', 'name')
      .addSelect('SUM(t.reviewCount)', 'count')
      .where('t.isActive = :active', { active: true });

    this.applyTourFilters(qb, filters);
    qb.groupBy('t.region');

    const raw: { name: string; count: string }[] = await qb.getRawMany();
    const total = raw.reduce((sum, item) => sum + Number(item.count || 0), 0) || 1;

    return raw
      .map((item) => ({
        name: item.name || 'ไม่ระบุ',
        count: Number(item.count || 0),
        percent: Number(((Number(item.count || 0) / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private async getProvinceStats(filters: DashboardFilters) {
    const qb = this.toursRepo
      .createQueryBuilder('t')
      .select('t.province', 'name')
      .addSelect('SUM(t.reviewCount)', 'count')
      .where('t.isActive = :active', { active: true });

    this.applyTourFilters(qb, filters);
    qb.groupBy('t.province');

    const raw: { name: string; count: string }[] = await qb.getRawMany();
    const total = raw.reduce((sum, item) => sum + Number(item.count || 0), 0) || 1;

    return raw
      .map((item) => ({
        name: item.name || 'ไม่ระบุ',
        count: Number(item.count || 0),
        percent: Number(((Number(item.count || 0) / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private async getViewsOverTime() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const raw: { month: string; views: string }[] = await this.tourViewsRepo
      .createQueryBuilder('v')
      .select("TO_CHAR(v.viewedAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'views')
      .where('v.viewedAt >= :since', { since: sixMonthsAgo })
      .groupBy("TO_CHAR(v.viewedAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const viewsMap: Record<string, number> = {};

    raw.forEach((row) => {
      viewsMap[row.month] = Number(row.views || 0);
    });

    const now = new Date();
    const result: { month: string; views: number }[] = [];
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: thaiMonths[date.getMonth()],
        views: viewsMap[key] || 0,
      });
    }

    return result;
  }

  private async getBookingsOverTime() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [thisMonthRaw, lastMonthRaw] = await Promise.all([
      this.bookingsRepo
        .createQueryBuilder('b')
        .select('EXTRACT(DAY FROM b.createdAt)::int', 'day')
        .addSelect('COUNT(*)', 'count')
        .where('b.createdAt BETWEEN :start AND :end', { start: thisMonthStart, end: thisMonthEnd })
        .groupBy('EXTRACT(DAY FROM b.createdAt)')
        .getRawMany<{ day: number; count: string }>(),
      this.bookingsRepo
        .createQueryBuilder('b')
        .select('EXTRACT(DAY FROM b.createdAt)::int', 'day')
        .addSelect('COUNT(*)', 'count')
        .where('b.createdAt BETWEEN :start AND :end', { start: lastMonthStart, end: lastMonthEnd })
        .groupBy('EXTRACT(DAY FROM b.createdAt)')
        .getRawMany<{ day: number; count: string }>(),
    ]);

    const thisMonthMap: Record<number, number> = {};
    const lastMonthMap: Record<number, number> = {};
    thisMonthRaw.forEach((row) => {
      thisMonthMap[row.day] = Number(row.count || 0);
    });
    lastMonthRaw.forEach((row) => {
      lastMonthMap[row.day] = Number(row.count || 0);
    });

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const result: { day: number; thisMonth: number; lastMonth: number }[] = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push({
        day,
        thisMonth: thisMonthMap[day] || 0,
        lastMonth: lastMonthMap[day] || 0,
      });
    }

    return result;
  }
}
