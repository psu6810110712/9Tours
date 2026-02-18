export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-4 gap-8">

        {/* ติดต่อเรา */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4">ติดต่อเรา</h3>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-gray-400">📞</span> 095-0323782
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gray-400">✉️</span> info@9tours.com
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gray-400">🌐</span> www.9tours.com
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4">Social Media</h3>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              {/* Line icon */}
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              Line
            </li>
            <li className="flex items-center gap-2">
              {/* Facebook icon */}
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </li>
            <li className="flex items-center gap-2">
              {/* Instagram icon */}
              <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </li>
          </ul>
        </div>

        {/* เกี่ยวกับ */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4">เกี่ยวกับ</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="#" className="text-gray-600 hover:text-[#F5A623] underline underline-offset-2 transition-colors">
                ข้อกำหนดและเงื่อนไข
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-[#F5A623] underline underline-offset-2 transition-colors">
                นโยบายความเป็นส่วนตัว
              </a>
            </li>
          </ul>
        </div>

        {/* ช่องทางการชำระเงิน */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4">ช่องทางการชำระเงิน</h3>
          <div className="flex items-center gap-2">
            {/* Thai QR Payment badge */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-blue-800 bg-white">
              <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h7v7H3zm1 1v5h5V4zm1 1h3v3H5zm8-2h7v7h-7zm1 1v5h5V4zm1 1h3v3h-3zM3 13h7v7H3zm1 1v5h5v-5zm1 1h3v3H5zm8 0h2v2h-2zm3 0h2v2h-2zm-3 3h2v2h-2zm3 0h2v2h-2z"/>
              </svg>
              THAI QR<br/>PAYMENT
            </div>
            {/* QR code icon */}
            <div className="border border-gray-200 rounded-lg p-2">
              <svg className="w-8 h-8 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h7v7H3zm1 1v5h5V4zm1 1h3v3H5zm8-2h7v7h-7zm1 1v5h5V4zm1 1h3v3h-3zM3 13h7v7H3zm1 1v5h5v-5zm1 1h3v3H5zm8 0h2v2h-2zm3 0h2v2h-2zm-3 3h2v2h-2zm3 0h2v2h-2z"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

      <div className="border-t border-gray-100 text-center py-4 text-xs text-gray-400">
        Copyright © 2026 9Tours Travel Thailand Co., Ltd. สงวนลิขสิทธิ์ตามกฎหมาย
      </div>
    </footer>
  )
}
