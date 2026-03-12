import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TourCard from '../components/TourCard'
import SearchBar from '../components/common/SearchBar'
import ScrollerArrowButton from '../components/common/ScrollerArrowButton'
import { useAuth } from '../context/AuthContext'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'

const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']

const PLACES = [
  { name: 'ที่ไหนก็ได้', image: '/images/anywhere-2.png', province: null as string | null },
  { name: 'สุราษฎร์ธานี', image: '/images/anywhere-1.png', province: 'สุราษฎร์ธานี' },
  { name: 'ภูเก็ต', image: '/images/anywhere-4.png', province: 'ภูเก็ต' },
  { name: 'เชียงใหม่', image: '/images/anywhere-3.png', province: 'เชียงใหม่' },
]

type Place = typeof PLACES[0]

type RailState = {
  canScrollLeft: boolean
  canScrollRight: boolean
}

function useRailState(ref: RefObject<HTMLDivElement | null>, deps: readonly unknown[] = []) {
  const [state, setState] = useState<RailState>({ canScrollLeft: false, canScrollRight: false })

  useEffect(() => {
    const element = ref.current
    if (!element) {
      setState({ canScrollLeft: false, canScrollRight: false })
      return
    }

    const updateState = () => {
      const { scrollLeft, clientWidth, scrollWidth } = element
      setState({
        canScrollLeft: scrollLeft > 8,
        canScrollRight: scrollLeft + clientWidth < scrollWidth - 8,
      })
    }

    updateState()
    element.addEventListener('scroll', updateState, { passive: true })
    window.addEventListener('resize', updateState)

    return () => {
      element.removeEventListener('scroll', updateState)
      window.removeEventListener('resize', updateState)
    }
  }, [ref, ...deps])

  return state
}

function scrollRow(ref: RefObject<HTMLDivElement | null>, amount: number) {
  ref.current?.scrollBy({ left: amount, behavior: 'smooth' })
}

interface RailHeaderProps {
  title: string
  linkTo?: string
  linkLabel?: string
}

