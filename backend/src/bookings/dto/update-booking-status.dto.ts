import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus, {
    message: `Status ต้องเป็น ${Object.values(BookingStatus).join(', ')} เท่านั้น`,
  })
  status: BookingStatus;

  @IsOptional()
  @IsIn(['approve', 'reject'])
  refundAction?: 'approve' | 'reject';
}
