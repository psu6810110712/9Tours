import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { access, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Payment } from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ToursService } from '../tours/tours.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EasySlipService, type EasySlipVerificationResult } from '../easyslip/easyslip.service';
import { safeDeleteFile } from './slip-file.utils';
import { buildPromptPayPayload, getActivePaymentQrExpiry } from './promptpay.util';
import {
  buildStoredUploadPath,
  getSlipUploadDirectory,
  getUploadsRoot,
  resolveStoredUploadPath,
} from '../common/upload-paths';

const PROMPTPAY_QR_RENDERER_BASE_URL = 'https://api.qrserver.com/v1/create-qr-code/';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly slipUploadDirectory = getSlipUploadDirectory();
  private readonly uploadsRoot = resolve(getUploadsRoot());

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private configService: ConfigService,
    private toursService: ToursService,
    private notificationsService: NotificationsService,
    private easySlipService: EasySlipService,
  ) { }

  async getPaymentQr(bookingId: number, userId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or you do not have access to it');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException('QR is only available while the booking is awaiting payment');
    }

    const expiresAt = getActivePaymentQrExpiry(new Date(booking.createdAt));
    if (Date.now() >= expiresAt.getTime()) {
      throw new BadRequestException('The QR payment window has expired for this booking');
    }

    const promptPayId = this.configService.get<string>('PROMPTPAY_ID')?.trim();
    const accountName = this.configService.get<string>('PROMPTPAY_ACCOUNT_NAME')?.trim();

    if (!promptPayId || !accountName) {
      throw new ServiceUnavailableException(
        'PromptPay QR is not configured yet. Please contact support or upload your slip after transferring manually.',
      );
    }

    const amount = Number(booking.totalPrice);
    const qrPayload = buildPromptPayPayload(promptPayId, amount);

    return {
      bookingId: booking.id,
      amount,
      accountName,
      qrPayload,
      qrImageUrl: this.buildQrImageUrl(qrPayload),
      expiresAt: expiresAt.toISOString(),
    };
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    slipFile: Express.Multer.File,
    userId: string,
    auditContext?: {
      ipAddress?: string | null;
      userAgent?: string | null;
    },
  ) {
    const { bookingId, paymentMethod } = createPaymentDto;
    const normalizedSlipPath = buildStoredUploadPath('slips', slipFile.filename);

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

    const canReplacePendingReview = (
      booking.status === BookingStatus.AWAITING_APPROVAL
      && !booking.reviewedAt
    );

    if (booking.status !== BookingStatus.PENDING_PAYMENT && !canReplacePendingReview) {
      throw new BadRequestException(
        `Booking is not in a replaceable payment state (current status: ${booking.status})`,
      );
    }

    if (!slipFile) {
      throw new BadRequestException('A payment slip image is required');
    }

    const existingPayment = await this.paymentsRepository.findOne({
      where: { bookingId },
      order: { uploadedAt: 'DESC' },
    });

    if (existingPayment) {
      if (!canReplacePendingReview) {
        await safeDeleteFile(slipFile.path);
        throw new BadRequestException('A payment slip has already been uploaded for this booking');
      }
    }

    const verificationResult = this.resolveVerificationAgainstBooking(
      await this.easySlipService.verifySlip(slipFile),
      Number(booking.totalPrice),
    );

    let savedPayment: Payment;

    try {
      if (existingPayment && canReplacePendingReview) {
        const previousSlipPath = existingPayment.slipUrl;

        existingPayment.amountPaid = booking.totalPrice;
        existingPayment.paymentMethod = paymentMethod;
        existingPayment.slipUrl = normalizedSlipPath;
        existingPayment.uploadedByUserId = userId;
        existingPayment.uploadedFromIp = auditContext?.ipAddress ?? null;
        existingPayment.uploadedFromUserAgent = auditContext?.userAgent ?? null;
        existingPayment.verificationStatus = verificationResult.status;
        existingPayment.verifiedAmount = verificationResult.verifiedAmount;
        existingPayment.verifiedTransRef = verificationResult.verifiedTransRef;
        existingPayment.verifiedAt = verificationResult.verifiedAt;
        existingPayment.verificationProvider = verificationResult.provider;
        existingPayment.verificationMessage = verificationResult.message;
        existingPayment.verificationRaw = verificationResult.raw;
        existingPayment.uploadedAt = new Date();

        savedPayment = await this.paymentsRepository.save(existingPayment);

        if (previousSlipPath && previousSlipPath !== normalizedSlipPath) {
          await safeDeleteFile(resolveStoredUploadPath(previousSlipPath));
        }
      } else {
        const newPayment = this.paymentsRepository.create({
          bookingId,
          amountPaid: booking.totalPrice,
          paymentMethod,
          slipUrl: normalizedSlipPath,
          uploadedByUserId: userId,
          uploadedFromIp: auditContext?.ipAddress ?? null,
          uploadedFromUserAgent: auditContext?.userAgent ?? null,
          verificationStatus: verificationResult.status,
          verifiedAmount: verificationResult.verifiedAmount,
          verifiedTransRef: verificationResult.verifiedTransRef,
          verifiedAt: verificationResult.verifiedAt,
          verificationProvider: verificationResult.provider,
          verificationMessage: verificationResult.message,
          verificationRaw: verificationResult.raw,
        });

        savedPayment = await this.paymentsRepository.save(newPayment);
      }

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

    this.logger.log(
      `${existingPayment && canReplacePendingReview ? 'Slip replaced' : 'Slip uploaded'} for booking ${booking.id} by user ${userId} from ${auditContext?.ipAddress ?? 'unknown-ip'}`,
    );

    return {
      message: existingPayment && canReplacePendingReview
        ? 'Payment slip replaced successfully'
        : 'Payment slip uploaded successfully',
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

  async getSlipFilePath(paymentId: number, userId: string, isAdmin: boolean) {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
      relations: ['booking'],
    });

    if (!payment || !payment.slipUrl) {
      throw new NotFoundException('Payment slip not found');
    }

    if (!isAdmin && payment.booking?.userId !== userId) {
      throw new NotFoundException('Payment slip not found');
    }

    const absolutePath = resolveStoredUploadPath(payment.slipUrl);

    if (!absolutePath.startsWith(this.uploadsRoot)) {
      this.logger.warn(`Blocked slip access outside upload directory for payment ${paymentId}`);
      throw new NotFoundException('Payment slip not found');
    }

    try {
      await access(absolutePath);
    } catch {
      throw new NotFoundException('Payment slip not found');
    }

    return absolutePath;
  }

  private buildQrImageUrl(qrPayload: string) {
    const params = new URLSearchParams({
      size: '512x512',
      format: 'png',
      margin: '0',
      data: qrPayload,
    });

    return `${PROMPTPAY_QR_RENDERER_BASE_URL}?${params.toString()}`;
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
        message: 'Slip verification succeeded but did not return an amount',
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

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanSlipFiles() {
    let filenames: string[] = [];

    try {
      filenames = await readdir(this.slipUploadDirectory);
    } catch {
      return;
    }

    if (filenames.length === 0) {
      return;
    }

    const payments = await this.paymentsRepository.find({
      select: ['slipUrl'],
    });
    const referencedSlipPaths = new Set(payments.map((payment) => payment.slipUrl).filter(Boolean));
    const now = Date.now();

    for (const filename of filenames) {
      const normalizedPath = `uploads/slips/${filename}`.replace(/\\/g, '/');
      if (referencedSlipPaths.has(normalizedPath)) {
        continue;
      }

      const absolutePath = join(this.slipUploadDirectory, filename);

      try {
        const fileStat = await stat(absolutePath);
        const isOlderThanOneDay = now - fileStat.mtimeMs > 24 * 60 * 60 * 1000;
        if (!isOlderThanOneDay) {
          continue;
        }

        await safeDeleteFile(absolutePath);
        this.logger.warn(`Deleted orphan slip file: ${normalizedPath}`);
      } catch {
        // Ignore per-file cleanup failures and continue.
      }
    }
  }
}
