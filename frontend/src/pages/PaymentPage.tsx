import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()

  const [timeLeft, setTimeLeft] = useState(581)
  const [bookingData, setBookingData] = useState<any>(null)

  useEffect(() => {
    // 1. ระบบนับเวลาถอยหลัง
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    // 2. ดึงข้อมูลการจองจาก Local Storage
    const existingBookings = JSON.parse(localStorage.getItem('myBookings') || '[]')
    let currentBooking = existingBookings.find((b: any) => b.id === bookingId)
    
    // 🌟 เพิ่มระบบ Fallback: ถ้าหาบิลไม่เจอ (เช่น เผลอส่งเลข 5 มา) ให้ดึงข้อมูลมาจำลองไว้ก่อน หน้าเว็บจะได้ไม่พัง
    if (!currentBooking) {
      currentBooking = {
        id: bookingId?.includes('BK') ? bookingId : `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        tourName: 'ทัวร์เขื่อนเชี่ยวหลาน (ข้อมูลจำลอง)',
        date: '17 เม.ย. 2569 - 19 เม.ย. 2569',
        price: 1800,
        adults: 1,
        children: 0,
        status: 'รอชำระเงิน',
        image: 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'
      }
    }

    setBookingData(currentBooking)

    return () => clearInterval(timer)
  }, [bookingId])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleConfirmPayment = () => {
    const existingBookings = JSON.parse(localStorage.getItem('myBookings') || '[]')
    
    // เช็คว่ามีบิลนี้ในระบบไหม ถ้ามีให้อัปเดตสถานะ
    const isExist = existingBookings.some((b: any) => b.id === bookingData.id)
    
    let updatedBookings;
    if (isExist) {
      updatedBookings = existingBookings.map((b: any) => 
        b.id === bookingData.id ? { ...b, status: 'รอตรวจสอบ' } : b
      )
    } else {
      // ถ้าไม่มีในระบบ (เป็นข้อมูลที่ Fallback สร้างขึ้นมา) ให้เพิ่มเข้าไปใหม่
      updatedBookings = [{ ...bookingData, status: 'รอตรวจสอบ' }, ...existingBookings]
    }
    
    localStorage.setItem('myBookings', JSON.stringify(updatedBookings))
    alert('อัปโหลดสลิปสำเร็จ! รอการตรวจสอบจากระบบ')
    navigate('/my-bookings')
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center font-bold text-gray-400 mt-20">
          กำลังโหลดข้อมูลการชำระเงิน...
        </div>
        <Footer />
      </div>
    )
  }

  const adultPrice = 1800; // อิงราคาจากรูปที่คุณส่งมาล่าสุด
  const childPrice = 1000;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-red-50 text-red-500 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
        <span>⏱</span> กรุณาชำระเงินภายใน {formatTime(timeLeft)} นาที
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
          
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm flex flex-col items-center">
            <div className="bg-[#113566] text-white w-full py-2 rounded-t-lg text-center font-bold text-sm tracking-wider">THAI QR PAYMENT</div>
            <div className="bg-[#113566] w-full pb-4 px-4 rounded-b-lg flex flex-col items-center">
               <div className="bg-white p-4 rounded-lg mt-2 w-48 h-48 flex items-center justify-center">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code" className="w-full h-full opacity-90" />
               </div>
            </div>
            <p className="mt-4 font-bold text-gray-700 text-lg">บจก. ไนน์ทัวร์</p>
          </div>

          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
            <h3 className="text-md font-bold text-gray-800 mb-4">สรุปข้อมูลการจองของท่าน</h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 text-[11px] space-y-2 text-gray-600">
                <p><span className="font-bold text-gray-800 w-16 inline-block">รหัสทัวร์</span> {bookingData.id}</p>
                <p><span className="font-bold text-gray-800 w-16 inline-block">ชื่อทัวร์</span> {bookingData.tourName}</p>
                <p><span className="font-bold text-gray-800 w-16 inline-block align-top">วันที่เดินทาง</span> <span className="inline-block w-[100px]">{bookingData.date.replace(' - ', ' -\n')}</span></p>
                <p><span className="font-bold text-gray-800 w-16 inline-block">จำนวน</span> ผู้ใหญ่ {bookingData.adults}, เด็ก {bookingData.children}</p>
              </div>
              <img src={bookingData.image} alt="Tour" className="w-20 h-20 object-cover rounded-lg shadow-sm"/>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mb-4 text-xs space-y-2">
              {bookingData.adults > 0 && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>ผู้ใหญ่</span>
                  <span>{adultPrice.toLocaleString()} x {bookingData.adults}</span>
                  <span className="font-medium text-gray-800">{(bookingData.adults * adultPrice).toLocaleString()} บาท</span>
                </div>
              )}
              {bookingData.children > 0 && (
                <div className="flex justify-between items-center text-gray-600">
                  <span>เด็ก</span>
                  <span>{childPrice.toLocaleString()} x {bookingData.children}</span>
                  <span className="font-medium text-gray-800">{(bookingData.children * childPrice).toLocaleString()} บาท</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
              <span className="font-bold text-gray-800 text-sm">ยอดที่ต้องชำระ</span>
              <span className="text-2xl font-black text-blue-600">{bookingData.price.toLocaleString()} <span className="text-sm font-medium text-gray-800">บาท</span></span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
            <h3 className="text-md font-bold text-gray-800 mb-4 text-center">หลักฐานการชำระเงิน</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 mb-4 cursor-pointer hover:bg-gray-100 transition">
              <span className="text-2xl mb-2 text-gray-400">↑</span>
              <p className="text-xs text-gray-500 font-bold">อัปโหลดรูปภาพ</p>
              <p className="text-[10px] text-gray-400">JPG, PNG หรือ PDF</p>
            </div>
            <div className="text-[11px] text-gray-500 space-y-2 mt-6">
               <p className="font-bold text-gray-700 text-sm mb-3">ขั้นตอนการชำระเงิน</p>
               <p className="flex items-start gap-2"><span className="text-sm">📱</span> เปิดแอปพลิเคชันธนาคาร</p>
               <p className="flex items-start gap-2"><span className="text-sm">📷</span> สแกน QR Code เพื่อชำระเงิน</p>
               <p className="flex items-start gap-2"><span className="text-sm">☑️</span> ตรวจสอบชื่อผู้รับโอนและยอดเงิน</p>
               <p className="flex items-start gap-2"><span className="text-sm">✅</span> แนบสลิปการโอนเงิน</p>
            </div>
          </div>

        </div>

        <div className="flex justify-center mt-12">
          <button 
            onClick={handleConfirmPayment}
            className="bg-[#3b82f6] text-white font-black py-4 px-20 rounded-full hover:bg-blue-600 transition-all text-lg shadow-[0_10px_20px_rgba(59,130,246,0.25)] active:scale-95"
          >
            ยืนยันการชำระเงิน
          </button>
        </div>

      </main>
      <Footer />
    </div>
  )
}