import { attachSlipVerificationNormalization, buildSlipVerificationNormalizedBlock } from './slip2go-normalizer';

describe('slip2go-normalizer', () => {
  it('normalizes nested sender and receiver objects', () => {
    const normalized = buildSlipVerificationNormalizedBlock({
      data: {
        sender: {
          displayName: { th: 'นายสมชาย ใจดี' },
          bank: { th: 'กสิกรไทย' },
          account: { value: '123-4-56789-0' },
        },
        receiver: {
          name: { en: 'Nine Tours Co., Ltd.' },
          bankName: { en: 'Bangkok Bank' },
          accountNumber: { value: '987-6-54321-0' },
        },
        dateTime: '2026-03-19T09:00:00.000Z',
        amount: 5000,
        transRef: 'TX-5000',
      },
    });

    expect(normalized.parties.sender).toEqual({
      name: 'นายสมชาย ใจดี',
      bank: 'กสิกรไทย',
      account: '123-4-56789-0',
    });
    expect(normalized.parties.receiver).toEqual({
      name: 'Nine Tours Co., Ltd.',
      bank: 'Bangkok Bank',
      account: '987-6-54321-0',
    });
    expect(normalized.transaction).toEqual({
      dateTime: '2026-03-19T09:00:00.000Z',
      amount: 5000,
      reference: 'TX-5000',
    });
  });

  it('supports direct string fields and arrays', () => {
    const normalized = buildSlipVerificationNormalizedBlock({
      data: {
        senderName: ['สมหญิง', 'ใจงาม'],
        receiverName: 'บริษัท 9Tours',
        sender: {
          bankName: 'SCB',
          accountNo: '111-222-3333',
        },
        receiver: {
          bank: ['Krungthai'],
          account: ['999-888-7777'],
        },
        transactionDateTime: '2026-03-19 16:45:00',
        amount: '1500.50',
        referenceId: 'REF-1500',
      },
    });

    expect(normalized.parties.sender.name).toBe('สมหญิง, ใจงาม');
    expect(normalized.parties.sender.bank).toBe('SCB');
    expect(normalized.parties.sender.account).toBe('111-222-3333');
    expect(normalized.parties.receiver.name).toBe('บริษัท 9Tours');
    expect(normalized.parties.receiver.bank).toBe('Krungthai');
    expect(normalized.parties.receiver.account).toBe('999-888-7777');
    expect(normalized.transaction.reference).toBe('REF-1500');
  });

  it('keeps original payload shape and appends normalized block', () => {
    const payload = {
      code: '200000',
      message: 'Slip verified successfully',
      data: {
        senderName: { th: 'ผู้โอน' },
      },
    };

    const result = attachSlipVerificationNormalization(payload);

    expect(result.code).toBe('200000');
    expect(result.message).toBe('Slip verified successfully');
    expect(result.data).toEqual(payload.data);
    expect(result.normalized).toBeDefined();
  });
});
