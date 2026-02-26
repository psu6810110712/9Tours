import { IsNumber, Min } from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  scheduleId: number;

  @IsNumber()
  @Min(1)
  paxCount: number;
}
