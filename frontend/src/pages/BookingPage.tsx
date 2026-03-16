import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PaymentPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const navigate = useNavigate()

  // จำลองเวลานับถอยหลัง (9 นาที 41 วินาที = 581 วินาที)
  const [timeLeft, setTimeLeft] = useState(581)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleConfirmPayment = () => {
    // 1. จำลองการบันทึกข้อมูลการจองลง Local Storage (เพื่อให้ไปโผล่ในหน้าการจองของฉัน)
    const newBooking = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      tourName: 'ทัวร์เกาะพีพีดําน้ำชมปะการัง',
      date: '17 เม.ย. 2569 - 19 เม.ย. 2569',
      price: 4000,
      status: 'รอตรวจสอบ', // สถานะหลังจากโอนเงิน
      image: 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'
    }

    const existingBookings = JSON.parse(localStorage.getItem('myBookings') || '[]')
    localStorage.setItem('myBookings', JSON.stringify([newBooking, ...existingBookings]))

    alert('อัปโหลดสลิปสำเร็จ! รอการตรวจสอบจากระบบ')
    // 2. เด้งไปหน้า การจองของฉัน
    navigate('/my-bookings')
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* แถบแจ้งเตือนเวลา */}
      <div className="bg-red-50 text-red-500 py-2 text-center text-sm font-bold flex items-center justify-center gap-2">
        <span>⏱</span> กรุณาชำระเงินภายใน {formatTime(timeLeft)} นาที
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* --- Header & Progress Bar --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 relative">
          <button onClick={() => navigate(-1)} className="text-blue-500 font-medium hover:underline flex items-center gap-1 mb-4 md:mb-0 z-10">
            ← ย้อนกลับ
          </button>

          {/* Progress Bar */}
          <div className="flex-1 flex justify-center w-full absolute left-0">
            <div className="flex items-start gap-0 w-full max-w-2xl mx-auto">
              <div className="flex flex-col items-center relative flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm z-10">✓</div>
                <span className="text-blue-500 text-xs font-bold mt-2">จอง</span>
                <div className="absolute top-4 left-[50%] w-full h-[2px] bg-blue-500"></div>
              </div>
              <div className="flex flex-col items-center relative flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm z-10">✓</div>
                <span className="text-blue-500 text-xs font-bold mt-2">ตรวจสอบข้อมูล</span>
                <div className="absolute top-4 left-[50%] w-full h-[2px] bg-blue-500"></div>
              </div>
              <div className="flex flex-col items-center relative flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm z-10">3</div>
                <span className="text-blue-500 text-xs font-bold mt-2">ชำระเงิน</span>
                <div className="absolute top-4 left-[50%] w-full h-[2px] bg-blue-200"></div>
              </div>
              <div className="flex flex-col items-center relative flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-300 flex items-center justify-center font-bold text-sm z-10">4</div>
                <span className="text-gray-400 text-xs mt-2">รับตั๋ว</span>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-8 mt-16 md:mt-0 text-center">สแกนเพื่อชำระเงิน</h1>

        {/* --- 3 Columns Layout --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
          
          {/* คอลัมน์ 1: QR Code */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm flex flex-col items-center">
            <div className="bg-[#113566] text-white w-full py-2 rounded-t-lg text-center font-bold text-sm">
              THAI QR PAYMENT
            </div>
            <div className="bg-[#113566] w-full pb-4 px-4 rounded-b-lg flex flex-col items-center">
               <div className="bg-white p-4 rounded-lg mt-2 w-48 h-48 flex items-center justify-center">
                 {/* แทนที่ด้วยรูป QR ของจริง */}
                 <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code" className="w-full h-full opacity-80" />
               </div>
            </div>
            <p className="mt-4 font-bold text-gray-700">ศิริพงศ์ ...</p>
          </div>

          {/* คอลัมน์ 2: สรุปการจอง */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
            <h3 className="text-md font-bold text-gray-800 mb-4">สรุปข้อมูลการจองของท่าน</h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 text-[11px] space-y-2 text-gray-600">
                <p><span className="font-bold text-gray-800 w-16 inline-block">รหัสทัวร์</span> {tourId || '13012026'}</p>
                <p><span className="font-bold text-gray-800 w-16 inline-block">ชื่อทัวร์</span> ทัวร์เกาะพีพีดําน้ำชมปะการัง</p>
                <p><span className="font-bold text-gray-800 w-16 inline-block align-top">วันที่เดินทาง</span> <span className="inline-block w-[100px]">17 เม.ย. พ.ศ.2569 -<br/>19 เม.ย. พ.ศ.2569</span></p>
                <p><span className="font-bold text-gray-800 w-16 inline-block">จำนวน</span> ผู้ใหญ่ 2, เด็ก 1</p>
                <p><span className="font-bold text-gray-800 w-16 inline-block">ที่พัก</span> PP Princess Resort</p>
              </div>
              <img src="https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=150" alt="Tour" className="w-20 h-20 object-cover rounded-lg"/>
            </div>
            <div className="border-t border-gray-100 pt-4 mb-4 text-xs">
              <div className="flex justify-between mb-1"><span>ผู้ใหญ่</span><span>1,500 x 2</span><span>3,000 บาท</span></div>
              <div className="flex justify-between"><span>เด็ก</span><span>1,000 x 1</span><span>1,000 บาท</span></div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-gray-800 text-sm">ยอดที่ต้องชำระ</span>
              <span className="text-xl font-bold text-gray-800">4,000 <span className="text-sm">บาท</span></span>
            </div>
          </div>

          {/* คอลัมน์ 3: อัปโหลดสลิป */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
            <h3 className="text-md font-bold text-gray-800 mb-4 text-center">หลักฐานการชำระเงิน</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 mb-4 cursor-pointer hover:bg-gray-100 transition">
              <span className="text-2xl mb-2 text-gray-400">↑</span>
              <p className="text-xs text-gray-500 font-bold">อัปโหลดรูปภาพ</p>
              <p className="text-[10px] text-gray-400">JPG, PNG หรือ PDF</p>
            </div>
            <div className="text-[11px] text-gray-500 space-y-2">
               <p className="font-bold text-gray-700">ขั้นตอนการชำระเงิน</p>
               <p className="flex items-start gap-1"><span>📱</span> เปิดแอปพลิเคชันธนาคาร</p>
               <p className="flex items-start gap-1"><span>📷</span> สแกน QR Code เพื่อชำระเงิน</p>
               <p className="flex items-start gap-1"><span>☑️</span> ตรวจสอบชื่อผู้รับโอนและยอดเงิน</p>
               <p className="flex items-start gap-1"><span>✅</span> แนบสลิปการโอนเงิน</p>
            </div>
          </div>

        </div>

        {/* ปุ่มยืนยัน */}
        <div className="flex justify-center mt-10">
          <button 
            onClick={handleConfirmPayment}
            className="bg-[#3b82f6] text-white font-bold py-3.5 px-16 rounded-full hover:bg-blue-600 transition-all text-lg shadow-md"
          >
            ยืนยันการชำระเงิน
          </button>
        </div>

      </main>
      <Footer />
    </div>
  )
}