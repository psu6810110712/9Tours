const PROMPTPAY_BOT_ID = 'A000000677010111';
const COUNTRY_CODE = 'TH';
const CURRENCY_CODE = '764';

function formatTag(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

function sanitizePromptPayId(value: string) {
  return value.replace(/[^0-9]/g, '');
}

function normalizePromptPayTarget(value: string) {
  const sanitized = sanitizePromptPayId(value);

  if (sanitized.length === 10 && sanitized.startsWith('0')) {
    return { targetType: '01', targetValue: `0066${sanitized.slice(1)}` };
  }

  if (sanitized.length === 13) {
    return { targetType: '02', targetValue: sanitized };
  }

  if (sanitized.length === 15) {
    return { targetType: '03', targetValue: sanitized };
  }

  throw new Error('PROMPTPAY_ID must be a Thai mobile number, national ID, or e-wallet ID');
}

function formatAmount(amount: number) {
  return amount.toFixed(2).replace(/\.00$/, '');
}

function crc16Ccitt(payload: string) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j += 1) {
      crc = (crc & 0x8000) !== 0
        ? ((crc << 1) ^ 0x1021)
        : (crc << 1);
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildPromptPayPayload(promptPayId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('PromptPay amount must be greater than zero');
  }

  const { targetType, targetValue } = normalizePromptPayTarget(promptPayId);
  const merchantInfo = formatTag(
    '29',
    formatTag('00', PROMPTPAY_BOT_ID) + formatTag(targetType, targetValue),
  );

  const payloadWithoutCrc = [
    formatTag('00', '01'),
    formatTag('01', '12'),
    merchantInfo,
    formatTag('53', CURRENCY_CODE),
    formatTag('54', formatAmount(amount)),
    formatTag('58', COUNTRY_CODE),
    '6304',
  ].join('');

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
}

export function getActivePaymentQrExpiry(createdAt: Date) {
  return new Date(createdAt.getTime() + (15 * 60 * 1000));
}
