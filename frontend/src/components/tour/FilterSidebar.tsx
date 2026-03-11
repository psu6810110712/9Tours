const REGIONS = ['ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันออกเฉียงเหนือ']

const PROVINCES_BY_REGION: Record<string, string[]> = {
  'ภาคเหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'แม่ฮ่องสอน'],
  'ภาคกลาง': ['กรุงเทพฯ', 'อยุธยา', 'กาญจนบุรี'],
  'ภาคใต้': ['ภูเก็ต', 'กระบี่', 'สุราษฎร์ธานี', 'สงขลา', 'ชุมพร', 'นครศรีธรรมราช'],
  'ภาคตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี'],
  'ภาคตะวันออกเฉียงเหนือ': ['ขอนแก่น', 'นครราชสีมา', 'อุดรธานี'],
}

const getMonthOptions = () => {
  const options = []
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  for (let index = 0; index < 12; index++) {
    const date = new Date(year, month + index, 1)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const thMonth = date.toLocaleDateString('th-TH', { month: 'long' })
    const thYear = yyyy + 543
    options.push({ value: `${yyyy}-${mm}`, label: `${thMonth} ${thYear}` })
  }

  return options
}

const MONTH_OPTIONS = getMonthOptions()

interface FilterSidebarProps {
  region: string
  province: string
  tourType: string
  search: string
  month: string
  onRegionChange: (value: string) => void
  onProvinceChange: (value: string) => void
  onTourTypeChange: (value: string) => void
  onMonthChange: (value: string) => void
  onClear: () => void
  mode?: 'sidebar' | 'drawer'
  onClose?: () => void
}

export default function FilterSidebar({
  region,
  province,
  tourType,
  search,
  month,
  onRegionChange,
  onProvinceChange,
  onTourTypeChange,
  onMonthChange,
  onClear,
  mode = 'sidebar',
  onClose,
}: FilterSidebarProps) {
  const hasFilter = region || province || tourType || search || month
  const provinceOptions = region
    ? (PROVINCES_BY_REGION[region] ?? [])
    : Object.values(PROVINCES_BY_REGION).flat()

  const isDrawer = mode === 'drawer'

  return (
    <aside className={isDrawer ? 'w-full' : 'w-full lg:w-64 lg:flex-shrink-0'}>
      <div className={`ui-surface rounded-[1.5rem] border border-gray-100 bg-white p-5 ${isDrawer ? '' : 'lg:sticky lg:top-24'}`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-800">ตัวกรอง</h2>
          <div className="flex items-center gap-2">
            {hasFilter && (
              <button type="button" onClick={onClear} className="text-xs font-semibold text-accent hover:underline">
                ล้างทั้งหมด
              </button>
            )}
            {isDrawer && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ui-focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">ประเภท</label>
            <div className="space-y-2">
              {[
                { value: '', label: 'ทั้งหมด' },
                { value: 'one_day', label: 'วันเดย์ทริป' },
                { value: 'package', label: 'แพ็กเกจพร้อมที่พัก' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onTourTypeChange(option.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${tourType === option.value
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">เดือนที่เดินทาง</label>
            <select
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
              className="ui-focus-ring w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white"
            >
              <option value="">ทุกเดือน</option>
              {MONTH_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">ภาค</label>
            <select
              value={region}
              onChange={(event) => {
                onRegionChange(event.target.value)
                onProvinceChange('')
              }}
              className="ui-focus-ring w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white"
            >
              <option value="">ทุกภาค</option>
              {REGIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">จังหวัด</label>
            <select
              value={province}
              onChange={(event) => onProvinceChange(event.target.value)}
              className="ui-focus-ring w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white"
            >
              <option value="">ทุกจังหวัด</option>
              {provinceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </div>
      </div>
    </aside>
  )
}
