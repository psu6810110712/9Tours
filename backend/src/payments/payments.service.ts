import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ToursService } from '../tours/tours.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private toursService: ToursService,
    private notificationsService: NotificationsService,
  ) { }

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    slipFile: Express.Multer.File,
    userId: string,
  ) {
    const { bookingId, paymentMethod } = createPaymentDto;

    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException(
        `ไม่พบ Booking ID ${bookingId} หรือคุณไม่มีสิทธิ์เข้าถึง`,
      );
    }

    if (booking.status === BookingStatus.CANCELED) {
      throw new BadRequestException(
        'เซสชันการชำระเงินหมดอายุแล้ว และที่นั่งได้ถูกคืนให้ส่วนกลางไปแล้ว หากท่านทำการโอนเงินสำเร็จไปแล้ว กรุณาติดต่อแอดมินผ่าน Line หรือ Facebook เพื่อรับเงินคืนหรือรับความช่วยเหลือ'
      );
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Booking นี้ไม่ได้อยู่ในสถานะรอชำระเงิน (สถานะปัจจุบัน: ${booking.status})`,
      );
    }

    if (!slipFile) {
      throw new BadRequestException('ต้องแนบไฟล์สลิปการโอนเงิน');
    }

    const newPayment = this.paymentsRepository.create({
      bookingId,
      amountPaid: booking.totalPrice,
      paymentMethod,
      slipUrl: slipFile.path.replace(/\\/g, '/'),
    });

    const savedPayment = await this.paymentsRepository.save(newPayment);

    booking.status = BookingStatus.AWAITING_APPROVAL;
    await this.bookingsRepository.save(booking);

    // Notify admins about the uploaded slip
    let tourName = 'ทัวร์';
    const tours = this.toursService.findAll({ admin: 'true' });
    for (const t of tours) {
      if (t.schedules?.some((s: any) => s.id === booking.scheduleId)) {
        tourName = t.name;
        break;
      }
    }
    this.notificationsService.notifyAdminsPaymentUploaded({
      bookingId: booking.id,
      tourName,
      customerName: booking.contactName || 'ลูกค้า',
      amount: booking.totalPrice,
    }).catch((e) => console.error(e));

    return {
      message: 'การชำระเงินสำเร็จ',
      payment: savedPayment,
      booking,
    };
  }
}
