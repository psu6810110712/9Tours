import { useState } from 'react'

interface TourGalleryProps {
  images: string[]
  name: string
}

export default function TourGallery({ images, name }: TourGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const activeImage = images[activeIndex] || images[0]

  const showPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const showNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="mb-4">
      <div className="relative rounded-2xl overflow-hidden h-[270px] md:h-[320px] mb-3 bg-gray-100">
        <button
          type="button"
          onClick={() => setIsPopupOpen(true)}
          className="w-full h-full"
        >
          <img
            src={activeImage}
            alt={name}
            className="w-full h-full object-cover"
          />
        </button>
      </div>

      <h1 className="text-3xl md:text-4xl leading-tight font-bold text-gray-900 mb-3">
        {name}
      </h1>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}>
              <img
                src={img}
                alt=""
                className={`w-[72px] h-[56px] object-cover rounded-lg flex-shrink-0 transition-all ${
                  activeIndex === i
                    ? 'opacity-100 ring-2 ring-[var(--color-primary)]'
                    : 'opacity-70 hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* popup gallery — ใช้ของง่ายๆอ่านง่าย ไม่ซับซ้อน */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            className="w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-xl overflow-hidden bg-black">
              <img
                src={activeImage}
                alt={name}
                className="w-full max-h-[78vh] object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 text-lg"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 text-lg"
                  >
                    ›
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsPopupOpen(false)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white text-lg"
              >
                ×
              </button>
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto justify-center">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveIndex(i)}>
                    <img
                      src={img}
                      alt=""
                      className={`w-20 h-14 object-cover rounded-md ${
                        activeIndex === i
                          ? 'ring-2 ring-white'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
