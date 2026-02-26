import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// นำเข้า useAuth และ LoginModal ของคุณมาใช้
import { useAuth } from '../../context/AuthContext'
import LoginModal from '../LoginModal' 

interface Props {
  tour: any 
}

export default function BookingSidebar({ tour }: Props) {
  const navigate = useNavigate()
  
  // 1. เรียกใช้ Context เพื่อเช็คว่า User ล็อกอินหรือยัง
  const { user } = useAuth() 
  
  // State สำหรับจำนวนคน
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)

  // State สำหรับควบคุมการเปิด/ปิด Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false)

  // คำนวณราคา
  const adultPrice = tour?.price || 1500 
  const childPrice = tour?.childPrice || 1000 
  const totalPrice = (adults * adultPrice) + (children * childPrice)

  // ฟังก์ชันเมื่อกดปุ่ม "จองเลย"
  const handleBookingClick = () => {
    // 🌟 ดักจับ: ถ้ายังไม่ล็อกอิน ให้เปิด Modal ที่คุณทำไว้ขึ้นมา
    if (!user) {
      setShowLoginModal(true)
      return
    }

    // ถ้าล็อกอินแล้ว ส่งไปหน้ากรอกข้อมูลการจองได้เลย
    navigate(`/booking/${tour.id}?adults=${adults}&children=${children}`)
  }

  return (
    <>
      <div className="bg-white p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 sticky top-10">
        <div className="mb-6">
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">เปิดจองแล้ว</span>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-3xl font-black text-gray-800">฿{adultPrice.toLocaleString()}</span>
            <span className="text-gray-400 text-sm font-medium">/ ท่าน</span>
          </div>
        </div>

        <div className="space-y-5 mb-8">
          <h4 className="font-bold text-gray-700 text-sm">ระบุจำนวนผู้เดินทาง</h4>
          
          {/* เลือกผู้ใหญ่ */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">ผู้ใหญ่</p>
              <p className="text-[11px] text-gray-400 font-medium">12 ปีขึ้นไป</p>
            </div>
            <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
              <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 flex items-center justify-center text-blue-600 font-bold hover:bg-white rounded-full transition-all"> − </button>
              <span className="w-8 text-center font-bold text-gray-800">{adults}</span>
              <button type="button" onClick={() => setAdults(adults + 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full shadow-md"> + </button>
            </div>
          </div>

          {/* เลือกเด็ก */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">เด็ก</p>
              <p className="text-[11px] text-gray-400 font-medium">2 - 11 ปี</p>
            </div>
            <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
              <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 flex items-center justify-center text-blue-600 font-bold hover:bg-white rounded-full transition-all"> − </button>
              <span className="w-8 text-center font-bold text-gray-800">{children}</span>
              <button type="button" onClick={() => setChildren(children + 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full shadow-md"> + </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-50 pt-5 mb-6">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">ราคารวม</span>
            <span className="text-2xl font-black text-blue-600">฿{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* ปุ่มจองเลย */}
        <button 
          onClick={handleBookingClick}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-[0_12px_24px_rgba(37,99,235,0.15)] active:scale-95 text-lg"
        >
          จองเลย
        </button>
        
        <p className="text-center text-gray-400 text-[10px] mt-4 font-medium uppercase tracking-tight">
          * ยืนยันทันทีหลังการชำระเงิน
        </p>
      </div>

      {/* 🌟 แสดง Modal ของคุณเมื่อ state เป็น true 🌟 */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)} 
          onSwitchToRegister={() => {
            setShowLoginModal(false)
            // ถ้าคุณมีหน้า Register ก็ให้มันพาไปหน้านั้นครับ (หรือเปิด Modal สมัครสมาชิก)
            navigate('/register') 
          }} 
        />
      )}
    </>
  )
}