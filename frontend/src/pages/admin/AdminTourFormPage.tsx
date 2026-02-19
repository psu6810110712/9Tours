import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { tourService } from '../../services/tourService'

// ===== ค่าคงที่ที่ใช้ในฟอร์ม =====
const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']
const HIGHLIGHTS = ['ยกเลิกฟรี', 'มีรถรับส่ง', 'อาหารกลางวัน', 'เที่ยวเต็มวัน', 'มีไกด์นำเที่ยว']
const REGIONS = ['ภาคเหนือ', 'ภาคใต้', 'ภาคกลาง', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออก']

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
  const [tourCode, setTourCode] = useState('')

  // ===== State ฟอร์ม =====
  const [tourType, setTourType] = useState<'package' | 'one_day'>('one_day')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [highlights, setHighlights] = useState<string[]>([])
  const [region, setRegion] = useState('')
  const [province, setProvince] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [transportation, setTransportation] = useState('')
  const [accommodation, setAccommodation] = useState('')

  // ถ้าเป็นหน้าแก้ไข → โหลดข้อมูลเดิมมาใส่ฟอร์ม
  useEffect(() => {
    if (!isEditing) return
    tourService.getOne(Number(id)).then((tour) => {
      if (!tour) return
      setTourCode(tour.tourCode || '')
      setTourType(tour.tourType)
      setName(tour.name)
      setDescription(tour.description)
      setCategories(tour.categories)
      setHighlights(tour.highlights)
      setRegion(tour.region)
      setProvince(tour.province)
      setPrice(String(tour.price))
      setDuration(tour.duration || '')
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

  // toggle chip: กด ซ้ำเพื่อเอาออก กดใหม่เพื่อเพิ่ม
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

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const updateSchedule = (index: number, field: keyof ScheduleRow, value: string | number | boolean) => {
    setSchedules(schedules.map((s, i) => {
      if (i !== index) return s
      const updated = { ...s, [field]: value }

      // วันเดย์ทริป: ตั้ง endDate = startDate อัตโนมัติ (จบภายในวันเดียว)
      if (tourType === 'one_day' && field === 'startDate') {
        updated.endDate = value as string
      }

      return updated
    }))
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
      duration,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <p className="flex-1 flex items-center justify-center text-gray-400">กำลังโหลด...</p>
        <Footer />
      </div>
    )
  }

  // ===== CSS class ที่ใช้ซ้ำ =====
  const inputClass = 'w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-300'
  const labelClass = 'text-sm font-bold text-gray-800 block mb-1'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-8 py-8">

          {/* หัวข้อ + Toggle ประเภท */}
          <div className="flex items-center gap-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'แก้ไขทัวร์' : 'เพิ่มทัวร์ใหม่'}
            </h1>
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
          </div>

          {/* 2 คอลัมน์ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ========== ฝั่งซ้าย: ข้อมูลทัวร์ ========== */}
            <div className="bg-white rounded-2xl border-2 border-yellow-400 p-6 space-y-5">

              {/* รหัสทัวร์ + ชื่อทัวร์ */}
              <div className="grid grid-cols-[1fr_2fr] gap-4">
                <div>
                  <label className={labelClass}>รหัสทัวร์</label>
                  <input
                    type="text"
                    value={isEditing ? tourCode : 'สร้างอัตโนมัติ'}
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
                <span className={labelClass}>เกี่ยวกับทัวร์นี้</span>
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
                    <option value="">เลือกภาค</option>
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

              {/* ระยะเวลา + ราคา */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>ระยะเวลา*</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder={tourType === 'one_day' ? 'เช่น 8 ชั่วโมง' : 'เช่น 3 วัน 2 คืน'}
                    required
                    className={inputClass}
                  />
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

            {/* ========== ฝั่งขวา: รูปภาพ + กำหนดการ ========== */}
            <div className="bg-white rounded-2xl border-2 border-yellow-400 p-6 space-y-5">

              <h2 className="text-sm font-bold text-gray-800">รูปภาพและกำหนดการ</h2>

              {/* รูปภาพ — ใช้ URL input (backend ยังไม่มี file storage) */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <p className="text-sm text-gray-400 mb-3">วาง URL รูปภาพด้านล่าง</p>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-50 rounded-lg px-3 py-2 text-xs outline-none border border-gray-200 focus:border-yellow-400"
                />
              </div>

              {/* กำหนดการ (schedules) */}
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
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <input
                        type="date"
                        value={s.startDate}
                        onChange={(e) => updateSchedule(i, 'startDate', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                      />
                      {/* วันเดย์ทริป: endDate ถูก auto-fill ตาม startDate จึงซ่อนไว้ */}
                      {tourType === 'package' && (
                        <>
                          <span className="text-gray-400">ถึง</span>
                          <input
                            type="date"
                            value={s.endDate}
                            onChange={(e) => updateSchedule(i, 'endDate', e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                          />
                        </>
                      )}
                      <input
                        type="number"
                        value={s.maxCapacity}
                        onChange={(e) => updateSchedule(i, 'maxCapacity', Number(e.target.value))}
                        min={1}
                        className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-yellow-400"
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {tourType === 'one_day' ? 'คน/รอบ' : 'คน/กรุ๊ป'}
                      </span>
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        onChange={(e) => updateSchedule(i, 'enabled', e.target.checked)}
                        className="accent-yellow-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeSchedule(i)}
                        className="text-red-400 hover:text-red-600 text-xs"
                        title="ลบรอบนี้"
                      >
                        ✕
                      </button>
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
                  rows={2}
                  className={inputClass + ' resize-none'}
                />
              </div>

              {/* รายละเอียดที่พัก — เฉพาะแพ็กเกจ */}
              {tourType === 'package' && (
                <div>
                  <label className={labelClass}>รายละเอียดที่พัก*</label>
                  <textarea
                    value={accommodation}
                    onChange={(e) => setAccommodation(e.target.value)}
                    required
                    rows={2}
                    placeholder="เช่น โรงแรม 3 ดาว ย่านนิมมาน"
                    className={inputClass + ' resize-none'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ปุ่มด้านล่าง */}
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
      </main>

      <Footer />
    </div>
  )
}
