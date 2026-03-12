import type { ReactNode } from 'react'

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
}: BookingSummaryCardProps) {
  const calculatedTotal = totalPrice !== undefined
    ? totalPrice
    : (isPrivate ? adultPrice : (adults * adultPrice) + (children * childPrice))

  return (
    <div className="ui-surface h-full rounded-[1.75rem] border border-gray-100 bg-white p-6 md:p-7">
      <div className="mb-5 flex items-start gap-4 border-b border-gray-100 pb-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-400">สรุปรายการจอง</p>
          <h3 className="mt-2 text-xl font-bold text-gray-900">ข้อมูลการจอง</h3>
        </div>
        <img
          src={image}
          alt={tourName}
          className="h-24 w-28 rounded-[1.1rem] border border-gray-200 object-cover shadow-sm"
        />
      </div>

      <div className="space-y-3 text-sm text-gray-700">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <span className="font-semibold text-gray-800">รหัสทัวร์</span>
          <span className="font-mono font-semibold tracking-wide text-gray-600">{tourCode}</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <span className="font-semibold text-gray-800">ชื่อทัวร์</span>
          <span className="leading-6 text-gray-700">{tourName}</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <span className="font-semibold text-gray-800">วันที่เดินทาง</span>
          <span className="leading-6 text-gray-700">{date}</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <span className="font-semibold text-gray-800">จำนวน</span>
          <span className="leading-6 text-gray-700">{isPrivate ? 'กรุ๊ปเหมาส่วนตัว' : `ผู้ใหญ่ ${adults}, เด็ก ${children}`}</span>
        </div>
        {accommodation && (
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <span className="font-semibold text-gray-800">ที่พัก</span>
            <span className="leading-6 text-gray-700">{accommodation}</span>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-gray-100 bg-gray-50 p-4">
        <h4 className="mb-3 text-sm font-bold text-gray-800">รายละเอียดราคา</h4>
        <div className="space-y-3 text-sm text-gray-700">
          {isPrivate ? (
            <div className="flex items-center justify-between gap-3">
              <span>ราคาเหมาแบบส่วนตัว</span>
              <span className="font-semibold text-gray-900">{adultPrice.toLocaleString()} บาท</span>
            </div>
          ) : (
            <>
              {adults > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span>ผู้ใหญ่</span>
                  <span className="text-gray-500">{adultPrice.toLocaleString()} × {adults}</span>
                  <span className="font-semibold text-gray-900">{(adults * adultPrice).toLocaleString()} บาท</span>
                </div>
              )}
              {children > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span>เด็ก</span>
                  <span className="text-gray-500">{childPrice.toLocaleString()} × {children}</span>
                  <span className="font-semibold text-gray-900">{(children * childPrice).toLocaleString()} บาท</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-gray-100 pt-5">
        <span className="text-base font-bold text-gray-800">ยอดที่ต้องชำระ</span>
        <div className="text-right">
          <span className="text-3xl font-bold text-primary">{calculatedTotal.toLocaleString()}</span>
          <span className="ml-1.5 text-base font-bold text-gray-800">บาท</span>
        </div>
      </div>
    </div>
  )
}
