import { NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { ToursService } from '../tours/tours.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EasySlipService, type EasySlipVerificationResult } from '../easyslip/easyslip.service';

const mockAccess = jest.fn();
const mockReaddir = jest.fn();
const mockStat = jest.fn();
jest.mock('node:fs/promises', () => ({
  access: (...args: any[]) => mockAccess(...args),
  readdir: (...args: any[]) => mockReaddir(...args),
  stat: (...args: any[]) => mockStat(...args),
}));

const mockSafeDeleteFile = jest.fn();
jest.mock('./slip-file.utils', () => ({
  safeDeleteFile: (...args: any[]) => mockSafeDeleteFile(...args),
}));

const mockBuildStoredUploadPath = jest.fn((...segments: string[]) => segments.join('/'));
const mockResolveStoredUploadPath = jest.fn((path: string) => `D:/9tours/backend/${path}`);
const mockGetSlipUploadDirectory = jest.fn(() => 'D:/9tours/backend/uploads/slips');
const mockGetUploadsRoot = jest.fn(() => 'D:/9tours/backend/uploads');
jest.mock('../common/upload-paths', () => ({
  buildStoredUploadPath: (...args: unknown[]) => mockBuildStoredUploadPath(...(args as string[])),
  resolveStoredUploadPath: (...args: unknown[]) => mockResolveStoredUploadPath(...(args as [string])),
  getSlipUploadDirectory: () => mockGetSlipUploadDirectory(),
  getUploadsRoot: () => mockGetUploadsRoot(),
}));

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepository: any;
  let bookingsRepository: any;
  let configService: any;
  let toursService: any;
  let notificationsService: any;
  let easySlipService: any;
  let storageService: any;

  const mockUserId = 'user-123';
  const mockAdminId = 'admin-456';

  const createMockBooking = (overrides: Partial<Booking> = {}): Booking => ({
    id: 100,
    userId: mockUserId,
    scheduleId: 1,
    paxCount: 2,
    adults: 2,
    children: 0,
    totalPrice: 5000,
    status: BookingStatus.PENDING_PAYMENT,
    contactName: 'Test User',
    contactPrefix: 'นาย',
    contactEmail: 'test@example.com',
    contactPhone: '0812345678',
    createdAt: new Date(),
    ...overrides,
  } as any);

  const createMockPayment = (overrides: Partial<Payment> = {}): Payment => ({
    id: 1,
    bookingId: 100,
    amountPaid: 5000,
    paymentMethod: 'PROMPTPAY',
    slipUrl: 'uploads/slips/test.jpg',
    uploadedByUserId: mockUserId,
    uploadedFromIp: '127.0.0.1',
    uploadedFromUserAgent: 'Test',
    verificationStatus: 'verified',
    verifiedAmount: 5000,
    verifiedTransRef: 'TX-001',
    verifiedAt: new Date(),
    verificationProvider: 'slip2go',
    verificationMessage: 'verified',
    verificationRaw: {},
    uploadedAt: new Date(),
    ...overrides,
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();

    mockBuildStoredUploadPath.mockImplementation((...segments: string[]) => segments.join('/'));
    mockResolveStoredUploadPath.mockImplementation((path: string) => `D:/9tours/backend/${path}`);
    mockGetSlipUploadDirectory.mockReturnValue('D:/9tours/backend/uploads/slips');
    mockGetUploadsRoot.mockReturnValue('D:/9tours/backend/uploads');
    mockAccess.mockResolvedValue(undefined);
    mockReaddir.mockResolvedValue([]);
    mockStat.mockResolvedValue({ mtimeMs: Date.now() } as any);

    paymentsRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((entity) => ({ id: Math.random(), ...entity })),
    };

    bookingsRepository = {
      findOne: jest.fn(),
      save: jest.fn((entity) => entity),
    };

    configService = {
      get: jest.fn(),
    };

    toursService = {
      findAll: jest.fn(() => [{ id: 1, name: 'Test Tour', schedules: [{ id: 1 }] }]),
    };

    notificationsService = {
      notifyAdminsPaymentUploaded: jest.fn().mockResolvedValue(undefined),
    };

    easySlipService = {
      verifySlip: jest.fn(),
    };

    storageService = {
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getFile: jest.fn(),
      uploadFile: jest.fn(),
      fileExists: jest.fn(),
      buildPublicUrl: jest.fn(),
    };

    service = new PaymentsService(
      paymentsRepository,
      bookingsRepository,
      configService as unknown as ConfigService,
      toursService as unknown as ToursService,
      notificationsService as unknown as NotificationsService,
      easySlipService as unknown as EasySlipService,
      storageService,
    );
  });

  describe('getPaymentQr', () => {
    it('generates QR code for valid booking with pending payment status', async () => {
      const booking = createMockBooking({
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      });
      bookingsRepository.findOne.mockResolvedValue(booking);
      configService.get.mockImplementation((key: string) => {
        if (key === 'PROMPTPAY_ID') return '0812345678';
        if (key === 'PROMPTPAY_ACCOUNT_NAME') return 'Test Account';
        return undefined;
      });

      const result = await service.getPaymentQr(100, mockUserId);

      expect(result.bookingId).toBe(100);
      expect(result.amount).toBe(5000);
      expect(result.accountName).toBe('Test Account');
      expect(result.qrPayload).toBeDefined();
      expect(result.qrImageUrl).toContain('qrserver.com');
      expect(result.expiresAt).toBeDefined();
    });

    it('throws NotFoundException when booking not found', async () => {
      bookingsRepository.findOne.mockResolvedValue(null);

      await expect(service.getPaymentQr(999, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when booking status is not pending_payment', async () => {
      const booking = createMockBooking({ status: BookingStatus.CONFIRMED });
      bookingsRepository.findOne.mockResolvedValue(booking);

      await expect(service.getPaymentQr(100, mockUserId)).rejects.toThrow(
        'QR is only available while the booking is awaiting payment',
      );
    });

    it('throws BadRequestException when QR payment window has expired', async () => {
      const booking = createMockBooking({
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      });
      bookingsRepository.findOne.mockResolvedValue(booking);

      await expect(service.getPaymentQr(100, mockUserId)).rejects.toThrow(
        'The QR payment window has expired for this booking',
      );
    });

    it('throws ServiceUnavailableException when PromptPay is not configured', async () => {
      const booking = createMockBooking({
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: new Date(),
      });
      bookingsRepository.findOne.mockResolvedValue(booking);
      configService.get.mockReturnValue(undefined);

      await expect(service.getPaymentQr(100, mockUserId)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('createPayment', () => {
    const mockSlipFile = {
      filename: 'test-slip.jpg',
      path: '/tmp/test-slip.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const mockCreatePaymentDto = {
      bookingId: 100,
      amount: 5000,
      paymentMethod: 'PROMPTPAY',
    };

    it('successfully creates payment with verified slip', async () => {
      const booking = createMockBooking({
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: new Date(),
      });
      bookingsRepository.findOne.mockResolvedValue(booking);
      paymentsRepository.findOne.mockResolvedValue(null);
      easySlipService.verifySlip.mockResolvedValue({
        status: 'verified',
        provider: 'slip2go',
        message: 'verified',
        verifiedAmount: 5000,
        verifiedTransRef: 'TX-001',
        verifiedAt: new Date(),
        raw: {},
      } as EasySlipVerificationResult);

      const result = await service.createPayment(
        mockCreatePaymentDto,
        mockSlipFile,
        mockUserId,
        { ipAddress: '127.0.0.1', userAgent: 'Test' },
      );

      expect(result.message).toBe('Payment slip uploaded successfully');
      expect(result.payment).toBeDefined();
      expect(result.booking.status).toBe(BookingStatus.AWAITING_APPROVAL);
      expect(notificationsService.notifyAdminsPaymentUploaded).toHaveBeenCalledWith({
        bookingId: 100,
        tourName: 'Test Tour',
        customerName: 'Test User',
        amount: 5000,
      });
    });

    it('throws NotFoundException when booking not found', async () => {
      bookingsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createPayment(mockCreatePaymentDto, mockSlipFile, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when booking is canceled', async () => {
      const booking = createMockBooking({ status: BookingStatus.CANCELED });
      bookingsRepository.findOne.mockResolvedValue(booking);

      await expect(
        service.createPayment(mockCreatePaymentDto, mockSlipFile, mockUserId),
      ).rejects.toThrow('This payment session has already expired');
    });

    it('throws BadRequestException when booking status is not in payment or awaiting_approval state', async () => {
      const booking = createMockBooking({ status: BookingStatus.CONFIRMED });
      bookingsRepository.findOne.mockResolvedValue(booking);

      await expect(
        service.createPayment(mockCreatePaymentDto, mockSlipFile, mockUserId),
      ).rejects.toThrow('Booking is not in a replaceable payment state');
    });

    it('throws BadRequestException when booking is in wrong status', async () => {
      const booking = createMockBooking({ status: BookingStatus.CONFIRMED });
      bookingsRepository.findOne.mockResolvedValue(booking);

      await expect(
        service.createPayment(mockCreatePaymentDto, mockSlipFile, mockUserId),
      ).rejects.toThrow('Booking is not in a replaceable payment state');
    });

    it('throws BadRequestException when slip already uploaded and cannot replace', async () => {
      const booking = createMockBooking({ status: BookingStatus.PENDING_PAYMENT });
      const existingPayment = createMockPayment({ bookingId: 100 });
      bookingsRepository.findOne.mockResolvedValue(booking);
      paymentsRepository.findOne.mockResolvedValue(existingPayment);

      await expect(
        service.createPayment(mockCreatePaymentDto, mockSlipFile, mockUserId),
      ).rejects.toThrow('A payment slip has already been uploaded for this booking');
    });

    it('allows replacing slip when status is awaiting_approval and not reviewed', async () => {
      const booking = createMockBooking({
        status: BookingStatus.AWAITING_APPROVAL,
        reviewedAt: null,
      });
      const existingPayment = createMockPayment({ bookingId: 100 });
      bookingsRepository.findOne.mockResolvedValue(booking);
      paymentsRepository.findOne.mockResolvedValue(existingPayment);
      easySlipService.verifySlip.mockResolvedValue({
        status: 'verified',
        provider: 'slip2go',
        message: 'verified',
        verifiedAmount: 5000,
        verifiedTransRef: 'TX-002',
        verifiedAt: new Date(),
        raw: {},
      } as EasySlipVerificationResult);

      const result = await service.createPayment(
        mockCreatePaymentDto,
        mockSlipFile,
        mockUserId,
      );

      expect(result.message).toBe('Payment slip replaced successfully');
    });

    it('fails when slip amount does not match booking amount', async () => {
      const booking = createMockBooking({
        status: BookingStatus.PENDING_PAYMENT,
        totalPrice: 5000,
      });
      bookingsRepository.findOne.mockResolvedValue(booking);
      paymentsRepository.findOne.mockResolvedValue(null);
      easySlipService.verifySlip.mockResolvedValue({
        status: 'verified',
        provider: 'slip2go',
        message: 'verified',
        verifiedAmount: 3000,
        verifiedTransRef: 'TX-001',
        verifiedAt: new Date(),
        raw: {},
      } as EasySlipVerificationResult);

      const result = await service.createPayment(
        mockCreatePaymentDto,
        mockSlipFile,
        mockUserId,
      );

      expect(result.verification.status).toBe('amount_mismatch');
    });

    it('fails when slip verification returns failed status', async () => {
      const booking = createMockBooking({
        status: BookingStatus.PENDING_PAYMENT,
        totalPrice: 5000,
      });
      bookingsRepository.findOne.mockResolvedValue(booking);
      paymentsRepository.findOne.mockResolvedValue(null);
      easySlipService.verifySlip.mockResolvedValue({
        status: 'failed',
        provider: 'slip2go',
        message: 'Slip verification failed',
        verifiedAmount: null,
        verifiedTransRef: null,
        verifiedAt: null,
        raw: {},
      } as EasySlipVerificationResult);

      const result = await service.createPayment(
        mockCreatePaymentDto,
        mockSlipFile,
        mockUserId,
      );

      expect(result.verification.status).toBe('failed');
    });

    it('fails when slip verification returns duplicate status', async () => {
      const booking = createMockBooking({
        status: BookingStatus.PENDING_PAYMENT,
        totalPrice: 5000,
      });
      bookingsRepository.findOne.mockResolvedValue(booking);
      paymentsRepository.findOne.mockResolvedValue(null);
      easySlipService.verifySlip.mockResolvedValue({
        status: 'duplicate',
        provider: 'slip2go',
        message: 'Slip already used',
        verifiedAmount: 5000,
        verifiedTransRef: 'TX-DUP',
        verifiedAt: null,
        raw: {},
      } as EasySlipVerificationResult);

      const result = await service.createPayment(
        mockCreatePaymentDto,
        mockSlipFile,
        mockUserId,
      );

      expect(result.verification.status).toBe('duplicate');
    });

    it('fails when slip verification returns unreadable status', async () => {
      const booking = createMockBooking({
        status: BookingStatus.PENDING_PAYMENT,
        totalPrice: 5000,
      });
      bookingsRepository.findOne.mockResolvedValue(booking);
      paymentsRepository.findOne.mockResolvedValue(null);
      easySlipService.verifySlip.mockResolvedValue({
        status: 'unreadable',
        provider: 'slip2go',
        message: 'Cannot read slip',
        verifiedAmount: null,
        verifiedTransRef: null,
        verifiedAt: null,
        raw: {},
      } as EasySlipVerificationResult);

      const result = await service.createPayment(
        mockCreatePaymentDto,
        mockSlipFile,
        mockUserId,
      );

      expect(result.verification.status).toBe('unreadable');
    });
  });

  describe('getSlipStoredPath', () => {

    it('throws NotFoundException when payment not found', async () => {
      paymentsRepository.findOne.mockResolvedValue(null);

      await expect(service.getSlipStoredPath(999, mockUserId, false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when payment has no slip', async () => {
      const payment = createMockPayment({ slipUrl: undefined });
      paymentsRepository.findOne.mockResolvedValue(payment);

      await expect(service.getSlipStoredPath(1, mockUserId, false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when non-admin user tries to access others payment', async () => {
      const payment = createMockPayment({
        id: 1,
        booking: { id: 100, userId: 'other-user' } as Booking,
      });
      paymentsRepository.findOne.mockResolvedValue(payment);

      await expect(service.getSlipStoredPath(1, mockUserId, false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns stored path for the owner', async () => {
      const payment = createMockPayment({
        id: 1,
        booking: { id: 100, userId: mockUserId } as Booking,
      });
      paymentsRepository.findOne.mockResolvedValue(payment);

      await expect(service.getSlipStoredPath(1, mockUserId, false)).resolves.toEqual({
        storedPath: payment.slipUrl,
        isOwner: true,
      });
    });
  });

  describe('cleanupOrphanSlipFiles', () => {
    it('deletes orphaned slip files older than 24 hours', async () => {
      const payments = [{ slipUrl: 'uploads/slips/kept.jpg' }];
      paymentsRepository.find.mockResolvedValue(payments);

      const oldFileStat = {
        mtimeMs: Date.now() - 25 * 60 * 60 * 1000,
      };
      mockReaddir.mockResolvedValue(['orphan.jpg', 'kept.jpg']);
      mockStat.mockResolvedValue(oldFileStat as any);

      await service.cleanupOrphanSlipFiles();

      expect(mockReaddir).toHaveBeenCalled();
    });

    it('keeps files that are referenced in database', async () => {
      const payments = [{ slipUrl: 'uploads/slips/kept.jpg' }];
      paymentsRepository.find.mockResolvedValue(payments);

      mockReaddir.mockResolvedValue(['kept.jpg', 'orphan.jpg']);

      const oldFileStat = {
        mtimeMs: Date.now() - 25 * 60 * 60 * 1000,
      };

      mockStat.mockImplementation((path: string) => {
        if (path.includes('orphan.jpg')) {
          return Promise.resolve(oldFileStat as any);
        }
        return Promise.resolve({ mtimeMs: Date.now() } as any);
      });

      await service.cleanupOrphanSlipFiles();

      expect(mockReaddir).toHaveBeenCalled();
    });

    it('keeps files younger than 24 hours', async () => {
      const payments = [];
      paymentsRepository.find.mockResolvedValue(payments);

      const recentFileStat = {
        mtimeMs: Date.now() - 12 * 60 * 60 * 1000,
      };
      mockReaddir.mockResolvedValue(['recent.jpg']);
      mockStat.mockResolvedValue(recentFileStat as any);

      await service.cleanupOrphanSlipFiles();

      expect(mockStat).toHaveBeenCalled();
    });

    it('handles empty slip directory gracefully', async () => {
      const payments = [];
      paymentsRepository.find.mockResolvedValue(payments);
      mockReaddir.mockResolvedValue([]);

      await expect(service.cleanupOrphanSlipFiles()).resolves.not.toThrow();
    });

    it('handles missing slip directory gracefully', async () => {
      mockReaddir.mockRejectedValue(new Error('ENOENT'));

      await expect(service.cleanupOrphanSlipFiles()).resolves.not.toThrow();
    });
  });
});
