import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

export default function AdminTourFormPage() {
  const navigate = useNavigate()
  const [tourType, setTourType] = useState('package')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
          
          {/* Header & Radio Buttons */}
          <div className="flex flex-wrap items-center gap-6 mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-2xl font-bold text-gray-800">เพิ่ม/แก้ไขทัวร์</h1>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" name="tourType" value="package"
                  checked={tourType === 'package'} onChange={(e) => setTourType(e.target.value)}
                  className="accent-[#F5A623] w-4 h-4" 
                />
                <span className="text-sm text-gray-700 font-medium">เที่ยวพร้อมที่พัก</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" name="tourType" value="one_day"
                  checked={tourType === 'one_day'} onChange={(e) => setTourType(e.target.value)}
                  className="accent-[#F5A623] w-4 h-4" 
                />
                <span className="text-sm text-gray-700 font-medium">วันเดย์ทริป</span>
              </label>
            </div>
          </div>

          <form className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* --- คอลัมน์ซ้าย --- */}
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">รหัสทัวร์ <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="รหัสทัวร์" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">ชื่อทัวร์ <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-bold text-gray-800">แท็กประเภทของทัวร์</label>
                  <button type="button" className="text-xs bg-[#F5A623] text-white px-3 py-1 rounded-full">+ เพิ่มแท็ก</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล'].map((tag, i) => (
                    <span key={tag} className={`text-xs px-4 py-1.5 rounded-full ${i === 0 ? 'bg-[#F5A623] text-white' : 'bg-gray-200 text-gray-500'}`}>{tag}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">รายละเอียดทัวร์ <span className="text-red-500">*</span></label>
                <textarea rows={4} placeholder="รายละเอียดทัวร์" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623] resize-none"></textarea>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-bold text-gray-800">เกี่ยวกับทัวร์นี้</label>
                  <button type="button" className="text-xs bg-[#F5A623] text-white px-3 py-1 rounded-full">+ เพิ่มแท็ก</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['ยกเลิกฟรี', 'มีรถรับส่ง', 'อาหารกลางวัน', 'เที่ยวเต็มวัน', 'มีไกด์นำเที่ยว'].map((tag, i) => (
                    <span key={tag} className={`text-xs px-4 py-1.5 rounded-full ${i < 4 ? 'bg-[#F5A623] text-white' : 'bg-gray-200 text-gray-500'}`}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">ภาค <span className="text-red-500">*</span></label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623] appearance-none">
                    <option></option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">จังหวัด <span className="text-red-500">*</span></label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623] appearance-none">
                    <option></option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">เทศกาล</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623] appearance-none">
                    <option></option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">ราคา <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-2.5 text-sm outline-none focus:border-[#F5A623]" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">บาท</span>
                  </div>
                </div>
              </div>

            </div>

            {/* --- คอลัมน์ขวา --- */}
            <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 flex flex-col">
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-3">รูปภาพและกำหนดการ</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/80 h-32 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  <p className="text-sm text-gray-500 font-medium">ลากรูปมาที่นี่ หรือ คลิกเพื่ออัปโหลด</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-6 mb-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-gray-800">กำหนดการ</label>
                    <button type="button" className="text-xs bg-[#F5A623] text-white px-3 py-1 rounded-full">+ เพิ่มช่วงเวลา</button>
                  </div>
                  <label className="text-sm font-bold text-gray-800">จำนวนผู้เดินทาง</label>
                </div>

                <div className="space-y-3">
                  {[1, 2].map((item, i) => (
                    <div key={item} className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                        <input type="text" placeholder={i === 0 ? "1 มี.ค. 2569 - 30 เม.ย. 2569" : "1 ธ.ค. 2569 - 31 มี.ค. 2570"} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#F5A623]" />
                      </div>
                      <div className="relative w-32 flex-shrink-0">
                        <input type="number" defaultValue="150" className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-12 py-2.5 text-sm outline-none focus:border-[#F5A623]" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">คน/วัน</span>
                      </div>
                      <input type="checkbox" defaultChecked={i === 0} className="w-4 h-4 accent-[#F5A623] cursor-pointer" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8 flex-1">
                <label className="block text-sm font-bold text-gray-800 mb-2">คำแนะนำการเดินทาง</label>
                <textarea rows={4} className="w-full h-32 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F5A623] resize-none shadow-sm"></textarea>
              </div>

              {/* ปุ่ม Action */}
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => navigate('/admin/tours')}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button" 
                  className="px-8 py-2.5 rounded-full text-sm font-bold text-white bg-[#F5A623] hover:bg-[#E09415] shadow-md transition-colors"
                >
                  บันทึก
                </button>
              </div>

            </div>
          </form>

        </div>
      </div>
    </div>
  )
}