function RailHeader({ title, linkTo, linkLabel = 'ดูทั้งหมด' }: RailHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
      {linkTo ? (
        <Link
          to={linkTo}
          className="text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  )
}

interface RailShellProps {
  children: ReactNode
  scrollRef: RefObject<HTMLDivElement | null>
  canScrollLeft: boolean
  canScrollRight: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}

function RailShell({ children, scrollRef, canScrollLeft, canScrollRight, onPrev, onNext, className = '' }: RailShellProps) {
  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={`scrollbar-hide flex gap-4 overflow-x-auto px-4 py-2 scroll-smooth ${className}`.trim()}
        style={{ scrollPaddingInline: '1rem' }}
      >
        {children}
      </div>

      {canScrollLeft && <div className="ui-rail-fade-left" />}
      {canScrollRight && <div className="ui-rail-fade-right" />}

      {canScrollLeft && (
        <ScrollerArrowButton
          direction="left"
          onClick={onPrev}
          className="absolute left-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2"
        />
      )}
      {canScrollRight && (
        <ScrollerArrowButton
          direction="right"
          onClick={onNext}
          className="absolute right-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2"
        />
      )}
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const [tours, setTours] = useState<Tour[]>([])
  const [toursLoading, setToursLoading] = useState(true)
  const [recommendedTours, setRecommendedTours] = useState<Tour[]>([])
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [tourType, setTourType] = useState<'' | 'one_day' | 'package'>('')
  const [guests, setGuests] = useState(2)
  const [childrenCount, setChildrenCount] = useState(0)
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [selectedPlace, setSelectedPlace] = useState<Place>(PLACES[0])

  const placeScrollRef = useRef<HTMLDivElement>(null)
  const tourScrollRef = useRef<HTMLDivElement>(null)
  const recommendationScrollRef = useRef<HTMLDivElement>(null)
  const resultsSectionRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    tourService.getAll()
      .then(setTours)
      .catch(console.error)
      .finally(() => setToursLoading(false))
  }, [])

  useEffect(() => {
    if (!user) {
      setRecommendedTours([])
      setRecommendationLoading(false)
      return
    }

    setRecommendationLoading(true)
    tourService.getRecommendations(8)
      .then((items) => setRecommendedTours(items))
      .catch(() => {
        setRecommendedTours(tours.slice(0, 8))
      })
      .finally(() => setRecommendationLoading(false))
  }, [user, tours])

  const placeRail = useRailState(placeScrollRef, [selectedPlace.name])
  const popularRail = useRailState(tourScrollRef, [toursLoading, selectedPlace.name, tours.length])
  const recommendationRail = useRailState(recommendationScrollRef, [recommendationLoading, recommendedTours.length])

  const toggleCategory = (category: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const canSubmitHeroSearch = search.trim().length > 0

  const handleSearch = () => {
    const trimmedSearch = search.trim()
    if (!trimmedSearch) return

    const params = new URLSearchParams()
    params.set('search', trimmedSearch)
    if (tourType) params.set('tourType', tourType)
    if (selectedCats.size > 0) {
      params.set('categories', [...selectedCats].join(','))
    }
    navigate(`/tours?${params.toString()}`)
  }

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
    requestAnimationFrame(() => {
      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const displayedTours = selectedPlace.province
    ? tours.filter((tour) => tour.province === selectedPlace.province)
    : tours

  const sectionTitle = selectedPlace.province
    ? `ทริปยอดนิยมใน${selectedPlace.name}`
    : 'ทริปยอดนิยมทั่วไทย'

  const emptyStateMessage = selectedPlace.province
    ? `ยังไม่มีทัวร์ใน${selectedPlace.name}`
    : 'ยังไม่มีทัวร์แนะนำในขณะนี้'

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-[2rem]"
          style={{ backgroundImage: 'url(/hero-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.22),rgba(15,23,42,0.58))]" />
          <div className="relative z-10 px-5 py-12 text-center text-white sm:px-8 sm:py-14 lg:px-12 lg:py-16">
            <div className="mx-auto max-w-3xl">
              <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">มีสถานที่ในใจแล้วหรือยัง?</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                เที่ยวทั่วไทย ราคาดี จองง่าย เลือกทริปที่ใช่แล้วออกเดินทางได้ทันที
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="relative inline-grid grid-cols-2 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-md">
                <div
                  className="absolute inset-y-1 rounded-full bg-[var(--color-accent)] shadow-md transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
                  style={{
                    width: 'calc(50% - 4px)',
                    left: tourType === 'package' ? 'calc(50% + 2px)' : '4px',
                    opacity: tourType ? 1 : 0,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setTourType(tourType === 'one_day' ? '' : 'one_day')}
                  className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors sm:px-5 ${tourType === 'one_day' ? 'text-white' : 'text-white/65 hover:text-white/95'}`}
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l1.5 1.5L14 12" />
                  </svg>
                  วันเดย์ทริป
                </button>
                <button
                  type="button"
                  onClick={() => setTourType(tourType === 'package' ? '' : 'package')}
                  className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors sm:px-5 ${tourType === 'package' ? 'text-white' : 'text-white/65 hover:text-white/95'}`}
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11 2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  แพ็กเกจพร้อมที่พัก
                </button>
              </div>
            </div>

            <div className="mt-8">
              <SearchBar
                search={search}
                setSearch={setSearch}
                guests={guests}
                setGuests={setGuests}
                childrenCount={childrenCount}
                setChildrenCount={setChildrenCount}
                onSearch={handleSearch}
                searchDisabled={!canSubmitHeroSearch}
                className="max-w-5xl"
              />
            </div>

            <div className="mx-auto mt-6 max-w-3xl text-center text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/68">เลือกแนวทริปที่สนใจ</p>
              <p className="mt-2 text-sm font-medium text-white/82 sm:text-[15px]">แตะหมวดด้านล่างเพื่อช่วยกรองทริปให้ตรงกับสไตล์ที่คุณอยากเที่ยว</p>
            </div>

            <div className="mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selectedCats.has(category)}
                  onClick={() => toggleCategory(category)}
                  className={`ui-pressable rounded-full px-5 py-2.5 text-sm font-semibold sm:px-6 sm:text-[15px] ${selectedCats.has(category)
                    ? 'bg-[var(--color-accent)] text-white shadow-[0_10px_22px_rgba(245,166,35,0.22)]'
                    : 'bg-white/92 text-gray-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:bg-white'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-10">
          <RailHeader title="สถานที่ยอดนิยม" />
          <RailShell
            scrollRef={placeScrollRef}
            canScrollLeft={placeRail.canScrollLeft}
            canScrollRight={placeRail.canScrollRight}
            onPrev={() => scrollRow(placeScrollRef, -280)}
            onNext={() => scrollRow(placeScrollRef, 280)}
            className="pb-3"
          >
            {PLACES.map((place) => {
              const isSelected = selectedPlace.name === place.name

              return (
                <button
                  key={place.name}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handlePlaceSelect(place)}
                  className={`group relative h-40 w-60 flex-shrink-0 overflow-hidden rounded-[1.6rem] border-2 text-left transition-all ${isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-[0_12px_28px_rgba(37,99,235,0.18)]'
                    : 'border-transparent bg-white/80 opacity-95 hover:border-white hover:opacity-100 hover:shadow-[0_10px_24px_rgba(15,23,42,0.10)]'
                    }`}
                >
                  <img
                    src={place.image}
                    alt={place.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 ${isSelected ? 'bg-gradient-to-t from-black/55 via-black/10 to-transparent' : 'bg-gradient-to-t from-black/60 via-black/15 to-transparent'}`} />
                  <div className="absolute inset-x-4 bottom-4 text-white">
                    <p className="text-lg font-bold">{place.name}</p>
                  </div>
                </button>
              )
            })}
          </RailShell>
        </section>

        <section ref={resultsSectionRef} className="mb-10 scroll-mt-24">
          <RailHeader title={sectionTitle} linkTo={selectedPlace.province ? `/tours?province=${selectedPlace.province}` : '/tours'} />

          {toursLoading ? (
            <div className="ui-surface rounded-[1.5rem] px-6 py-14 text-center text-gray-400">กำลังโหลด...</div>
          ) : displayedTours.length === 0 ? (
            <div className="ui-surface rounded-[1.5rem] px-6 py-14 text-center text-gray-400">{emptyStateMessage}</div>
          ) : (
            <RailShell
              scrollRef={tourScrollRef}
              canScrollLeft={popularRail.canScrollLeft}
              canScrollRight={popularRail.canScrollRight}
              onPrev={() => scrollRow(tourScrollRef, -300)}
              onNext={() => scrollRow(tourScrollRef, 300)}
              className="pb-2"
            >
              {displayedTours.map((tour) => (
                <div key={tour.id} className="w-[292px] flex-shrink-0">
                  <TourCard tour={tour} />
                </div>
              ))}
            </RailShell>
          )}
        </section>

        {user && (
          <section>
            <RailHeader title="ทริปที่คุณอาจชอบ" linkTo="/tours" />

            {recommendationLoading ? (
              <div className="ui-surface rounded-[1.5rem] px-6 py-10 text-center text-gray-400">กำลังจัดอันดับทัวร์ที่เหมาะกับคุณ...</div>
            ) : recommendedTours.length === 0 ? (
              <div className="ui-surface rounded-[1.5rem] px-6 py-10 text-center text-gray-400">ยังไม่มีข้อมูลเพียงพอสำหรับคำแนะนำส่วนตัว</div>
            ) : (
              <RailShell
                scrollRef={recommendationScrollRef}
                canScrollLeft={recommendationRail.canScrollLeft}
                canScrollRight={recommendationRail.canScrollRight}
                onPrev={() => scrollRow(recommendationScrollRef, -280)}
                onNext={() => scrollRow(recommendationScrollRef, 280)}
                className="pb-2"
              >
                {recommendedTours.map((tour) => (
                  <div key={tour.id} className="w-[292px] flex-shrink-0">
                    <TourCard tour={tour} />
                  </div>
                ))}
              </RailShell>
            )}
          </section>
        )}
      </div>
    </>
  )
}
