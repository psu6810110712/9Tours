import { ConfigService } from '@nestjs/config';
import { EasySlipService } from './easyslip.service';

describe('EasySlipService', () => {
  const originalFetch = global.fetch;
  const fileBuffer = Buffer.from('slip-image');
  const fileName = 'mock.png';
  const mimeType = 'image/png';

  const createService = () => new EasySlipService({
    get: jest.fn((key: string) => {
      if (key === 'SLIP2GO_API_SECRET') return 'test-secret';
      if (key === 'SLIP2GO_BASE_URL') return 'https://connect.slip2go.com/api';
      return undefined;
    }),
  } as unknown as ConfigService);

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('marks canonical Slip2Go success as verified', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      code: '200000',
      message: 'Slip verified successfully',
      data: {
        amount: 1,
        transRef: 'TX-001',
        dateTime: '2026-03-15T14:32:00.000Z',
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

    const result = await createService().verifySlip(fileBuffer, fileName, mimeType);

    expect(result.status).toBe('verified');
    expect(result.verifiedAmount).toBe(1);
    expect(result.verifiedTransRef).toBe('TX-001');
    expect(result.raw?.normalized).toEqual({
      parties: {
        sender: { name: null, bank: null, account: null },
        receiver: { name: null, bank: null, account: null },
      },
      transaction: {
        dateTime: '2026-03-15T14:32:00.000Z',
        amount: 1,
        reference: 'TX-001',
      },
    });
  });

  it('treats readable slips marked as valid as verified and appends normalized details', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      code: '201000',
      message: 'Slip is valid.',
      data: {
        amount: 1,
        referenceId: 'A22fe667943bb4510',
        dateTime: '2026-03-15T14:32:00.000Z',
        sender: {
          displayName: { th: 'นายใจดี' },
          bank: { th: 'กสิกรไทย' },
          account: { value: '123-4-56789-0' },
        },
        receiver: {
          name: { en: 'Nine Tours' },
          bankName: { en: 'Bangkok Bank' },
          accountNumber: { value: '987-6-54321-0' },
        },
      },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

    const result = await createService().verifySlip(fileBuffer, fileName, mimeType);

    expect(result.status).toBe('verified');
    expect(result.verifiedAmount).toBe(1);
    expect(result.verifiedTransRef).toBe('A22fe667943bb4510');
    expect(result.message).toBe('ตรวจสลิปผ่าน');
    expect(result.raw?.normalized).toEqual({
      parties: {
        sender: { name: 'นายใจดี', bank: 'กสิกรไทย', account: '123-4-56789-0' },
        receiver: { name: 'Nine Tours', bank: 'Bangkok Bank', account: '987-6-54321-0' },
      },
      transaction: {
        dateTime: '2026-03-15T14:32:00.000Z',
        amount: 1,
        reference: 'A22fe667943bb4510',
      },
    });
  });

  it('still keeps duplicate slips as duplicate', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'DUPLICATE_001',
      message: 'This slip was already used',
      data: {
        amount: 1,
        referenceId: 'TX-USED',
      },
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

    const result = await createService().verifySlip(fileBuffer, fileName, mimeType);

    expect(result.status).toBe('duplicate');
    expect(result.raw?.normalized).toEqual({
      parties: {
        sender: { name: null, bank: null, account: null },
        receiver: { name: null, bank: null, account: null },
      },
      transaction: {
        dateTime: null,
        amount: 1,
        reference: 'TX-USED',
      },
    });
  });
});
