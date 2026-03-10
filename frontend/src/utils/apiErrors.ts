interface ApiErrorPayload {
  message?: string | string[];
}

type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

const DEFAULT_FIELD_HINTS: Record<string, string[]> = {
  prefix: ['prefix', 'คำนำหน้า'],
  name: ['name', 'ชื่อ-นามสกุล', 'ชื่อ'],
  email: ['email', 'อีเมล'],
  phone: ['phone', 'เบอร์', 'โทรศัพท์', 'หมายเลขโทรศัพท์'],
  identifier: ['identifier', 'อีเมลหรือหมายเลขโทรศัพท์'],
  password: ['password', 'รหัสผ่าน'],
  contactPrefix: ['contactprefix'],
  contactName: ['contactname'],
  contactEmail: ['contactemail'],
  contactPhone: ['contactphone'],
};

function getMessages(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return [] as string[];
  }

  const response = error as { response?: { data?: ApiErrorPayload } };
  const message = response.response?.data?.message;
  if (Array.isArray(message)) {
    return message.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  }

  if (typeof message === 'string' && message.trim()) {
    return [message];
  }

  return [] as string[];
}

export function extractApiFieldErrors<TField extends string>(
  error: unknown,
  fields: readonly TField[],
  customHints: Partial<Record<TField, string[]>> = {},
): FieldErrors<TField> {
  const messages = getMessages(error);
  const result: FieldErrors<TField> = {};
  const resultRecord = result as Record<string, string | undefined>;
  const fieldSet = new Set<string>(fields);

  for (const message of messages) {
    const normalizedMessage = message.toLowerCase();

    for (const field of fields) {
      if (result[field]) {
        continue;
      }

      const hints = [...(customHints[field] ?? []), ...(DEFAULT_FIELD_HINTS[field] ?? [])];
      if (hints.some((hint) => normalizedMessage.includes(hint.toLowerCase()))) {
        result[field] = message;
      }
    }
  }

  if (!resultRecord.email && fieldSet.has('email') && messages.some((message) => message.includes('อีเมล'))) {
    resultRecord.email = messages.find((message) => message.includes('อีเมล'));
  }

  if (!resultRecord.phone && fieldSet.has('phone') && messages.some((message) => message.includes('โทรศัพท์') || message.includes('เบอร์'))) {
    resultRecord.phone = messages.find((message) => message.includes('โทรศัพท์') || message.includes('เบอร์'));
  }

  if (!resultRecord.password && fieldSet.has('password') && messages.some((message) => message.includes('รหัสผ่าน'))) {
    resultRecord.password = messages.find((message) => message.includes('รหัสผ่าน'));
  }

  if (!resultRecord.identifier && fieldSet.has('identifier') && messages.some((message) => message.includes('อีเมลหรือหมายเลขโทรศัพท์'))) {
    resultRecord.identifier = messages.find((message) => message.includes('อีเมลหรือหมายเลขโทรศัพท์'));
  }

  return result;
}

export function extractApiErrorMessage(error: unknown, fallbackMessage: string) {
  const messages = getMessages(error);
  return messages[0] ?? fallbackMessage;
}
