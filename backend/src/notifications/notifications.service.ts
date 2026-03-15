import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Notification, NotificationType } from './entities/notification.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) { }

    // ─── In-App Notification Methods ─────────────────────────────────

    async createBookingNotification(
        userId: string,
        bookingId: number,
        type: NotificationType,
        tourName: string,
    ) {
        let title = '';
        let message = '';

        switch (type) {
            case NotificationType.BOOKING_CONFIRMED:
                title = 'การจองได้รับการยืนยัน';
                message = `การจอง #${bookingId} สำหรับ "${tourName}" ได้รับการยืนยันเรียบร้อยแล้ว`;
                break;
            case NotificationType.BOOKING_SUCCESS:
                title = 'การจองสำเร็จ';
                message = `การจอง #${bookingId} สำหรับ "${tourName}" สำเร็จเรียบร้อยแล้ว เตรียมตัวเดินทางได้เลย!`;
                break;
            case NotificationType.BOOKING_CANCELED:
                title = 'การจองถูกยกเลิก';
                message = `การจอง #${bookingId} สำหรับ "${tourName}" ถูกยกเลิก กรุณาติดต่อแอดมินหากมีข้อสงสัย`;
                break;
        }

        const notification = this.notificationRepo.create({
            userId,
            bookingId,
            type,
            title,
            message,
        });

        return this.notificationRepo.save(notification);
    }

    async findAllForUser(userId: string) {
        return this.notificationRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async countUnread(userId: string): Promise<number> {
        return this.notificationRepo.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(id: number, userId: string) {
        await this.notificationRepo.update(
            { id, userId },
            { isRead: true },
        );
    }

    async markAllAsRead(userId: string) {
        await this.notificationRepo.update(
            { userId, isRead: false },
            { isRead: true },
        );
    }

    // ─── Admin Notification Methods ──────────────────────────────────

    async notifyAdminsNewBooking(details: {
        bookingId: number;
        tourName: string;
        customerName: string;
        paxCount: number;
        totalPrice: number;
        scheduleDate?: string;
    }) {
        const admins = await this.userRepo.find({ where: { role: UserRole.ADMIN } });
        if (admins.length === 0) return;

        const title = 'มีการจองใหม่';
        const priceFmt = Number(details.totalPrice).toLocaleString();
        const datePart = details.scheduleDate ? ` | วันเดินทาง: ${details.scheduleDate}` : '';
        const message = `การจอง #${details.bookingId} — "${details.tourName}" โดย ${details.customerName} (${details.paxCount} ท่าน) ยอด ฿${priceFmt}${datePart}`;

        const notifications = admins.map((admin) =>
            this.notificationRepo.create({
                userId: admin.id,
                bookingId: details.bookingId,
                type: NotificationType.NEW_BOOKING,
                title,
                message,
            }),
        );

        await this.notificationRepo.save(notifications);
    }

    async notifyAdminsPaymentUploaded(details: {
        bookingId: number;
        tourName: string;
        customerName: string;
        amount: number;
    }) {
        const admins = await this.userRepo.find({ where: { role: UserRole.ADMIN } });
        if (admins.length === 0) return;

        const title = 'มีสลิปรอตรวจสอบ';
        const amountFmt = Number(details.amount).toLocaleString();
        const message = `การจอง #${details.bookingId} — "${details.tourName}" | ${details.customerName} อัปโหลดสลิป ฿${amountFmt} รอตรวจสอบ`;

        const notifications = admins.map((admin) =>
            this.notificationRepo.create({
                userId: admin.id,
                bookingId: details.bookingId,
                type: NotificationType.PAYMENT_UPLOADED,
                title,
                message,
            }),
        );

        await this.notificationRepo.save(notifications);
    }

    // ─── Email Notification (existing) ───────────────────────────────

    async sendBookingStatusEmail(booking: Booking, previousStatus: string, newStatus: string) {
        if (!this.configService.get<boolean>('MAIL_ENABLED')) {
            this.logger.log(`Skipping booking status email for booking ${booking.id} because MAIL_ENABLED=false`);
            return;
        }

        // Only send email when transitioning from awaiting_approval to confirmed or success
        const validTransition = previousStatus === BookingStatus.AWAITING_APPROVAL &&
            (newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.SUCCESS);

        // Also notify if it's canceled from awaiting_approval (rejected)
        const wasRejected = previousStatus === BookingStatus.AWAITING_APPROVAL && newStatus === BookingStatus.CANCELED;

        if (!validTransition && !wasRejected) {
            this.logger.debug(`Skip booking status email for booking ${booking.id}: ${previousStatus} -> ${newStatus}`);
            return;
        }

        try {
            const email = booking.contactEmail || booking.user?.email;
            const name = booking.contactName || booking.user?.name || 'ลูกค้าที่เคารพ';

            if (!email) {
                this.logger.warn(`Cannot send email for booking ${booking.id} - No email found`);
                return;
            }

            let subject = '';
            let statusText = '';
            let color = '';
            let message = '';

            if (validTransition) {
                subject = `ยืนยันการรับชำระเงิน - หมายเลขการจอง #${booking.id}`;
                statusText = 'สำเร็จ / ยืนยันแล้ว';
                color = '#10B981'; // Green
                message = 'การชำระเงินของคุณได้รับการตรวจสอบและยืนยันเรียบร้อยแล้ว เตรียมตัวเดินทางได้เลย!';
            } else if (wasRejected) {
                subject = `อัปเดตสถานะการจอง - หมายเลขการจอง #${booking.id}`;
                statusText = 'ไม่อนุมัติ / ยกเลิก';
                color = '#EF4444'; // Red
                message = 'ขออภัย ทางเราไม่สามารถอนุมัติสลิปโอนเงินรายการนี้ได้ กรุณาติดต่อแอดมินหรือทำรายการจองและชำระเงินเข้ามาใหม่นะคะ';
            }

            // We fallback to a generic schedule representation, as populated via relation
            const anyBooking = booking as any;
            const tourName = anyBooking.schedule?.tour?.name || 'ทัวร์ (ดูรายละเอียดในระบบ)';

            const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #F5A623;">9Tours Travel</h2>
          <h3>เรียนคุณ ${name},</h3>
          <p>${message}</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>หมายเลขการจอง:</strong> #${booking.id}</p>
            <p style="margin: 5px 0;"><strong>ทริป:</strong> ${tourName}</p>
            <p style="margin: 5px 0;"><strong>จำนวนผู้เดินทาง:</strong> ${booking.paxCount} ท่าน</p>
            <p style="margin: 5px 0;"><strong>ยอดชำระ:</strong> ฿${Number(booking.totalPrice).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>สถานะปัจจุบัน:</strong> <span style="color: ${color}; font-weight: bold;">${statusText}</span></p>
          </div>

          <p>หากมีข้อกังวลข้อสงสัยใด ๆ สามารถติดต่อทีมงาน 9Tours ได้ตลอดเวลาครับ</p>
          <br>
          <p>ขอแสดงความนับถือ,<br>ทีมงาน 9Tours</p>
        </div>
      `;

            await this.mailerService.sendMail({
                to: email,
                subject,
                html: htmlTemplate,
            });

            this.logger.log(`Status email sent to ${email} for booking ${booking.id}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send email for booking ${booking.id}: ${message}`, stack);
        }
    }
}
