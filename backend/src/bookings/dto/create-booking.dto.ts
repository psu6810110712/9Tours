import { IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  scheduleId: number;

  @IsNumber()
  @Min(1)
  paxCount: number;

  @IsNumber()
  @Min(1)
  adults?: number;

  @IsNumber()
  @Min(0)
  children?: number;

  @IsString()
  @IsOptional()
  specialRequest?: string;
}
