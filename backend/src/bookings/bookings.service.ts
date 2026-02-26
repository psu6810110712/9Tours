import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { TourSchedule } from '../tours/entities/tour-schedule.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(TourSchedule)
    private tourSchedulesRepository: Repository<TourSchedule>,
  ) {}

  async create(userId: number, createBookingDto: CreateBookingDto) {
    const { scheduleId, paxCount } = createBookingDto;

    // ตรวจสอบว่า schedule มีอยู่และโหลด tour ด้วย
    const schedule = await this.tourSchedulesRepository.findOne({
      where: { id: scheduleId },
      relations: ['tour'],
    });

    if (!schedule) {
      throw new NotFoundException('ไม่พบ Tour Schedule นี้');
    }

    // ตรวจสอบ capacity
    if (schedule.currentBooked + paxCount > schedule.maxCapacity) {
      const availableSlots = schedule.maxCapacity - schedule.currentBooked;
      throw new BadRequestException(
        `ที่ว่างไม่พอ มี ${availableSlots} ที่ว่าง แต่คุณต้องการ ${paxCount} ที่`,
      );
    }

    // คำนวณ total price
    const totalPrice = paxCount * schedule.tour.price;

    // สร้าง booking ใหม่
    const booking = this.bookingsRepository.create({
      userId,
      scheduleId,
      paxCount,
      totalPrice,
      status: BookingStatus.PENDING_PAYMENT,
    });

    // บันทึก booking
    const savedBooking = await this.bookingsRepository.save(booking);

    // อัปเดต currentBooked ใน schedule
    schedule.currentBooked += paxCount;
    await this.tourSchedulesRepository.save(schedule);

    // คืน booking พร้อม schedule และ tour info
    const result = await this.bookingsRepository.findOne({
      where: { id: savedBooking.id },
      relations: ['schedule', 'schedule.tour'],
    });

    return result;
  }

  async getMyBookings(userId: number) {
    return this.bookingsRepository.find({
      where: { userId },
      relations: ['schedule', 'schedule.tour'],
      order: { createdAt: 'DESC' },
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
    await this.bookingsRepository.save(booking);

    // คืน booking ที่อัปเดตแล้ว
    return this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['schedule', 'schedule.tour'],
    });
  }

  async findOne(id: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['schedule', 'schedule.tour', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('ไม่พบ Booking นี้');
    }

    return booking;
  }
}
