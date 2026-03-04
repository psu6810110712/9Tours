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

// ไม่ต้องอ่าน tours-data.json ตรงๆ แล้ว เพราะจะใช้ข้อมูลจาก ToursService ที่มี Cache ใน Memory

import { ToursService } from '../tours/tours.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private toursService: ToursService, // ✅ เพิ่ม ToursService
  ) { }

  // ดึงข้อมูลทัวร์จาก ToursService แทนการอ่านไฟล์ตรงๆ
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

  async create(userId: number, createBookingDto: CreateBookingDto) {
    const { scheduleId, paxCount } = createBookingDto;

    // ค้นหา schedule จาก ToursService (ใช้ตัวเดียวกับ frontend)
    const found = this.findScheduleInData(scheduleId);

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
      const found = this.findScheduleInData(booking.scheduleId);
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
      const found = this.findScheduleInData(booking.scheduleId);
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

    // ✅ ลดจำนวนที่นั่งลงในเมื่ออัปเดตเป็น AWAITING_APPROVAL
    if (updateBookingStatusDto.status === BookingStatus.AWAITING_APPROVAL && booking.status !== BookingStatus.AWAITING_APPROVAL) {
      this.toursService.updateScheduleBookedCount(booking.scheduleId, booking.paxCount);
    }

    // อัปเดต status
    booking.status = updateBookingStatusDto.status;
    const updated = await this.bookingsRepository.save(booking);

    // เติมข้อมูล schedule จาก JSON  
    const found = this.findScheduleInData(updated.scheduleId);
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

    const found = this.findScheduleInData(booking.scheduleId);
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

    // ✅ คืนจำนวนที่นั่งกลับไปที่ JSON เฉพาะเมื่อ booking มี status AWAITING_APPROVAL
    // (เนื่องจาก seats ลดลงไปแล้วเมื่อ payment upload)
    // ต้องเช็คก่อนเปลี่ยน status
    if (booking.status === BookingStatus.AWAITING_APPROVAL) {
      this.toursService.updateScheduleBookedCount(booking.scheduleId, -booking.paxCount);
    }

    // อัปเดต status เป็น canceled
    booking.status = BookingStatus.CANCELED;
    const updated = await this.bookingsRepository.save(booking);

    const found = this.findScheduleInData(updated.scheduleId);
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
