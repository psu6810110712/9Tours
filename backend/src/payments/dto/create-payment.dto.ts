import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentDto {
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  @IsNumber()
  @IsNotEmpty()
  bookingId: number; // จ่ายเงินสำหรับบิลไหน

  @Transform(({ value }) => {
    if (typeof value === 'string') return parseFloat(value);
    return value;
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number; // ยอดเงินที่จ่าย (เอามาเช็คว่าจ่ายครบไหม)

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // จ่ายผ่านอะไร เช่น 'PROMPTPAY', 'CREDIT_CARD'
}