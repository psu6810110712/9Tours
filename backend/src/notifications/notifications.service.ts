import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly mailerService: MailerService) { }

    async sendBookingStatusEmail(booking: Booking, previousStatus: string, newStatus: string) {
        // Only send email when transitioning from awaiting_approval to confirmed or success
        const validTransition = previousStatus === BookingStatus.AWAITING_APPROVAL &&
            (newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.SUCCESS);

        // Also notify if it's canceled from awaiting_approval (rejected)
        const wasRejected = previousStatus === BookingStatus.AWAITING_APPROVAL && newStatus === BookingStatus.CANCELED;

        if (!validTransition && !wasRejected) return;

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
            this.logger.error(`Failed to send email for booking ${booking.id}`, error);
        }
    }
}
