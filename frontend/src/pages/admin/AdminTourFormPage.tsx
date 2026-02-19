import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { tourService } from '../../services/tourService'

// ===== ค่าคงที่ที่ใช้ในฟอร์ม =====

const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']
const HIGHLIGHTS = ['ยกเลิกฟรี', 'มีรถรับส่ง', 'อาหารกลางวัน', 'เที่ยวเต็มวัน', 'มีไกด์นำเที่ยว']
const REGIONS = ['ภาคเหนือ', 'ภาคใต้', 'ภาคกลาง', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออก']

// กำหนดการ 1 ช่วงเวลา
interface ScheduleRow {
  startDate: string
  endDate: string
  maxCapacity: number
  enabled: boolean
}

export default function AdminTourFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ===== State ฟอร์มฝั่งซ้าย =====
  const [tourType, setTourType] = useState<'package' | 'one_day'>('one_day')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [highlights, setHighlights] = useState<string[]>([])
  const [region, setRegion] = useState('')
  const [province, setProvince] = useState('')
  const [price, setPrice] = useState('')

  // ===== State ฟอร์มฝั่งขวา =====
  const [imageUrl, setImageUrl] = useState('')
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [transportation, setTransportation] = useState('')
  const [accommodation, setAccommodation] = useState('')

  // ถ้าเป็นหน้าแก้ไข → โหลดข้อมูลเดิมมาใส่ฟอร์ม
  useEffect(() => {
    if (!isEditing) return
    tourService.getOne(Number(id)).then((tour) => {
      if (!tour) return
      setTourType(tour.tourType)
      setName(tour.name)
      setDescription(tour.description)
      setCategories(tour.categories)
      setHighlights(tour.highlights)
      setRegion(tour.region)
      setProvince(tour.province)
      setPrice(String(tour.price))
      setImageUrl(tour.images?.[0] || '')
      setTransportation(tour.transportation || '')
      setAccommodation(tour.accommodation || '')
      setSchedules(
        tour.schedules.map((s) => ({
          startDate: s.startDate,
          endDate: s.endDate,
          maxCapacity: s.maxCapacity,
          enabled: true,
        }))
      )
      setLoading(false)
    })
  }, [id, isEditing])

  // ===== Handlers =====

  // toggle chip: ถ้าเลือกอยู่แล้วให้เอาออก ถ้ายังไม่เลือกให้เพิ่ม
  const toggleChip = (
    list: string[],
    setList: (v: string[]) => void,
    value: string
  ) => {
    setList(
      list.includes(value)
        ? list.filter((v2) => v2 !== value)
        : [...list, value]
    )
  }

  const addSchedule = () => {
    setSchedules([...schedules, { startDate: '', endDate: '', maxCapacity: 50, enabled: true }])
  }

  const updateSchedule = (index: number, field: keyof ScheduleRow, value: string | number | boolean) => {
    setSchedules(schedules.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      name,
      description,
      tourType,
      categories,
      price: Number(price),
      highlights,
      images: imageUrl ? [imageUrl] : [],
      transportation,
      duration: tourType === 'one_day' ? '1 วัน' : '',
      region,
      province,
      accommodation: tourType === 'package' ? accommodation : null,
      schedules: schedules
        .filter((s) => s.enabled && s.startDate && s.endDate)
        .map((s) => ({
          startDate: s.startDate,
          endDate: s.endDate,
          maxCapacity: Number(s.maxCapacity),
        })),
    }

    try {
      // payload มี schedules แบบย่อ (ไม่ครบ TourSchedule) ต้อง cast เพราะ backend รับ DTO แยก
      if (isEditing) {
        await tourService.update(Number(id), payload as any)
      } else {
        await tourService.create(payload as any)
      }
      navigate('/admin/tours')
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-8 text-center text-gray-500">กำลังโหลด...</p>

  // ===== CSS class ที่ใช้ซ้ำ =====
  const inputClass = 'w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-300'
  const labelClass = 'text-sm font-bold text-gray-800 block mb-1'

  return (
    <div className="min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-8 py-8">

        {/* หัวข้อ + Toggle ประเภท */}
        <div className="flex items-center gap-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">เพิ่ม/แก้ไขทัวร์</h1>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tourType"
              checked={tourType === 'package'}
              onChange={() => setTourType('package')}
              className="accent-yellow-500"
            />
            <span className="text-sm text-gray-700">เที่ยวพร้อมที่พัก</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tourType"
              checked={tourType === 'one_day'}
              onChange={() => setTourType('one_day')}
              className="accent-yellow-500"
            />
            <span className="text-sm text-gray-700">วันเดย์ทริป</span>
          </label>
        </div>

        {/* 2 คอลัมน์ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ========== ฝั่งซ้าย ========== */}
          <div className="bg-white rounded-2xl border-2 border-yellow-400 p-6 space-y-5">

            {/* รหัสทัวร์ + ชื่อทัวร์ */}
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              <div>
                <label className={labelClass}>รหัสทัวร์*</label>
                <input
                  type="text"
                  value={isEditing ? `T-${id}` : 'Auto'}
                  disabled
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className={labelClass}>ชื่อทัวร์*</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* แท็กประเภทของทัวร์ */}
            <div>
              <span className={labelClass}>แท็กประเภทของทัวร์</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleChip(categories, setCategories, cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      categories.includes(cat)
                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* รายละเอียดทัวร์ */}
            <div>
              <label className={labelClass}>รายละเอียดทัวร์*</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="รายละเอียดทัวร์"
                required
                rows={3}
                className={inputClass + ' resize-none'}
              />
            </div>

            {/* เกี่ยวกับทัวร์นี้ (highlights) */}
            <div>
              <span className={labelClass}>เกี่ยวกับทัวร์นี้*</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {HIGHLIGHTS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleChip(highlights, setHighlights, h)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      highlights.includes(h)
                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* ภาค + จังหวัด */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>ภาค*</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value=""></option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>จังหวัด*</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* เทศกาล (visual only) + ราคา */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>เทศกาล</label>
                <select className={inputClass}>
                  <option value=""></option>
                  <option value="songkran">สงกรานต์</option>
                  <option value="newyear">ปีใหม่</option>
                  <option value="loy">ลอยกระทง</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>ราคา*</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min={0}
                    className={inputClass}
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">บาท</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========== ฝั่งขวา ========== */}
          <div className="bg-white rounded-2xl border-2 border-yellow-400 p-6 space-y-5">

            <h2 className="text-sm font-bold text-gray-800">รูปภาพและกำหนดการ</h2>

            {/* พื้นที่รูปภาพ — ใช้ URL input แทน drag-drop จริง (backend ยังไม่มี storage) */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">ลากรูปมาที่นี่ หรือ คลิกเพื่ออัปโหลด</p>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="วาง URL รูปภาพที่นี่"
                className="w-full bg-gray-50 rounded-lg px-3 py-2 text-xs outline-none border border-gray-200 focus:border-yellow-400"
              />
            </div>

            {/* กำหนดการ */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-bold text-gray-800">กำหนดการ</span>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="text-xs font-semibold text-white bg-orange-400 hover:bg-orange-500 px-3 py-1 rounded-full transition-colors"
                >
                  + เพิ่มช่วงเวลา
                </button>
              </div>

              <div className="space-y-2">
                {schedules.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {/* ไอคอนปฏิทิน */}
                    <span className="text-gray-400">📅</span>
                    <input
                      type="date"
                      value={s.startDate}
                      onChange={(e) => updateSchedule(i, 'startDate', e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="date"
                      value={s.endDate}
                      onChange={(e) => updateSchedule(i, 'endDate', e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                    />
                    <input
                      type="number"
                      value={s.maxCapacity}
                      onChange={(e) => updateSchedule(i, 'maxCapacity', Number(e.target.value))}
                      min={1}
                      className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-yellow-400"
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {tourType === 'one_day' ? 'คน/กริป' : 'คน/วัน'}
                    </span>
                    {/* checkbox เปิด/ปิดช่วงเวลานี้ */}
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) => updateSchedule(i, 'enabled', e.target.checked)}
                      className="accent-yellow-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* คำแนะนำการเดินทาง */}
            <div>
              <label className={labelClass}>คำแนะนำการเดินทาง</label>
              <textarea
                value={transportation}
                onChange={(e) => setTransportation(e.target.value)}
                rows={3}
                className={inputClass + ' resize-none'}
              />
            </div>

            {/* รายละเอียดที่พัก — แสดงเฉพาะเมื่อเลือก "เที่ยวพร้อมที่พัก" */}
            {tourType === 'package' && (
              <div>
                <label className={labelClass}>รายละเอียดที่พัก*</label>
                <textarea
                  value={accommodation}
                  onChange={(e) => setAccommodation(e.target.value)}
                  rows={3}
                  className={inputClass + ' resize-none'}
                />
              </div>
            )}
          </div>
        </div>

        {/* ปุ่มด้านล่างขวา */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/admin/tours')}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  )
}
