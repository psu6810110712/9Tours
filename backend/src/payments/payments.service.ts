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

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private toursService: ToursService, // ✅ เพิ่ม ToursService
  ) { }

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

    // ตรวจสอบว่า booking ถูกยกเลิกอัตโนมัติจากระบบคืนที่นั่งหรือไม่ (Hard Cutoff)
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

    // สร้าง Payment record
    const newPayment = this.paymentsRepository.create({
      bookingId,
      amountPaid: booking.totalPrice,
      paymentMethod,
      slipUrl: slipFile.path.replace(/\\/g, '/'),
    });

    const savedPayment = await this.paymentsRepository.save(newPayment);

    // อัปเดตสถานะ Booking → AWAITING_APPROVAL
    // (ที่นั่งถูก hold ไปแล้วตั้งแต่สร้าง booking จึงไม่ต้อง update currentBooked อีก)
    booking.status = BookingStatus.AWAITING_APPROVAL;
    await this.bookingsRepository.save(booking);

    return {
      message: 'การชำระเงินสำเร็จ',
      payment: savedPayment,
      booking,
    };
  }
}
