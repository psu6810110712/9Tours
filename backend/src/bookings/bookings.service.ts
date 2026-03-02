import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import * as fs from 'fs';
import * as path from 'path';

// === อ่าน tours-data.json (แหล่งข้อมูลเดียวกันกับ ToursService) ===
const DATA_FILE = path.join(process.cwd(), 'tours-data.json');

function loadToursData(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('❌ BookingsService: cannot read tours-data.json', e);
  }
  return [];
}

function persistToursData(tours: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tours, null, 2));
  } catch (e) {
    console.error('❌ BookingsService: cannot write tours-data.json', e);
  }
}

// ค้นหา schedule ใน JSON
function findScheduleInJson(scheduleId: number): { tour: any; schedule: any } | null {
  const tours = loadToursData();
  for (const tour of tours) {
    if (!tour.schedules) continue;
    const schedule = tour.schedules.find((s: any) => s.id === scheduleId);
    if (schedule) {
      return { tour, schedule };
    }
  }
  return null;
}

// อัปเดต currentBooked ของ schedule ใน JSON
function updateScheduleBookedCount(scheduleId: number, addPax: number) {
  const tours = loadToursData();
  for (const tour of tours) {
    if (!tour.schedules) continue;
    const schedule = tour.schedules.find((s: any) => s.id === scheduleId);
    if (schedule) {
      schedule.currentBooked = (schedule.currentBooked || 0) + addPax;
      persistToursData(tours);
      return;
    }
  }
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) { }

  async create(userId: number, createBookingDto: CreateBookingDto) {
    const { scheduleId, paxCount } = createBookingDto;

    // ค้นหา schedule จาก tours-data.json (แหล่งข้อมูลเดียวกันกับ ToursService)
    const found = findScheduleInJson(scheduleId);

    if (!found) {
      throw new NotFoundException('ไม่พบ Tour Schedule นี้');
    }

    const { tour, schedule } = found;

    // ตรวจสอบ capacity
    const currentBooked = schedule.currentBooked || 0;
    if (currentBooked + paxCount > schedule.maxCapacity) {
      const availableSlots = schedule.maxCapacity - currentBooked;
      throw new BadRequestException(
        `ที่ว่างไม่พอ มี ${availableSlots} ที่ว่าง แต่คุณต้องการ ${paxCount} ที่`,
      );
    }

    // คำนวณ total price
    const totalPrice = paxCount * tour.price;

    // สร้าง booking ใหม่  (เราเก็บ scheduleId ไว้เฉยๆ เพื่อ reference)
    const booking = this.bookingsRepository.create({
      userId,
      scheduleId,
      paxCount,
      totalPrice,
      status: BookingStatus.PENDING_PAYMENT,
    });

    // บันทึก booking ลง DB
    const savedBooking = await this.bookingsRepository.save(booking);

    // ⚠️ ไม่อัปเดต currentBooked ในขั้นนี้
    // เพราะ booking ยังอยู่ในสถานะ PENDING_PAYMENT
    // จะอัปเดตเมื่อ payment upload แล้ว (AWAITING_APPROVAL status)

    // คืนข้อมูล booking พร้อมข้อมูลทัวร์
    return {
      ...savedBooking,
      schedule: {
        ...schedule,
        tour: {
          id: tour.id,
          name: tour.name,
          price: tour.price,
          images: tour.images,
          accommodation: tour.accommodation || null,
        },
      },
    };
  }

  // สำหรับ Admin: ดึงรายการจองทั้งหมด (เพื่อตรวจสอบสลิป)
  async findAll() {
    const bookings = await this.bookingsRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['payments'],
    });

    return bookings.map((booking) => {
      const found = findScheduleInJson(booking.scheduleId);
      return {
        ...booking,
        schedule: found
          ? {
            ...found.schedule,
            tour: {
              id: found.tour.id,
              name: found.tour.name,
              price: found.tour.price,
            },
          }
          : null,
      };
    });
  }

  async getMyBookings(userId: number) {
    const bookings = await this.bookingsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['payments'],
    });

    // เติมข้อมูล schedule + tour จาก JSON
    return bookings.map((booking) => {
      const found = findScheduleInJson(booking.scheduleId);
      return {
        ...booking,
        schedule: found
          ? {
            ...found.schedule,
            tour: {
              id: found.tour.id,
              name: found.tour.name,
              price: found.tour.price,
              images: found.tour.images,
              accommodation: found.tour.accommodation || null,
            },
          }
          : null,
      };
    });
  }

  async updateStatus(bookingId: number, updateBookingStatusDto: UpdateBookingStatusDto, userId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('ไม่พบ Booking นี้');
    }

    // อัปเดต status
    booking.status = updateBookingStatusDto.status;
    const updated = await this.bookingsRepository.save(booking);

    // เติมข้อมูล schedule จาก JSON  
    const found = findScheduleInJson(updated.scheduleId);
    return {
      ...updated,
      schedule: found
        ? {
          ...found.schedule,
          tour: {
            id: found.tour.id,
            name: found.tour.name,
            price: found.tour.price,
            images: found.tour.images,
            accommodation: found.tour.accommodation || null,
          },
        }
        : null,
    };
  }

  async findOne(id: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['payments'],
    });

    if (!booking) {
      throw new NotFoundException('ไม่พบ Booking นี้');
    }

    const found = findScheduleInJson(booking.scheduleId);
    return {
      ...booking,
      schedule: found
        ? {
          ...found.schedule,
          tour: {
            id: found.tour.id,
            name: found.tour.name,
            price: found.tour.price,
            images: found.tour.images,
            accommodation: found.tour.accommodation || null,
          },
        }
        : null,
    };
  }

  async cancelBooking(bookingId: number, userId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('ไม่พบ Booking นี้');
    }

    if (booking.userId !== userId) {
      throw new UnauthorizedException('คุณไม่มีสิทธิ์ยกเลิก Booking นี้');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT && booking.status !== BookingStatus.AWAITING_APPROVAL) {
      throw new BadRequestException('สามารถยกเลิกได้เฉพาะรายการที่รอชำระเงินหรือรอการยืนยันเท่านั้น');
    }

    // อัปเดต status เป็น canceled
    booking.status = BookingStatus.CANCELED;
    const updated = await this.bookingsRepository.save(booking);

    // ✅ คืนจำนวนที่นั่งกลับไปที่ JSON เฉพาะเมื่อ booking มี status AWAITING_APPROVAL
    // (เนื่องจาก seats ลดลงไปแล้วเมื่อ payment upload)
    if (booking.status === BookingStatus.AWAITING_APPROVAL) {
      updateScheduleBookedCount(booking.scheduleId, -booking.paxCount);
    }

    const found = findScheduleInJson(updated.scheduleId);
    return {
      ...updated,
      schedule: found
        ? {
          ...found.schedule,
          tour: {
            id: found.tour.id,
            name: found.tour.name,
            price: found.tour.price,
            images: found.tour.images,
            accommodation: found.tour.accommodation || null,
          },
        }
        : null,
    };
  }
}
