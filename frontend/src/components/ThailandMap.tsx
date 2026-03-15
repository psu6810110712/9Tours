import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scalePow } from 'd3-scale'

const geoUrl = '/maps/thailand.json'

const PROVINCE_MAP: Record<string, string> = {
  'Amnat Charoen': 'อำนาจเจริญ',
  'Ang Thong': 'อ่างทอง',
  'Bangkok Metropolis': 'กรุงเทพมหานคร',
  'Bueng Kan': 'บึงกาฬ',
  'Buri Ram': 'บุรีรัมย์',
  'Chachoengsao': 'ฉะเชิงเทรา',
  'Chai Nat': 'ชัยนาท',
  'Chaiyaphum': 'ชัยภูมิ',
  Chanthaburi: 'จันทบุรี',
  'Chiang Mai': 'เชียงใหม่',
  'Chiang Rai': 'เชียงราย',
  'Chon Buri': 'ชลบุรี',
  Chumphon: 'ชุมพร',
  Kalasin: 'กาฬสินธุ์',
  'Kamphaeng Phet': 'กำแพงเพชร',
  Kanchanaburi: 'กาญจนบุรี',
  'Khon Kaen': 'ขอนแก่น',
  Krabi: 'กระบี่',
  Lampang: 'ลำปาง',
  Lamphun: 'ลำพูน',
  Loei: 'เลย',
  'Lop Buri': 'ลพบุรี',
  'Mae Hong Son': 'แม่ฮ่องสอน',
  'Maha Sarakham': 'มหาสารคาม',
  Mukdahan: 'มุกดาหาร',
  'Nakhon Nayok': 'นครนายก',
  'Nakhon Pathom': 'นครปฐม',
  'Nakhon Phanom': 'นครพนม',
  'Nakhon Ratchasima': 'นครราชสีมา',
  'Nakhon Sawan': 'นครสวรรค์',
  'Nakhon Si Thammarat': 'นครศรีธรรมราช',
  Nan: 'น่าน',
  Narathiwat: 'นราธิวาส',
  'Nong Bua Lam Phu': 'หนองบัวลำภู',
  'Nong Khai': 'หนองคาย',
  Nonthaburi: 'นนทบุรี',
  'Pathum Thani': 'ปทุมธานี',
  Pattani: 'ปัตตานี',
  Phangnga: 'พังงา',
  Phatthalung: 'พัทลุง',
  Phayao: 'พะเยา',
  Phetchabun: 'เพชรบูรณ์',
  Phetchaburi: 'เพชรบุรี',
  Phichit: 'พิจิตร',
  Phitsanulok: 'พิษณุโลก',
  'Phra Nakhon Si Ayutthaya': 'พระนครศรีอยุธยา',
  Phrae: 'แพร่',
  Phuket: 'ภูเก็ต',
  'Prachin Buri': 'ปราจีนบุรี',
  'Prachuap Khiri Khan': 'ประจวบคีรีขันธ์',
  Ranong: 'ระนอง',
  Ratchaburi: 'ราชบุรี',
  Rayong: 'ระยอง',
  'Roi Et': 'ร้อยเอ็ด',
  'Sa Kaeo': 'สระแก้ว',
  'Sakon Nakhon': 'สกลนคร',
  'Samut Prakan': 'สมุทรปราการ',
  'Samut Sakhon': 'สมุทรสาคร',
  'Samut Songkhram': 'สมุทรสงคราม',
  Saraburi: 'สระบุรี',
  Satun: 'สตูล',
  'Sing Buri': 'สิงห์บุรี',
  'Si Sa Ket': 'ศรีสะเกษ',
  Songkhla: 'สงขลา',
  Sukhothai: 'สุโขทัย',
  'Suphan Buri': 'สุพรรณบุรี',
  'Surat Thani': 'สุราษฎร์ธานี',
  Surin: 'สุรินทร์',
  Tak: 'ตาก',
  Trang: 'ตรัง',
  Trat: 'ตราด',
  'Ubon Ratchathani': 'อุบลราชธานี',
  'Udon Thani': 'อุดรธานี',
  'Uthai Thani': 'อุทัยธานี',
  Uttaradit: 'อุตรดิตถ์',
  Yala: 'ยะลา',
  Yasothon: 'ยโสธร',
}

interface ThailandMapProps {
  provinceStats: { name: string; value: number; percent: number }[]
  metricLabel: string
  emptyLabel: string
  valueFormatter?: (value: number) => string
}

interface HoveredProvince {
  name: string
  value: number
  percent: number
}

export default function ThailandMap({
  provinceStats,
  metricLabel,
  emptyLabel,
  valueFormatter = (value) => value.toLocaleString(),
}: ThailandMapProps) {
  const [hoveredProvince, setHoveredProvince] = useState<HoveredProvince | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const provinceLookup = useMemo(() => {
    return new Map(provinceStats.map((province) => [province.name, province]))
  }, [provinceStats])

  const maxValue = Math.max(...provinceStats.map((province) => province.value), 1)

  const colorScale = useMemo(() => {
    return scalePow<string>()
      .exponent(0.55)
      .domain([0, maxValue])
      .range(['#FFF3D6', '#C96A12'])
  }, [maxValue])

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-50">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [101, 13.2],
          scale: 2550,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => {
              const englishName = geo.properties.name || geo.properties.NAME_1
              const provinceName = PROVINCE_MAP[englishName] || englishName
              const provinceData = provinceLookup.get(provinceName)
              const value = provinceData?.value ?? 0

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={value > 0 ? colorScale(value) : '#EEF2F7'}
                  stroke="#FFFFFF"
                  strokeWidth={0.7}
                  onMouseEnter={(event) => {
                    setHoveredProvince({
                      name: provinceName,
                      value,
                      percent: provinceData?.percent ?? 0,
                    })
                    setTooltipPosition({
                      x: event.clientX,
                      y: event.clientY,
                    })
                  }}
                  onMouseMove={(event) => {
                    setTooltipPosition({
                      x: event.clientX,
                      y: event.clientY,
                    })
                  }}
                  onMouseLeave={() => {
                    setHoveredProvince(null)
                  }}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      fill: value > 0 ? '#E4572E' : '#DCE4EE',
                      outline: 'none',
                      cursor: 'pointer',
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {hoveredProvince && (
        <div
          className="pointer-events-none fixed z-[70] min-w-[148px] rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
          style={{
            left: tooltipPosition.x + 14,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <p className="text-sm font-semibold text-slate-900">{hoveredProvince.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {hoveredProvince.value > 0
              ? `${valueFormatter(hoveredProvince.value)} ${metricLabel} · ${hoveredProvince.percent}%`
              : emptyLabel}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 right-4 rounded-xl border border-white/80 bg-white/92 px-3 py-2 text-[10px] text-slate-500">
        <p className="mb-1 font-semibold tracking-wide text-slate-600">{metricLabel}</p>
        <div className="flex items-center gap-2">
          <span>น้อย</span>
          <div className="h-1.5 w-20 rounded-full bg-[linear-gradient(90deg,#FFF3D6_0%,#F2A233_45%,#C96A12_100%)]" />
          <span>มาก</span>
        </div>
      </div>
    </div>
  )
}
