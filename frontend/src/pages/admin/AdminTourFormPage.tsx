import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { tourService } from '../../services/tourService'
import type { TourType } from '../../types/tour'

const REGIONS = ['ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันออกเฉียงเหนือ']
const PROVINCES = ['เชียงใหม่', 'กรุงเทพฯ', 'ภูเก็ต', 'ชลบุรี', 'สุราษฎร์ธานี', 'กระบี่', 'กาญจนบุรี']

const ALL_CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']
const ALL_HIGHLIGHTS = ['ยกเลิกฟรี', 'มีรถรับส่ง', 'อาหารกลางวัน', 'เที่ยวเต็มวัน', 'มีไกด์นำเที่ยว']

export default function AdminTourFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEditMode)

  const [tourType, setTourType] = useState<TourType>('package')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    province: '',
    price: '',
  })

  const [categories, setCategories] = useState<string[]>(['สายธรรมชาติ'])
  const [highlights, setHighlights] = useState<string[]>(['ยกเลิกฟรี'])

  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (isEditMode && id) {
      tourService.getOne(Number(id))
        .then((tour) => {
          setTourType(tour.tourType)
          setFormData({
            name: tour.name,
            description: tour.description,
            region: tour.region,
            province: tour.province,
            price: String(tour.price),
          })
          setCategories(tour.categories)
          setHighlights(tour.highlights)
          setImages(tour.images || [])
        })
        .catch((err) => {
          console.error(err)
          alert('ไม่พบข้อมูลทัวร์นี้')
          navigate('/admin/tours')
        })
        .finally(() => setFetching(false))
    }
  }, [id, isEditMode, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleTag = (tag: string, currentList: string[], setList: (val: string[]) => void) => {
    if (currentList.includes(tag)) {
      setList(currentList.filter(t => t !== tag))
    } else {
      setList([...currentList, tag])
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    try {
      setUploadingImage(true)
      const url = await tourService.uploadImage(file)
      setImages((prev) => [...prev, url])
    } catch (error) {
      console.error(error)
      alert('อัปโหลดรูปภาพไม่สำเร็จ')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        tourType,
        price: Number(formData.price),
        region: formData.region,
        province: formData.province,
        categories,
        highlights,
        duration: tourType === 'one_day' ? '1 วัน' : '3 วัน 2 คืน',
        isActive: true,
        images: images, // ใช้ State รูปภาพของจริง
      }

      if (isEditMode) {
        await tourService.update(Number(id), payload)
        alert('อัปเดตข้อมูลทัวร์สำเร็จ!')
      } else {
        await tourService.create(payload)
        alert('บันทึกทัวร์สำเร็จ!')
      }

      navigate('/admin/tours')
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">

          <div className="flex flex-wrap items-center gap-6 mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? `แก้ไขทัวร์: รหัส ${id}` : 'เพิ่มทัวร์ใหม่'}
            </h1>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" value="package"
                  checked={tourType === 'package'} onChange={(e) => setTourType(e.target.value as TourType)}
                  className="accent-[#F5A623] w-4 h-4"
                />
                <span className="text-sm text-gray-700 font-medium">เที่ยวพร้อมที่พัก</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" value="one_day"
                  checked={tourType === 'one_day'} onChange={(e) => setTourType(e.target.value as TourType)}
                  className="accent-[#F5A623] w-4 h-4"
                />
                <span className="text-sm text-gray-700 font-medium">วันเดย์ทริป</span>
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* --- คอลัมน์ซ้าย --- */}
            <div className="space-y-6">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">รหัสทัวร์</label>
                  <input type="text" placeholder={isEditMode ? id : "ระบบสร้างอัตโนมัติ"} disabled className="w-full bg-gray-100 text-gray-400 border border-gray-200 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">ชื่อทัวร์ <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-bold text-gray-800">แท็กประเภทของทัวร์</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map((tag) => {
                    const isActive = categories.includes(tag)
                    return (
                      <button
                        key={tag} type="button"
                        onClick={() => toggleTag(tag, categories, setCategories)}
                        className={`text-xs px-4 py-1.5 rounded-full transition-colors ${isActive ? 'bg-[#F5A623] text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">รายละเอียดทัวร์ <span className="text-red-500">*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623] resize-none"></textarea>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-bold text-gray-800">เกี่ยวกับทัวร์นี้ (Highlights)</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_HIGHLIGHTS.map((tag) => {
                    const isActive = highlights.includes(tag)
                    return (
                      <button
                        key={tag} type="button"
                        onClick={() => toggleTag(tag, highlights, setHighlights)}
                        className={`text-xs px-4 py-1.5 rounded-full transition-colors ${isActive ? 'bg-[#F5A623] text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">ภาค <span className="text-red-500">*</span></label>
                  <select name="region" value={formData.region} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623]">
                    <option value="">เลือกภาค</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">จังหวัด <span className="text-red-500">*</span></label>
                  <select name="province" value={formData.province} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623]">
                    <option value="">เลือกจังหวัด</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-2">ราคา <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-2.5 text-sm outline-none focus:border-[#F5A623]" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">บาท</span>
                  </div>
                </div>
              </div>

            </div>

            {/* --- คอลัมน์ขวา --- */}
            <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 flex flex-col">

              {/* ระบบอัปโหลดรูปภาพ */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-3">รูปภาพทัวร์</label>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {images.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden h-24 border border-gray-200">
                        <img src={url} alt={`Tour ${i}`} className="w-full h-full object-cover" />
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

                <label className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/80 h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  <span className="text-2xl mb-1 text-gray-400">📷</span>
                  <span className="text-sm text-gray-500 font-medium">
                    {uploadingImage ? 'กำลังอัปโหลด...' : 'คลิกเพื่ออัปโหลดรูปภาพ'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* ปุ่มบันทึก */}
              <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/admin/tours')}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-full text-sm font-bold text-white bg-[#F5A623] hover:bg-[#E09415] shadow-md transition-colors disabled:opacity-50"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
