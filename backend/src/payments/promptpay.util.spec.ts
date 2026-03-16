import { buildPromptPayPayload, getActivePaymentQrExpiry } from './promptpay.util';

describe('promptpay.util', () => {
  it('builds a dynamic PromptPay payload for Thai mobile numbers', () => {
    const payload = buildPromptPayPayload('081-234-5678', 1500);

    expect(payload).toContain('000201');
    expect(payload).toContain('010212');
    expect(payload).toContain('0016A000000677010111');
    expect(payload).toContain('01130066812345678');
    expect(payload).toContain('5303764');
    expect(payload).toContain('54041500');
    expect(payload).toContain('5802TH');
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });

  it('keeps satang when amount has decimals', () => {
    const payload = buildPromptPayPayload('0812345678', 1500.5);

    expect(payload).toContain('54071500.50');
  });

  it('returns the QR expiry 15 minutes after booking creation', () => {
    const createdAt = new Date('2026-03-15T10:00:00.000Z');

    expect(getActivePaymentQrExpiry(createdAt).toISOString()).toBe('2026-03-15T10:15:00.000Z');
  });

  it('rejects unsupported PromptPay identifiers', () => {
    expect(() => buildPromptPayPayload('12345', 999)).toThrow(
      'PROMPTPAY_ID must be a Thai mobile number, national ID, or e-wallet ID',
    );
  });
});
