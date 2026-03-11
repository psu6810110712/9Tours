import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'
import ImageUploadSection from '../../components/admin/tour-form/ImageUploadSection'
import ItinerarySection from '../../components/admin/tour-form/ItinerarySection'
import ScheduleSection from '../../components/admin/tour-form/ScheduleSection'
import { tourService } from '../../services/tourService'
import type { CreateTourPayload } from '../../types/tour'

const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']
const HIGHLIGHTS = ['ยกเลิกฟรี', 'มีรถรับส่ง', 'อาหารกลางวัน', 'เที่ยวเต็มวัน', 'มีไกด์นำเที่ยว', 'รวมที่พัก', 'รถรับส่งสนามบิน']
const REGIONS = ['ภาคเหนือ', 'ภาคใต้', 'ภาคกลาง', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออก', 'ภาคตะวันตก']

export interface ScheduleRow {
  id?: number
  startDate: string
  endDate: string
  timeSlot: string
  roundName: string
  maxCapacity: number
  currentBooked?: number
  enabled: boolean
}

export interface ItineraryItem {
  day?: number
  time: string
  title: string
  description: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) {
      return message.join(' ')
    }
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
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

  const [tourType, setTourType] = useState<'package' | 'one_day'>('one_day')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [highlights, setHighlights] = useState<string[]>([])
  const [region, setRegion] = useState('')
  const [province, setProvince] = useState('')
  const [price, setPrice] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [childPrice, setChildPrice] = useState('')
  const [minPeople, setMinPeople] = useState('')
  const [maxPeople, setMaxPeople] = useState('')
  const [duration, setDuration] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [transportation, setTransportation] = useState('')
  const [accommodation, setAccommodation] = useState('')
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [bulkFrom, setBulkFrom] = useState('')
  const [bulkTo, setBulkTo] = useState('')
  const [bulkCapacity, setBulkCapacity] = useState(20)
  const [bulkDuration, setBulkDuration] = useState(1)
  const [bulkDays, setBulkDays] = useState<Set<number>>(new Set([6, 0]))
  const [roundTemplates, setRoundTemplates] = useState<{ roundName: string; timeSlot: string }[]>([{ roundName: '', timeSlot: '' }])

  useEffect(() => {
    if (!isEditing) return

    setLoading(true)
    setError('')

    tourService.getOne(Number(id))
      .then((tour) => {
        if (!tour) {
          setError('ไม่พบทัวร์ที่ต้องการแก้ไข')
          return
        }

        setTourCode(tour.tourCode || '')
        setTourType(tour.tourType)
        setName(tour.name)
        setDescription(tour.description)
        setCategories(tour.categories)
        setHighlights(tour.highlights)
        setRegion(tour.region)
        setProvince(tour.province)

        let discount = 0
        if (tour.originalPrice) {
          discount = Math.round((1 - tour.price / tour.originalPrice) * 100)
          setDiscountPercent(String(discount))
          setPrice(String(tour.originalPrice))
        } else {
          setPrice(String(tour.price))
        }

        if (tour.childPrice) {
          if (discount > 0) {
            const originalChild = Math.round(tour.childPrice / (1 - discount / 100))
            setChildPrice(String(originalChild))
          } else {
            setChildPrice(String(tour.childPrice))
          }
        }

        setMinPeople(tour.minPeople ? String(tour.minPeople) : '')
        setMaxPeople(tour.maxPeople ? String(tour.maxPeople) : '')
        setDuration(tour.duration || '')
        setImages(tour.images || [])
        setTransportation(tour.transportation || '')
        setAccommodation(tour.accommodation || '')
        setItinerary(tour.itinerary || [])
        setSchedules(
          tour.schedules.map((schedule) => ({
            id: schedule.id,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            timeSlot: schedule.timeSlot || '',
            roundName: schedule.roundName || '',
            maxCapacity: schedule.maxCapacity,
            currentBooked: schedule.currentBooked,
            enabled: true,
          })),
        )
      })
      .catch((loadError) => {
        setError(getApiErrorMessage(loadError, 'ไม่สามารถโหลดข้อมูลทัวร์ได้'))
      })
      .finally(() => setLoading(false))
  }, [id, isEditing])

  const toggleChip = (list: string[], setList: (value: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return
    const file = event.target.files[0]

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      toast.error('กรุณาแนบเฉพาะไฟล์ประเภท .jpg หรือ .png เท่านั้นครับ')
      event.target.value = ''
      return
    }

    try {
      setUploadingImage(true)
      const url = await tourService.uploadImage(file)
      setImages((prev) => [...prev, url])
    } catch (uploadError) {
      console.error(uploadError)
      toast.error('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const addSchedule = () => {
    setSchedules([...schedules, { startDate: '', endDate: '', timeSlot: '', roundName: '', maxCapacity: 50, enabled: true }])
  }

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, itemIndex) => itemIndex !== index))
  }

  const updateSchedule = (index: number, field: keyof ScheduleRow, value: string | number | boolean) => {
    setSchedules(schedules.map((schedule, itemIndex) => {
      if (itemIndex !== index) return schedule
      const updated = { ...schedule, [field]: value }

      if (field === 'startDate') {
        if (tourType === 'one_day') {
          updated.endDate = value as string
        } else if (tourType === 'package') {
          const startDate = new Date(value as string)
          if (!Number.isNaN(startDate.getTime()) && bulkDuration > 1) {
            startDate.setDate(startDate.getDate() + (bulkDuration - 1))
            updated.endDate = startDate.toISOString().slice(0, 10)
          }
        }
      }
      return updated
    }))
  }

  const handleBulkAdd = () => {
    if (!bulkFrom || !bulkTo || bulkFrom > bulkTo) return
    const result: ScheduleRow[] = []
    const current = new Date(bulkFrom)
    const end = new Date(bulkTo)

    let rounds = [{ roundName: '', timeSlot: '' }]
    if (tourType === 'one_day') {
      const validRounds = roundTemplates.filter((round) => round.timeSlot || round.roundName)
      if (validRounds.length > 0) rounds = validRounds
    } else {
      rounds = [{ roundName: 'Private Group', timeSlot: '' }]
    }

    while (current <= end) {
      if (bulkDays.has(current.getDay())) {
        const year = current.getFullYear()
        const month = String(current.getMonth() + 1).padStart(2, '0')
        const day = String(current.getDate()).padStart(2, '0')
        const startDateStr = `${year}-${month}-${day}`

        const endDateObj = new Date(current)
        if (tourType === 'package' && bulkDuration > 1) {
          endDateObj.setDate(endDateObj.getDate() + (bulkDuration - 1))
        }

        const endYear = endDateObj.getFullYear()
        const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0')
        const endDay = String(endDateObj.getDate()).padStart(2, '0')
        const endDateStr = `${endYear}-${endMonth}-${endDay}`

        for (const round of rounds) {
          const alreadyExists = schedules.some((schedule) => schedule.startDate === startDateStr && schedule.timeSlot === round.timeSlot)
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
      current.setDate(current.getDate() + 1)
    }

    setSchedules((prev) => [...prev, ...result])
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    const numPrice = Number(price)
    const numDiscount = Number(discountPercent)
    let finalPrice = numPrice
    let finalOriginalPrice: number | null = null
    let finalChildPrice: number | null = childPrice ? Number(childPrice) : null

    if (numDiscount > 0 && numPrice > 0) {
      finalOriginalPrice = numPrice
      finalPrice = Math.round(numPrice * (1 - numDiscount / 100))
      if (finalChildPrice) {
        finalChildPrice = Math.round(finalChildPrice * (1 - numDiscount / 100))
      }
    }

    const payload: CreateTourPayload = {
      name,
      description,
      tourType,
      categories,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      childPrice: finalChildPrice,
      minPeople: minPeople ? Number(minPeople) : undefined,
      maxPeople: maxPeople ? Number(maxPeople) : undefined,
      highlights,
      images,
      transportation,
      duration,
      region,
      province,
      accommodation: tourType === 'package' ? accommodation : null,
      itinerary,
      schedules: schedules
        .filter((schedule) => schedule.enabled && schedule.startDate && schedule.endDate)
        .map((schedule) => ({
          id: schedule.id,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          timeSlot: schedule.timeSlot || null,
          roundName: schedule.roundName || null,
          maxCapacity: Number(schedule.maxCapacity),
          currentBooked: schedule.currentBooked,
        })),
    }

    try {
      if (isEditing) {
        await tourService.update(Number(id), payload)
      } else {
        await tourService.create(payload)
      }
      navigate('/admin/tours')
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'บันทึกไม่สำเร็จ กรุณาลองใหม่'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="flex flex-1 items-center justify-center text-gray-400">กำลังโหลด...</p>
  }

  const inputClass = 'ui-focus-ring w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:bg-white'
  const labelClass = 'mb-2 block text-sm font-semibold text-gray-800'

  return (
    <>
      <main className="flex-1">
        <form onSubmit={handleSubmit} className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'แก้ไขทัวร์' : 'เพิ่มทัวร์ใหม่'}</h1>
              <p className="mt-2 text-sm text-gray-500">กรอกข้อมูลทัวร์ รูปภาพ รอบเดินทาง และรายละเอียดสำคัญให้พร้อมก่อนเผยแพร่</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-gray-200 bg-white px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input type="radio" name="tourType" checked={tourType === 'one_day'} onChange={() => setTourType('one_day')} className="accent-yellow-500" />
                วันเดย์ทริป
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input type="radio" name="tourType" checked={tourType === 'package'} onChange={() => setTourType('package')} className="accent-yellow-500" />
                เที่ยวพร้อมที่พัก
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="ui-surface rounded-[1.75rem] border border-yellow-200 bg-white p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr]">
                <div>
                  <label className={labelClass}>รหัสทัวร์</label>
                  <input type="text" value={isEditing ? tourCode : 'สร้างอัตโนมัติ'} disabled className="w-full cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-400" />
                </div>
                <div>
                  <label className={labelClass}>ชื่อทัวร์*</label>
                  <input type="text" value={name} onChange={(event) => setName(event.target.value)} required className={inputClass} />
                </div>
              </div>

              <div className="mt-5">
                <span className={labelClass}>แท็กประเภทของทัวร์</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleChip(categories, setCategories, category)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${categories.includes(category) ? 'border-yellow-400 bg-yellow-400 text-gray-900' : 'border-gray-300 bg-white text-gray-600 hover:border-yellow-300'}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className={labelClass}>รายละเอียดทัวร์*</label>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} className={`${inputClass} resize-none`} />
              </div>

              <div className="mt-5">
                <span className={labelClass}>เกี่ยวกับทัวร์นี้</span>
                <div className="flex flex-wrap gap-2">
                  {HIGHLIGHTS.map((highlight) => (
                    <button
                      key={highlight}
                      type="button"
                      onClick={() => toggleChip(highlights, setHighlights, highlight)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${highlights.includes(highlight) ? 'border-yellow-400 bg-yellow-400 text-gray-900' : 'border-gray-300 bg-white text-gray-600 hover:border-yellow-300'}`}
                    >
                      {highlight}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>ภาค*</label>
                  <select value={region} onChange={(event) => setRegion(event.target.value)} required className={inputClass}>
                    <option value="">เลือกภาค</option>
                    {REGIONS.map((regionOption) => <option key={regionOption} value={regionOption}>{regionOption}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>จังหวัด*</label>
                  <input type="text" value={province} onChange={(event) => setProvince(event.target.value)} required className={inputClass} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>ระยะเวลา*</label>
                  <input type="text" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder={tourType === 'one_day' ? 'เช่น 8 ชั่วโมง' : 'เช่น 3 วัน 2 คืน'} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ราคาผู้ใหญ่*</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} required min={0} className={inputClass} />
                    <span className="text-sm text-gray-600">บาท</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>ส่วนลด (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        if (value >= 0 && value <= 100) setDiscountPercent(event.target.value)
                      }}
                      min={0}
                      max={100}
                      placeholder="ไม่บังคับ"
                      className={inputClass}
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>ราคาเด็ก</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={childPrice} onChange={(event) => setChildPrice(event.target.value)} min={0} placeholder="ไม่บังคับ" className={inputClass} />
                    <span className="text-sm text-gray-600">บาท</span>
                  </div>
                </div>
              </div>

              {tourType === 'package' && (
                <div className="mt-5 rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4">
                  <span className="mb-2 block text-sm font-bold text-blue-800">ตั้งค่า Private Tour</span>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-blue-700">จำนวนคนขั้นต่ำ (Min)*</label>
                      <input type="number" min="1" value={minPeople} onChange={(event) => setMinPeople(event.target.value)} required className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="เช่น 4 คน" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-blue-700">รับได้สูงสุด (Max)</label>
                      <input type="number" min="1" value={maxPeople} onChange={(event) => setMaxPeople(event.target.value)} className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="เช่น 10 คน" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-blue-500">เมื่อระบุจำนวนคนขั้นต่ำ ระบบจะเปลี่ยนเป็นโหมดเหมากลุ่ม (Private) อัตโนมัติ</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <ImageUploadSection images={images} uploadingImage={uploadingImage} onImageUpload={handleImageUpload} onRemoveImage={removeImage} />

              <div className="ui-surface rounded-[1.75rem] border border-yellow-200 bg-white p-6">
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

          <div className="ui-surface mt-6 rounded-[1.75rem] border border-gray-200 bg-white p-6">
            <ItinerarySection itinerary={itinerary} tourType={tourType} setItinerary={setItinerary} />
            <hr className="my-6 border-gray-100" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>คำแนะนำการเดินทาง</label>
                <textarea value={transportation} onChange={(event) => setTransportation(event.target.value)} rows={3} className={`${inputClass} resize-none`} />
              </div>
              {tourType === 'package' && (
                <div>
                  <label className={labelClass}>รายละเอียดที่พัก*</label>
                  <textarea value={accommodation} onChange={(event) => setAccommodation(event.target.value)} required rows={3} placeholder="เช่น โรงแรม 3 ดาว ย่านนิมมาน" className={`${inputClass} resize-none`} />
                </div>
              )}
            </div>
          </div>

          {error && <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setCancelModalOpen(true)} className="ui-focus-ring ui-pressable rounded-2xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50">
              ยกเลิก
            </button>
            <button type="submit" disabled={saving} className="ui-focus-ring ui-pressable rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </main>

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
