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

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    slipFile: Express.Multer.File,
    userId: number,
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

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Booking นี้ไม่ได้อยู่ในสถานะรอชำระเงิน (สถานะปัจจุบัน: ${booking.status})`,
      );
    }

    if (!slipFile) {
      throw new BadRequestException('ต้องแนบไฟล์สลิปการโอนเงิน');
    }

    // สร้าง Payment record
    const newPayment = this.paymentsRepository.create({
      bookingId,
      amountPaid: booking.totalPrice,
      paymentMethod,
      slipUrl: slipFile.path,
    });

    const savedPayment = await this.paymentsRepository.save(newPayment);

    // อัปเดตสถานะ Booking
    booking.status = BookingStatus.CONFIRMED;
    await this.bookingsRepository.save(booking);

    return {
      message: 'การชำระเงินสำเร็จ',
      payment: savedPayment,
      booking,
    };
  }
}
