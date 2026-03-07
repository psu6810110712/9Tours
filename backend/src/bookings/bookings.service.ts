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
import { TourSchedule } from '../tours/entities/tour-schedule.entity';
import { Tour } from '../tours/entities/tour.entity';

@Injectable()
export class BookingsService {
  private readonly seatHeldStatuses = new Set<BookingStatus>([
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.AWAITING_APPROVAL,
    BookingStatus.CONFIRMED,
    BookingStatus.SUCCESS,
  ]);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private toursService: ToursService, // เพิ่ม ToursService
  ) { }

  // อ่านข้อมูล schedule/tour จากฐานข้อมูลโดยตรง เพื่อเลิกพึ่งไฟล์ mock runtime
  private async findScheduleInData(scheduleId: number): Promise<{ tour: any; schedule: any } | null> {
    const found = await this.toursService.getScheduleWithTour(scheduleId);
    if (!found) return null;
    return { tour: found.tour, schedule: found.schedule };
  }
  private isSeatHeldStatus(status: BookingStatus) {
    return this.seatHeldStatuses.has(status);
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

      const found = await this.findScheduleInData(booking.scheduleId);
      if (found) {
        const { tour, schedule } = found;
        const isPrivate = !!tour.minPeople;
        const seatsToRelease = isPrivate ? schedule.maxCapacity : booking.paxCount;
        await this.toursService.updateScheduleBookedCount(booking.scheduleId, -seatsToRelease);
        console.log(`[Cron] ยกเลิกการจอง ID ${booking.id} และคืนที่นั่ง ${seatsToRelease} ที่`);
      }
    }
  }

  async create(userId: number, createBookingDto: CreateBookingDto) {
    const { scheduleId, adults = 1, children = 0 } = createBookingDto;
    const paxCount = adults + children;

    const savedBooking = await this.bookingsRepository.manager.transaction(async (manager) => {
      const bookingsRepo = manager.getRepository(Booking);
      const schedulesRepo = manager.getRepository(TourSchedule);
      const toursRepo = manager.getRepository(Tour);
      const lockedSchedule = await schedulesRepo
        .createQueryBuilder('schedule')
        .setLock('pessimistic_write')
        .where('schedule.id = :scheduleId', { scheduleId })
        .getOne();

      if (!lockedSchedule) {
        throw new NotFoundException('Tour schedule not found');
      }

      const tour = await toursRepo.findOne({
        where: { id: lockedSchedule.tourId },
      });

      if (!tour) {
        throw new NotFoundException('Tour not found');
      }
      const isPrivate = !!tour.minPeople;

      const existingPendingBooking = await bookingsRepo.findOne({
        where: {
          userId,
          status: BookingStatus.PENDING_PAYMENT,
        },
      });
      if (existingPendingBooking) {
        throw new BadRequestException('You already have a pending payment booking. Please complete or cancel it before creating a new one.');
      }

      if (isPrivate) {
        const existingBooking = await bookingsRepo.findOne({
          where: {
            userId,
            scheduleId,
            status: Not(In([BookingStatus.CANCELED, BookingStatus.REFUND_COMPLETED])),
          },
        });
        if (existingBooking) {
          throw new BadRequestException('You already have an active booking for this schedule.');
        }
      }

      const maxCapacity = Number(lockedSchedule.maxCapacity || 0);
      const currentBooked = Math.max(0, Number(lockedSchedule.currentBooked || 0));
      const seatsToHold = isPrivate ? maxCapacity : paxCount;
      if (currentBooked + seatsToHold > maxCapacity) {
        const availableSlots = maxCapacity - currentBooked;
        throw new BadRequestException(
          isPrivate
            ? 'This schedule is already fully booked.'
            : `Only ${availableSlots} seat(s) are still available.`,
        );
      }

      const totalPrice = isPrivate
        ? Number(tour.price)
        : (adults * Number(tour.price)) + (children * Number(tour.childPrice ?? tour.price));

      lockedSchedule.currentBooked = currentBooked + seatsToHold;
      await schedulesRepo.save(lockedSchedule);

      const booking = bookingsRepo.create({
        userId,
        scheduleId,
        paxCount,
        adults,
        children,
        totalPrice,
        status: BookingStatus.PENDING_PAYMENT,
      });

      return bookingsRepo.save(booking);
    });

    const found = await this.findScheduleInData(scheduleId);
    return {
      ...savedBooking,
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
  // สำหรับ Admin: ดึงรายการจองทั้งหมด (เพื่อตรวจสอบสลิป)
  async findAll() {
    const bookings = await this.bookingsRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['payments', 'user'],
    });

    return Promise.all(bookings.map(async (booking) => {
      const found = await this.findScheduleInData(booking.scheduleId);
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
    }));
  }

  async getMyBookings(userId: number) {
    const bookings = await this.bookingsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['payments'],
    });

    return Promise.all(bookings.map(async (booking) => {
      const found = await this.findScheduleInData(booking.scheduleId);
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
    }));
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
    const wasHoldingSeats = this.isSeatHeldStatus(previousStatus);
    const shouldHoldSeats = this.isSeatHeldStatus(newStatus);

    if (wasHoldingSeats !== shouldHoldSeats) {
      const found = await this.findScheduleInData(booking.scheduleId);
      if (found) {
        const isPrivate = !!found.tour.minPeople;
        const seatsForBooking = isPrivate ? found.schedule.maxCapacity : booking.paxCount;
        const seatDelta = shouldHoldSeats ? seatsForBooking : -seatsForBooking;
        await this.toursService.updateScheduleBookedCount(booking.scheduleId, seatDelta);
      }
    }

    booking.status = newStatus;
    const updated = await this.bookingsRepository.save(booking);

    const found = await this.findScheduleInData(updated.scheduleId);
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

    const found = await this.findScheduleInData(booking.scheduleId);
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

    // อนุญาตยกเลิกได้ทั้ง PENDING_PAYMENT, AWAITING_APPROVAL, CONFIRMED, SUCCESS
    const cancellableStatuses = [BookingStatus.PENDING_PAYMENT, BookingStatus.AWAITING_APPROVAL, BookingStatus.CONFIRMED, BookingStatus.SUCCESS];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException('สามารถยกเลิกได้เฉพาะรายการที่รอชำระเงิน รอตรวจสอบ หรือสำเร็จเท่านั้น');
    }

    booking.status = BookingStatus.CANCELED;
    const updated = await this.bookingsRepository.save(booking);

    // คืน seat กลับทุกกรณี (เพราะ hold ตั้งแต่สร้าง booking)
    const foundForCancel = await this.findScheduleInData(booking.scheduleId);
    if (foundForCancel) {
      const isPrivate = !!foundForCancel.tour.minPeople;
      const seatsToRelease = isPrivate ? foundForCancel.schedule.maxCapacity : booking.paxCount;
      await this.toursService.updateScheduleBookedCount(booking.scheduleId, -seatsToRelease);
    }

    const found = await this.findScheduleInData(updated.scheduleId);
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
