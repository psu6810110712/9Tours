import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ToursModule } from '../tours/tours.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EasySlipModule } from '../easyslip/easyslip.module';
import { PaymentUploadRateLimitService } from './payment-upload-rate-limit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Booking]),
    ToursModule,
    NotificationsModule,
    EasySlipModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentUploadRateLimitService],
})
export class PaymentsModule { }
