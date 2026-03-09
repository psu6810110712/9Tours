import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { TourView } from './entities/tour-view.entity';
import { Tour, TourType } from '../tours/entities/tour.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DashboardSeederService implements OnModuleInit {
    constructor(
        @InjectRepository(Tour)
        private toursRepo: Repository<Tour>,
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        @InjectRepository(Booking)
        private bookingsRepo: Repository<Booking>,
        @InjectRepository(TourView)
        private tourViewsRepo: Repository<TourView>,
    ) { }

    async onModuleInit() {
        try {
            // ── เช็คว่ามี tour ใน DB แล้วหรือยัง ──
            const tourCount = await this.toursRepo.count();
            if (tourCount > 0) {
                console.log(`✅ Dashboard seed: tours already exist (${tourCount}), skipping...`);
                return;
            }

            console.log('🌱 Dashboard seed: seeding sample data...');

            // ──────── 1. สร้าง Tours ────────
            const toursData: Partial<Tour>[] = [
                {
                    tourCode: '15012026001',
                    name: 'เที่ยวภูเก็ต เมืองเก่า ถ่ายรูปคาเฟ่ทั้งวัน',
                    description: 'เดินเล่นย่านเมืองเก่าภูเก็ต คาเฟ่สวย ๆ และแลนด์มาร์กยอดฮิตในวันเดียว',
                    tourType: TourType.ONE_DAY,
                    categories: ['สายคาเฟ่', 'สายชิล'],
                    price: 2900,
                    originalPrice: 3200,
                    images: ['https://images.unsplash.com/photo-1541417904950-b855846fe074?w=800'],
                    highlights: ['บริการรถรับส่ง', 'รวมอาหารกลางวัน'],
                    itinerary: [],
                    transportation: 'รถตู้ปรับอากาศ',
                    duration: '8 ชั่วโมง',
                    region: 'ภาคใต้',
                    province: 'ภูเก็ต',
                    rating: 4.3,
                    reviewCount: 19,
                    isActive: true,
                },
                {
                    tourCode: '15012026002',
                    name: 'ทัวร์เขื่อนเชี่ยวหลาน ล่องเรือ ชมหมอกตอนเช้า',
                    description: 'ล่องเรือชมวิวเขื่อนเชี่ยวหลาน น้ำสีเขียวมรกต พร้อมกิจกรรมพายเรือคายัค',
                    tourType: TourType.ONE_DAY,
                    categories: ['สายธรรมชาติ', 'สายชิล'],
                    price: 1800,
                    originalPrice: 2100,
                    images: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800'],
                    highlights: ['ล่องเรือชมวิว', 'พายเรือคายัค'],
                    itinerary: [],
                    transportation: 'เรือหางยาว + รถตู้',
                    duration: '8 ชั่วโมง',
                    region: 'ภาคใต้',
                    province: 'สุราษฎร์ธานี',
                    rating: 4.9,
                    reviewCount: 95,
                    isActive: true,
                },
                {
                    tourCode: '20012026003',
                    name: 'แพ็คเกจเชียงใหม่ 3 วัน 2 คืน ชมดอยอินทนนท์',
                    description: 'เที่ยวเชียงใหม่ครบทั้งดอยวัดคาเฟ่ ที่พักสบายย่านนิมมาน',
                    tourType: TourType.PACKAGE,
                    categories: ['สายธรรมชาติ', 'สายชิล'],
                    price: 6900,
                    originalPrice: 7500,
                    images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'],
                    highlights: ['รวมที่พัก', 'รถรับส่งสนามบิน'],
                    itinerary: [],
                    transportation: 'รถตู้ส่วนตัว',
                    duration: '3 วัน 2 คืน',
                    region: 'ภาคเหนือ',
                    province: 'เชียงใหม่',
                    accommodation: 'โรงแรม 3 ดาว ย่านนิมมาน',
                    rating: 4.7,
                    reviewCount: 48,
                    isActive: true,
                },
                {
                    tourCode: '25012026004',
                    name: 'เกาะพีพี ดำน้ำดูปะการัง เต็มวัน',
                    description: 'นั่งสปีดโบ๊ทไปเกาะพีพี ดำน้ำ 2 จุด พร้อมอาหารกลางวันบุฟเฟ่ต์',
                    tourType: TourType.ONE_DAY,
                    categories: ['สายกิจกรรม', 'สายธรรมชาติ'],
                    price: 2300,
                    images: ['https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800'],
                    highlights: ['ดำน้ำดูปะการัง', 'รวมอุปกรณ์ดำน้ำ'],
                    itinerary: [],
                    transportation: 'สปีดโบ๊ท',
                    duration: '8 ชั่วโมง',
                    region: 'ภาคใต้',
                    province: 'กระบี่',
                    rating: 4.5,
                    reviewCount: 65,
                    isActive: true,
                },
                {
                    tourCode: 'ATV2026005',
                    name: 'ขับ ATV ตะลุยป่า ภูเก็ต',
                    description: 'ผจญภัยขับ ATV เส้นทางธรรมชาติ วิวทะเลและภูเขา',
                    tourType: TourType.ONE_DAY,
                    categories: ['สายลุย', 'สายกิจกรรม'],
                    price: 1500,
                    originalPrice: 1900,
                    images: ['https://images.unsplash.com/photo-1616174783309-8f388da5362e?w=800'],
                    highlights: ['ขับ ATV 1 ชั่วโมง', 'รวมอุปกรณ์ความปลอดภัย'],
                    itinerary: [],
                    transportation: 'รถรับส่งในโซน',
                    duration: '4 ชั่วโมง',
                    region: 'ภาคใต้',
                    province: 'ภูเก็ต',
                    rating: 4.8,
                    reviewCount: 42,
                    isActive: true,
                },
                {
                    tourCode: 'CNX2026006',
                    name: 'วันเดย์ทริป เชียงราย วัดร่องขุ่น บ้านดำ',
                    description: 'เที่ยวเชียงรายแบบจัดเต็ม วัดร่องขุ่น บ้านดำ สิงห์ปาร์ค',
                    tourType: TourType.ONE_DAY,
                    categories: ['สายวัฒนธรรม'],
                    price: 2200,
                    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=800'],
                    highlights: ['วัดร่องขุ่น', 'บ้านดำ', 'สิงห์ปาร์ค'],
                    itinerary: [],
                    transportation: 'รถตู้ปรับอากาศ',
                    duration: '10 ชั่วโมง',
                    region: 'ภาคเหนือ',
                    province: 'เชียงราย',
                    rating: 4.6,
                    reviewCount: 33,
                    isActive: true,
                },
                {
                    tourCode: 'KAN2026007',
                    name: 'แพ็คเกจกาญจนบุรี 2 วัน 1 คืน ล่องแพ',
                    description: 'ล่องแพริมแม่น้ำแคว พักแพริมน้ำ กิจกรรมสนุกสนาน',
                    tourType: TourType.PACKAGE,
                    categories: ['สายธรรมชาติ', 'สายชิล'],
                    price: 3500,
                    originalPrice: 4200,
                    images: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800'],
                    highlights: ['ล่องแพ', 'พักแพริมน้ำ'],
                    itinerary: [],
                    transportation: 'รถตู้ปรับอากาศ',
                    duration: '2 วัน 1 คืน',
                    region: 'ภาคตะวันตก',
                    province: 'กาญจนบุรี',
                    accommodation: 'แพริมน้ำแคว',
                    rating: 4.4,
                    reviewCount: 27,
                    isActive: true,
                },
            ];

            const savedTours = await this.toursRepo.save(toursData);
            console.log(`   ✅ Seeded ${savedTours.length} tours`);

            // ──────── 2. สร้าง Users (customers) ────────
            const hashedPassword = await bcrypt.hash('password123', 10);

            // เช็คว่ามี admin อยู่แล้วหรือยัง ถ้าไม่มีให้สร้าง
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

            // ──────── 3. สร้าง Bookings ────────
            const now = new Date();
            const statuses = [
                BookingStatus.SUCCESS,
                BookingStatus.SUCCESS,
                BookingStatus.SUCCESS,
                BookingStatus.PENDING_PAYMENT,
                BookingStatus.AWAITING_APPROVAL,
                BookingStatus.CANCELED,
                BookingStatus.REFUND_PENDING,
                BookingStatus.SUCCESS,
            ];

            const bookingsToSave: Partial<Booking>[] = [];
            for (let i = 0; i < 30; i++) {
                const customer = savedCustomers[i % savedCustomers.length];
                const tour = savedTours[i % savedTours.length];
                const status = statuses[i % statuses.length];
                const adults = Math.floor(Math.random() * 3) + 1;
                const children = Math.floor(Math.random() * 2);

                // สร้างวันที่กระจายใน 60 วันที่ผ่านมา
                const daysAgo = Math.floor(Math.random() * 60);
                const bookingDate = new Date(now);
                bookingDate.setDate(bookingDate.getDate() - daysAgo);

                bookingsToSave.push({
                    userId: customer.id as any,
                    scheduleId: tour.id * 100, // อ้างอิงไปที่ schedule
                    paxCount: adults + children,
                    adults,
                    children,
                    totalPrice: Number(tour.price) * adults + Number(tour.price) * 0.5 * children,
                    status,
                    createdAt: bookingDate,
                });
            }

            await this.bookingsRepo.save(bookingsToSave);
            console.log(`   ✅ Seeded ${bookingsToSave.length} bookings`);

            // ──────── 4. สร้าง TourViews ────────
            const viewsToSave: Partial<TourView>[] = [];
            for (let i = 0; i < 120; i++) {
                const tour = savedTours[i % savedTours.length];
                const customer = savedCustomers[i % savedCustomers.length];

                // กระจายใน 6 เดือนที่ผ่านมา
                const daysAgo = Math.floor(Math.random() * 180);
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
