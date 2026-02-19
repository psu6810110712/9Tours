const REGIONS = ['ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันออกเฉียงเหนือ']

const PROVINCES_BY_REGION: Record<string, string[]> = {
  'ภาคเหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'แม่ฮ่องสอน'],
  'ภาคกลาง': ['กรุงเทพฯ', 'อยุธยา', 'กาญจนบุรี'],
  'ภาคใต้': ['ภูเก็ต', 'กระบี่', 'สุราษฎร์ธานี', 'สงขลา', 'ชุมพร', 'นครศรีธรรมราช'],
  'ภาคตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี'],
  'ภาคตะวันออกเฉียงเหนือ': ['ขอนแก่น', 'นครราชสีมา', 'อุดรธานี'],
}

interface FilterSidebarProps {
  region: string
  province: string
  tourType: string
  search: string
  onRegionChange: (v: string) => void
  onProvinceChange: (v: string) => void
  onTourTypeChange: (v: string) => void
  onSearchChange: (v: string) => void
  onClear: () => void
}

export default function FilterSidebar({
  region, province, tourType, search,
  onRegionChange, onProvinceChange, onTourTypeChange, onSearchChange, onClear,
}: FilterSidebarProps) {
  const hasFilter = region || province || tourType || search
  const provinceOptions = region
    ? (PROVINCES_BY_REGION[region] ?? [])
    : Object.values(PROVINCES_BY_REGION).flat()

  return (
    <aside className="w-56 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm p-4 sticky top-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800">ตัวกรอง</h2>
          {hasFilter && (
            <button onClick={onClear} className="text-xs text-[#F5A623] hover:underline">
              ล้างทั้งหมด
            </button>
          )}
        </div>

        {/* ประเภท */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">ประเภท</label>
          <div className="space-y-1">
            {[
              { value: '', label: 'ทั้งหมด' },
              { value: 'one_day', label: 'วันเดย์ทริป' },
              { value: 'package', label: 'แพ็คเกจพร้อมที่พัก' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onTourTypeChange(opt.value)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${tourType === opt.value
                    ? 'bg-[#F5A623] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ภาค */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">ภาค</label>
          <select
            value={region}
            onChange={(e) => { onRegionChange(e.target.value); onProvinceChange('') }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
          >
            <option value="">ทุกภาค</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* จังหวัด */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">จังหวัด</label>
          <select
            value={province}
            onChange={(e) => onProvinceChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
          >
            <option value="">ทุกจังหวัด</option>
            {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
    </aside>
  )
}
