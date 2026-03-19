export type VerificationDetailItem = {
  label: string
  value: string
}

export type VerificationDetailSection = {
  title: string
  items: VerificationDetailItem[]
}

type UnknownRecord = Record<string, unknown>

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
] as const

function getNestedRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as UnknownRecord
}

function getReadableValue(value: unknown, seen = new Set<unknown>()): string | null {
  if (value === null || value === undefined) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toLocaleString('th-TH') : null
  }

  if (typeof value === 'boolean') {
    return value ? 'ใช่' : 'ไม่ใช่'
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => getReadableValue(item, seen))
      .filter((item): item is string => Boolean(item))

    return items.length > 0 ? items.join(', ') : null
  }

  const record = getNestedRecord(value)
  if (!record || seen.has(record)) return null

  seen.add(record)

  for (const key of PREFERRED_TEXT_KEYS) {
    const candidate = getReadableValue(record[key], seen)
    if (candidate) return candidate
  }

  for (const nestedValue of Object.values(record)) {
    const candidate = getReadableValue(nestedValue, seen)
    if (candidate) return candidate
  }

  return null
}

function pickFirstValue(...values: unknown[]) {
  return values.find((value) => value !== null && value !== undefined && value !== '')
}

function formatVerificationValue(value: unknown) {
  return getReadableValue(value) ?? '-'
}

function formatVerificationDateTime(value: unknown) {
  const readable = getReadableValue(value)
  if (!readable) return '-'

  const parsed = new Date(readable)
  if (Number.isNaN(parsed.getTime())) {
    return readable
  }

  return parsed.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function buildVerificationDetails(raw: unknown): VerificationDetailSection[] {
  const record = getNestedRecord(raw)
  if (!record) return []

  const data = getNestedRecord(record.data)
  const normalized = getNestedRecord(record.normalized)
  const normalizedParties = getNestedRecord(normalized?.parties)
  const normalizedSender = getNestedRecord(normalizedParties?.sender)
  const normalizedReceiver = getNestedRecord(normalizedParties?.receiver)
  const normalizedTransaction = getNestedRecord(normalized?.transaction)
  const sender = getNestedRecord(data?.sender)
  const receiver = getNestedRecord(data?.receiver)

  const transactionItems: VerificationDetailItem[] = []
  const partyItems: VerificationDetailItem[] = []
  const referenceItems: VerificationDetailItem[] = []
  const extraItems: VerificationDetailItem[] = []

  const pushIfPresent = (
    items: VerificationDetailItem[],
    label: string,
    value: unknown,
    formatter?: (input: unknown) => string,
  ) => {
    const formatted = formatter ? formatter(value) : formatVerificationValue(value)
    if (!formatted || formatted === '-') return
    items.push({ label, value: formatted })
  }

  pushIfPresent(transactionItems, 'สถานะจาก API', record.message)
  pushIfPresent(
    transactionItems,
    'เวลาโอน',
    pickFirstValue(normalizedTransaction?.dateTime, data?.dateTime, data?.transDate, data?.transactionDateTime),
    formatVerificationDateTime,
  )
  pushIfPresent(
    transactionItems,
    'จำนวนเงินที่ตรวจได้',
    pickFirstValue(normalizedTransaction?.amount, data?.amount),
    (value) => `${formatVerificationValue(value)} บาท`,
  )
  pushIfPresent(
    transactionItems,
    'ค่าธรรมเนียม',
    pickFirstValue(data?.fee, data?.feeAmount),
    (value) => `${formatVerificationValue(value)} บาท`,
  )
  pushIfPresent(transactionItems, 'รหัสผลตรวจ', record.code)

  pushIfPresent(
    partyItems,
    'ชื่อผู้โอน',
    pickFirstValue(
      normalizedSender?.name,
      sender?.displayName,
      sender?.name,
      data?.senderName,
      data?.payerName,
      data?.fromName,
    ),
  )
  pushIfPresent(
    partyItems,
    'ธนาคารผู้โอน',
    pickFirstValue(normalizedSender?.bank, sender?.bank, sender?.bankName),
  )
  pushIfPresent(
    partyItems,
    'บัญชีผู้โอน',
    pickFirstValue(normalizedSender?.account, sender?.account, sender?.accountNo, sender?.accountNumber),
  )
  pushIfPresent(
    partyItems,
    'ชื่อผู้รับ',
    pickFirstValue(
      normalizedReceiver?.name,
      receiver?.displayName,
      receiver?.name,
      data?.receiverName,
      data?.payeeName,
      data?.toName,
    ),
  )
  pushIfPresent(
    partyItems,
    'ธนาคารผู้รับ',
    pickFirstValue(normalizedReceiver?.bank, receiver?.bank, receiver?.bankName),
  )
  pushIfPresent(
    partyItems,
    'บัญชีผู้รับ',
    pickFirstValue(normalizedReceiver?.account, receiver?.account, receiver?.accountNo, receiver?.accountNumber),
  )

  pushIfPresent(
    referenceItems,
    'เลขอ้างอิงธุรกรรม',
    pickFirstValue(normalizedTransaction?.reference, data?.transRef, data?.transactionId, data?.referenceId),
  )
  pushIfPresent(referenceItems, 'Ref 1', data?.ref1)
  pushIfPresent(referenceItems, 'Ref 2', data?.ref2)
  pushIfPresent(referenceItems, 'Ref 3', data?.ref3)

  const decode = typeof data?.decode === 'string' ? data.decode.replace(/\s+/g, ' ').trim() : ''
  if (decode) {
    extraItems.push({
      label: 'ข้อมูลจาก QR',
      value: decode.length > 160 ? `${decode.slice(0, 160)}...` : decode,
    })
  }

  return [
    { title: 'ข้อมูลธุรกรรม', items: transactionItems },
    { title: 'ผู้โอนและผู้รับ', items: partyItems },
    { title: 'เลขอ้างอิง', items: referenceItems },
    { title: 'ข้อมูลเพิ่มเติม', items: extraItems },
  ].filter((section) => section.items.length > 0)
}
