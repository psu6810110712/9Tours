import { FaPhone, FaEnvelope, FaGlobe, FaFacebookF, FaInstagram } from 'react-icons/fa'
import { SiLine } from 'react-icons/si'

function CircleIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
      {children}
    </span>
  )
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-4 gap-10">

        {/* ติดต่อเรา */}
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-4">ติดต่อเรา</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaPhone className="w-3 h-3 text-gray-600" /></CircleIcon>
              <span className="text-sm text-gray-700">095-0323782</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaEnvelope className="w-3 h-3 text-gray-600" /></CircleIcon>
              <span className="text-sm text-gray-700">info@9tours.com</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaGlobe className="w-3 h-3 text-gray-600" /></CircleIcon>
              <span className="text-sm text-gray-700">www.9tours.com</span>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-4">Social Media</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2.5">
              <CircleIcon><SiLine className="w-3.5 h-3.5 text-[#06C755]" /></CircleIcon>
              <span className="text-sm text-gray-700">Line</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaFacebookF className="w-3 h-3 text-[#1877F2]" /></CircleIcon>
              <span className="text-sm text-gray-700">Facebook</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CircleIcon><FaInstagram className="w-3.5 h-3.5 text-[#E4405F]" /></CircleIcon>
              <span className="text-sm text-gray-700">Instagram</span>
            </li>
          </ul>
        </div>

        {/* เกี่ยวกับ */}
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-4">เกี่ยวกับ</h3>
          <ul className="space-y-2.5">
            <li>
              <a href="#" className="text-sm text-gray-700 underline hover:text-[#F5A623] transition-colors">
                ข้อกำหนดและเงื่อนไข
              </a>
            </li>
            <li>
              <a href="#" className="text-sm text-gray-700 underline hover:text-[#F5A623] transition-colors">
                นโยบายความเป็นส่วนตัว
              </a>
            </li>
          </ul>
        </div>

        {/* ช่องทางการชำระเงิน */}
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-4">ช่องทางการชำระเงิน</h3>
          <img
            src="/thai-qr-payment.png"
            alt="Thai QR Payment"
            className="h-10 w-auto rounded"
          />
        </div>

      </div>

      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        Copyright © 2026 9Tours Travel Thailand Co., Ltd. สงวนลิขสิทธิ์ตามกฎหมาย
      </div>
    </footer>
  )
}
