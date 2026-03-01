import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('slip'))
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @UploadedFile() slipFile: Express.Multer.File,
    @Req() req: any,
  ) {
    // Convert bookingId from string to number
    const bookingId = parseInt(createPaymentDto.bookingId as any, 10);

    return this.paymentsService.createPayment(
      { ...createPaymentDto, bookingId },
      slipFile,
      req.user.id,
    );
  }
}
