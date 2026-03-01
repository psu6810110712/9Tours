import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('slip', {
      storage: diskStorage({
        destination: './uploads/slips', // โฟลเดอร์ปลายทางที่จะเซฟรูป
        filename: (req, file, cb) => {
          // สุ่มชื่อไฟล์ใหม่ ป้องกันชื่อซ้ำกัน (เช่น 168123456-1234.jpg)
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // ดักไว้ให้รับเฉพาะไฟล์รูปภาพเท่านั้น
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG) เท่านั้น'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @UploadedFile() slipFile: Express.Multer.File,
    @Req() req: any,
  ) {
    // 1. เช็คว่ามีคนแนบไฟล์มาจริงไหม
    if (!slipFile) {
      throw new BadRequestException('ต้องแนบไฟล์สลิปการโอนเงิน (field: slip)');
    }

    // 2. แปลง bookingId จาก string (ที่มากับ form-data) เป็น number
    const bookingId = parseInt(createPaymentDto.bookingId as any, 10);

    // 3. ส่งข้อมูลไปให้ Service ทำงานต่อ
    return this.paymentsService.createPayment(
      { ...createPaymentDto, bookingId },
      slipFile,
      req.user.id,
    );
  }
}
