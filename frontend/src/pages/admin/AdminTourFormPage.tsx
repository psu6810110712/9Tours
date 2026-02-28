import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { tourService } from '../../services/tourService'

// ===== ค่าคงที่ที่ใช้ในฟอร์ม =====
const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']
const HIGHLIGHTS = ['ยกเลิกฟรี', 'มีรถรับส่ง', 'อาหารกลางวัน', 'เที่ยวเต็มวัน', 'มีไกด์นำเที่ยว', 'รวมที่พัก', 'รถรับส่งสนามบิน']
const REGIONS = ['ภาคเหนือ', 'ภาคใต้', 'ภาคกลาง', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออก']

interface ScheduleRow {
  startDate: string
  endDate: string
  timeSlot: string
  roundName: string
  maxCapacity: number
  enabled: boolean
}

interface ItineraryItem {
  day?: number
  time: string
  title: string
  description: string
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
  const [minPeople, setMinPeople] = useState('')
  const [maxPeople, setMaxPeople] = useState('')
  const [duration, setDuration] = useState('')

  // State สำหรับรูปภาพ
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [transportation, setTransportation] = useState('')
  const [accommodation, setAccommodation] = useState('')
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])

  // ===== State สำหรับเพิ่มหลายวันพร้อมกัน (เฉพาะ one_day) =====
  const [bulkFrom, setBulkFrom] = useState('')
  const [bulkTo, setBulkTo] = useState('')
  const [bulkCapacity, setBulkCapacity] = useState(20)
  const [bulkDuration, setBulkDuration] = useState(1)
  const [bulkDays, setBulkDays] = useState<Set<number>>(new Set([6, 0]))
  const [roundTemplates, setRoundTemplates] = useState<{ roundName: string; timeSlot: string }[]>([{ roundName: '', timeSlot: '' }])

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
      setMinPeople(tour.minPeople ? String(tour.minPeople) : '')
      setMaxPeople(tour.maxPeople ? String(tour.maxPeople) : '')
      setDuration(tour.duration || '')
      setImages(tour.images || []) // โหลดรูปภาพเดิม
      setTransportation(tour.transportation || '')
      setAccommodation(tour.accommodation || '')
      setItinerary(tour.itinerary || [])
      setSchedules(
        tour.schedules.map((s) => ({
          startDate: s.startDate,
          endDate: s.endDate,
          timeSlot: s.timeSlot || '',
          roundName: s.roundName || '',
          maxCapacity: s.maxCapacity,
          enabled: true,
        }))
      )
      setLoading(false)
    })
  }, [id, isEditing])

  // ===== Handlers =====

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

  // ===== Image Handlers =====
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    // ตรวจสอบประเภทไฟล์ (รับเฉพาะ jpg/jpeg และ png)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      alert('กรุณาแนบเฉพาะไฟล์ประเภท .jpg หรือ .png เท่านั้นครับ')
      e.target.value = ''
      return
    }

    try {
      setUploadingImage(true)
      const url = await tourService.uploadImage(file)
      setImages((prev) => [...prev, url])
    } catch (error) {
      console.error(error)
      alert('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  // ===== Schedule Handlers =====
  const addSchedule = () => {
    setSchedules([...schedules, { startDate: '', endDate: '', timeSlot: '', roundName: '', maxCapacity: 50, enabled: true }])
  }

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const updateSchedule = (index: number, field: keyof ScheduleRow, value: string | number | boolean) => {
    setSchedules(schedules.map((s, i) => {
      if (i !== index) return s
      const updated = { ...s, [field]: value }
      if (tourType === 'one_day' && field === 'startDate') {
        updated.endDate = value as string
      }
      return updated
    }))
  }

  const handleBulkAdd = () => {
    if (!bulkFrom || !bulkTo || bulkFrom > bulkTo) return
    const result: ScheduleRow[] = []
    const cur = new Date(bulkFrom)
    const end = new Date(bulkTo)

    let rounds = [{ roundName: '', timeSlot: '' }]
    if (tourType === 'one_day') {
      const validRounds = roundTemplates.filter((r) => r.timeSlot || r.roundName)
      if (validRounds.length > 0) rounds = validRounds
    } else {
      rounds = [{ roundName: 'Private Group', timeSlot: '' }]
    }

    while (cur <= end) {
      if (bulkDays.has(cur.getDay())) {
        const startDateStr = cur.toISOString().slice(0, 10)
        const endDateObj = new Date(cur)
        if (tourType === 'package' && bulkDuration > 1) {
          endDateObj.setDate(endDateObj.getDate() + (bulkDuration - 1))
        }
        const endDateStr = endDateObj.toISOString().slice(0, 10)

        for (const round of rounds) {
          const alreadyExists = schedules.some(
            (s) => s.startDate === startDateStr && s.timeSlot === round.timeSlot
          )
          if (!alreadyExists) {
            result.push({
              startDate: startDateStr,
              endDate: endDateStr,
              timeSlot: round.timeSlot,
              roundName: round.roundName,
              maxCapacity: bulkCapacity,
              enabled: true,
            })
          }
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
    setSchedules((prev) => [...prev, ...result])
  }

  // ===== Itinerary Handlers =====
  const addItineraryItem = () => {
    setItinerary([...itinerary, { time: '', title: '', description: '' }])
  }

  const removeItineraryItem = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index))
  }

  const updateItineraryItem = (index: number, field: keyof ItineraryItem, value: string) => {
    setItinerary(itinerary.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  // ===== Submit Handler =====
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
      minPeople: minPeople ? Number(minPeople) : undefined,
      maxPeople: maxPeople ? Number(maxPeople) : undefined,
      highlights,
      images: images, // ส่ง Array ของรูปภาพไปให้ Backend
      transportation,
      duration,
      region,
      province,
      accommodation: tourType === 'package' ? accommodation : null,
      itinerary,
      schedules: schedules
        .filter((s) => s.enabled && s.startDate && s.endDate)
        .map((s) => ({
          startDate: s.startDate,
          endDate: s.endDate,
          timeSlot: s.timeSlot || null,
          roundName: s.roundName || null,
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
      <p className="flex-1 flex items-center justify-center text-gray-400">กำลังโหลด...</p>
    )
  }

  const inputClass = 'w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-300'
  const labelClass = 'text-sm font-bold text-gray-800 block mb-1'

  return (
    <>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ========== ฝั่งซ้าย: ข้อมูลทัวร์ ========== */}
            <div className="bg-white rounded-2xl border-2 border-yellow-400 p-6 space-y-5">
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

              <div>
                <span className={labelClass}>แท็กประเภทของทัวร์</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleChip(categories, setCategories, cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${categories.includes(cat)
                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

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

              <div>
                <span className={labelClass}>เกี่ยวกับทัวร์นี้</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {HIGHLIGHTS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleChip(highlights, setHighlights, h)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${highlights.includes(h)
                        ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300'
                        }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

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

              {tourType === 'package' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <span className="text-sm font-bold text-blue-800 block mb-2">ตั้งค่า Private Tour</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-blue-700 mb-1 block">จำนวนคนขั้นต่ำ (Min)*</label>
                      <input
                        type="number"
                        min="1"
                        value={minPeople}
                        onChange={(e) => setMinPeople(e.target.value)}
                        required
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                        placeholder="เช่น 4 คน"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-blue-700 mb-1 block">รับได้สูงสุด (Max)</label>
                      <input
                        type="number"
                        min="1"
                        value={maxPeople}
                        onChange={(e) => setMaxPeople(e.target.value)}
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                        placeholder="เช่น 10 คน"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-500 mt-2">
                    * เมื่อระบุจำนวนคนขั้นต่ำ ระบบจะเปลี่ยนเป็นโหมด <strong>"เหมากลุ่ม (Private)"</strong> อัตโนมัติ โดยผู้จองสามารถเลือกวันเริ่มเดินทางได้อิสระ
                  </p>
                </div>
              )}
            </div>

            {/* ========== ฝั่งขวา: รูปภาพ + กำหนดการ ========== */}
            <div className="bg-white rounded-2xl border-2 border-yellow-400 p-6 space-y-5">

              {/* ระบบอัปโหลดรูปภาพ */}
              <div className="mb-2">
                <span className="text-sm font-bold text-gray-800 block mb-3">รูปภาพทัวร์ (เฉพาะ .jpg, .png)</span>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {images.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden h-24 border border-gray-200">
                        <img src={url} alt={`Tour ${i}`} className="w-full h-full object-cover bg-gray-100" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/80 h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  <span className="text-2xl mb-1 text-gray-400">📷</span>
                  <span className="text-sm text-gray-500 font-medium">
                    {uploadingImage ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* กำหนดการ (schedules) */}
              <div>
                <span className="text-sm font-bold text-gray-800 block mb-3">กำหนดการ</span>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3 space-y-2">
                  <p className="text-xs font-bold text-orange-700">เพิ่มหลายวันพร้อมกัน (Bulk Add)</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">จาก</span>
                      <input
                        type="date"
                        value={bulkFrom}
                        onChange={(e) => setBulkFrom(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">ถึง</span>
                      <input
                        type="date"
                        value={bulkTo}
                        onChange={(e) => setBulkTo(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                      />
                    </div>

                    {tourType === 'package' && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">ระยะเวลา</span>
                        <input
                          type="number"
                          min={1}
                          value={bulkDuration}
                          onChange={(e) => setBulkDuration(Number(e.target.value))}
                          className="w-12 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-orange-400"
                        />
                        <span className="text-xs text-gray-500">วัน</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={bulkCapacity}
                        min={1}
                        onChange={(e) => setBulkCapacity(Number(e.target.value))}
                        className="w-14 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-orange-400"
                      />
                      <span className="text-xs text-gray-500">คน/รอบ</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((label, dayIdx) => (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => {
                          const next = new Set(bulkDays)
                          next.has(dayIdx) ? next.delete(dayIdx) : next.add(dayIdx)
                          setBulkDays(next)
                        }}
                        className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${bulkDays.has(dayIdx)
                          ? 'bg-orange-400 text-white'
                          : 'bg-white border border-gray-300 text-gray-500'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {tourType === 'one_day' && (
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-blue-700">⏱ รอบเวลา (Join Trip)</p>
                        <button
                          type="button"
                          onClick={() => setRoundTemplates([...roundTemplates, { roundName: '', timeSlot: '' }])}
                          className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
                        >
                          + เพิ่มรอบ
                        </button>
                      </div>
                      {roundTemplates.map((rt, ri) => (
                        <div key={ri} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={rt.timeSlot}
                            onChange={(e) => {
                              const next = [...roundTemplates]
                              next[ri] = { ...next[ri], timeSlot: e.target.value }
                              setRoundTemplates(next)
                            }}
                            placeholder="เช่น 08:00-12:00"
                            className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-400"
                          />
                          <input
                            type="text"
                            value={rt.roundName}
                            onChange={(e) => {
                              const next = [...roundTemplates]
                              next[ri] = { ...next[ri], roundName: e.target.value }
                              setRoundTemplates(next)
                            }}
                            placeholder="ชื่อรอบ เช่น รอบเช้า"
                            className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-400"
                          />
                          {roundTemplates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setRoundTemplates(roundTemplates.filter((_, i) => i !== ri))}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >✕</button>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-blue-400">ถ้าไม่กรอกเวลา = สร้าง 1 รอบต่อวัน (ทัวร์ปกติ)</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBulkAdd}
                    disabled={!bulkFrom || !bulkTo}
                    className="text-xs font-semibold text-white bg-orange-400 hover:bg-orange-500 disabled:opacity-40 px-4 py-1.5 rounded-full transition-colors"
                  >
                    สร้างกำหนดการ
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addSchedule}
                  className="text-xs font-semibold text-orange-500 border border-orange-300 hover:bg-orange-50 px-3 py-1 rounded-full transition-colors mb-2"
                >
                  + เพิ่มทีละรอบ
                </button>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {schedules.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm flex-wrap">
                      <input
                        type="date"
                        value={s.startDate}
                        onChange={(e) => updateSchedule(i, 'startDate', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                      />
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
                      {tourType === 'one_day' && (
                        <input
                          type="text"
                          value={s.timeSlot}
                          onChange={(e) => updateSchedule(i, 'timeSlot', e.target.value)}
                          placeholder="เช่น 08:00-12:00"
                          title="ช่วงเวลา (Join Trip)"
                          className="w-32 bg-gray-50 border border-blue-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
                      )}
                      {tourType === 'one_day' && (
                        <input
                          type="text"
                          value={s.roundName}
                          onChange={(e) => updateSchedule(i, 'roundName', e.target.value)}
                          placeholder="ชื่อรอบ เช่น รอบเช้า"
                          title="ชื่อรอบ"
                          className="w-28 bg-gray-50 border border-blue-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
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
                  {schedules.length === 0 && (
                    <p className="text-xs text-gray-400 py-2">ยังไม่มีกำหนดการ</p>
                  )}
                </div>

                {schedules.filter(s => s.enabled).length > 0 && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-500">สรุปกำหนดการ</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        รวม {schedules.filter(s => s.enabled).length} รอบ
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>📅 <strong>จำนวนวัน:</strong> {new Set(schedules.filter(s => s.enabled).map(s => s.startDate)).size} วัน</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.from(new Set(schedules.filter(s => s.enabled).map(s => s.startDate)))
                          .sort()
                          .slice(0, 5)
                          .map(d => (
                            <span key={d} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px]">
                              {new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </span>
                          ))
                        }
                        {new Set(schedules.filter(s => s.enabled).map(s => s.startDate)).size > 5 && (
                          <span className="text-gray-400 pl-1">...และอื่นๆ</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ตารางกิจกรรม (Itinerary) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">ตารางกิจกรรม (Itinerary)</span>
                  <button
                    type="button"
                    onClick={addItineraryItem}
                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full font-semibold transition-colors"
                  >
                    + เพิ่มกิจกรรม
                  </button>
                </div>
                <div className="space-y-3">
                  {itinerary.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.day || 1}
                            onChange={(e) => updateItineraryItem(i, 'day', e.target.value)}
                            placeholder="วันที่"
                            className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 text-center"
                          />
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) => updateItineraryItem(i, 'time', e.target.value)}
                            placeholder="เวลา (เช่น 08:00)"
                            className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                          />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateItineraryItem(i, 'title', e.target.value)}
                            placeholder="ชื่อกิจกรรม (เช่น รับที่โรงแรม)"
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 font-medium"
                          />
                        </div>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItineraryItem(i, 'description', e.target.value)}
                          placeholder="รายละเอียดเพิ่มเติม (optional)"
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400 text-gray-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItineraryItem(i)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {itinerary.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
                      ยังไม่มีตารางกิจกรรม
                    </p>
                  )}
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
    </>
  )
}