type UnknownRecord = Record<string, unknown>;

export interface SlipVerificationPartySummary {
  name: string | null;
  bank: string | null;
  account: string | null;
}

export interface SlipVerificationNormalizedBlock {
  parties: {
    sender: SlipVerificationPartySummary;
    receiver: SlipVerificationPartySummary;
  };
  transaction: {
    dateTime: string | null;
    amount: number | string | null;
    reference: string | null;
  };
}

const PREFERRED_TEXT_KEYS = [
  'displayName',
  'name',
  'fullName',
  'title',
  'label',
  'value',
  'th',
  'en',
  'bankName',
  'bank',
  'accountNumber',
  'accountNo',
  'account',
] as const;

function getRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function getReadableValue(value: unknown, seen = new Set<unknown>()): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => getReadableValue(item, seen))
      .filter((item): item is string => Boolean(item));

    return items.length > 0 ? items.join(', ') : null;
  }

  const record = getRecord(value);
  if (!record || seen.has(record)) {
    return null;
  }

  seen.add(record);

  for (const key of PREFERRED_TEXT_KEYS) {
    const candidate = getReadableValue(record[key], seen);
    if (candidate) {
      return candidate;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const candidate = getReadableValue(nestedValue, seen);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function pickFirstReadable(...values: unknown[]) {
  for (const value of values) {
    const readable = getReadableValue(value);
    if (readable) {
      return readable;
    }
  }

  return null;
}

function pickFirstValue(...values: unknown[]) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }

  return null;
}

function pickFirstScalarValue(...values: unknown[]): string | number | null {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

export function buildSlipVerificationNormalizedBlock(payload: UnknownRecord): SlipVerificationNormalizedBlock {
  const data = getRecord(payload.data);
  const sender = getRecord(data?.sender);
  const receiver = getRecord(data?.receiver);

  return {
    parties: {
      sender: {
        name: pickFirstReadable(
          sender?.displayName,
          sender?.name,
          data?.senderName,
          data?.payerName,
          data?.fromName,
        ),
        bank: pickFirstReadable(sender?.bank, sender?.bankName),
        account: pickFirstReadable(sender?.account, sender?.accountNo, sender?.accountNumber),
      },
      receiver: {
        name: pickFirstReadable(
          receiver?.displayName,
          receiver?.name,
          data?.receiverName,
          data?.payeeName,
          data?.toName,
        ),
        bank: pickFirstReadable(receiver?.bank, receiver?.bankName),
        account: pickFirstReadable(receiver?.account, receiver?.accountNo, receiver?.accountNumber),
      },
    },
    transaction: {
      dateTime: pickFirstReadable(data?.dateTime, data?.transDate, data?.transactionDateTime),
      amount: pickFirstScalarValue(data?.amount, data?.totalAmount),
      reference: pickFirstReadable(data?.transRef, data?.transactionId, data?.referenceId),
    },
  };
}

export function attachSlipVerificationNormalization(payload: UnknownRecord): UnknownRecord {
  return {
    ...payload,
    normalized: buildSlipVerificationNormalizedBlock(payload),
  };
}
