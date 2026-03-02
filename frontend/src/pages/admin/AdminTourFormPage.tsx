import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { tourService } from '../../services/tourService'
import ConfirmModal from '../../components/common/ConfirmModal'
import { toast } from 'react-hot-toast'
import type { CreateTourPayload } from '../../types/tour'
import ImageUploadSection from '../../components/admin/tour-form/ImageUploadSection'
import ItinerarySection from '../../components/admin/tour-form/ItinerarySection'
import ScheduleSection from '../../components/admin/tour-form/ScheduleSection'

// ===== ค่าคงที่ที่ใช้ในฟอร์ม =====
const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']
const HIGHLIGHTS = ['ยกเลิกฟรี', 'มีรถรับส่ง', 'อาหารกลางวัน', 'เที่ยวเต็มวัน', 'มีไกด์นำเที่ยว', 'รวมที่พัก', 'รถรับส่งสนามบิน']
const REGIONS = ['ภาคเหนือ', 'ภาคใต้', 'ภาคกลาง', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออก']

export interface ScheduleRow {
  startDate: string
  endDate: string
  timeSlot: string
  roundName: string
  maxCapacity: number
  enabled: boolean
}

export interface ItineraryItem {
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
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
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
  const [childPrice, setChildPrice] = useState('')
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
      if (tour.childPrice) setChildPrice(String(tour.childPrice))
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
      toast.error('กรุณาแนบเฉพาะไฟล์ประเภท .jpg หรือ .png เท่านั้นครับ')
      e.target.value = ''
      return
    }

    try {
      setUploadingImage(true)
      const url = await tourService.uploadImage(file)
      setImages((prev) => [...prev, url])
    } catch (error) {
      console.error(error)
      toast.error('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
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

      // Auto-calculate endDate 
      if (field === 'startDate') {
        if (tourType === 'one_day') {
          updated.endDate = value as string
        } else if (tourType === 'package') {
          const startD = new Date(value as string);
          if (!isNaN(startD.getTime()) && bulkDuration > 1) {
            startD.setDate(startD.getDate() + (bulkDuration - 1));
            updated.endDate = startD.toISOString().slice(0, 10);
          }
        }
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


  // ===== Submit Handler =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload: CreateTourPayload = {
      name,
      description,
      tourType,
      categories,
      price: Number(price),
      childPrice: childPrice ? Number(childPrice) : null,
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
        await tourService.update(Number(id), payload)
      } else {
        await tourService.create(payload)
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className={labelClass}>ราคาผู้ใหญ่*</label>
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
                <div>
                  <label className={labelClass}>ราคาเด็ก</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={childPrice}
                      onChange={(e) => setChildPrice(e.target.value)}
                      min={0}
                      placeholder="ไม่บังคับ"
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
            <div className="space-y-6">

              {/* ระบบอัปโหลดรูปภาพ */}
              <ImageUploadSection
                images={images}
                uploadingImage={uploadingImage}
                onImageUpload={handleImageUpload}
                onRemoveImage={removeImage}
              />

              {/* กำหนดการ (schedules) */}
              <div className="bg-white rounded-2xl border-2 border-yellow-400 p-6">
                <ScheduleSection
                  schedules={schedules}
                  tourType={tourType}
                  bulkFrom={bulkFrom}
                  bulkTo={bulkTo}
                  bulkCapacity={bulkCapacity}
                  bulkDuration={bulkDuration}
                  bulkDays={bulkDays}
                  roundTemplates={roundTemplates}
                  setBulkFrom={setBulkFrom}
                  setBulkTo={setBulkTo}
                  setBulkCapacity={setBulkCapacity}
                  setBulkDuration={setBulkDuration}
                  setBulkDays={setBulkDays}
                  setRoundTemplates={setRoundTemplates}
                  addSchedule={addSchedule}
                  removeSchedule={removeSchedule}
                  updateSchedule={updateSchedule}
                  handleBulkAdd={handleBulkAdd}
                />
              </div>
            </div>
          </div>

          {/* ตารางกิจกรรม (Itinerary) - เต็มหน้า */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6 space-y-6">
            <ItinerarySection
              itinerary={itinerary}
              tourType={tourType}
              setItinerary={setItinerary}
            />

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {tourType === 'package' && (
                <div>
                  <label className={labelClass}>รายละเอียดที่พัก*</label>
                  <textarea
                    value={accommodation}
                    onChange={(e) => setAccommodation(e.target.value)}
                    required
                    rows={3}
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
              onClick={() => setCancelModalOpen(true)}
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

      {/* 🛑 Confirm Cancel Modal 🛑 */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        title="ยกเลิกการแก้ไข?"
        message="ข้อมูลที่คุณพิมพ์ไว้จะหายไปทั้งหมด ยืนยันที่จะยกเลิกหรือไม่?"
        confirmText="ยืนยันยกเลิก"
        cancelText="กลับไปหน้าทัวร์"
        confirmStyle="danger"
        onConfirm={() => navigate('/admin/tours')}
        onCancel={() => setCancelModalOpen(false)}
      />
    </>
  )
}