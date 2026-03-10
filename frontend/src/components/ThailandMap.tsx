import { useMemo } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'

// The URL of the Thailand GeoJSON file (make sure it exists in public folder)
const geoUrl = '/maps/thailand.json'

// Mapping from English province names (found in the GeoJSON) to Thai province names
const PROVINCE_MAP: Record<string, string> = {
  'Amnat Charoen': 'อำนาจเจริญ',
  'Ang Thong': 'อ่างทอง',
  'Bangkok Metropolis': 'กรุงเทพมหานคร',
  'Bueng Kan': 'บึงกาฬ',
  'Buri Ram': 'บุรีรัมย์',
  'Chachoengsao': 'ฉะเชิงเทรา',
  'Chai Nat': 'ชัยนาท',
  'Chaiyaphum': 'ชัยภูมิ',
  'Chanthaburi': 'จันทบุรี',
  'Chiang Mai': 'เชียงใหม่',
  'Chiang Rai': 'เชียงราย',
  'Chon Buri': 'ชลบุรี',
  'Chumphon': 'ชุมพร',
  'Kalasin': 'กาฬสินธุ์',
  'Kamphaeng Phet': 'กำแพงเพชร',
  'Kanchanaburi': 'กาญจนบุรี',
  'Khon Kaen': 'ขอนแก่น',
  'Krabi': 'กระบี่',
  'Lampang': 'ลำปาง',
  'Lamphun': 'ลำพูน',
  'Loei': 'เลย',
  'Lop Buri': 'ลพบุรี',
  'Mae Hong Son': 'แม่ฮ่องสอน',
  'Maha Sarakham': 'มหาสารคาม',
  'Mukdahan': 'มุกดาหาร',
  'Nakhon Nayok': 'นครนายก',
  'Nakhon Pathom': 'นครปฐม',
  'Nakhon Phanom': 'นครพนม',
  'Nakhon Ratchasima': 'นครราชสีมา',
  'Nakhon Sawan': 'นครสวรรค์',
  'Nakhon Si Thammarat': 'นครศรีธรรมราช',
  'Nan': 'น่าน',
  'Narathiwat': 'นราธิวาส',
  'Nong Bua Lam Phu': 'หนองบัวลำภู',
  'Nong Khai': 'หนองคาย',
  'Nonthaburi': 'นนทบุรี',
  'Pathum Thani': 'ปทุมธานี',
  'Pattani': 'ปัตตานี',
  'Phangnga': 'พังงา',
  'Phatthalung': 'พัทลุง',
  'Phayao': 'พะเยา',
  'Phetchabun': 'เพชรบูรณ์',
  'Phetchaburi': 'เพชรบุรี',
  'Phichit': 'พิจิตร',
  'Phitsanulok': 'พิษณุโลก',
  'Phra Nakhon Si Ayutthaya': 'พระนครศรีอยุธยา',
  'Phrae': 'แพร่',
  'Phuket': 'ภูเก็ต',
  'Prachin Buri': 'ปราจีนบุรี',
  'Prachuap Khiri Khan': 'ประจวบคีรีขันธ์',
  'Ranong': 'ระนอง',
  'Ratchaburi': 'ราชบุรี',
  'Rayong': 'ระยอง',
  'Roi Et': 'ร้อยเอ็ด',
  'Sa Kaeo': 'สระแก้ว',
  'Sakon Nakhon': 'สกลนคร',
  'Samut Prakan': 'สมุทรปราการ',
  'Samut Sakhon': 'สมุทรสาคร',
  'Samut Songkhram': 'สมุทรสงคราม',
  'Saraburi': 'สระบุรี',
  'Satun': 'สตูล',
  'Sing Buri': 'สิงห์บุรี',
  'Si Sa Ket': 'ศรีสะเกษ',
  'Songkhla': 'สงขลา',
  'Sukhothai': 'สุโขทัย',
  'Suphan Buri': 'สุพรรณบุรี',
  'Surat Thani': 'สุราษฎร์ธานี',
  'Surin': 'สุรินทร์',
  'Tak': 'ตาก',
  'Trang': 'ตรัง',
  'Trat': 'ตราด',
  'Ubon Ratchathani': 'อุบลราชธานี',
  'Udon Thani': 'อุดรธานี',
  'Uthai Thani': 'อุทัยธานี',
  'Uttaradit': 'อุตรดิตถ์',
  'Yala': 'ยะลา',
  'Yasothon': 'ยโสธร'
}

interface RegionData {
  name: string
  count: number
  percent: number
}

interface ThailandMapProps {
  regionStats: RegionData[]
  provinceStats: { name: string; count: number; percent: number }[]
}

export default function ThailandMap({ provinceStats }: ThailandMapProps) {
  // สร้าง Scale สี (ยอดจำนวน count น้อยเป็นสีส้มอ่อน -> มากเป็นสีส้มเข้ม/แดง)
  const colorScale = useMemo(() => {
    const maxCount = Math.max(...provinceStats.map(d => d.count), 1);
    return scaleLinear<string>()
      .domain([0, maxCount / 2, maxCount])
      .range(["#FEF3C7", "#F59E0B", "#B45309"]); // Light Yellow -> Amber -> Dark Amber
  }, [provinceStats]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50 border border-gray-100 flex flex-col items-center justify-center relative min-h-[300px]">
      {/* React Simple Maps component */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [101, 13.2], // ปรับศูนย์กลางแผนที่
          scale: 1800 // ปรับลดขนาดแผนที่ให้ไม่ล้น
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map(geo => {
              const enName = geo.properties.name || geo.properties.NAME_1;
              const thName = PROVINCE_MAP[enName] || enName;

              // ค้นหาข้อมูลจังหวัดจาก Stats
              const foundData = provinceStats.find(d => d.name === thName);
              const count = foundData ? foundData.count : 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={count > 0 ? colorScale(count) : "#F3F4F6"} // เทาสำหรับจังหวัดที่ไม่มีข้อมูล
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#EF4444", outline: "none", cursor: "pointer" }, // เปลี่ยนเป็นสีแดงสดเมื่อ Hover
                    pressed: { outline: "none" },
                  }}
                >
                  <title>{thName}: {count > 0 ? `${count} วิว` : 'ไม่มีข้อมูล'}</title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend เล็กๆ ด้านล่างขวา */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-[10px] border border-gray-100 shadow-sm pointer-events-none z-10">
        <p className="text-gray-500 font-medium mb-1 tracking-wide">จำนวนวิว</p>
        <div className="flex items-center gap-1.5 h-2">
          <span className="text-[9px] text-gray-400">น้อย</span>
          <div className="w-16 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, #FEF3C7, #F59E0B, #B45309)' }}></div>
          <span className="text-[9px] text-gray-400">มาก</span>
        </div>
      </div>
    </div>
  )
}
