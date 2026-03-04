import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { TourType } from './entities/tour.entity';

// ข้อมูล mock สำหรับ demo วันที่ 20 ก.พ.
// ถ้าทีม backend ทำ CRUD เสร็จแล้ว สามารถลบส่วนนี้แล้วเปลี่ยนไปใช้ DB จริงได้เลย
// ตำแหน่งไฟล์ฐานข้อมูลจำลอง
const DATA_FILE = path.join(process.cwd(), 'tours-data.json');

const INITIAL_DATA = [
  {
    id: 1,
    tourCode: '15012026001',
    name: 'เที่ยวภูเก็ต เมืองเก่า ถ่ายรูปคาเฟ่ทั้งวัน',
    description: 'เดินเล่นย่านเมืองเก่าภูเก็ต คาเฟ่สวย ๆ และแลนด์มาร์กยอดฮิตในวันเดียว',
    tourType: TourType.ONE_DAY,
    categories: ['สายคาเฟ่', 'สายชิล'],
    price: 2900,
    originalPrice: 3200,
    images: [
      'https://images.unsplash.com/photo-1541417904950-b855846fe074?w=800',
      'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800',
      'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
    ],
    highlights: ['บริการรถรับส่ง', 'รวมอาหารกลางวัน'],
    itinerary: [],
    transportation: 'รถตู้ปรับอากาศ',
    duration: '8 ชั่วโมง',
    region: 'ภาคใต้',
    province: 'ภูเก็ต',
    accommodation: null,
    rating: 4.3,
    reviewCount: 19,
    isActive: true,
    schedules: [
      {
        id: 101,
        tourId: 1,
        startDate: '2026-02-21',
        endDate: '2026-02-21',
        timeSlot: '09:00-17:00',
        roundName: 'รอบเช้า',
        maxCapacity: 20,
        currentBooked: 8,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    tourCode: '15012026002',
    name: 'ทัวร์เขื่อนเชี่ยวหลาน ล่องเรือ ชมหมอกตอนเช้า',
    description: 'ล่องเรือชมวิวเขื่อนเชี่ยวหลาน น้ำสีเขียวมรกต พร้อมกิจกรรมพายเรือคายัค',
    tourType: TourType.ONE_DAY,
    categories: ['สายธรรมชาติ', 'สายชิล'],
    price: 1800,
    originalPrice: 2100,
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
      'https://images.unsplash.com/photo-1504699894957-93f02c251aaa?w=800',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    ],
    highlights: ['ล่องเรือชมวิว', 'พายเรือคายัค'],
    itinerary: [],
    transportation: 'เรือหางยาว + รถตู้',
    duration: '8 ชั่วโมง',
    region: 'ภาคใต้',
    province: 'สุราษฎร์ธานี',
    accommodation: null,
    rating: 4.9,
    reviewCount: 95,
    isActive: true,
    schedules: [
      {
        id: 201,
        tourId: 2,
        startDate: '2026-02-22',
        endDate: '2026-02-22',
        timeSlot: '08:00-16:00',
        roundName: 'รอบปกติ',
        maxCapacity: 25,
        currentBooked: 11,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    tourCode: '20012026003',
    name: 'แพ็คเกจเชียงใหม่ 3 วัน 2 คืน ชมดอยอินทนนท์',
    description: 'เที่ยวเชียงใหม่ครบทั้งดอยวัดคาเฟ่ ที่พักสบายย่านนิมมาน',
    tourType: TourType.PACKAGE,
    categories: ['สายธรรมชาติ', 'สายชิล'],
    price: 6900,
    originalPrice: 7500,
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
      'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    ],
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
    schedules: [
      {
        id: 301,
        tourId: 3,
        startDate: '2026-02-24',
        endDate: '2026-02-26',
        timeSlot: null,
        roundName: 'แพ็กเกจ 3 วัน 2 คืน',
        maxCapacity: 15,
        currentBooked: 6,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    tourCode: '25012026004',
    name: 'เกาะพีพี ดำน้ำดูปะการัง เต็มวัน',
    description: 'นั่งสปีดโบ๊ทไปเกาะพีพี ดำน้ำ 2 จุด พร้อมอาหารกลางวันบุฟเฟ่ต์',
    tourType: TourType.ONE_DAY,
    categories: ['สายกิจกรรม', 'สายธรรมชาติ'],
    price: 2300,
    originalPrice: null,
    images: [
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800',
      'https://images.unsplash.com/photo-1518990034670-3eb04d6ea23b?w=800',
    ],
    highlights: ['ดำน้ำดูปะการัง', 'รวมอุปกรณ์ดำน้ำ'],
    itinerary: [],
    transportation: 'สปีดโบ๊ท',
    duration: '8 ชั่วโมง',
    region: 'ภาคใต้',
    province: 'ภูเก็ต',
    accommodation: null,
    rating: 4.5,
    reviewCount: 65,
    isActive: true,
    schedules: [
      {
        id: 401,
        tourId: 4,
        startDate: '2026-02-23',
        endDate: '2026-02-23',
        timeSlot: '10:00-18:00',
        roundName: 'รอบทะเลสวย',
        maxCapacity: 18,
        currentBooked: 18,
      },
      {
        id: 402,
        tourId: 4,
        startDate: '2026-02-25',
        endDate: '2026-02-25',
        timeSlot: '10:00-18:00',
        roundName: 'รอบพิเศษ',
        maxCapacity: 18,
        currentBooked: 9,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    tourCode: 'ATV2026005',
    name: 'ขับ ATV ตะลุยป่า ภูเก็ต (Join Trip)',
    description: 'ผจญภัยขับ ATV เส้นทางธรรมชาติ วิวทะเลและภูเขา พร้อมครูฝึกดูแลอย่างใกล้ชิด',
    tourType: TourType.ONE_DAY,
    categories: ['สายลุย', 'สายกิจกรรม'],
    price: 1500,
    originalPrice: 1900,
    images: [
      'https://images.unsplash.com/photo-1616174783309-8f388da5362e?w=800',
      'https://images.unsplash.com/photo-1599557291771-859a1a457c13?w=800',
      'https://images.unsplash.com/photo-1533230676263-5464731df400?w=800',
      'https://images.unsplash.com/photo-1596489438096-76472304859a?w=800',
      'https://images.unsplash.com/photo-1570460984850-629851722e13?w=800',
    ],
    highlights: ['ขับ ATV 1 ชั่วโมง', 'รวมอุปกรณ์ความปลอดภัย', 'ครูฝึกมืออาชีพ'],
    itinerary: [],
    transportation: 'รถรับส่งในโซน',
    duration: '4 ชั่วโมง',
    region: 'ภาคใต้',
    province: 'ภูเก็ต',
    accommodation: null,
    rating: 4.8,
    reviewCount: 42,
    isActive: true,
    schedules: [
      {
        id: 501,
        tourId: 5,
        startDate: '2026-02-25',
        endDate: '2026-02-25',
        timeSlot: '08:00-12:00',
        roundName: 'รอบเช้า',
        maxCapacity: 10,
        currentBooked: 2,
      },
      {
        id: 502,
        tourId: 5,
        startDate: '2026-02-25',
        endDate: '2026-02-25',
        timeSlot: '13:00-17:00',
        roundName: 'รอบบ่าย',
        maxCapacity: 10,
        currentBooked: 8,
      },
      {
        id: 503,
        tourId: 5,
        startDate: '2026-02-26',
        endDate: '2026-02-26',
        timeSlot: '08:00-12:00',
        roundName: 'รอบเช้า',
        maxCapacity: 10,
        currentBooked: 0,
      },
      {
        id: 504,
        tourId: 5,
        startDate: '2026-02-26',
        endDate: '2026-02-26',
        timeSlot: '13:00-17:00',
        roundName: 'รอบบ่าย',
        maxCapacity: 10,
        currentBooked: 5,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// โหลดข้อมูล (ใส่ Type any[] เพื่อป้องกัน TS Error 'never[]')
let DEMO_TOURS: any[] = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    DEMO_TOURS = JSON.parse(raw);
    console.log('✅ Loaded tours from database file');
  } else {
    DEMO_TOURS = INITIAL_DATA;
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEMO_TOURS, null, 2));
  }
} catch (error) {
  DEMO_TOURS = INITIAL_DATA;
}

// ฟังก์ชันเซฟข้อมูล
const persistData = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEMO_TOURS, null, 2));
  } catch (error) {
    console.error('❌ Save error:', error);
  }
};

// โหลดข้อมูลใหม่จากไฟล์ (เพื่ออ่านค่า currentBooked ล่าสุดที่ถูก bookings.service อัปเดต)
const reloadTours = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      DEMO_TOURS = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('❌ reloadTours error:', e);
  }
};

@Injectable()
export class ToursService {
  private nextId = Math.max(...DEMO_TOURS.map(t => t.id), 99) + 1;
  private codeSeq = DEMO_TOURS.length + 1;

  // สร้างรหัสทัวร์: DDMMYYYY + ลำดับ 3 หลัก เช่น 19022026005
  private makeTourCode(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const seq = String(this.codeSeq++).padStart(3, '0');
    return `${dd}${mm}${d.getFullYear()}${seq}`;
  }

  create(dto: CreateTourDto) {
    const newTour = {
      id: this.nextId++,
      tourCode: this.makeTourCode(),
      name: dto.name,
      description: dto.description,
      tourType: dto.tourType as unknown as TourType,
      categories: dto.categories || [],
      price: Number(dto.price),
      childPrice: dto.childPrice ? Number(dto.childPrice) : null,
      minPeople: dto.minPeople ? Number(dto.minPeople) : null,
      maxPeople: dto.maxPeople ? Number(dto.maxPeople) : null,
      originalPrice: dto.originalPrice ? Number(dto.originalPrice) : null,
      images: dto.images || [],
      highlights: dto.highlights || [],
      itinerary: dto.itinerary || [],
      transportation: dto.transportation || '',
      duration: dto.duration,
      region: dto.region,
      province: dto.province,
      accommodation: dto.accommodation || null,
      rating: 0,
      reviewCount: 0,
      isActive: true,
      schedules: (dto.schedules || []).map((s, i) => ({
        id: this.nextId * 100 + i,
        tourId: this.nextId - 1,
        startDate: s.startDate,
        endDate: s.endDate,
        timeSlot: (s as any).timeSlot || '',
        roundName: (s as any).roundName || '',
        maxCapacity: Number(s.maxCapacity),
        currentBooked: 0,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // cast เป็น any เพราะ TypeScript infer type ของ DEMO_TOURS จาก literal values
    // ทำให้ originalPrice: number | null ไม่ตรงกับ type ที่ infer ไว้
    DEMO_TOURS.push(newTour as any);
    persistData();
    return newTour;
  }

  // admin=true จะ return ทุกทัวร์ รวมที่ปิดใช้งาน
  findAll(filters?: {
    region?: string;
    province?: string;
    tourType?: string;
    search?: string;
    admin?: string;
  }) {
    reloadTours(); // โหลดข้อมูลล่าสุดจากไฟล์
    const { region, province, tourType, search, admin } = filters || {};

    let result = admin === 'true'
      ? [...DEMO_TOURS]
      : DEMO_TOURS.filter((t) => t.isActive);

    if (region) {
      result = result.filter((t) => t.region === region);
    }
    if (province) {
      result = result.filter((t) => t.province === province);
    }
    if (tourType) {
      result = result.filter((t) => t.tourType === tourType);
    }
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.province.includes(search),
      );
    }

    return result;
  }

  findOne(id: number) {
    reloadTours(); // โหลดข้อมูลล่าสุดจากไฟล์
    return DEMO_TOURS.find((t) => t.id === id) || null;
  }

  getAvailableSeats(tourId: number, scheduleId: number) {
    reloadTours(); // โหลดข้อมูลล่าสุดจากไฟล์
    const tour = DEMO_TOURS.find((t) => t.id === tourId);
    if (!tour) {
      throw new Error(`Tour ${tourId} not found`);
    }

    const schedule = tour.schedules.find((s: any) => s.id === scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found for tour ${tourId}`);
    }

    const currentBooked = schedule.currentBooked || 0;
    const availableSeats = schedule.maxCapacity - currentBooked;

    return {
      tourId,
      scheduleId,
      maxCapacity: schedule.maxCapacity,
      currentBooked,
      availableSeats,
      isFull: availableSeats <= 0,
    };
  }

  update(id: number, dto: UpdateTourDto) {
    const tour = DEMO_TOURS.find((t) => t.id === id);
    if (!tour) return null;

    // แยก schedules ออกจาก dto เพื่อไม่ให้ Object.assign ลบ schedules เดิมทิ้ง
    const { schedules: newSchedules, ...rest } = dto as any;
    Object.assign(tour, rest, { updatedAt: new Date() });

    // ถ้า frontend ส่ง schedules มา → สร้าง schedules ใหม่ทั้งชุด
    if (newSchedules && Array.isArray(newSchedules)) {
      tour.schedules = newSchedules.map((s: any, i: number) => ({
        id: tour.id * 100 + i,
        tourId: tour.id,
        startDate: s.startDate,
        endDate: s.endDate,
        timeSlot: s.timeSlot || '',
        roundName: s.roundName || '',
        maxCapacity: Number(s.maxCapacity),
        currentBooked: 0,
      }));
    }

    persistData();
    return tour;
  }

  remove(id: number) {
    const tour = DEMO_TOURS.find((t) => t.id === id);
    if (!tour) return null;
    // soft delete: ซ่อนจากหน้าผู้ใช้ แต่ admin ยังเห็น
    tour.isActive = false;
    persistData();
    return { id, deleted: true };
  }
}
