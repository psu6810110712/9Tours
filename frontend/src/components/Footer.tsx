export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-4 gap-10">

        {/* ติดต่อเรา */}
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-4">ติดต่อเรา</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </span>
              <span className="text-sm text-gray-700">095-0323782</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </span>
              <span className="text-sm text-gray-700">info@9tours.com</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </span>
              <span className="text-sm text-gray-700">www.9tours.com</span>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-4">Social Media</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
                {/* Line logo */}
                <svg className="w-3.5 h-3.5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629"/>
                </svg>
              </span>
              <span className="text-sm text-gray-700">Line</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </span>
              <span className="text-sm text-gray-700">Facebook</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </span>
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
          <div className="flex items-center gap-2">
            {/* Thai QR Payment Badge */}
            <div className="border border-gray-300 rounded overflow-hidden flex items-center" style={{ height: '40px' }}>
              <div className="bg-[#1a3a6b] flex items-center justify-center px-2 h-full">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 13h2v2h-2zm-4 0h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2z"/>
                </svg>
              </div>
              <div className="bg-white px-2 h-full flex flex-col justify-center leading-tight">
                <span className="text-[9px] font-black text-[#1a3a6b] tracking-wide">THAI QR</span>
                <span className="text-[7px] font-semibold text-[#1a3a6b] tracking-wide">PAYMENT</span>
              </div>
            </div>

            {/* QR Code Box */}
            <div className="border border-gray-300 rounded p-1.5">
              <svg className="w-6 h-6 text-gray-800" viewBox="0 0 100 100" fill="currentColor">
                <rect x="10" y="10" width="30" height="30" rx="3"/>
                <rect x="16" y="16" width="18" height="18" rx="1" fill="white"/>
                <rect x="20" y="20" width="10" height="10" rx="1"/>
                <rect x="60" y="10" width="30" height="30" rx="3"/>
                <rect x="66" y="16" width="18" height="18" rx="1" fill="white"/>
                <rect x="70" y="20" width="10" height="10" rx="1"/>
                <rect x="10" y="60" width="30" height="30" rx="3"/>
                <rect x="16" y="66" width="18" height="18" rx="1" fill="white"/>
                <rect x="20" y="70" width="10" height="10" rx="1"/>
                <rect x="60" y="60" width="8" height="8"/>
                <rect x="72" y="60" width="8" height="8"/>
                <rect x="84" y="60" width="8" height="8"/>
                <rect x="60" y="72" width="8" height="8"/>
                <rect x="72" y="72" width="8" height="8"/>
                <rect x="84" y="84" width="8" height="8"/>
                <rect x="60" y="84" width="8" height="8"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        Copyright © 2026 9Tours Travel Thailand Co., Ltd. สงวนลิขสิทธิ์ตามกฎหมาย
      </div>
    </footer>
  )
}
