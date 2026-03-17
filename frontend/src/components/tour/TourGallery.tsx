import { useEffect, useRef, useState } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import ScrollerArrowButton from '../common/ScrollerArrowButton'

interface TourGalleryProps {
  images: string[]
  name: string
}

export default function TourGallery({ images, name }: TourGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [galleryMotion, setGalleryMotion] = useState<'left' | 'right' | null>(null)
  const activeImage = images[activeIndex] || images[0]
  const previousIndex = images.length > 1 ? (activeIndex === 0 ? images.length - 1 : activeIndex - 1) : 0
  const nextIndex = images.length > 1 ? (activeIndex === images.length - 1 ? 0 : activeIndex + 1) : 0
  const galleryAspectClass = 'aspect-[16/10]'
  const thumbnailAspectClass = 'aspect-[16/10]'
  const galleryArrowButtonClass = 'ui-arrow-button-gallery h-12 w-12'
  const mobileGalleryRef = useRef<HTMLDivElement | null>(null)
  const desktopLeftRef = useRef<HTMLDivElement | null>(null)
  const desktopCenterRef = useRef<HTMLButtonElement | null>(null)
  const desktopRightRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!galleryMotion) {
      return
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGalleryMotion(null)
      return
    }

    const travel = galleryMotion === 'left' ? -24 : 24
    const mainKeyframes: Keyframe[] = [
      { transform: `translateX(${travel}px) scale(0.985)` },
      { transform: 'translateX(0) scale(1)' },
    ]
    const sideKeyframes: Keyframe[] = [
      { transform: `translateX(${travel * 0.55}px) scale(0.985)` },
      { transform: 'translateX(0) scale(1)' },
    ]

    const animateGalleryElement = (
      element: HTMLDivElement | HTMLButtonElement | null,
      keyframes: Keyframe[],
      duration: number,
    ) => {
      element?.animate(keyframes, {
        duration: duration as number,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      })
    }

    animateGalleryElement(mobileGalleryRef.current, mainKeyframes, 280)
    animateGalleryElement(desktopCenterRef.current, mainKeyframes, 300)
    animateGalleryElement(desktopLeftRef.current, sideKeyframes, 240)
    animateGalleryElement(desktopRightRef.current, sideKeyframes, 240)

    const resetTimer = window.setTimeout(() => setGalleryMotion(null), 320)
    return () => window.clearTimeout(resetTimer)
  }, [activeIndex, galleryMotion])

  const showPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const showNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const preloadImage = async (imageSrc: string) => {
    if (!imageSrc) {
      return
    }

    const image = new Image()
    image.src = imageSrc

    if (image.decode) {
      try {
        await image.decode()
        return
      } catch {
        // Fall back to load events when decode is unavailable or fails.
      }
    }

    if (image.complete) {
      return
    }

    await new Promise<void>((resolve) => {
      image.onload = () => resolve()
      image.onerror = () => resolve()
    })
  }

  const showPrevWithAnimation = async () => {
    await preloadImage(images[previousIndex] || activeImage)
    setGalleryMotion('left')
    showPrev()
  }

  const showNextWithAnimation = async () => {
    await preloadImage(images[nextIndex] || activeImage)
    setGalleryMotion('right')
    showNext()
  }

  return (
    <div className="mb-3 sm:mb-4">
      <div className="md:hidden">
        <div
          ref={mobileGalleryRef}
          className="relative mb-3 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-100 aspect-[20/9] sm:mb-4 sm:rounded-[1.9rem]"
        >
          <img
            src={activeImage}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-900/5 to-transparent" />
          {images.length > 1 && (
            <>
              <ScrollerArrowButton
                direction="left"
                onClick={showPrevWithAnimation}
                className={`${galleryArrowButtonClass} absolute left-3 top-1/2 z-10 -translate-y-1/2`}
              />
              <ScrollerArrowButton
                direction="right"
                onClick={showNextWithAnimation}
                className={`${galleryArrowButtonClass} absolute right-3 top-1/2 z-10 -translate-y-1/2`}
              />
            </>
          )}
          <button
            type="button"
            onClick={() => setIsPopupOpen(true)}
            className="ui-focus-ring ui-pressable absolute bottom-4 right-4 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.14)] backdrop-blur-sm hover:bg-white"
          >
            ดูรูปทั้งหมด
          </button>
        </div>
      </div>

      <div className="relative mb-5 hidden md:grid md:auto-rows-[320px] md:grid-cols-[0.9fr_minmax(0,2.35fr)_0.9fr] md:gap-1.5 lg:auto-rows-[360px]">
        <div
          ref={desktopLeftRef}
          className="relative h-full overflow-hidden rounded-l-[1.9rem] border border-slate-200 bg-slate-100"
        >
          <img
            src={images[previousIndex] || activeImage}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/40" />
          {images.length > 1 && (
            <div className="absolute inset-y-0 right-0 flex w-[44%] items-center justify-center bg-gradient-to-r from-transparent via-slate-950/48 to-slate-950/88">
              <ScrollerArrowButton
                direction="left"
                onClick={showPrevWithAnimation}
                className={galleryArrowButtonClass}
              />
            </div>
          )}
        </div>

        <button
          ref={desktopCenterRef}
          type="button"
          onClick={() => setIsPopupOpen(true)}
          className="group relative h-full overflow-hidden border border-slate-200 bg-slate-100 text-left"
          aria-label="เปิดดูรูปทั้งหมด"
        >
          <img
            src={activeImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/26 via-transparent to-slate-950/10" />
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-slate-950/20 px-3 py-1.5 backdrop-blur-sm">
              {images.slice(0, Math.min(images.length, 6)).map((_, index) => (
                <span
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${index === activeIndex ? 'bg-white' : 'bg-white/45'}`}
                />
              ))}
            </div>
          )}
        </button>

        <div
          ref={desktopRightRef}
          className="relative h-full overflow-hidden rounded-r-[1.9rem] border border-slate-200 bg-slate-100"
        >
          <div className="h-full w-full">
            <img
              src={images[nextIndex] || activeImage}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/40" />
            {images.length > 1 && (
              <div className="absolute inset-y-0 left-0 flex w-[44%] items-center justify-center bg-gradient-to-l from-transparent via-slate-950/48 to-slate-950/88">
                <ScrollerArrowButton
                  direction="right"
                  onClick={showNextWithAnimation}
                  className={galleryArrowButtonClass}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsPopupOpen(true)}
            className="ui-focus-ring ui-pressable absolute bottom-4 right-4 rounded-full border border-white/70 bg-white/92 px-4 py-2 text-sm font-bold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.14)] backdrop-blur-sm hover:bg-white"
          >
            ดูรูปทั้งหมด
          </button>
        </div>
      </div>

      <h1 className="mt-4 text-xl font-bold leading-tight text-gray-900 sm:text-3xl md:mt-6 md:text-4xl">
        {name}
      </h1>

      {isPopupOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-5 md:p-8">
          <button
            type="button"
            aria-label="ปิดแกลเลอรี"
            className="ui-overlay-strong absolute inset-0"
            onClick={() => setIsPopupOpen(false)}
          />
          <div className="ui-pop relative z-10 w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 shadow-[0_32px_90px_rgba(0,0,0,0.34)] backdrop-blur-sm sm:max-h-[calc(100vh-5rem)]">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-transparent px-5 py-4 text-white sm:px-6 sm:py-5">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-base font-bold text-white sm:text-lg">{name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-lg font-medium text-white/65">
                    <span>รูปที่ {activeIndex + 1} จาก {images.length}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className="ui-focus-ring flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
                  aria-label="ปิดแกลเลอรี"
                >
                  ×
                </button>
              </div>

              <div className="relative flex-1 overflow-hidden bg-transparent px-2 py-3 sm:px-5 sm:py-5 md:px-6 md:py-6">
                <div className={`mx-auto w-full max-w-[108vh] overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/25 shadow-[0_16px_44px_rgba(0,0,0,0.2)] ${galleryAspectClass}`}>
                  <img
                    src={activeImage}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {images.length > 1 && (
                  <>
                    <ScrollerArrowButton
                      direction="left"
                      onClick={showPrev}
                      className={`${galleryArrowButtonClass} absolute left-1 sm:left-6 top-1/2 z-10 -translate-y-1/2`}
                    />
                    <ScrollerArrowButton
                      direction="right"
                      onClick={showNext}
                      className={`${galleryArrowButtonClass} absolute right-1 sm:right-6 top-1/2 z-10 -translate-y-1/2`}
                    />
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="border-t border-white/10 bg-transparent px-5 py-4 sm:px-6 sm:py-5">
                  <div className="scrollbar-hide flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`relative w-16 overflow-hidden rounded-[0.75rem] border transition-all sm:w-24 md:w-32 sm:rounded-[1rem] ${thumbnailAspectClass} ${activeIndex === index
                          ? 'border-[var(--color-accent)] shadow-[0_0_0_2px_rgba(245,166,35,0.28)]'
                          : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        aria-label={`ดูรูปที่ ${index + 1}`}
                      >
                        <img src={image} alt="" className="h-full w-full object-cover" />
                        {activeIndex === index && (
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(245,166,35,0.08),rgba(245,166,35,0.18))]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
