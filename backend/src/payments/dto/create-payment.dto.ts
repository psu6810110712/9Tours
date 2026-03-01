import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  bookingId: number; // จ่ายเงินสำหรับบิลไหน

  @IsNumber()
  @IsNotEmpty()
  amount: number; // ยอดเงินที่จ่าย (เอามาเช็คว่าจ่ายครบไหม)

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // จ่ายผ่านอะไร เช่น 'PROMPTPAY', 'CREDIT_CARD'
}