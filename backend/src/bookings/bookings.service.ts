import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';


import { ToursService } from '../tours/tours.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private toursService: ToursService, // ✅ เพิ่ม ToursService
  ) { }

  // ดึงข้อมูลทัวร์จาก ToursService
  private findScheduleInData(scheduleId: number): { tour: any; schedule: any } | null {
    const tours = this.toursService.findAll({ admin: 'true' });
    for (const tour of tours) {
      if (!tour.schedules) continue;
      const schedule = tour.schedules.find((s: any) => s.id === scheduleId);
      if (schedule) {
        return { tour, schedule };
      }
    }
    return null;
  }

  // ระบบคืนที่นั่งอัตโนมัติ: ทำงานทุก 1 นาที ตรวจสอบ booking ที่ค้างเกิน 18 นาที
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredBookings() {
    const cutoffTime = new Date(Date.now() - 18 * 60 * 1000);

    const expiredBookings = await this.bookingsRepository.find({
      where: {
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: LessThan(cutoffTime),
      },
    });

    if (expiredBookings.length === 0) return;

    for (const booking of expiredBookings) {
      if (booking.status !== BookingStatus.PENDING_PAYMENT) continue;

      booking.status = BookingStatus.CANCELED;
      booking.adminNotes = 'ระบบยกเลิกอัตโนมัติเนื่องจากเกินกำหนดชำระเงิน (18 นาที)';
      await this.bookingsRepository.save(booking);

      const found = this.findScheduleInData(booking.scheduleId);
      if (found) {
        const { tour, schedule } = found;
        const isPrivate = !!tour.minPeople;
        const seatsToRelease = isPrivate ? schedule.maxCapacity : booking.paxCount;
        this.toursService.updateScheduleBookedCount(booking.scheduleId, -seatsToRelease);
        console.log(`[Cron] ยกเลิกการจอง ID ${booking.id} และคืนที่นั่ง ${seatsToRelease} ที่`);
      }
    }
  }

  async create(userId: number, createBookingDto: CreateBookingDto) {
    const { scheduleId, adults = 1, children = 0 } = createBookingDto;

    const paxCount = adults + children;

    const found = this.findScheduleInData(scheduleId);

    if (!found) {
      throw new NotFoundException('ไม่พบ Tour Schedule นี้');
    }

    const { tour, schedule } = found;
    const isPrivate = !!tour.minPeople;

    // ตรวจสอบว่าผู้ใช้มี booking ค้างชำระอยู่หรือไม่ (ป้องกันการจองซ้อนทุกกรณี ไม่ว่าจะทัวร์ไหน)
    const existingPendingBooking = await this.bookingsRepository.findOne({
      where: {
        userId,
        status: BookingStatus.PENDING_PAYMENT,
      },
    });
    if (existingPendingBooking) {
      throw new BadRequestException('คุณมีรายการรอชำระเงินอยู่ กรุณาชำระเงินหรือยกเลิกรายการดังกล่าวให้เสร็จสมบูรณ์ก่อนเริ่มการจองใหม่');
    }

    // ตรวจสอบการจองซ้ำ: แยกตรรกะ Join Tour กับ Private Tour
    if (isPrivate) {
      // Private Tour: บล็อกจองซ้ำถ้ามี booking active อยู่แล้ว (ทุกสถานะยกเว้น canceled/refund)
      const existingBooking = await this.bookingsRepository.findOne({
        where: {
          userId,
          scheduleId,
          status: Not(In([BookingStatus.CANCELED, BookingStatus.REFUND_COMPLETED])),
        },
      });
      if (existingBooking) {
        throw new BadRequestException('คุณมีการจองรอบนี้อยู่แล้ว ไม่สามารถจองซ้ำได้');
      }
    }

    // Hold seat: Private = เต็มทั้งรอบ, Join = ตามจำนวนคน
    const seatsToHold = isPrivate ? schedule.maxCapacity : paxCount;
    const currentBooked = Math.max(0, schedule.currentBooked || 0);
    if (currentBooked + seatsToHold > schedule.maxCapacity) {
      const availableSlots = schedule.maxCapacity - currentBooked;
      throw new BadRequestException(
        isPrivate
          ? 'รอบนี้ถูกจองแล้ว'
          : `คุณสามารถจองได้สูงสุด ${availableSlots} ที่`,
      );
    }

    // คำนวณ total price — แยก Join (ราคาต่อคน) vs Private (ราคาเหมา)
    let totalPrice: number;
    if (isPrivate) {
      totalPrice = Number(tour.price);
    } else {
      const childPrice = tour.childPrice ?? tour.price;
      totalPrice = (adults * tour.price) + (children * childPrice);
    }

    // สร้าง booking
    const booking = this.bookingsRepository.create({
      userId,
      scheduleId,
      paxCount,
      adults,
      children,
      totalPrice,
      status: BookingStatus.PENDING_PAYMENT,
    });

    const savedBooking = await this.bookingsRepository.save(booking);

    // Hold seat ทันที
    this.toursService.updateScheduleBookedCount(scheduleId, seatsToHold);

    // คืนข้อมูล booking พร้อมข้อมูลทัวร์
    return {
      ...savedBooking,
      schedule: {
        ...schedule,
        tour: {
          id: tour.id,
          tourCode: tour.tourCode,
          name: tour.name,
          price: tour.price,
          childPrice: tour.childPrice,
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
      relations: ['payments', 'user'],
    });

    return bookings.map((booking) => {
      const found = this.findScheduleInData(booking.scheduleId);
      return {
        ...booking,
        schedule: found
          ? {
            ...found.schedule,
            tour: {
              id: found.tour.id,
              tourCode: found.tour.tourCode,
              name: found.tour.name,
              price: found.tour.price,
              childPrice: found.tour.childPrice,
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
      const found = this.findScheduleInData(booking.scheduleId);
      return {
        ...booking,
        schedule: found
          ? {
            ...found.schedule,
            tour: {
              id: found.tour.id,
              tourCode: found.tour.tourCode,
              name: found.tour.name,
              price: found.tour.price,
              childPrice: found.tour.childPrice,
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

    const previousStatus = booking.status;
    const newStatus = updateBookingStatusDto.status;

    if (newStatus === BookingStatus.CANCELED && previousStatus !== BookingStatus.CANCELED) {
      const found = this.findScheduleInData(booking.scheduleId);
      if (found) {
        const isPrivate = !!found.tour.minPeople;
        const seatsToRelease = isPrivate ? found.schedule.maxCapacity : booking.paxCount;
        this.toursService.updateScheduleBookedCount(booking.scheduleId, -seatsToRelease);
      }
    }

    booking.status = newStatus;
    const updated = await this.bookingsRepository.save(booking);

    const found = this.findScheduleInData(updated.scheduleId);
    return {
      ...updated,
      schedule: found
        ? {
          ...found.schedule,
          tour: {
            id: found.tour.id,
            tourCode: found.tour.tourCode,
            name: found.tour.name,
            price: found.tour.price,
            childPrice: found.tour.childPrice,
            images: found.tour.images,
            accommodation: found.tour.accommodation || null,
          },
        }
        : null,
    };
  }

  // D1: เช็คเจ้าของ Booking — ผู้ใช้ดูได้เฉพาะ booking ของตัวเอง
  async findOne(id: number, userId?: number, isAdmin?: boolean) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['payments'],
    });

    if (!booking) {
      throw new NotFoundException('ไม่พบ Booking นี้');
    }

    // ถ้าไม่ใช่ admin ต้องเป็นเจ้าของเท่านั้น
    if (!isAdmin && userId && booking.userId !== userId) {
      throw new UnauthorizedException('คุณไม่มีสิทธิ์เข้าถึง Booking นี้');
    }

    const found = this.findScheduleInData(booking.scheduleId);
    return {
      ...booking,
      schedule: found
        ? {
          ...found.schedule,
          tour: {
            id: found.tour.id,
            tourCode: found.tour.tourCode,
            name: found.tour.name,
            price: found.tour.price,
            childPrice: found.tour.childPrice,
            minPeople: found.tour.minPeople || null,
            maxPeople: found.tour.maxPeople || null,
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

    // อนุญาตยกเลิกได้ทั้ง PENDING_PAYMENT, AWAITING_APPROVAL, SUCCESS
    const cancellableStatuses = [BookingStatus.PENDING_PAYMENT, BookingStatus.AWAITING_APPROVAL, BookingStatus.SUCCESS];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException('สามารถยกเลิกได้เฉพาะรายการที่รอชำระเงิน รอตรวจสอบ หรือสำเร็จเท่านั้น');
    }

    booking.status = BookingStatus.CANCELED;
    const updated = await this.bookingsRepository.save(booking);

    // คืน seat กลับทุกกรณี (เพราะ hold ตั้งแต่สร้าง booking)
    const foundForCancel = this.findScheduleInData(booking.scheduleId);
    if (foundForCancel) {
      const isPrivate = !!foundForCancel.tour.minPeople;
      const seatsToRelease = isPrivate ? foundForCancel.schedule.maxCapacity : booking.paxCount;
      this.toursService.updateScheduleBookedCount(booking.scheduleId, -seatsToRelease);
    }

    const found = this.findScheduleInData(updated.scheduleId);
    return {
      ...updated,
      schedule: found
        ? {
          ...found.schedule,
          tour: {
            id: found.tour.id,
            tourCode: found.tour.tourCode,
            name: found.tour.name,
            price: found.tour.price,
            childPrice: found.tour.childPrice,
            images: found.tour.images,
            accommodation: found.tour.accommodation || null,
          },
        }
        : null,
    };
  }
}
