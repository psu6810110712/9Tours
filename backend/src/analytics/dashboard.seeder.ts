import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { TourView } from './entities/tour-view.entity';
import { Tour, TourType } from '../tours/entities/tour.entity';
import { TourSchedule } from '../tours/entities/tour-schedule.entity';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DashboardSeederService implements OnModuleInit {
    constructor(
        @InjectRepository(Tour)
        private toursRepo: Repository<Tour>,
        @InjectRepository(TourSchedule)
        private schedulesRepo: Repository<TourSchedule>,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        @InjectRepository(Booking)
        private bookingsRepo: Repository<Booking>,
        @InjectRepository(TourView)
        private tourViewsRepo: Repository<TourView>,
    ) { }

    async onModuleInit() {
        if (String(process.env.ENABLE_DEMO_DASHBOARD_SEED ?? '').trim().toLowerCase() !== 'true') {
            return;
        }

        try {
            // ── เช็คว่ามี tour ใน DB แล้วหรือยัง ──
            const tourCount = await this.toursRepo.count();
            if (tourCount > 0) {
                console.log(`✅ Dashboard seed: tours already exist (${tourCount}), skipping...`);
                return;
            }

            console.log('🌱 Dashboard seed: seeding sample data from tours-data.json...');

            // ──────── 1. อ่านข้อมูลจาก JSON ────────
            const dataPath = path.join(process.cwd(), 'tours-data.json');
            if (!fs.existsSync(dataPath)) {
                console.error('❌ Dashboard seed: tours-data.json not found!');
                return;
            }

            const rawData = fs.readFileSync(dataPath, 'utf-8');
            const toursList = JSON.parse(rawData);

            // ──────── 2. สร้าง Tours และ Schedules ตาม JSON ────────
            const savedTours: Tour[] = [];
            const allScheduleIds: number[] = [];

            for (const t of toursList) {
                // สร้าง Tour
                const tour = this.toursRepo.create({
                    id: t.id,
                    tourCode: t.tourCode,
                    name: t.name,
                    description: t.description,
                    tourType: t.tourType as TourType,
                    categories: t.categories || [],
                    price: t.price,
                    childPrice: t.childPrice || null,
                    originalPrice: t.originalPrice || null,
                    images: t.images || [],
                    highlights: t.highlights || [],
                    itinerary: t.itinerary || [],
                    transportation: t.transportation || '',
                    duration: t.duration || '',
                    region: t.region || '',
                    province: t.province || '',
                    accommodation: t.accommodation || null,
                    rating: t.rating || 0,
                    reviewCount: t.reviewCount || 0,
                    isActive: t.isActive !== undefined ? t.isActive : true,
                });

                const savedTour = await this.toursRepo.save(tour);
                savedTours.push(savedTour);

                // สร้าง Schedules
                if (t.schedules && Array.isArray(t.schedules)) {
                    for (const s of t.schedules) {
                        const schedule = this.schedulesRepo.create({
                            id: s.id,
                            tour: savedTour,
                            startDate: s.startDate,
                            endDate: s.endDate,
                            timeSlot: s.timeSlot || null,
                            roundName: s.roundName || null,
                            maxCapacity: s.maxCapacity || 20,
                            currentBooked: s.currentBooked || 0,
                        });
                        await this.schedulesRepo.save(schedule);
                        allScheduleIds.push(s.id);
                    }
                }
            }
            console.log(`   ✅ Seeded ${savedTours.length} tours and ${allScheduleIds.length} schedules`);

            // ──────── 3. สร้าง Users (customers) ────────
            const hashedPassword = await bcrypt.hash('password123', 10);

            let admin = await this.usersRepo.findOne({ where: { email: 'admin@9tours.com' } });
            if (!admin) {
                admin = await this.usersRepo.save({
                    name: 'Admin 9Tours',
                    email: 'admin@9tours.com',
                    phone: '081-000-0000',
                    password: hashedPassword,
                    role: UserRole.ADMIN,
                });
            }

            const customersData = [
                { name: 'สมชาย ใจดี', email: 'somchai@test.com', phone: '081-111-1111' },
                { name: 'สมหญิง จริงใจ', email: 'somying@test.com', phone: '082-222-2222' },
                { name: 'วิชัย มีสุข', email: 'wichai@test.com', phone: '083-333-3333' },
                { name: 'นภา สวัสดิ์', email: 'napa@test.com', phone: '084-444-4444' },
                { name: 'ธนา พัฒนา', email: 'tana@test.com', phone: '085-555-5555' },
                { name: 'มณี รักษ์', email: 'manee@test.com', phone: '086-666-6666' },
                { name: 'ประเสริฐ ศรีสุข', email: 'prasert@test.com', phone: '087-777-7777' },
                { name: 'กัญญา ดี', email: 'kanya@test.com', phone: '088-888-8888' },
            ];

            const savedCustomers: User[] = [];
            for (const c of customersData) {
                const existing = await this.usersRepo.findOne({ where: { email: c.email } });
                if (!existing) {
                    const user = await this.usersRepo.save({
                        ...c,
                        password: hashedPassword,
                        role: UserRole.CUSTOMER,
                    });
                    savedCustomers.push(user);
                } else {
                    savedCustomers.push(existing);
                }
            }
            console.log(`   ✅ Seeded ${savedCustomers.length} customers + admin`);

            // ──────── 4. สร้าง Bookings (ใช้ Schedule ID จริงจาก JSON) ────────
            const now = new Date();
            if (allScheduleIds.length > 0) {
                const statuses = [
                    BookingStatus.SUCCESS,
                    BookingStatus.SUCCESS,
                    BookingStatus.PENDING_PAYMENT,
                    BookingStatus.AWAITING_APPROVAL,
                    BookingStatus.CANCELED,
                    BookingStatus.SUCCESS,
                ];

                const bookingsToSave: Partial<Booking>[] = [];
                for (let i = 0; i < 40; i++) {
                    const customer = savedCustomers[i % savedCustomers.length];
                    // สุ่มเลือก schedule ที่มีอยู่จริง
                    const scheduleId = allScheduleIds[i % allScheduleIds.length];
                    const status = statuses[i % statuses.length];
                    const adults = Math.floor(Math.random() * 3) + 1;
                    const children = Math.floor(Math.random() * 2);

                    const daysAgo = Math.floor(Math.random() * 30);
                    const bookingDate = new Date(now);
                    bookingDate.setDate(bookingDate.getDate() - daysAgo);

                    bookingsToSave.push({
                        userId: customer.id as any,
                        scheduleId: scheduleId,
                        paxCount: adults + children,
                        adults,
                        children,
                        totalPrice: 2000 * (adults + children), // ราคาตัวอย่าง
                        status,
                        createdAt: bookingDate,
                    });
                }

                await this.bookingsRepo.save(bookingsToSave);
                console.log(`   ✅ Seeded ${bookingsToSave.length} bookings attached to real schedules`);
            }

            // ──────── 5. สร้าง TourViews ────────
            const viewsToSave: Partial<TourView>[] = [];
            for (let i = 0; i < 100; i++) {
                const tour = savedTours[i % savedTours.length];
                const customer = savedCustomers[i % savedCustomers.length];

                const daysAgo = Math.floor(Math.random() * 60);
                const viewDate = new Date(now);
                viewDate.setDate(viewDate.getDate() - daysAgo);

                viewsToSave.push({
                    tourId: tour.id,
                    userId: customer.id as any,
                    viewedAt: viewDate,
                    sessionId: `session_${i}_${Date.now()}`,
                });
            }

            await this.tourViewsRepo.save(viewsToSave);
            console.log(`   ✅ Seeded ${viewsToSave.length} tour views`);

            console.log('🎉 Dashboard seed: complete!');
        } catch (error) {
            console.error('❌ Dashboard seed error:', error);
        }
    }
}
