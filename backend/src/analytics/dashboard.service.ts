import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Tour } from '../tours/entities/tour.entity';
import { TourSchedule } from '../tours/entities/tour-schedule.entity';
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
      this.getViewsOverTime(normalizedFilters),
      this.getBookingsOverTime(normalizedFilters),
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

  private parseDate(value?: string, endOfDay = false) {
    if (!value) return null;

    const parsed = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getDateRange(filters: DashboardFilters): { start: Date; end: Date } | null {
    if (!filters.startDate && !filters.endDate) return null;

    const requestedStart = this.parseDate(filters.startDate);
    const requestedEnd = this.parseDate(filters.endDate, true);

    let start = requestedStart ?? new Date('2000-01-01T00:00:00');
    let end = requestedEnd ?? new Date();

    if (start > end) {
      start = this.parseDate(filters.endDate) ?? new Date(end);
      end = this.parseDate(filters.startDate, true) ?? new Date(start);
    }

    return { start, end };
  }

  private hasTourFilters(filters: DashboardFilters) {
    return Boolean(
      (filters.region && filters.region !== 'all')
      || (filters.tourType && filters.tourType !== 'all'),
    );
  }

  private applyTourFilters<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, filters: DashboardFilters, tourAlias = 't') {
    if (filters.region && filters.region !== 'all') {
      qb.andWhere(`${tourAlias}.region = :region`, { region: filters.region });
    }
    if (filters.tourType && filters.tourType !== 'all') {
      qb.andWhere(`${tourAlias}.tourType = :tourType`, { tourType: filters.tourType });
    }
    return qb;
  }

  private applyBookingFilters<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, filters: DashboardFilters, bookingAlias = 'b') {
    if (!this.hasTourFilters(filters)) {
      return qb;
    }

    const scheduleAlias = `${bookingAlias}_schedule`;
    const tourAlias = `${bookingAlias}_tour`;

    qb
      .innerJoin(TourSchedule, scheduleAlias, `${scheduleAlias}.id = ${bookingAlias}.scheduleId`)
      .innerJoin(Tour, tourAlias, `${tourAlias}.id = ${scheduleAlias}.tourId`);

    return this.applyTourFilters(qb, filters, tourAlias);
  }

  private applyViewFilters<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, filters: DashboardFilters, viewAlias = 'v') {
    if (!this.hasTourFilters(filters)) {
      return qb;
    }

    const tourAlias = `${viewAlias}_tour`;
    qb.innerJoin(Tour, tourAlias, `${tourAlias}.id = ${viewAlias}.tourId`);
    return this.applyTourFilters(qb, filters, tourAlias);
  }

  private shiftMonth(date: Date, months: number, endOfDay = false) {
    const targetMonthStart = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth() + 1, 0).getDate();
    const shifted = new Date(
      targetMonthStart.getFullYear(),
      targetMonthStart.getMonth(),
      Math.min(date.getDate(), lastDay),
    );

    if (endOfDay) {
      shifted.setHours(23, 59, 59, 999);
    } else {
      shifted.setHours(0, 0, 0, 0);
    }

    return shifted;
  }

  private isSameMonth(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
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

  private async getViewsOverTime(filters: DashboardFilters) {
    const dateRange = this.getDateRange(filters);
    const anchorEnd = dateRange?.end ?? new Date();
    const windowStart = new Date(anchorEnd.getFullYear(), anchorEnd.getMonth() - 5, 1);
    const queryStart = dateRange?.start && dateRange.start > windowStart ? dateRange.start : windowStart;

    const qb = this.tourViewsRepo
      .createQueryBuilder('v')
      .select("TO_CHAR(v.viewedAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'views')
      .where('v.viewedAt BETWEEN :start AND :end', { start: queryStart, end: anchorEnd });

    this.applyViewFilters(qb, filters, 'v');

    const raw: { month: string; views: string }[] = await qb
      .groupBy("TO_CHAR(v.viewedAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    const thaiMonths = ['\u0e21.\u0e04.', '\u0e01.\u0e1e.', '\u0e21\u0e35.\u0e04.', '\u0e40\u0e21.\u0e22.', '\u0e1e.\u0e04.', '\u0e21\u0e34.\u0e22.', '\u0e01.\u0e04.', '\u0e2a.\u0e04.', '\u0e01.\u0e22.', '\u0e15.\u0e04.', '\u0e1e.\u0e22.', '\u0e18.\u0e04.'];
    const viewsMap: Record<string, number> = {};

    raw.forEach((row) => {
      viewsMap[row.month] = Number(row.views || 0);
    });

    const result: { month: string; views: number }[] = [];
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(anchorEnd.getFullYear(), anchorEnd.getMonth() - index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: thaiMonths[date.getMonth()],
        views: viewsMap[key] || 0,
      });
    }

    return result;
  }

  private async getBookingsGroupedByDay(start: Date, end: Date, filters: DashboardFilters) {
    if (start > end) {
      return [] as { day: number; count: string }[];
    }

    const qb = this.bookingsRepo
      .createQueryBuilder('b')
      .select('EXTRACT(DAY FROM b.createdAt)::int', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('b.createdAt BETWEEN :start AND :end', { start, end });

    this.applyBookingFilters(qb, filters, 'b');

    return qb
      .groupBy('EXTRACT(DAY FROM b.createdAt)')
      .getRawMany<{ day: number; count: string }>();
  }

  private async getBookingsOverTime(filters: DashboardFilters) {
    const dateRange = this.getDateRange(filters);
    const anchorDate = dateRange?.end ?? new Date();
    const thisMonthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const thisMonthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 0, 23, 59, 59, 999);

    let currentRangeStart = thisMonthStart;
    let currentRangeEnd = dateRange?.end && dateRange.end < thisMonthEnd ? dateRange.end : thisMonthEnd;
    let previousRangeStart = lastMonthStart;
    let previousRangeEnd = lastMonthEnd;

    if (dateRange?.start && this.isSameMonth(dateRange.start, anchorDate) && dateRange.start > thisMonthStart) {
      currentRangeStart = dateRange.start;
      const shiftedStart = this.shiftMonth(dateRange.start, -1);
      if (shiftedStart > previousRangeStart) {
        previousRangeStart = shiftedStart;
      }
    }

    if (dateRange?.end) {
      const shiftedEnd = this.shiftMonth(dateRange.end, -1, true);
      if (shiftedEnd < previousRangeEnd) {
        previousRangeEnd = shiftedEnd;
      }
    }

    const [thisMonthRaw, lastMonthRaw] = await Promise.all([
      this.getBookingsGroupedByDay(currentRangeStart, currentRangeEnd, filters),
      this.getBookingsGroupedByDay(previousRangeStart, previousRangeEnd, filters),
    ]);

    const thisMonthMap: Record<number, number> = {};
    const lastMonthMap: Record<number, number> = {};
    thisMonthRaw.forEach((row) => {
      thisMonthMap[row.day] = Number(row.count || 0);
    });
    lastMonthRaw.forEach((row) => {
      lastMonthMap[row.day] = Number(row.count || 0);
    });

    const daysInMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
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
