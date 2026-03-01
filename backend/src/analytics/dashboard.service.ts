import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { TourView } from './entities/tour-view.entity';
import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE = path.join(process.cwd(), 'tours-data.json');

function loadToursData(): any[] {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('❌ DashboardService: cannot read tours-data.json', e);
    }
    return [];
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
    ) { }

    async getDashboardData() {
        const [
            summaryCards,
            topTours,
            bookingsByStatus,
            regionStats,
            provinceStats,
            viewsOverTime,
            bookingsOverTime,
        ] = await Promise.all([
            this.getSummaryCards(),
            this.getTopTours(),
            this.getBookingsByStatus(),
            this.getRegionStats(),
            this.getProvinceStats(),
            this.getViewsOverTime(),
            this.getBookingsOverTime(),
        ]);

        const conversionRate = summaryCards.totalViews > 0
            ? ((summaryCards.totalBookings / summaryCards.totalViews) * 100).toFixed(1)
            : '0';

        return {
            summaryCards,
            topTours,
            bookingsByStatus,
            regionStats,
            provinceStats,
            viewsOverTime,
            bookingsOverTime,
            conversionRate: Number(conversionRate),
        };
    }

    private async getSummaryCards() {
        // ยอดขายทั้งหมด
        const revenueResult = await this.bookingsRepo
            .createQueryBuilder('b')
            .select('COALESCE(SUM(b.totalPrice), 0)', 'total')
            .where('b.status IN (:...statuses)', {
                statuses: [BookingStatus.SUCCESS, BookingStatus.AWAITING_APPROVAL],
            })
            .getRawOne();

        // จำนวน bookings ทั้งหมด
        const totalBookings = await this.bookingsRepo.count();

        // จำนวน views ทั้งหมด
        const totalViews = await this.tourViewsRepo.count();

        // ลูกค้าใหม่ (จำนวน users ทั้งหมด ลบ admin)
        const totalCustomers = await this.usersRepo.count({
            where: { role: 'customer' as any },
        });

        return {
            totalRevenue: Number(revenueResult?.total || 0),
            totalBookings,
            totalViews,
            totalCustomers,
        };
    }

    private async getTopTours() {
        const tours = loadToursData();

        // Sort tours by reviewCount (as proxy for popularity), take top 5
        const sorted = [...tours]
            .filter((t: any) => t.isActive)
            .sort((a: any, b: any) => (b.reviewCount || 0) - (a.reviewCount || 0))
            .slice(0, 5);

        const maxReviews = sorted[0]?.reviewCount || 1;

        return sorted.map((tour: any, index: number) => ({
            rank: index + 1,
            id: tour.id,
            name: tour.name,
            province: tour.province,
            reviewCount: tour.reviewCount || 0,
            rating: tour.rating || 0,
            popularityPercent: Math.round(((tour.reviewCount || 0) / maxReviews) * 100),
            revenue: (tour.price || 0) * (tour.reviewCount || 0),
        }));
    }

    private async getBookingsByStatus() {
        const statuses = [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.AWAITING_APPROVAL,
            BookingStatus.SUCCESS,
            BookingStatus.CANCELED,
            BookingStatus.REFUND_PENDING,
            BookingStatus.REFUND_COMPLETED,
        ];

        const result: Record<string, number> = {};
        for (const status of statuses) {
            result[status] = await this.bookingsRepo.count({ where: { status } });
        }

        return result;
    }

    private getRegionStats() {
        const tours = loadToursData();
        const regionMap: Record<string, number> = {};

        for (const tour of tours) {
            if (!tour.isActive) continue;
            const region = tour.region || 'ไม่ระบุ';
            regionMap[region] = (regionMap[region] || 0) + (tour.reviewCount || 1);
        }

        const total = Object.values(regionMap).reduce((a, b) => a + b, 0) || 1;

        return Object.entries(regionMap)
            .map(([name, count]) => ({
                name,
                count,
                percent: Number(((count / total) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.count - a.count);
    }

    private getProvinceStats() {
        const tours = loadToursData();
        const provinceMap: Record<string, number> = {};

        for (const tour of tours) {
            if (!tour.isActive) continue;
            const province = tour.province || 'ไม่ระบุ';
            provinceMap[province] = (provinceMap[province] || 0) + (tour.reviewCount || 1);
        }

        const total = Object.values(provinceMap).reduce((a, b) => a + b, 0) || 1;

        return Object.entries(provinceMap)
            .map(([name, count]) => ({
                name,
                count,
                percent: Number(((count / total) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.count - a.count);
    }

    private async getViewsOverTime() {
        // Generate mock monthly data for views chart
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.'];
        const totalViews = await this.tourViewsRepo.count();
        const baseValue = Math.max(totalViews, 1000);

        return months.map((month, i) => ({
            month,
            views: Math.round(baseValue * (0.5 + Math.random() * 0.8) * (1 + i * 0.1)),
        }));
    }

    private async getBookingsOverTime() {
        // Generate daily data for current month bookings chart
        const days: { day: number; thisMonth: number; lastMonth: number }[] = [];
        const totalBookings = await this.bookingsRepo.count();
        const avg = Math.max(Math.round(totalBookings / 30), 5);

        for (let d = 1; d <= 30; d++) {
            days.push({
                day: d,
                thisMonth: Math.round(avg * (0.6 + Math.random() * 0.8)),
                lastMonth: Math.round(avg * (0.4 + Math.random() * 0.6)),
            });
        }

        return days;
    }
}
