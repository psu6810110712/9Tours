import { useState } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface TourGalleryProps {
  images: string[]
  name: string
}

export default function TourGallery({ images, name }: TourGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  useBodyScrollLock(isPopupOpen)

  const activeImage = images[activeIndex] || images[0]

  const showPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const showNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="mb-4">
      {/* ===== รูปหลัก (hero) ===== */}
      <div className="relative rounded-2xl overflow-hidden h-[270px] md:h-[350px] mb-3 bg-gray-100">
        <img
          src={activeImage}
          alt={name}
          className="w-full h-full object-cover"
        />
        {/* ปุ่ม "ดูรูปทั้งหมด" */}
        <button
          type="button"
          onClick={() => setIsPopupOpen(true)}
          className="absolute bottom-3 right-4 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-colors"
        >
          ดูรูปทั้งหมด
        </button>
      </div>

      {/* ===== thumbnail grid — 5 รูปเรียงพอดี ===== */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {images.slice(0, 5).map((img, i) => (
            <button key={i} onClick={() => { setActiveIndex(i); setIsPopupOpen(true) }}>
              <img
                src={img}
                alt=""
                className={`w-full aspect-[3/2] object-cover rounded-xl transition-all ${activeIndex === i
                  ? 'opacity-100 ring-2 ring-[var(--color-primary)]'
                  : 'opacity-60 hover:opacity-100'
                  }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* ===== ชื่อทัวร์ — อยู่ใต้ภาพเล็ก ===== */}
      <h1 className="text-3xl md:text-4xl leading-tight font-bold text-gray-900 mt-10 mb-4">
        {name}
      </h1>

      {/* popup gallery — ปรับปรุง UI ใหม่ ย้ายปุ่มออกข้างนอกภาพ */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 md:p-8"
          onClick={() => setIsPopupOpen(false)}
        >
          {/* Close button - Top Right of screen area */}
          <button
            type="button"
            onClick={() => setIsPopupOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl flex items-center justify-center transition-colors z-50"
            title="ปิด"
          >
            ×
          </button>

          <div
            className="w-full max-w-6xl relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button - Left Side Outside */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={showPrev}
                className="hidden md:flex absolute -left-16 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl items-center justify-center transition-colors"
              >
                ‹
              </button>
            )}

            <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={activeImage}
                alt={name}
                className="w-full max-h-[80vh] object-contain mx-auto"
              />

              {/* Mobile Navigation - Still inside for better reach */}
              {images.length > 1 && (
                <div className="md:hidden">
                  <button
                    type="button"
                    onClick={showPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white text-xl flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white text-xl flex items-center justify-center"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Next Button - Right Side Outside */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                className="hidden md:flex absolute -right-16 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl items-center justify-center transition-colors"
              >
                ›
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto justify-center">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveIndex(i)}>
                  <img
                    src={img}
                    alt=""
                    className={`w-20 h-14 object-cover rounded-md ${activeIndex === i
                      ? 'ring-2 ring-white'
                      : 'opacity-70 hover:opacity-100'
                      }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )
      }
    </div >
  )
}
