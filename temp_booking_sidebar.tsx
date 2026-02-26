import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// α╕Öα╕│α╣Çα╕éα╣ëα╕▓ useAuth α╣üα╕Ñα╕░ LoginModal α╕éα╕¡α╕çα╕äα╕╕α╕ôα╕íα╕▓α╣âα╕èα╣ë
import { useAuth } from '../../context/AuthContext'
import LoginModal from '../LoginModal' 

interface Props {
  tour: any 
}

export default function BookingSidebar({ tour }: Props) {
  const navigate = useNavigate()
  
  // 1. α╣Çα╕úα╕╡α╕óα╕üα╣âα╕èα╣ë Context α╣Çα╕₧α╕╖α╣êα╕¡α╣Çα╕èα╣çα╕äα╕ºα╣êα╕▓ User α╕Ñα╣çα╕¡α╕üα╕¡α╕┤α╕Öα╕½α╕úα╕╖α╕¡α╕óα╕▒α╕ç
  const { user } = useAuth() 
  
  // State α╕¬α╕│α╕½α╕úα╕▒α╕Üα╕êα╕│α╕Öα╕ºα╕Öα╕äα╕Ö
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)

  // State α╕¬α╕│α╕½α╕úα╕▒α╕Üα╕äα╕ºα╕Üα╕äα╕╕α╕íα╕üα╕▓α╕úα╣Çα╕¢α╕┤α╕ö/α╕¢α╕┤α╕ö Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false)

  // α╕äα╕│α╕Öα╕ºα╕ôα╕úα╕▓α╕äα╕▓
  const adultPrice = tour?.price || 1500 
  const childPrice = tour?.childPrice || 1000 
  const totalPrice = (adults * adultPrice) + (children * childPrice)

  // α╕ƒα╕▒α╕çα╕üα╣îα╕èα╕▒α╕Öα╣Çα╕íα╕╖α╣êα╕¡α╕üα╕öα╕¢α╕╕α╣êα╕í "α╕êα╕¡α╕çα╣Çα╕Ñα╕ó"
  const handleBookingClick = () => {
    // ≡ƒîƒ α╕öα╕▒α╕üα╕êα╕▒α╕Ü: α╕ûα╣ëα╕▓α╕óα╕▒α╕çα╣äα╕íα╣êα╕Ñα╣çα╕¡α╕üα╕¡α╕┤α╕Ö α╣âα╕½α╣ëα╣Çα╕¢α╕┤α╕ö Modal α╕ùα╕╡α╣êα╕äα╕╕α╕ôα╕ùα╕│α╣äα╕ºα╣ëα╕éα╕╢α╣ëα╕Öα╕íα╕▓
    if (!user) {
      setShowLoginModal(true)
      return
    }

    // α╕ûα╣ëα╕▓α╕Ñα╣çα╕¡α╕üα╕¡α╕┤α╕Öα╣üα╕Ñα╣ëα╕º α╕¬α╣êα╕çα╣äα╕¢α╕½α╕Öα╣ëα╕▓α╕üα╕úα╕¡α╕üα╕éα╣ëα╕¡α╕íα╕╣α╕Ñα╕üα╕▓α╕úα╕êα╕¡α╕çα╣äα╕öα╣ëα╣Çα╕Ñα╕ó
    navigate(`/booking/${tour.id}?adults=${adults}&children=${children}`)
  }

  return (
    <>
      <div className="bg-white p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 sticky top-10">
        <div className="mb-6">
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">α╣Çα╕¢α╕┤α╕öα╕êα╕¡α╕çα╣üα╕Ñα╣ëα╕º</span>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-3xl font-black text-gray-800">α╕┐{adultPrice.toLocaleString()}</span>
            <span className="text-gray-400 text-sm font-medium">/ α╕ùα╣êα╕▓α╕Ö</span>
          </div>
        </div>

        <div className="space-y-5 mb-8">
          <h4 className="font-bold text-gray-700 text-sm">α╕úα╕░α╕Üα╕╕α╕êα╕│α╕Öα╕ºα╕Öα╕£α╕╣α╣ëα╣Çα╕öα╕┤α╕Öα╕ùα╕▓α╕ç</h4>
          
          {/* α╣Çα╕Ñα╕╖α╕¡α╕üα╕£α╕╣α╣ëα╣âα╕½α╕ìα╣ê */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">α╕£α╕╣α╣ëα╣âα╕½α╕ìα╣ê</p>
              <p className="text-[11px] text-gray-400 font-medium">12 α╕¢α╕╡α╕éα╕╢α╣ëα╕Öα╣äα╕¢</p>
            </div>
            <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
              <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 flex items-center justify-center text-blue-600 font-bold hover:bg-white rounded-full transition-all"> ΓêÆ </button>
              <span className="w-8 text-center font-bold text-gray-800">{adults}</span>
              <button type="button" onClick={() => setAdults(adults + 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full shadow-md"> + </button>
            </div>
          </div>

          {/* α╣Çα╕Ñα╕╖α╕¡α╕üα╣Çα╕öα╣çα╕ü */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">α╣Çα╕öα╣çα╕ü</p>
              <p className="text-[11px] text-gray-400 font-medium">2 - 11 α╕¢α╕╡</p>
            </div>
            <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
              <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 flex items-center justify-center text-blue-600 font-bold hover:bg-white rounded-full transition-all"> ΓêÆ </button>
              <span className="w-8 text-center font-bold text-gray-800">{children}</span>
              <button type="button" onClick={() => setChildren(children + 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full shadow-md"> + </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-50 pt-5 mb-6">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">α╕úα╕▓α╕äα╕▓α╕úα╕ºα╕í</span>
            <span className="text-2xl font-black text-blue-600">α╕┐{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* α╕¢α╕╕α╣êα╕íα╕êα╕¡α╕çα╣Çα╕Ñα╕ó */}
        <button 
          onClick={handleBookingClick}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-[0_12px_24px_rgba(37,99,235,0.15)] active:scale-95 text-lg"
        >
          α╕êα╕¡α╕çα╣Çα╕Ñα╕ó
        </button>
        
        <p className="text-center text-gray-400 text-[10px] mt-4 font-medium uppercase tracking-tight">
          * α╕óα╕╖α╕Öα╕óα╕▒α╕Öα╕ùα╕▒α╕Öα╕ùα╕╡α╕½α╕Ñα╕▒α╕çα╕üα╕▓α╕úα╕èα╕│α╕úα╕░α╣Çα╕çα╕┤α╕Ö
        </p>
      </div>

      {/* ≡ƒîƒ α╣üα╕¬α╕öα╕ç Modal α╕éα╕¡α╕çα╕äα╕╕α╕ôα╣Çα╕íα╕╖α╣êα╕¡ state α╣Çα╕¢α╣çα╕Ö true ≡ƒîƒ */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)} 
          onSwitchToRegister={() => {
            setShowLoginModal(false)
            // α╕ûα╣ëα╕▓α╕äα╕╕α╕ôα╕íα╕╡α╕½α╕Öα╣ëα╕▓ Register α╕üα╣çα╣âα╕½α╣ëα╕íα╕▒α╕Öα╕₧α╕▓α╣äα╕¢α╕½α╕Öα╣ëα╕▓α╕Öα╕▒α╣ëα╕Öα╕äα╕úα╕▒α╕Ü (α╕½α╕úα╕╖α╕¡α╣Çα╕¢α╕┤α╕ö Modal α╕¬α╕íα╕▒α╕äα╕úα╕¬α╕íα╕▓α╕èα╕┤α╕ü)
            navigate('/register') 
          }} 
        />
      )}
    </>
  )
}
