import type { ReactNode } from 'react'
import { buildDisplayName } from '../../utils/profileValidation'

interface BookingSummaryCardProps {
  tourCode: string
  tourName: string
  date: ReactNode
  adults: number
  children: number
  adultPrice: number
  childPrice: number
  image: string
  accommodation?: string
  totalPrice?: number
  isPrivate?: boolean
  contactPrefix?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
}

export default function BookingSummaryCard({
  tourCode,
  tourName,
  date,
  adults,
  children,
  adultPrice,
  childPrice,
  image,
  accommodation,
  totalPrice,
  isPrivate,
  contactPrefix,
  contactName,
  contactEmail,
  contactPhone,
}: BookingSummaryCardProps) {
  const normalizedAdultPrice = Number(adultPrice || 0)
  const normalizedChildPrice = Number(childPrice || 0)
  const calculatedTotal = totalPrice !== undefined
    ? Number(totalPrice)
    : (isPrivate ? normalizedAdultPrice : (adults * normalizedAdultPrice) + (children * normalizedChildPrice))
  const totalTravelers = isPrivate ? Math.max(adults, 1) : adults + children
  const hasContactInfo = Boolean(contactPrefix || contactName || contactEmail || contactPhone)
  const bookingTypeLabel = isPrivate ? 'กรุ๊ปเหมาส่วนตัว' : 'Join Trip'
  const contactDisplayName = buildDisplayName(contactPrefix, contactName) || contactName?.trim() || '-'
  const contactEmailLabel = contactEmail?.trim() || '-'
  const contactPhoneLabel = contactPhone?.trim() || '-'

  const formatAmount = (value: number) => {
    const amount = Number(value || 0)
    const isWholeNumber = Number.isInteger(amount)

    return amount.toLocaleString('en-US', {
      minimumFractionDigits: isWholeNumber ? 0 : 2,
      maximumFractionDigits: isWholeNumber ? 0 : 2,
    })
  }

  return (
    <div className="ui-surface flex h-full flex-col rounded-[1.65rem] border border-gray-100 bg-white p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3 border-b border-gray-100 pb-4">
        <div className="min-w-0 flex-1">
          <p className="text-[24px] font-bold uppercase tracking-wide text-gray-900">สรุปรายการจอง</p>
          <h3 className="mt-3 text-[1.15rem] font-semibold leading-tight text-gray-700">ข้อมูลการจอง</h3>
        </div>
        <img
          src={image}
          alt={tourName}
          className="h-20 w-24 rounded-[1rem] border border-gray-200 object-cover shadow-sm"
        />
      </div>

      <div className="space-y-3 text-base text-gray-700">
        <div className="grid grid-cols-[104px_1fr] gap-3">
          <span className="font-semibold text-gray-800">รหัสทัวร์</span>
          <span className="font-mono font-semibold tracking-wide text-gray-600">{tourCode}</span>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-3">
          <span className="font-semibold text-gray-800">ชื่อทัวร์</span>
          <span className="leading-6 text-gray-700">{tourName}</span>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-3">
          <span className="font-semibold text-gray-800">วันที่เดินทาง</span>
          <span className="leading-6 text-gray-700">{date}</span>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-3">
          <span className="font-semibold text-gray-800">จำนวน</span>
          <div className="leading-6 text-gray-700">
            <p>{isPrivate ? 'กรุ๊ปเหมาส่วนตัว' : `ผู้ใหญ่ ${adults}, เด็ก ${children}`}</p>
            <p className="text-[15px] text-gray-500">รวม {totalTravelers.toLocaleString('en-US')} คน</p>
          </div>
        </div>
        <div className="grid grid-cols-[104px_1fr] gap-3">
          <span className="font-semibold text-gray-800">รูปแบบ</span>
          <span className="leading-6 text-gray-700">{bookingTypeLabel}</span>
        </div>
        {accommodation && (
          <div className="grid grid-cols-[104px_1fr] gap-3">
            <span className="font-semibold text-gray-800">ที่พัก</span>
            <span className="leading-6 text-gray-700">{accommodation}</span>
          </div>
        )}
      </div>

      {hasContactInfo && (
        <div className="mt-4 rounded-[1.05rem] border border-gray-100 bg-white px-4 py-3.5">
          <p className="text-[16px] font-bold text-gray700">ข้อมูลติดต่อของท่าน</p>
          <div className="mt-3 space-y-2.5 text-base text-gray-700">
            <div className="flex items-start justify-between gap-4">
              <span className="font-medium text-gray-500">ชื่อ</span>
              <span className="max-w-[260px] break-words text-right font-semibold text-gray-900">{contactDisplayName}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="font-medium text-gray-500">อีเมล</span>
              <span className="max-w-[260px] break-all text-right text-gray-900">{contactEmailLabel}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="font-medium text-gray-500">โทรศัพท์</span>
              <span className="max-w-[260px] break-words text-right text-gray-900">{contactPhoneLabel}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-[1.15rem] border border-gray-100 bg-gray-50 p-4">
        <h4 className="mb-3 text-base font-bold text-gray-800">รายละเอียดราคา</h4>
        <div className="space-y-3 text-base text-gray-700">
          {isPrivate ? (
            <div className="flex items-center justify-between gap-3">
              <span>ราคาเหมาแบบส่วนตัว</span>
              <span className="font-semibold text-gray-900">{formatAmount(normalizedAdultPrice)} บาท</span>
            </div>
          ) : (
            <>
              {adults > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span>ผู้ใหญ่</span>
                  <span className="text-gray-500">{formatAmount(normalizedAdultPrice)} × {adults}</span>
                  <span className="font-semibold text-gray-900">{formatAmount(adults * normalizedAdultPrice)} บาท</span>
                </div>
              )}
              {children > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span>เด็ก</span>
                  <span className="text-gray-500">{formatAmount(normalizedChildPrice)} × {children}</span>
                  <span className="font-semibold text-gray-900">{formatAmount(children * normalizedChildPrice)} บาท</span>
                </div>
              )}
            </>
          )}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between gap-3 text-gray-800">
              <span>ราคารวม</span>
              <span className="font-semibold text-gray-900">{formatAmount(calculatedTotal)} บาท</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
        <span className="text-lg font-bold text-gray-800">ยอดที่ต้องชำระ</span>
        <div className="text-right">
          <span className="text-3xl font-bold text-primary">{formatAmount(calculatedTotal)}</span>
          <span className="ml-1.5 text-lg font-bold text-gray-800">บาท</span>
        </div>
      </div>
    </div>
  )
}
