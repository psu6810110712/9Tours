import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ToursService } from '../tours/tours.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EasySlipService, type EasySlipVerificationResult } from '../easyslip/easyslip.service';
import { safeDeleteFile } from './slip-file.utils';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private toursService: ToursService,
    private notificationsService: NotificationsService,
    private easySlipService: EasySlipService,
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
      throw new NotFoundException('Booking not found or you do not have access to it');
    }

    if (booking.status === BookingStatus.CANCELED) {
      throw new BadRequestException(
        'This payment session has already expired and the booking was canceled',
      );
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Booking is not in pending_payment status (current status: ${booking.status})`,
      );
    }

    if (!slipFile) {
      throw new BadRequestException('A payment slip image is required');
    }

    const verificationResult = this.resolveVerificationAgainstBooking(
      await this.easySlipService.verifySlip(slipFile),
      Number(booking.totalPrice),
    );

    let savedPayment: Payment;

    try {
      const newPayment = this.paymentsRepository.create({
        bookingId,
        amountPaid: booking.totalPrice,
        paymentMethod,
        slipUrl: slipFile.path.replace(/\\/g, '/'),
        verificationStatus: verificationResult.status,
        verifiedAmount: verificationResult.verifiedAmount,
        verifiedTransRef: verificationResult.verifiedTransRef,
        verifiedAt: verificationResult.verifiedAt,
        verificationProvider: verificationResult.provider,
        verificationMessage: verificationResult.message,
        verificationRaw: verificationResult.raw,
      });

      savedPayment = await this.paymentsRepository.save(newPayment);

      booking.status = BookingStatus.AWAITING_APPROVAL;
      await this.bookingsRepository.save(booking);
    } catch (error) {
      await safeDeleteFile(slipFile.path);
      throw error;
    }

    let tourName = 'Tour';
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
      customerName: booking.contactName || 'Customer',
      amount: booking.totalPrice,
    }).catch((e) => console.error(e));

    return {
      message: 'Payment slip uploaded successfully',
      payment: savedPayment,
      booking: {
        ...booking,
        payments: [savedPayment],
      },
      verification: {
        status: savedPayment.verificationStatus,
        verifiedAmount: savedPayment.verifiedAmount,
        verifiedTransRef: savedPayment.verifiedTransRef,
        verifiedAt: savedPayment.verifiedAt,
        verificationProvider: savedPayment.verificationProvider,
        verificationMessage: savedPayment.verificationMessage,
      },
    };
  }

  private resolveVerificationAgainstBooking(
    verification: EasySlipVerificationResult,
    bookingAmount: number,
  ): EasySlipVerificationResult {
    if (verification.status !== 'verified') {
      this.logger.log(`Slip verification result: ${verification.status} - ${verification.message}`);
      return verification;
    }

    if (verification.verifiedAmount === null) {
      return {
        ...verification,
        status: 'failed',
        message: 'EasySlip verified the slip but did not return an amount',
        verifiedAt: null,
      };
    }

    if (Math.abs(verification.verifiedAmount - bookingAmount) > 0.01) {
      return {
        ...verification,
        status: 'amount_mismatch',
        message: `Slip amount ${verification.verifiedAmount.toFixed(2)} does not match booking amount ${bookingAmount.toFixed(2)}`,
      };
    }

    this.logger.log(`Slip verification passed for booking amount ${bookingAmount}`);
    return verification;
  }
}
