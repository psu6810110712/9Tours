import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-3 gap-8">

        <div>
          <div className="text-xl font-bold mb-3">
            <span className="text-[#F5A623]">9</span>
            <span className="text-white">Tours</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            บริการท่องเที่ยวครบวงจร ทั้งในประเทศและต่างประเทศ
            กับทีมไกด์มืออาชีพที่คุณไว้ใจได้
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">เมนูหลัก</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-[#F5A623] transition-colors">หน้าแรก</Link></li>
            <li><Link to="/tours?tourType=one_day" className="hover:text-[#F5A623] transition-colors">วันเดย์ทริป</Link></li>
            <li><Link to="/tours?tourType=package" className="hover:text-[#F5A623] transition-colors">เที่ยวพร้อมที่พัก</Link></li>
            <li><Link to="/tours" className="hover:text-[#F5A623] transition-colors">ทัวร์ทั้งหมด</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">ติดต่อเรา</h3>
          <ul className="space-y-2 text-sm">
            <li>📞 02-xxx-xxxx</li>
            <li>✉️ contact@9tours.com</li>
            <li>📍 กรุงเทพมหานคร</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-xs text-gray-500">
        © 2026 9Tours. All rights reserved.
      </div>
    </footer>
  )
}
