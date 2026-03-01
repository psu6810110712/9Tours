import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from '../bookings/entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Booking]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/slips',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const extension = file.originalname.split('.').pop();
          cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
        },
      }),
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
