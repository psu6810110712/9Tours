import { useEffect, useState } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import ScrollerArrowButton from '../common/ScrollerArrowButton'

interface TourGalleryProps {
  images: string[]
  name: string
}

export default function TourGallery({ images, name }: TourGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const activeImage = images[activeIndex] || images[0]

  useBodyScrollLock(isPopupOpen)

  useEffect(() => {
    if (!isPopupOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPopupOpen(false)
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [images.length, isPopupOpen])

  const showPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const showNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="mb-4">
      <div className="relative mb-4 overflow-hidden rounded-[1.9rem] border border-slate-200 bg-slate-100">
        <img
          src={activeImage}
          alt={name}
          className="h-[280px] w-full object-cover sm:h-[360px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-900/5 to-transparent" />
        <button
          type="button"
          onClick={() => setIsPopupOpen(true)}
          className="ui-focus-ring ui-pressable absolute bottom-4 right-4 rounded-full border border-white/70 bg-white/92 px-4 py-2 text-sm font-bold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.14)] backdrop-blur-sm hover:bg-white"
        >
          ดูรูปทั้งหมด
        </button>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setActiveIndex(index)
                setIsPopupOpen(true)
              }}
              className={`relative overflow-hidden rounded-2xl border ${activeIndex === index ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.14)]' : 'border-slate-200'}`}
            >
              <img
                src={image}
                alt=""
                className={`aspect-[3/2] w-full object-cover transition-all duration-300 ${activeIndex === index ? 'opacity-100' : 'opacity-75 hover:opacity-100'}`}
              />
            </button>
          ))}
        </div>
      )}

      <h1 className="mt-8 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
        {name}
      </h1>

      {isPopupOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="ปิดแกลเลอรี"
            className="ui-overlay-strong absolute inset-0"
            onClick={() => setIsPopupOpen(false)}
          />
          <div className="ui-pop relative z-10 w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.24)]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 text-slate-700">
                <div>
                  <p className="text-base font-bold text-slate-900">{name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">รูปที่ {activeIndex + 1} จาก {images.length}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className="ui-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              <div className="relative bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF4FF_100%)] px-4 py-4 sm:px-6">
                <img
                  src={activeImage}
                  alt={name}
                  className="max-h-[72vh] w-full rounded-[1.4rem] border border-white bg-white object-contain shadow-[0_14px_40px_rgba(15,23,42,0.10)]"
                />

                {images.length > 1 && (
                  <>
                    <ScrollerArrowButton
                      direction="left"
                      onClick={showPrev}
                      className="absolute left-6 top-1/2 z-10 -translate-y-1/2"
                    />
                    <ScrollerArrowButton
                      direction="right"
                      onClick={showNext}
                      className="absolute right-6 top-1/2 z-10 -translate-y-1/2"
                    />
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-5 py-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`overflow-hidden rounded-xl border ${activeIndex === index ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_rgba(37,99,235,0.14)]' : 'border-slate-200 opacity-75 hover:opacity-100'}`}
                    >
                      <img src={image} alt="" className="h-16 w-24 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
