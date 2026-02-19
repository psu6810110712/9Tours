import { Injectable } from '@nestjs/common';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour, TourType } from './entities/tour.entity';

// ข้อมูล mock สำหรับ demo วันที่ 20 ก.พ.
// ถ้าทีม backend ทำ CRUD เสร็จแล้ว สามารถลบส่วนนี้แล้วเปลี่ยนไปใช้ DB จริงได้เลย
const DEMO_TOURS = [
  {
    id: 1,
    name: 'เที่ยวภูเก็ต เมืองเก่า ถ่ายรูปคาเฟ่ทั้งวัน',
    description: 'เดินเล่นย่านเมืองเก่าภูเก็ต คาเฟ่สวย ๆ และแลนด์มาร์กยอดฮิตในวันเดียว',
    tourType: TourType.ONE_DAY,
    categories: ['สายคาเฟ่', 'สายชิล'],
    price: 2900,
    originalPrice: 3200,
    images: [
      'https://images.unsplash.com/photo-1541417904950-b855846fe074?w=800',
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
    name: 'ทัวร์เขื่อนเชี่ยวหลาน ล่องเรือ ชมหมอกตอนเช้า',
    description: 'ล่องเรือชมวิวเขื่อนเชี่ยวหลาน น้ำสีเขียวมรกต พร้อมกิจกรรมพายเรือคายัค',
    tourType: TourType.ONE_DAY,
    categories: ['สายธรรมชาติ', 'สายชิล'],
    price: 1800,
    originalPrice: 2100,
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
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
    name: 'แพ็คเกจเชียงใหม่ 3 วัน 2 คืน ชมดอยอินทนนท์',
    description: 'เที่ยวเชียงใหม่ครบทั้งดอยวัดคาเฟ่ ที่พักสบายย่านนิมมาน',
    tourType: TourType.PACKAGE,
    categories: ['สายธรรมชาติ', 'สายชิล'],
    price: 6900,
    originalPrice: 7500,
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
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
    name: 'เกาะพีพี ดำน้ำดูปะการัง เต็มวัน',
    description: 'นั่งสปีดโบ๊ทไปเกาะพีพี ดำน้ำ 2 จุด พร้อมอาหารกลางวันบุฟเฟ่ต์',
    tourType: TourType.ONE_DAY,
    categories: ['สายกิจกรรม', 'สายธรรมชาติ'],
    price: 2300,
    originalPrice: null,
    images: [
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800',
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
];

@Injectable()
export class ToursService {
  // ตัวนับ id สำหรับทัวร์ใหม่
  private nextId = 100;

  create(dto: CreateTourDto) {
    const newTour = {
      id: this.nextId++,
      name: dto.name,
      description: dto.description,
      tourType: dto.tourType as unknown as TourType,
      categories: dto.categories || [],
      price: Number(dto.price),
      originalPrice: dto.originalPrice ? Number(dto.originalPrice) : null,
      images: dto.images || [],
      highlights: dto.highlights || [],
      itinerary: [],
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
        timeSlot: null,
        roundName: null,
        maxCapacity: Number(s.maxCapacity),
        currentBooked: 0,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // cast เป็น any เพราะ TypeScript infer type ของ DEMO_TOURS จาก literal values
    // ทำให้ originalPrice: number | null ไม่ตรงกับ type ที่ infer ไว้
    DEMO_TOURS.push(newTour as any);
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
    return DEMO_TOURS.find((t) => t.id === id) || null;
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
        timeSlot: null,
        roundName: null,
        maxCapacity: Number(s.maxCapacity),
        currentBooked: 0,
      }));
    }

    return tour;
  }

  remove(id: number) {
    const tour = DEMO_TOURS.find((t) => t.id === id);
    if (!tour) return null;
    // soft delete: ซ่อนจากหน้าผู้ใช้ แต่ admin ยังเห็น
    tour.isActive = false;
    return { id, deleted: true };
  }
}
