import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../common/storage.interface';
import { PaymentUploadRateLimitService } from './payment-upload-rate-limit.service';

const MAX_SLIP_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function createValidPngBuffer(width = 300, height = 300) {
  const buffer = Buffer.alloc(24);

  buffer[0] = 0x89;
  buffer[1] = 0x50;
  buffer[2] = 0x4e;
  buffer[3] = 0x47;
  buffer[4] = 0x0d;
  buffer[5] = 0x0a;
  buffer[6] = 0x1a;
  buffer[7] = 0x0a;
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);

  return buffer;
}

describe('PaymentsController multipart upload', () => {
  let app: INestApplication;

  const paymentsService = {
    createPayment: jest.fn(),
    getPaymentQr: jest.fn(),
    getSlipStoredPath: jest.fn(),
  };

  const paymentUploadRateLimitService = {
    assertUploadAllowed: jest.fn(),
  };

  const storageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getFile: jest.fn(),
    fileExists: jest.fn(),
    buildPublicUrl: jest.fn(),
  };

  const authGuard = {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'user-123', role: 'customer' };
      return true;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: paymentsService },
        { provide: PaymentUploadRateLimitService, useValue: paymentUploadRateLimitService },
        { provide: StorageService, useValue: storageService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(authGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    storageService.uploadFile.mockResolvedValue({
      storedPath: 'uploads/slips/test-slip.png',
      publicUrl: 'http://localhost:3000/uploads/slips/test-slip.png',
    });
    paymentsService.createPayment.mockResolvedValue({
      message: 'Payment slip uploaded successfully',
      payment: { id: 1 },
    });
  });

  it('accepts a valid multipart slip upload', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .field('bookingId', '100')
      .field('amount', '5000')
      .field('paymentMethod', 'PROMPTPAY')
      .attach('slip', createValidPngBuffer(), {
        filename: 'slip.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(response.body.message).toBe('Payment slip uploaded successfully');
    expect(paymentUploadRateLimitService.assertUploadAllowed).toHaveBeenCalledTimes(1);
    expect(storageService.uploadFile).toHaveBeenCalledWith(expect.objectContaining({
      originalName: 'slip.png',
      mimetype: 'image/png',
      folder: 'slips',
      buffer: expect.any(Buffer),
    }));
    const [createPaymentDto, uploadedSlip, userId, auditContext] = paymentsService.createPayment.mock.calls[0];
    expect(createPaymentDto).toEqual(expect.objectContaining({
      bookingId: 100,
      amount: 5000,
      paymentMethod: 'PROMPTPAY',
    }));
    expect(uploadedSlip).toEqual(expect.objectContaining({
      storedPath: 'uploads/slips/test-slip.png',
      fileName: 'slip.png',
      mimeType: 'image/png',
    }));
    expect(Buffer.isBuffer(uploadedSlip.buffer)).toBe(true);
    expect(userId).toBe('user-123');
    expect(auditContext).toEqual(expect.objectContaining({
      ipAddress: expect.any(String),
    }));
  });

  it('rejects a file renamed as jpg when the binary is not a real image', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .field('bookingId', '100')
      .field('amount', '5000')
      .field('paymentMethod', 'PROMPTPAY')
      .attach('slip', Buffer.from('this-is-not-a-real-jpeg'), {
        filename: 'fake-slip.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);

    expect(response.body.message).toBe('Uploaded slip is not a valid JPG or PNG image');
    expect(storageService.uploadFile).not.toHaveBeenCalled();
    expect(paymentsService.createPayment).not.toHaveBeenCalled();
  });

  it('rejects files larger than the configured 5 MB limit', async () => {
    const oversizedPng = Buffer.alloc(MAX_SLIP_FILE_SIZE_BYTES + 1);
    createValidPngBuffer().copy(oversizedPng, 0);

    const response = await request(app.getHttpServer())
      .post('/payments')
      .field('bookingId', '100')
      .field('amount', '5000')
      .field('paymentMethod', 'PROMPTPAY')
      .attach('slip', oversizedPng, {
        filename: 'oversized-slip.png',
        contentType: 'image/png',
      })
      .expect(413);

    expect(response.body.message).toBe('File too large');
    expect(storageService.uploadFile).not.toHaveBeenCalled();
    expect(paymentsService.createPayment).not.toHaveBeenCalled();
  });
});
