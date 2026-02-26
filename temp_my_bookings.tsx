import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function MyBookingPage() {
  const [activeTab, setActiveTab] = useState('α╕ùα╕▒α╣ëα╕çα╕½α╕íα╕ö')
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  
  const navigate = useNavigate()

  // 1. α╣Çα╕₧α╕┤α╣êα╕íα╣üα╕ùα╣çα╕Ü "α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º" α╕üα╕Ñα╕▒α╕Üα╣Çα╕éα╣ëα╕▓α╕íα╕▓
  const tabs = ['α╕ùα╕▒α╣ëα╕çα╕½α╕íα╕ö', 'α╕úα╕¡α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö', 'α╕úα╕¡α╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Ü', 'α╕¬α╕│α╣Çα╕úα╣çα╕ê', 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º']

  // α╕öα╕╢α╕çα╕éα╣ëα╕¡α╕íα╕╣α╕Ñα╣Çα╕íα╕╖α╣êα╕¡α╣éα╕½α╕Ñα╕öα╕½α╕Öα╣ëα╕▓α╣Çα╕ºα╣çα╕Ü
  useEffect(() => {
    loadBookings()
  }, [])

  // 2. α╕ƒα╕▒α╕çα╕üα╣îα╕èα╕▒α╕Öα╣éα╕½α╕Ñα╕öα╕éα╣ëα╕¡α╕íα╕╣α╕Ñ α╕₧α╕úα╣ëα╕¡α╕íα╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Üα╕ºα╕▒α╕Öα╕½α╕íα╕öα╕¡α╕▓α╕óα╕╕ (1 α╕ºα╕▒α╕Ö) α╕¬α╕│α╕½α╕úα╕▒α╕Üα╕úα╕▓α╕óα╕üα╕▓α╕úα╕ùα╕╡α╣êα╕ûα╕╣α╕üα╕óα╕üα╣Çα╕Ñα╕┤α╕ü
  const loadBookings = () => {
    const rawBookings = JSON.parse(localStorage.getItem('myBookings') || '[]')
    const now = Date.now()
    const ONE_DAY_MS = 24 * 60 * 60 * 1000 // 24 α╕èα╕▒α╣êα╕ºα╣éα╕íα╕çα╣âα╕Öα╕½α╕Öα╣êα╕ºα╕óα╕íα╕┤α╕Ñα╕Ñα╕┤α╕ºα╕┤α╕Öα╕▓α╕ùα╕╡

    // α╕äα╕▒α╕öα╕üα╕úα╕¡α╕çα╕úα╕▓α╕óα╕üα╕▓α╕ú: α╕ûα╣ëα╕▓α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º α╣üα╕Ñα╕░α╣Çα╕ºα╕Ñα╕▓α╕£α╣êα╕▓α╕Öα╣äα╕¢α╣Çα╕üα╕┤α╕Ö 1 α╕ºα╕▒α╕Ö α╣âα╕½α╣ëα╕ùα╕┤α╣ëα╕çα╣äα╕¢α╣Çα╕Ñα╕ó
    const validBookings = rawBookings.filter((booking: any) => {
      if (booking.status === 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º' && booking.canceledAt) {
        const timePassed = now - booking.canceledAt
        return timePassed <= ONE_DAY_MS // α╣Çα╕üα╣çα╕Üα╣äα╕ºα╣ëα╕ûα╣ëα╕▓α╕óα╕▒α╕çα╣äα╕íα╣êα╣Çα╕üα╕┤α╕Ö 1 α╕ºα╕▒α╕Ö
      }
      return true // α╕¬α╕ûα╕▓α╕Öα╕░α╕¡α╕╖α╣êα╕Öα╣Çα╕üα╣çα╕Üα╣äα╕ºα╣ëα╕½α╕íα╕ö
    })

    // α╕ûα╣ëα╕▓α╕úα╕▓α╕óα╕üα╕▓α╕úα╕Ñα╕öα╕Ñα╕ç (α╣üα╕¢α╕Ñα╕ºα╣êα╕▓α╕íα╕╡α╕úα╕▓α╕óα╕üα╕▓α╕úα╕½α╕íα╕öα╕¡α╕▓α╕óα╕╕α╕ûα╕╣α╕üα╕Ñα╕Üα╣äα╕¢) α╣âα╕½α╣ëα╣Çα╕ïα╕ƒα╕ùα╕▒α╕Ü Local Storage α╕ùα╕▒α╕Öα╕ùα╕╡
    if (rawBookings.length !== validBookings.length) {
      localStorage.setItem('myBookings', JSON.stringify(validBookings))
    }

    setBookings(validBookings)
  }

  // 3. α╕ƒα╕▒α╕çα╕üα╣îα╕èα╕▒α╕Öα╕óα╕üα╣Çα╕Ñα╕┤α╕üα╕üα╕▓α╕úα╕êα╕¡α╕ç (α╣Çα╕¢α╕Ñα╕╡α╣êα╕óα╕Öα╕¬α╕ûα╕▓α╕Öα╕░ α╣üα╕Ñα╕░α╕¢α╕▒α╣èα╕íα╣Çα╕ºα╕Ñα╕▓α╕ùα╕╡α╣êα╕óα╕üα╣Çα╕Ñα╕┤α╕ü)
  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('α╕äα╕╕α╕ôα╣üα╕Öα╣êα╣âα╕êα╕½α╕úα╕╖α╕¡α╣äα╕íα╣êα╕ºα╣êα╕▓α╕òα╣ëα╕¡α╕çα╕üα╕▓α╕úα╕óα╕üα╣Çα╕Ñα╕┤α╕üα╕üα╕▓α╕úα╕êα╕¡α╕çα╕Öα╕╡α╣ë? \n(α╕úα╕▓α╕óα╕üα╕▓α╕úα╕êα╕░α╕ûα╕╣α╕üα╣Çα╕üα╣çα╕Üα╣äα╕ºα╣ëα╣âα╕Öα╕¢α╕úα╕░α╕ºα╕▒α╕òα╕┤ 1 α╕ºα╕▒α╕Öα╕üα╣êα╕¡α╕Öα╕úα╕░α╕Üα╕Üα╕êα╕░α╕Ñα╕Üα╕ûα╕▓α╕ºα╕ú)')) {
      
      const updatedBookings = bookings.map(b => {
        if (b.id === bookingId) {
          // α╣Çα╕¢α╕Ñα╕╡α╣êα╕óα╕Öα╕¬α╕ûα╕▓α╕Öα╕░ α╣üα╕Ñα╕░α╕Üα╕▒α╕Öα╕ùα╕╢α╕üα╣Çα╕ºα╕Ñα╕▓ (Timestamp) α╕ô α╕ºα╕┤α╕Öα╕▓α╕ùα╕╡α╕ùα╕╡α╣êα╕üα╕öα╕óα╕üα╣Çα╕Ñα╕┤α╕ü
          return { ...b, status: 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º', canceledAt: Date.now() }
        }
        return b
      })

      setBookings(updatedBookings)
      localStorage.setItem('myBookings', JSON.stringify(updatedBookings))
      alert('α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╕üα╕▓α╕úα╕êα╕¡α╕çα╕¬α╕│α╣Çα╕úα╣çα╕ê')
    }
  }

  const filteredBookings = activeTab === 'α╕ùα╕▒α╣ëα╕çα╕½α╕íα╕ö' 
    ? bookings 
    : bookings.filter(b => b.status === activeTab)

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'α╕úα╕¡α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö': return 'bg-yellow-50 text-yellow-600 border border-yellow-200'
      case 'α╕úα╕¡α╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Ü': return 'bg-orange-50 text-orange-500 border border-orange-100'
      case 'α╕¬α╕│α╣Çα╕úα╣çα╕ê': return 'bg-green-50 text-green-600 border border-green-200'
      case 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º': return 'bg-red-50 text-red-500 border border-red-200' // α╣Çα╕₧α╕┤α╣êα╕íα╕¢α╣ëα╕▓α╕óα╕¬α╕╡α╣üα╕öα╕ç
      default: return 'bg-gray-50 text-gray-500'
    }
  }

  // α╕ƒα╕▒α╕çα╕üα╣îα╕èα╕▒α╕Ö Helper α╕¬α╕│α╕½α╕úα╕▒α╕Ü Modal
  const getModalHeaderColor = (status: string) => {
    switch(status) {
      case 'α╕úα╕¡α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö': return 'bg-[#FFC107]' 
      case 'α╕úα╕¡α╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Ü': return 'bg-[#F97316]' 
      case 'α╕¬α╕│α╣Çα╕úα╣çα╕ê': return 'bg-[#10B981]' 
      case 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º': return 'bg-[#EF4444]' // α╕¬α╕╡α╣üα╕öα╕ç
      default: return 'bg-gray-500'
    }
  }

  const getModalHeaderText = (status: string) => {
    switch(status) {
      case 'α╕úα╕¡α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö': return 'α╕¡α╕óα╕╣α╣êα╕úα╕░α╕½α╕ºα╣êα╕▓α╕çα╕üα╕▓α╕úα╕úα╕¡α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö'
      case 'α╕úα╕¡α╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Ü': return 'α╕úα╕¡α╕üα╕▓α╕úα╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Ü'
      case 'α╕¬α╕│α╣Çα╕úα╣çα╕ê': return 'α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Öα╣üα╕Ñα╣ëα╕º'
      case 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º': return 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º'
      default: return 'α╕¬α╕ûα╕▓α╕Öα╕░α╣äα╕íα╣êα╕ùα╕úα╕▓α╕Ü'
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-gray-800 mb-8">α╕üα╕▓α╕úα╕êα╕¡α╕çα╕éα╕¡α╕çα╕ëα╕▒α╕Ö</h1>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredBookings.length > 0 ? filteredBookings.map((booking, index) => (
            <div key={index} className={`bg-white p-5 rounded-[1.5rem] shadow-sm border flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-all ${booking.status === 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º' ? 'border-red-100 opacity-70' : 'border-gray-100'}`}>
              
              <img src={booking.image} alt="tour" className={`w-full md:w-40 h-28 object-cover rounded-xl ${booking.status === 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º' ? 'grayscale' : ''}`} />
              
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3">
                  <h3 className={`text-lg font-bold ${booking.status === 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{booking.tourName}</h3>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${getStatusBadge(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-500 mt-2">{booking.id}</p>
                <p className="text-xs text-gray-500 mt-1">{booking.date}</p>
              </div>

              <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold">α╕óα╕¡α╕öα╕ùα╕╡α╣êα╕òα╣ëα╕¡α╕çα╕èα╕│α╕úα╕░:</span>
                  <span className="text-xl font-black text-gray-800">{booking.price.toLocaleString()}</span>
                  <span className="text-sm font-bold text-gray-800">α╕Üα╕▓α╕ù</span>
                </div>
                
                <div className="flex gap-2 items-center w-full md:w-auto">
                  
                  {/* α╕¢α╕╕α╣êα╕íα╕úα╕▓α╕óα╕Ñα╕░α╣Çα╕¡α╕╡α╕óα╕ö α╕üα╕öα╕öα╕╣α╣äα╕öα╣ëα╕ùα╕╕α╕üα╕¬α╕ûα╕▓α╕Öα╕░ */}
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className="flex-1 md:flex-none px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
                  >
                     α╕úα╕▓α╕óα╕Ñα╕░α╣Çα╕¡α╕╡α╕óα╕ö
                  </button>

                  {/* α╕¢α╕╕α╣êα╕íα╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö/α╕óα╕üα╣Çα╕Ñα╕┤α╕ü α╕êα╕░α╣äα╕íα╣êα╣éα╕èα╕ºα╣îα╕ûα╣ëα╕▓α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣äα╕¢α╣üα╕Ñα╣ëα╕º */}
                  {booking.status === 'α╕úα╕¡α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö' && (
                    <>
                      <button 
                        onClick={() => navigate(`/payment/${booking.id}`)}
                        className="flex-1 md:flex-none px-6 py-2 bg-[#3b82f6] text-white rounded-full text-xs font-bold hover:bg-blue-600 transition-all shadow-sm"
                      >
                         α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö
                      </button>
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        className="flex-1 md:flex-none px-6 py-2 bg-white border border-red-200 text-red-500 rounded-full text-xs font-bold hover:bg-red-50 transition-all"
                      >
                         α╕óα╕üα╣Çα╕Ñα╕┤α╕ü
                      </button>
                    </>
                  )}

                </div>
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-400 py-16 bg-white rounded-[1.5rem] border border-gray-100 border-dashed">
              <span className="text-4xl mb-3 block">≡ƒôä</span>
              <p className="font-bold">α╣äα╕íα╣êα╕₧α╕Üα╕úα╕▓α╕óα╕üα╕▓α╕ú</p>
            </div>
          )}
        </div>
      </main>

      {/* ≡ƒîƒ Modal / Pop-up α╕úα╕▓α╕óα╕Ñα╕░α╣Çα╕¡α╕╡α╕óα╕öα╕üα╕▓α╕úα╕êα╕¡α╕ç ≡ƒîƒ */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[1.5rem] w-full max-w-[380px] overflow-hidden shadow-2xl relative">
            
            <div className={`py-3 px-4 text-center font-bold text-xs text-white relative ${getModalHeaderColor(selectedBooking.status)}`}>
              <span>{getModalHeaderText(selectedBooking.status)}</span>
              <button 
                onClick={() => setSelectedBooking(null)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-white font-bold transition-all"
              >
                Γ£ò
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-md font-bold text-gray-800 mb-5">α╕¬α╕úα╕╕α╕¢α╕éα╣ëα╕¡α╕íα╕╣α╕Ñα╕üα╕▓α╕úα╕êα╕¡α╕çα╕éα╕¡α╕çα╕ùα╣êα╕▓α╕Ö</h3>
              
              <div className="flex gap-3 mb-6">
                <div className="flex-1 space-y-2.5 text-[11px] text-gray-600 leading-tight">
                  <div className="flex"><span className="font-bold text-gray-800 w-16 shrink-0">α╕úα╕½α╕▒α╕¬α╕ùα╕▒α╕ºα╕úα╣î</span> <span className="text-gray-600">{selectedBooking.id}</span></div>
                  <div className="flex"><span className="font-bold text-gray-800 w-16 shrink-0">α╕èα╕╖α╣êα╕¡α╕ùα╕▒α╕ºα╕úα╣î</span> <span className="line-clamp-2 text-gray-600">{selectedBooking.tourName}</span></div>
                  <div className="flex"><span className="font-bold text-gray-800 w-16 shrink-0">α╕ºα╕▒α╕Öα╕ùα╕╡α╣ê</span> <span className="text-gray-600">{selectedBooking.date}</span></div>
                  <div className="flex"><span className="font-bold text-gray-800 w-16 shrink-0">α╕êα╕│α╕Öα╕ºα╕Ö</span> <span className="text-gray-600">α╕£α╕╣α╣ëα╣âα╕½α╕ìα╣ê {selectedBooking.adults || 1}, α╣Çα╕öα╣çα╕ü {selectedBooking.children || 0}</span></div>
                </div>
                <img src={selectedBooking.image} alt="tour" className={`w-20 h-24 object-cover rounded-lg shrink-0 shadow-sm border border-gray-100 ${selectedBooking.status === 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º' ? 'grayscale' : ''}`} />
              </div>

              <div className="border-t border-gray-100 pt-5 mb-5">
                 <h4 className="font-bold text-[11px] text-gray-800 mb-3">α╕úα╕▓α╕óα╕Ñα╕░α╣Çα╕¡α╕╡α╕óα╕öα╕úα╕▓α╕äα╕▓</h4>
                 <div className="text-[11px] space-y-2 text-gray-600">
                    {selectedBooking.adults > 0 && (
                       <div className="flex justify-between items-center">
                         <span className="w-16">α╕£α╕╣α╣ëα╣âα╕½α╕ìα╣ê</span>
                         <span className="flex-1 text-center text-gray-400">({selectedBooking.adults} α╕ùα╣êα╕▓α╕Ö)</span>
                         <span className="font-bold text-gray-800">α╕äα╕│α╕Öα╕ºα╕ôα╣âα╕Öα╕óα╕¡α╕öα╕úα╕ºα╕í</span>
                       </div>
                    )}
                 </div>
              </div>

              <div className="flex justify-between items-end border-t border-gray-100 pt-5 mb-2">
                <span className="font-bold text-gray-800 text-sm">α╕úα╕ºα╕íα╕óα╕¡α╕ö</span>
                <span className={`text-2xl font-black ${selectedBooking.status === 'α╕óα╕üα╣Çα╕Ñα╕┤α╕üα╣üα╕Ñα╣ëα╕º' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {selectedBooking.price.toLocaleString()} <span className="text-sm font-bold">α╕Üα╕▓α╕ù</span>
                </span>
              </div>

              {selectedBooking.status === 'α╕úα╕¡α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö' && (
                <button 
                  onClick={() => {
                     setSelectedBooking(null); 
                     navigate(`/payment/${selectedBooking.id}`);
                  }} 
                  className="w-full mt-6 bg-[#3b82f6] text-white font-bold py-3 rounded-full hover:bg-blue-600 transition-all text-sm shadow-md"
                >
                  α╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
