import { readFile } from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import { EasySlipService } from './easyslip.service';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

describe('EasySlipService', () => {
  const mockedReadFile = jest.mocked(readFile);
  const originalFetch = global.fetch;

  const createService = () => new EasySlipService({
    get: jest.fn((key: string) => {
      if (key === 'SLIP2GO_API_SECRET') return 'test-secret';
      if (key === 'SLIP2GO_BASE_URL') return 'https://connect.slip2go.com/api';
      return undefined;
    }),
  } as unknown as ConfigService);

  const file = {
    path: 'uploads/slips/mock.png',
    filename: 'mock.png',
    mimetype: 'image/png',
  } as Express.Multer.File;

  beforeEach(() => {
    mockedReadFile.mockResolvedValue(Buffer.from('slip-image'));
  });

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

    const result = await createService().verifySlip(file);

    expect(result.status).toBe('verified');
    expect(result.verifiedAmount).toBe(1);
    expect(result.verifiedTransRef).toBe('TX-001');
  });

  it('treats readable slips marked as valid as verified even when the provider code is different', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      code: '201000',
      message: 'Slip is valid.',
      data: {
        amount: 1,
        referenceId: 'A22fe667943bb4510',
        dateTime: '2026-03-15T14:32:00.000Z',
      },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

    const result = await createService().verifySlip(file);

    expect(result.status).toBe('verified');
    expect(result.verifiedAmount).toBe(1);
    expect(result.verifiedTransRef).toBe('A22fe667943bb4510');
    expect(result.message).toBe('Slip is valid.');
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

    const result = await createService().verifySlip(file);

    expect(result.status).toBe('duplicate');
  });
});
