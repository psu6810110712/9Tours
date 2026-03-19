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
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../common/storage.interface';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { validateSlipImageBuffer } from './slip-file.utils';
import { PaymentUploadRateLimitService } from './payment-upload-rate-limit.service';

const MAX_SLIP_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentUploadRateLimitService: PaymentUploadRateLimitService,
    private readonly storageService: StorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('slip', {
      storage: 'memory' as any, // Use memory storage
      fileFilter: (_req, file, cb) => {
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

    try {
      this.paymentUploadRateLimitService.assertUploadAllowed(req.user.id, req.ip ?? 'unknown');

      // Validate slip image from buffer
      validateSlipImageBuffer(slipFile.buffer);

      // Upload to storage service
      const uploadResult = await this.storageService.uploadFile({
        buffer: slipFile.buffer,
        originalName: slipFile.originalname,
        mimetype: slipFile.mimetype,
        folder: 'slips',
      });

      const bookingId = parseInt(createPaymentDto.bookingId as any, 10);

      return this.paymentsService.createPayment(
        { ...createPaymentDto, bookingId },
        {
          storedPath: uploadResult.storedPath,
          buffer: slipFile.buffer,
          fileName: slipFile.originalname,
          mimeType: slipFile.mimetype,
        },
        req.user.id,
        {
          ipAddress: req.ip ?? null,
          userAgent: typeof req.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : null,
        },
      );
    } catch (error) {
      // No need to delete file since we're using storage service with transactional upload
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
    const { storedPath, isOwner } = await this.paymentsService.getSlipStoredPath(
      Number(paymentId),
      req.user.id,
      req.user.role === 'admin',
    );

    // Get file from storage
    const fileResult = await this.storageService.getFile({ storedPath });

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // If local storage, send file
    if (fileResult.localPath) {
      return res.sendFile(fileResult.localPath);
    }

    // If S3, send buffer with content type
    if (fileResult.buffer) {
      if (fileResult.contentType) {
        res.setHeader('Content-Type', fileResult.contentType);
      }
      return res.send(fileResult.buffer);
    }

    throw new BadRequestException('Failed to retrieve slip file');
  }
}
