import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TourCard from '../components/TourCard'
import SearchBar from '../components/common/SearchBar'
import ScrollerArrowButton from '../components/common/ScrollerArrowButton'
import { useAuth } from '../context/AuthContext'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'

const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']
const HERO_CATEGORY_LIMIT = 5

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
  showFade?: boolean
}

function RailShell({ children, scrollRef, canScrollLeft, canScrollRight, onPrev, onNext, className = '', showFade = false }: RailShellProps) {
  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={`scrollbar-hide flex gap-4 overflow-x-auto px-4 py-2 scroll-smooth ${className}`.trim()}
        style={{ scrollPaddingInline: '1rem' }}
      >
        {children}
      </div>

      {showFade && canScrollLeft && <div className="ui-rail-fade-left" />}
      {showFade && canScrollRight && <div className="ui-rail-fade-right" />}

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

  const canSubmitHeroSearch = search.trim().length > 0 || selectedCats.size > 0 || Boolean(tourType)

  const handleSearch = () => {
    const trimmedSearch = search.trim()
    if (!trimmedSearch && selectedCats.size === 0 && !tourType) return

    const params = new URLSearchParams()
    if (trimmedSearch) {
      params.set('search', trimmedSearch)
    }
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

  const heroCategoryCounts = tours.reduce((counts, tour) => {
    tour.categories.forEach((category) => {
      counts.set(category, (counts.get(category) ?? 0) + 1)
    })
    return counts
  }, new Map<string, number>())

  const heroCategories = (heroCategoryCounts.size > 0
    ? [...heroCategoryCounts.entries()]
      .filter(([category]) => category.startsWith('สาย'))
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return a[0].localeCompare(b[0], 'th')
      })
      .slice(0, HERO_CATEGORY_LIMIT)
      .map(([category]) => category)
    : CATEGORIES
  )

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
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 px-5 py-12 text-center text-white sm:px-8 sm:py-14 lg:px-12 lg:py-16">
            <div className="mx-auto max-w-3xl">
              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">เลือกสไตล์ที่ชอบ แล้วหาทริปที่ใช่</h1>
            </div>


            <div className="mx-auto mt-4 max-w-3xl text-center text-white">
              <p className="mt-10 text-sm font-semibold text-white/90 sm:text-[24px]">กำลังมองหาทริปแนวไหนอยู่? เลือกแล้วกดค้นหาเลย</p>
            </div>

            <div className="mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-3">
              {heroCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selectedCats.has(category)}
                  onClick={() => toggleCategory(category)}
                  className={`ui-pressable rounded-full px-5 py-2.5 text-sm font-semibold sm:px-6 sm:text-[15px] ${selectedCats.has(category)
                    ? 'bg-[var(--color-accent)] text-white shadow-[0_10px_22px_rgba(245,166,35,0.22)]'
                    : 'bg-white/90 text-gray-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:bg-[rgba(245,166,35,0.85)] hover:text-white hover:shadow-[0_10px_20px_rgba(245,166,35,0.18)]'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <SearchBar
                search={search}
                setSearch={setSearch}
                guests={guests}
                setGuests={setGuests}
                childrenCount={childrenCount}
                setChildrenCount={setChildrenCount}
                onSearch={handleSearch}
                showGuests={false}
                searchDisabled={!canSubmitHeroSearch}
                className="max-w-4xl"
                transparent
                tourType={tourType}
                setTourType={setTourType}
              />
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
              showFade
            >
              {displayedTours.map((tour) => (
                <div key={tour.id} className="w-[260px] flex-shrink-0 sm:w-[280px]">
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
                showFade
              >
                {recommendedTours.map((tour) => (
                  <div key={tour.id} className="w-[260px] flex-shrink-0 sm:w-[280px]">
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
