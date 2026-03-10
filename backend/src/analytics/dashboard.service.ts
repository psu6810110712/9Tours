import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { TourView } from './entities/tour-view.entity';
import { Tour } from '../tours/entities/tour.entity';
import { ToursService } from '../tours/tours.service';

export interface DashboardFilters {
    startDate?: string; // 'YYYY-MM-DD'
    endDate?: string;   // 'YYYY-MM-DD'
    region?: string;    // e.g. 'ภาคเหนือ' or 'all'
    tourType?: string;  // 'one_day' | 'package' | 'all'
}

interface TrendData {
    value: number;
    percentChange: number;
}

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
        private toursService: ToursService,
    ) { }

    async getDashboardData(filters: DashboardFilters = {}) {
        const [
            summaryCards,
            topTours,
            bookingsByStatus,
            regionStats,
            provinceStats,
            viewsOverTime,
            bookingsOverTime,
            recentBookings,
        ] = await Promise.all([
            this.getSummaryCards(filters),
            this.getTopTours(filters),
            this.getBookingsByStatus(filters),
            this.getRegionStats(filters),
            this.getProvinceStats(filters),
            this.getViewsOverTime(filters),
            this.getBookingsOverTime(filters),
            this.getRecentBookings(filters),
        ]);

        const conversionRate = summaryCards.totalViews.value > 0
            ? ((summaryCards.totalBookings.value / summaryCards.totalViews.value) * 100).toFixed(1)
            : '0';

        return {
            summaryCards,
            topTours,
            recentBookings,
            bookingsByStatus,
            regionStats,
            provinceStats,
            viewsOverTime,
            bookingsOverTime,
            conversionRate: Number(conversionRate),
        };
    }

    // ──────────── Helper: สร้าง date range จาก startDate / endDate ────────────

    private getDateRange(filters: DashboardFilters): { start: Date; end: Date } | null {
        if (!filters.startDate && !filters.endDate) return null;

        const start = filters.startDate
            ? new Date(filters.startDate + 'T00:00:00')
            : new Date('2000-01-01T00:00:00');

        const end = filters.endDate
            ? new Date(filters.endDate + 'T23:59:59.999')
            : new Date();

        return { start, end };
    }

    // ──────────── Summary Cards ────────────

    private async getSummaryCards(filters: DashboardFilters) {
        const dateRange = this.getDateRange(filters);
        
        let previousRange: { start: Date; end: Date } | null = null;
        if (dateRange) {
            const diffTime = Math.abs(dateRange.end.getTime() - dateRange.start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            previousRange = {
                start: new Date(dateRange.start.getTime() - (diffDays * 24 * 60 * 60 * 1000)),
                end: new Date(dateRange.start.getTime() - 1)
            };
        }

        // --- Current Period ---
        const currentRevenueQb = this.bookingsRepo
            .createQueryBuilder('b')
            .select('COALESCE(SUM(b.totalPrice), 0)', 'total')
            .where('b.status IN (:...statuses)', { statuses: [BookingStatus.SUCCESS, BookingStatus.AWAITING_APPROVAL] });
        if (dateRange) currentRevenueQb.andWhere('b.createdAt BETWEEN :start AND :end', dateRange);

        const currentBookingsQb = this.bookingsRepo.createQueryBuilder('b');
        if (dateRange) currentBookingsQb.where('b.createdAt BETWEEN :start AND :end', dateRange);

        const currentViewsQb = this.tourViewsRepo.createQueryBuilder('v');
        if (dateRange) currentViewsQb.where('v.viewedAt BETWEEN :start AND :end', dateRange);

        const currentCustomersQb = this.usersRepo
            .createQueryBuilder('u')
            .where("u.role = :role", { role: 'customer' });
        if (dateRange) currentCustomersQb.andWhere('u.createdAt BETWEEN :start AND :end', dateRange);

        // --- Previous Period (for trend comparison) ---
        const previousRevenueQb = this.bookingsRepo
            .createQueryBuilder('b')
            .select('COALESCE(SUM(b.totalPrice), 0)', 'total')
            .where('b.status IN (:...statuses)', { statuses: [BookingStatus.SUCCESS, BookingStatus.AWAITING_APPROVAL] });
        if (previousRange) previousRevenueQb.andWhere('b.createdAt BETWEEN :start AND :end', previousRange);

        const previousBookingsQb = this.bookingsRepo.createQueryBuilder('b');
        if (previousRange) previousBookingsQb.where('b.createdAt BETWEEN :start AND :end', previousRange);

        const previousViewsQb = this.tourViewsRepo.createQueryBuilder('v');
        if (previousRange) previousViewsQb.where('v.viewedAt BETWEEN :start AND :end', previousRange);

        const previousCustomersQb = this.usersRepo
            .createQueryBuilder('u')
            .where("u.role = :role", { role: 'customer' });
        if (previousRange) previousCustomersQb.andWhere('u.createdAt BETWEEN :start AND :end', previousRange);

        // --- Execute All Queries in Parallel ---
        const [
            currentRevenueRes, currentBookings, currentViews, currentCustomers,
            previousRevenueRes, previousBookings, previousViews, previousCustomers
        ] = await Promise.all([
            currentRevenueQb.getRawOne(), currentBookingsQb.getCount(), currentViewsQb.getCount(), currentCustomersQb.getCount(),
            previousRevenueQb.getRawOne(), previousBookingsQb.getCount(), previousViewsQb.getCount(), previousCustomersQb.getCount()
        ]);

        const currentRevenue = Number(currentRevenueRes?.total || 0);
        const previousRevenue = Number(previousRevenueRes?.total || 0);

        // --- Calculate Percentage Changes ---
        const calcPercent = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Number((((current - previous) / previous) * 100).toFixed(1));
        };

        return {
            totalRevenue: { value: currentRevenue, percentChange: calcPercent(currentRevenue, previousRevenue) },
            totalBookings: { value: currentBookings, percentChange: calcPercent(currentBookings, previousBookings) },
            totalViews: { value: currentViews, percentChange: calcPercent(currentViews, previousViews) },
            totalCustomers: { value: currentCustomers, percentChange: calcPercent(currentCustomers, previousCustomers) },
        };
    }

    // ──────────── Top Tours ────────────

    private async getTopTours(filters: DashboardFilters) {
        const qb = this.toursRepo
            .createQueryBuilder('t')
            .where('t.isActive = :active', { active: true });

        if (filters.region && filters.region !== 'all') {
            qb.andWhere('t.region = :region', { region: filters.region });
        }
        if (filters.tourType && filters.tourType !== 'all') {
            qb.andWhere('t.tourType = :tourType', { tourType: filters.tourType });
        }

        qb.orderBy('t.reviewCount', 'DESC').limit(5);

        const tours = await qb.getMany();
        const maxReviews = tours[0]?.reviewCount || 1;

        return tours.map((tour, index) => ({
            rank: index + 1,
            id: tour.id,
            name: tour.name,
            province: tour.province,
            reviewCount: tour.reviewCount || 0,
            rating: tour.rating || 0,
            popularityPercent: Math.round(((tour.reviewCount || 0) / maxReviews) * 100),
            revenue: (Number(tour.price) || 0) * (tour.reviewCount || 0),
            imageUrl: tour.images && tour.images.length > 0 ? tour.images[0] : null,
        }));
    }

    // ──────────── Recent Bookings ────────────
    private async getRecentBookings(_filters: DashboardFilters) {
        const qb = this.bookingsRepo
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.user', 'user')
            .orderBy('b.createdAt', 'DESC')
            .limit(6);

        const bookings = await qb.getMany();
        
        return bookings.map(b => {
            let tourName = `Tour (Schedule ${b.scheduleId})`;
            // Attempt to get from toursService (which reads from tours-data.json or DB)
            const toursData = this.toursService.findAll({ admin: 'true' });
            for (const tour of toursData) {
                if (tour.schedules?.some((s: any) => s.id === b.scheduleId)) {
                    tourName = tour.name;
                    break;
                }
            }

            return {
                id: b.id,
                bookingCode: `BK-${b.id.toString().padStart(5, '0')}`,
                tourName,
                customerName: b.user?.name || (b.user?.email || 'Guest'),
                totalPrice: Number(b.totalPrice),
                status: b.status,
                createdAt: b.createdAt,
            };
        });
    }

    // ──────────── Bookings By Status ────────────

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

    // ──────────── Region Stats ────────────

    private async getRegionStats(filters: DashboardFilters) {
        const qb = this.toursRepo
            .createQueryBuilder('t')
            .select('t.region', 'name')
            .addSelect('SUM(t.reviewCount)', 'count')
            .where('t.isActive = :active', { active: true });

        if (filters.tourType && filters.tourType !== 'all') {
            qb.andWhere('t.tourType = :tourType', { tourType: filters.tourType });
        }

        qb.groupBy('t.region');
        const raw: { name: string; count: string }[] = await qb.getRawMany();

        const total = raw.reduce((sum, r) => sum + Number(r.count || 0), 0) || 1;

        return raw
            .map(r => ({
                name: r.name || 'ไม่ระบุ',
                count: Number(r.count || 0),
                percent: Number(((Number(r.count || 0) / total) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.count - a.count);
    }

    // ──────────── Province Stats ────────────

    private async getProvinceStats(filters: DashboardFilters) {
        const qb = this.toursRepo
            .createQueryBuilder('t')
            .select('t.province', 'name')
            .addSelect('SUM(t.reviewCount)', 'count')
            .where('t.isActive = :active', { active: true });

        if (filters.region && filters.region !== 'all') {
            qb.andWhere('t.region = :region', { region: filters.region });
        }
        if (filters.tourType && filters.tourType !== 'all') {
            qb.andWhere('t.tourType = :tourType', { tourType: filters.tourType });
        }

        qb.groupBy('t.province');
        const raw: { name: string; count: string }[] = await qb.getRawMany();

        const total = raw.reduce((sum, r) => sum + Number(r.count || 0), 0) || 1;

        return raw
            .map(r => ({
                name: r.name || 'ไม่ระบุ',
                count: Number(r.count || 0),
                percent: Number(((Number(r.count || 0) / total) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.count - a.count);
    }

    // ──────────── Views Over Time (monthly) ────────────

    private async getViewsOverTime(_filters: DashboardFilters) {
        // Query จริงจาก tour_views table — group by เดือน 6 เดือนย้อนหลัง
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

        // สร้าง label เดือนไทยสั้น
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        // สร้าง map ของผลลัพธ์
        const viewsMap: Record<string, number> = {};
        for (const r of raw) {
            viewsMap[r.month] = Number(r.views || 0);
        }

        // สร้าง 6 เดือนเต็ม
        const result: { month: string; views: number }[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            result.push({
                month: thaiMonths[d.getMonth()],
                views: viewsMap[key] || 0,
            });
        }

        return result;
    }

    // ──────────── Bookings Over Time (daily, this month vs last month) ────────────

    private async getBookingsOverTime(_filters: DashboardFilters) {
        const now = new Date();

        // เดือนนี้
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // เดือนที่แล้ว
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
        for (const r of thisMonthRaw) thisMonthMap[r.day] = Number(r.count || 0);
        for (const r of lastMonthRaw) lastMonthMap[r.day] = Number(r.count || 0);

        // จำนวนวันในเดือนนี้
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const days: { day: number; thisMonth: number; lastMonth: number }[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({
                day: d,
                thisMonth: thisMonthMap[d] || 0,
                lastMonth: lastMonthMap[d] || 0,
            });
        }

        return days;
    }
}
