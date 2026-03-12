import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface SearchBarProps {
  search: string
  setSearch: (value: string) => void
  guests: number
  setGuests: (value: number) => void
  childrenCount?: number
  setChildrenCount?: (value: number) => void
  onSearch: () => void
  showGuests?: boolean
  searchDisabled?: boolean
  className?: string
  tourType?: '' | 'one_day' | 'package'
  setTourType?: (value: '' | 'one_day' | 'package') => void
  transparent?: boolean
}

const MIN_ADULTS = 1
const MIN_CHILDREN = 0
const MAX_TRAVELERS = 10

interface GuestPickerPosition {
  top: number
  left: number
  width: number
}

interface CounterRowProps {
  label: string
  hint: string
  value: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseDisabled: boolean
  increaseDisabled: boolean
  accent?: 'blue' | 'amber'
}

function CounterRow({
  label,
  hint,
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
  accent = 'blue',
}: CounterRowProps) {
  const activeClasses = accent === 'amber'
    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white'
    : 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'

  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.15rem] bg-slate-50 px-3 py-3.5">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          className={`ui-focus-ring ui-pressable flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold ${decreaseDisabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 hover:transform-none'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          }`}
          aria-label={`ลดจำนวน${label}`}
        >
          -
        </button>

        <div className="min-w-[44px] text-center">
          <p className="text-xl font-black text-slate-900">{value}</p>
        </div>

        <button
          type="button"
          onClick={onIncrease}
          disabled={increaseDisabled}
          className={`ui-focus-ring ui-pressable flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold ${increaseDisabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 hover:transform-none'
            : activeClasses
          }`}
          aria-label={`เพิ่มจำนวน${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function SearchBar({
  search,
  setSearch,
  guests,
  setGuests,
  childrenCount,
  setChildrenCount,
  onSearch,
  showGuests = true,
  searchDisabled = false,
  className = '',
  tourType,
  setTourType,
  transparent = false,
}: SearchBarProps) {
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false)
  const [guestPickerPosition, setGuestPickerPosition] = useState<GuestPickerPosition | null>(null)
  const guestPickerRef = useRef<HTMLDivElement>(null)
  const guestTriggerRef = useRef<HTMLButtonElement>(null)

  const hasChildrenPicker = typeof childrenCount === 'number' && typeof setChildrenCount === 'function'
  const hasTourTypePicker = typeof tourType === 'string' && typeof setTourType === 'function'
  const resolvedChildrenCount = hasChildrenPicker ? childrenCount : 0
  const totalTravelers = guests + resolvedChildrenCount
  const canIncreaseAdults = totalTravelers < MAX_TRAVELERS
  const canIncreaseChildren = totalTravelers < MAX_TRAVELERS
  const surfaceClasses = transparent
    ? 'border-white/15 bg-white/10 shadow-[0_22px_48px_rgba(15,23,42,0.2)]'
    : 'border-white/70 bg-white/95 shadow-[0_22px_48px_rgba(15,23,42,0.16)]'
  const blurClasses = transparent ? 'backdrop-blur-sm' : 'backdrop-blur-xl'
  const segmentClasses = transparent
    ? 'border-slate-200/80 bg-white/90 shadow-[inset_0_0_0_0.25px_rgba(226,232,240,0.8)]'
    : 'border-slate-200 bg-slate-50'
  const activeSegmentClasses = transparent
    ? 'bg-[var(--color-accent)]'
    : 'bg-[var(--color-accent)] shadow-md'
  const fieldClasses = 'bg-white/90 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.8)]'
  const inputToneClasses = 'text-gray-800 placeholder:text-gray-400'
  const inactiveSegmentTextClasses = transparent
    ? 'text-slate-400 hover:text-slate-900'
    : 'text-slate-500 hover:text-slate-800'
  const shellPaddingClasses = transparent ? 'p-2 sm:p-2.5' : 'p-2.5 sm:p-3'
  const layoutGapClasses = transparent ? 'gap-2 lg:gap-2' : 'gap-2.5'
  const segmentWrapperClasses = transparent ? 'rounded-[1.2rem] p-1 min-h-[58px]' : 'rounded-[1.35rem] p-1.5'
  const segmentButtonClasses = transparent ? 'min-h-[50px] px-3.5 py-0 text-[14px]' : 'px-4 py-3 text-[15px]'
  const fieldPaddingClasses = transparent ? 'rounded-[1.2rem] px-4 py-2.5' : 'rounded-[1.35rem] px-5 py-3'
  const searchIconWrapperClasses = transparent ? 'h-9 w-9' : 'h-10 w-10'
  const searchInputClasses = transparent ? 'text-[14px] sm:text-[14px]' : 'text-[15px] sm:text-[15px]'
  const searchButtonClasses = transparent ? 'rounded-[1.2rem] px-4 py-1 text-[16px] sm:min-w-[90px]' : 'rounded-[1.35rem] px-5 py-3 text-[15px] sm:min-w-[140px]'

  useEffect(() => {
    if (!isGuestPickerOpen) return

    const updateGuestPickerPosition = () => {
      const trigger = guestTriggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const preferredWidth = Math.max(rect.width, 320)
      const maxWidth = Math.min(preferredWidth, viewportWidth - 24)
      const left = Math.min(
        Math.max(12, rect.left),
        Math.max(12, viewportWidth - maxWidth - 12),
      )

      setGuestPickerPosition({
        top: rect.bottom + 10,
        left,
        width: maxWidth,
      })
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !guestPickerRef.current?.contains(target)
        && !guestTriggerRef.current?.contains(target)
      ) {
        setIsGuestPickerOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsGuestPickerOpen(false)
      }
    }

    updateGuestPickerPosition()
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', updateGuestPickerPosition)
    window.addEventListener('scroll', updateGuestPickerPosition, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', updateGuestPickerPosition)
      window.removeEventListener('scroll', updateGuestPickerPosition, true)
    }
  }, [isGuestPickerOpen])

  const decreaseAdults = () => setGuests(Math.max(MIN_ADULTS, guests - 1))
  const increaseAdults = () => setGuests(Math.min(MAX_TRAVELERS, guests + 1))
  const decreaseChildren = () => {
    if (!setChildrenCount) return
    setChildrenCount(Math.max(MIN_CHILDREN, resolvedChildrenCount - 1))
  }
  const increaseChildren = () => {
    if (!setChildrenCount) return
    setChildrenCount(Math.min(MAX_TRAVELERS, resolvedChildrenCount + 1))
  }

  const guestSummary = hasChildrenPicker && resolvedChildrenCount > 0
    ? `ผู้ใหญ่ ${guests}, เด็ก ${resolvedChildrenCount}`
    : `${guests} ท่าน`

  const guestPicker = isGuestPickerOpen && guestPickerPosition
    ? createPortal(
      <div
        ref={guestPickerRef}
        className="ui-pop fixed z-[var(--z-dropdown)] rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.18)]"
        style={{
          top: `${guestPickerPosition.top}px`,
          left: `${guestPickerPosition.left}px`,
          width: `${guestPickerPosition.width}px`,
        }}
      >
        <div className="flex items-center justify-between gap-4 rounded-[1.1rem] bg-slate-50 px-3 py-3">
          <div>
            <p className="text-sm font-bold text-slate-900">จำนวนผู้เดินทาง</p>
            <p className="mt-1 text-xs font-medium text-slate-500">รวมทั้งหมดได้ไม่เกิน {MAX_TRAVELERS} ท่าน</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[var(--color-primary)] shadow-sm">
            {totalTravelers} ท่าน
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <CounterRow
            label="ผู้ใหญ่"
            hint="อย่างน้อย 1 ท่าน"
            value={guests}
            onDecrease={decreaseAdults}
            onIncrease={increaseAdults}
            decreaseDisabled={guests <= MIN_ADULTS}
            increaseDisabled={!canIncreaseAdults}
            accent="blue"
          />

          {hasChildrenPicker && (
            <CounterRow
              label="เด็ก"
              hint="อายุต่ำกว่าเกณฑ์ผู้ใหญ่"
              value={resolvedChildrenCount}
              onDecrease={decreaseChildren}
              onIncrease={increaseChildren}
              decreaseDisabled={resolvedChildrenCount <= MIN_CHILDREN}
              increaseDisabled={!canIncreaseChildren}
              accent="amber"
            />
          )}
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <>
      <div className={`ui-surface mx-auto w-full max-w-4xl rounded-[3rem] border ${shellPaddingClasses} ${blurClasses} ${surfaceClasses} ${className}`.trim()}>
        <div className={`flex flex-col ${layoutGapClasses} lg:flex-row lg:items-stretch`.trim()}>
          {hasTourTypePicker && (
            <div className="lg:flex-shrink-0">
              <div className={`relative inline-grid w-full grid-cols-2 border sm:w-auto ${segmentWrapperClasses} ${segmentClasses}`.trim()}>
                <div
                  className={`absolute inset-y-1.5 rounded-[1rem] transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] ${activeSegmentClasses}`.trim()}
                  style={{
                    width: 'calc(50% - 8px)',
                    left: tourType === 'package' ? 'calc(50% + 3px)' : '5.5px',
                    opacity: tourType ? 1 : 0,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setTourType(tourType === 'one_day' ? '' : 'one_day')}
                  className={`relative z-10 flex min-h-[14px] items-center justify-left gap-2 rounded-[0.95rem] font-semibold transition-colors ${segmentButtonClasses} ${tourType === 'one_day' ? 'text-white' : inactiveSegmentTextClasses}`}
                >
                  <svg className={`${transparent ? 'h-5 w-5' : 'h-6 w-6'} flex-shrink-0`} fill="none" viewBox="0 0 24 27" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l1.5 1.5L14 12" />
                  </svg>
                  วันเดย์ทริป
                </button>
                <button
                  type="button"
                  onClick={() => setTourType(tourType === 'package' ? '' : 'package')}
                  className={`relative z-10 flex min-h-[14px] items-center justify-center gap-2 rounded-[0.95rem] font-semibold transition-colors ${segmentButtonClasses} ${tourType === 'package' ? 'text-white' : inactiveSegmentTextClasses}`}
                >
                  <svg className={`${transparent ? 'h-5 w-5' : 'h-6 w-6'} flex-shrink-0`} fill="none" viewBox="0 0 24 27" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11 2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  แพ็กเกจพร้อมที่พัก
                </button>
              </div>
            </div>
          )}

          <label className={`flex min-w-0 flex-1 items-center gap-3 ${fieldPaddingClasses} ${fieldClasses}`.trim()}>
            <span className={`flex ${searchIconWrapperClasses} flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)]`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.1}>
                <circle cx="11" cy="11" r="7.5" />
                <path d="m20 20-3.8-3.8" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <input
                type="text"
                placeholder="ค้นหาทัวร์หรือสถานที่..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !searchDisabled) {
                    onSearch()
                  }
                }}
                className={`w-full min-w-0 bg-transparent font-semibold outline-none placeholder:font-medium ${searchInputClasses} ${inputToneClasses}`.trim()}
              />
            </div>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0">
            {showGuests && (
              <div className="relative sm:min-w-[228px]">
                <button
                  ref={guestTriggerRef}
                  type="button"
                  onClick={() => setIsGuestPickerOpen((prev) => !prev)}
                  className="ui-focus-ring flex h-full w-full items-center gap-3 rounded-[1.35rem] border border-gray-100 bg-gray-50 px-5 py-3 text-left lg:bg-white"
                  aria-haspopup="dialog"
                  aria-expanded={isGuestPickerOpen}
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.08)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">ผู้เดินทาง</p>
                    <p className="mt-1 text-base font-semibold text-gray-800">{totalTravelers} ท่าน</p>
                    {hasChildrenPicker && (
                      <p className="mt-0.5 truncate text-xs font-medium text-gray-400">{guestSummary}</p>
                    )}
                  </div>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-gray-500 transition-transform ${isGuestPickerOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.4}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onSearch}
              disabled={searchDisabled}
              className={`ui-focus-ring ui-pressable font-bold text-white ${searchButtonClasses} ${searchDisabled
                ? 'cursor-not-allowed bg-slate-300 shadow-none hover:bg-slate-300'
                : `${transparent ? 'bg-[var(--color-primary)] shadow-none hover:bg-[var(--color-primary-dark)]' : 'bg-[var(--color-primary)] shadow-[0_14px_28px_rgba(37,99,235,0.2)] hover:bg-[var(--color-primary-dark)]'}`
              }`}
            >
              ค้นหา
            </button>
          </div>
        </div>
      </div>
      {guestPicker}
    </>
  )
}
