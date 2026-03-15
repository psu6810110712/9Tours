import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ensureDirectoryExistsSync, getSlipUploadDirectory } from '../common/upload-paths';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ensureValidSlipImage, safeDeleteFile } from './slip-file.utils';
import { PaymentUploadRateLimitService } from './payment-upload-rate-limit.service';

const MAX_SLIP_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentUploadRateLimitService: PaymentUploadRateLimitService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('slip', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, ensureDirectoryExistsSync(getSlipUploadDirectory()));
        },
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
    try {
      if (!slipFile) {
        throw new BadRequestException('A payment slip image is required (field: slip)');
      }

      this.paymentUploadRateLimitService.assertUploadAllowed(req.user.id, req.ip ?? 'unknown');
      await ensureValidSlipImage(slipFile);

      const bookingId = parseInt(createPaymentDto.bookingId as any, 10);

      return this.paymentsService.createPayment(
        { ...createPaymentDto, bookingId },
        slipFile,
        req.user.id,
        {
          ipAddress: req.ip ?? null,
          userAgent: typeof req.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : null,
        },
      );
    } catch (error) {
      await safeDeleteFile(slipFile?.path);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:bookingId/qr')
  async getPaymentQr(
    @Param('bookingId') bookingId: string,
    @Req() req: any,
  ) {
    return this.paymentsService.getPaymentQr(Number(bookingId), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':paymentId/slip')
  async getProtectedSlip(
    @Param('paymentId') paymentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const absolutePath = await this.paymentsService.getSlipFilePath(
      Number(paymentId),
      req.user.id,
      req.user.role === 'admin',
    );

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.sendFile(absolutePath);
  }
}
