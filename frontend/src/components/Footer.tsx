import type { ReactNode } from 'react'
import { FaEnvelope, FaFacebookF, FaGlobe, FaInstagram, FaPhone } from 'react-icons/fa'
import { SiLine } from 'react-icons/si'

function CircleIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm">
      {children}
    </span>
  )
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <h3 className="mb-4 text-sm font-bold text-gray-900">ติดต่อเรา</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaPhone className="h-3 w-3 text-gray-600" /></CircleIcon>
              <span className="text-sm font-medium text-gray-700">095-0323782</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaEnvelope className="h-3 w-3 text-gray-600" /></CircleIcon>
              <span className="text-sm font-medium text-gray-700">info@9tours.com</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaGlobe className="h-3 w-3 text-gray-600" /></CircleIcon>
              <span className="text-sm font-medium text-gray-700">www.9tours.com</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gray-900">Social Media</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2.5">
              <CircleIcon><SiLine className="h-3.5 w-3.5 text-[#06C755]" /></CircleIcon>
              <span className="text-sm font-medium text-gray-700">Line Official</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaFacebookF className="h-3 w-3 text-[#1877F2]" /></CircleIcon>
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaInstagram className="h-3.5 w-3.5 text-[#E4405F]" /></CircleIcon>
              <span className="text-sm font-medium text-gray-700">Instagram</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gray-900">ข้อมูลสำคัญ</h3>
          <ul className="space-y-2.5 text-sm font-medium text-gray-700">
            <li>ข้อกำหนดและเงื่อนไขการจอง</li>
            <li>นโยบายความเป็นส่วนตัว</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gray-900">ช่องทางการชำระเงิน</h3>
          <img
            src="/thai-qr-payment.png"
            alt="Thai QR Payment"
            className="h-10 w-auto rounded"
          />
          <p className="mt-3 text-sm font-medium text-gray-600">รองรับการชำระผ่าน Thai QR Payment</p>
        </div>
      </div>

      <div className="border-t border-gray-100 py-4 text-center text-xs font-medium text-gray-500">
        Copyright © 2026 9Tours Travel Thailand Co., Ltd. สงวนลิขสิทธิ์ตามกฎหมาย
      </div>
    </footer>
  )
}
