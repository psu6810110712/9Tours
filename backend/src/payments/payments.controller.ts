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
import { ensureValidSlipImage } from './slip-file.utils';

const MAX_SLIP_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('slip', {
      storage: diskStorage({
        destination: './uploads/slips',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Please upload only JPG or PNG slip images'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: MAX_SLIP_FILE_SIZE_BYTES,
      },
    }),
  )
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @UploadedFile() slipFile: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!slipFile) {
      throw new BadRequestException('A payment slip image is required (field: slip)');
    }

    await ensureValidSlipImage(slipFile);

    const bookingId = parseInt(createPaymentDto.bookingId as any, 10);

    return this.paymentsService.createPayment(
      { ...createPaymentDto, bookingId },
      slipFile,
      req.user.id,
    );
  }
}
