import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus, {
    message: `Status ต้องเป็น ${Object.values(BookingStatus).join(', ')} เท่านั้น`,
  })
  status: BookingStatus;

  @IsOptional()
  @IsString()
  refundAction?: 'approve' | 'reject';
}
