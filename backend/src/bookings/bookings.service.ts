import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, In, Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { ToursService } from '../tours/tours.service';
import { User } from '../users/entities/user.entity';
import { normalizeEmail, normalizeThaiPhoneInput, sanitizeCustomerName } from '../users/customer-profile.utils';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private toursService: ToursService,
    private notificationsService: NotificationsService,
  ) { }

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
      }
    }
  }

  async create(userId: string, createBookingDto: CreateBookingDto) {
    const {
      scheduleId,
      adults = 1,
      children = 0,
      specialRequest,
      contactPrefix,
      contactName,
      contactEmail,
      contactPhone,
    } = createBookingDto;

    const paxCount = adults + children;
    const found = this.findScheduleInData(scheduleId);

    if (!found) {
      throw new NotFoundException('ไม่พบ Tour Schedule นี้');
    }

    const { tour, schedule } = found;
    const isPrivate = !!tour.minPeople;

    const existingPendingBooking = await this.bookingsRepository.findOne({
      where: {
        userId,
        status: BookingStatus.PENDING_PAYMENT,
      },
    });
    if (existingPendingBooking) {
      throw new BadRequestException('คุณมีรายการรอชำระเงินอยู่ กรุณาชำระเงินหรือยกเลิกรายการดังกล่าวให้เสร็จสมบูรณ์ก่อนเริ่มการจองใหม่');
    }

    if (isPrivate) {
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

    let totalPrice: number;
    if (isPrivate) {
      totalPrice = Number(tour.price);
    } else {
      const childPrice = tour.childPrice ?? tour.price;
      totalPrice = (adults * tour.price) + (children * childPrice);
    }

    const normalizedContactName = sanitizeCustomerName(contactName);
    const normalizedContactEmail = normalizeEmail(contactEmail);
    const normalizedContactPhone = normalizeThaiPhoneInput(contactPhone);
    if (!normalizedContactPhone) {
      throw new BadRequestException('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
    }

    const booking = await this.bookingsRepository.manager.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const userRepo = manager.getRepository(User);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('ไม่พบผู้ใช้งาน');
      }

      const emailOwner = await userRepo.findOne({ where: { email: normalizedContactEmail } });
      if (emailOwner && emailOwner.id !== userId) {
        throw new BadRequestException('อีเมลนี้มีผู้ใช้แล้ว');
      }

      const phoneCandidates = await userRepo.find({ where: { phone: Not(IsNull()) } });
      const phoneOwner = phoneCandidates.find((candidate) => (
        candidate.id !== userId
        && normalizeThaiPhoneInput(candidate.phone) === normalizedContactPhone
      ));
      if (phoneOwner) {
        throw new BadRequestException('หมายเลขโทรศัพท์นี้มีผู้ใช้แล้ว');
      }

      user.prefix = contactPrefix;
      user.name = normalizedContactName;
      user.email = normalizedContactEmail;
      user.phone = normalizedContactPhone;
      await userRepo.save(user);

      const createdBooking = bookingRepo.create({
        userId,
        scheduleId,
        paxCount,
        adults,
        children,
        totalPrice,
        contactPrefix,
        contactName: normalizedContactName,
        contactEmail: normalizedContactEmail,
        contactPhone: normalizedContactPhone,
        specialRequest,
        status: BookingStatus.PENDING_PAYMENT,
      });

      return bookingRepo.save(createdBooking);
    });

    this.toursService.updateScheduleBookedCount(scheduleId, seatsToHold);

    // Notify all admins about the new booking
    this.notificationsService.notifyAdminsNewBooking({
      bookingId: booking.id,
      tourName: tour.name,
      customerName: normalizedContactName,
      paxCount,
      totalPrice,
      scheduleDate: schedule.startDate || undefined,
    }).catch((e) => console.error(e));

    return {
      ...booking,
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

  async getMyBookings(userId: string) {
    const bookings = await this.bookingsRepository.find({
      where: { userId },
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
              tourCode: found.tour.tourCode,
              name: found.tour.name,
              description: found.tour.description,
              price: found.tour.price,
              childPrice: found.tour.childPrice,
              images: found.tour.images,
              highlights: found.tour.highlights || [],
              itinerary: found.tour.itinerary || [],
              transportation: found.tour.transportation || null,
              duration: found.tour.duration || null,
              accommodation: found.tour.accommodation || null,
            },
          }
          : null,
      };
    });
  }

  async updateStatus(bookingId: number, updateBookingStatusDto: UpdateBookingStatusDto, userId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['payments', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('ไม่พบ Booking นี้');
    }

    const previousStatus = booking.status;
    const newStatus = updateBookingStatusDto.status;

    const activeStatuses = [
      BookingStatus.PENDING_PAYMENT,
      BookingStatus.AWAITING_APPROVAL,
      BookingStatus.CONFIRMED,
      BookingStatus.SUCCESS,
    ];

    const wasActive = activeStatuses.includes(previousStatus);
    const isNowActive = activeStatuses.includes(newStatus);

    if (wasActive && !isNowActive) {
      const found = this.findScheduleInData(booking.scheduleId);
      if (found) {
        const isPrivate = !!found.tour.minPeople;
        const seatsToRelease = isPrivate ? found.schedule.maxCapacity : booking.paxCount;
        this.toursService.updateScheduleBookedCount(booking.scheduleId, -seatsToRelease);
      }
    } else if (!wasActive && isNowActive) {
      const found = this.findScheduleInData(booking.scheduleId);
      if (found) {
        const isPrivate = !!found.tour.minPeople;
        const seatsToHold = isPrivate ? found.schedule.maxCapacity : booking.paxCount;
        this.toursService.updateScheduleBookedCount(booking.scheduleId, seatsToHold);
      }
    }

    booking.status = newStatus;
    booking.reviewedByUserId = userId;
    booking.reviewedAt = new Date();
    await this.bookingsRepository.save(booking);
    this.logger.log(`Admin ${userId} updated booking ${bookingId} from ${previousStatus} to ${newStatus}`);

    const updated = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['payments', 'user'],
    });

    if (!updated) {
      throw new NotFoundException('à¹„à¸¡à¹ˆà¸žà¸š Booking à¸™à¸µà¹‰');
    }

    // Fetch schedule data for the response and for the email
    const found = this.findScheduleInData(updated.scheduleId);

    // Call the email service (asynchronous/non-blocking)
    const emailResult = {
      ...updated,
      schedule: found ? {
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
      } : null,
      user: updated.user,
      payments: updated.payments,
    };

    // Send email notification silently, don't block the request if it fails
    this.notificationsService.sendBookingStatusEmail(emailResult as Booking, previousStatus, newStatus).catch(e => console.error(e));

    // Create in-app notification for relevant status transitions
    const tourName = found?.tour?.name || 'ทัวร์';
    const isConfirmed = previousStatus === BookingStatus.AWAITING_APPROVAL && newStatus === BookingStatus.CONFIRMED;
    const isSuccess = previousStatus === BookingStatus.AWAITING_APPROVAL && newStatus === BookingStatus.SUCCESS;
    const wasRejected = previousStatus === BookingStatus.AWAITING_APPROVAL && newStatus === BookingStatus.CANCELED;

    if (isConfirmed) {
      this.notificationsService.createBookingNotification(booking.userId, booking.id, NotificationType.BOOKING_CONFIRMED, tourName).catch(e => console.error(e));
    } else if (isSuccess) {
      this.notificationsService.createBookingNotification(booking.userId, booking.id, NotificationType.BOOKING_SUCCESS, tourName).catch(e => console.error(e));
    } else if (wasRejected) {
      this.notificationsService.createBookingNotification(booking.userId, booking.id, NotificationType.BOOKING_CANCELED, tourName).catch(e => console.error(e));
    }

    return emailResult;
  }

  async findOne(id: number, userId?: string, isAdmin?: boolean) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['payments'],
    });

    if (!booking) {
      throw new NotFoundException('ไม่พบ Booking นี้');
    }

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

  async cancelBooking(bookingId: number, userId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('ไม่พบ Booking นี้');
    }

    if (booking.userId !== userId) {
      throw new UnauthorizedException('คุณไม่มีสิทธิ์ยกเลิก Booking นี้');
    }

    const cancellableStatuses = [BookingStatus.PENDING_PAYMENT, BookingStatus.AWAITING_APPROVAL, BookingStatus.CONFIRMED, BookingStatus.SUCCESS];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException('สามารถยกเลิกได้เฉพาะรายการที่รอชำระเงิน รอตรวจสอบ หรือสำเร็จเท่านั้น');
    }

    booking.status = BookingStatus.CANCELED;
    const updated = await this.bookingsRepository.save(booking);

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

  async findByScheduleId(scheduleId: number): Promise<any[]> {
    const bookings = await this.bookingsRepository.find({
      where: {
        scheduleId,
        status: Not(In([BookingStatus.CANCELED, BookingStatus.REFUND_COMPLETED])),
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['user'],
    });

    const found = this.findScheduleInData(scheduleId);

    return bookings.map((booking) => ({
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
    }));
  }
}
