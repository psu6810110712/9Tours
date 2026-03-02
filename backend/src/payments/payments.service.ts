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
import * as fs from 'fs';
import * as path from 'path';

// === อ่าน tours-data.json ===
const DATA_FILE = path.join(process.cwd(), 'tours-data.json');

function loadToursData(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('❌ PaymentsService: cannot read tours-data.json', e);
  }
  return [];
}

function persistToursData(tours: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tours, null, 2));
  } catch (e) {
    console.error('❌ PaymentsService: cannot write tours-data.json', e);
  }
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
      slipUrl: slipFile.path.replace(/\\/g, '/'), // แปลง backslash เป็น forward slash สำหรับ URL
    });

    const savedPayment = await this.paymentsRepository.save(newPayment);

    // อัปเดตสถานะ Booking
    // เปลี่ยนเป็น AWAITING_APPROVAL เพื่อรอ Admin ตรวจสอบสลิปก่อน
    booking.status = BookingStatus.AWAITING_APPROVAL;
    await this.bookingsRepository.save(booking);

    // ✅ อัปเดต currentBooked เมื่อ payment upload (booking status -> AWAITING_APPROVAL)
    updateScheduleBookedCount(booking.scheduleId, booking.paxCount);

    return {
      message: 'การชำระเงินสำเร็จ',
      payment: savedPayment,
      booking,
    };
  }
}
