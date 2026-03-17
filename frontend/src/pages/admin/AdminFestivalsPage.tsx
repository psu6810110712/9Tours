import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import ConfirmModal from '../../components/common/ConfirmModal'
import { festivalService } from '../../services/festivalService'
import type { Festival } from '../../types/tour'

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(' ')
    if (typeof message === 'string' && message.trim()) return message
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Date(value + 'T00:00:00').toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface FestivalFormState {
  name: string
  startDate: string
  endDate: string
}

const emptyForm: FestivalFormState = { name: '', startDate: '', endDate: '' }

export default function AdminFestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FestivalFormState>(emptyForm)

  const [deleteTarget, setDeleteTarget] = useState<Festival | null>(null)

  const loadFestivals = () => {
    setLoading(true)
    festivalService
      .getAll()
      .then(setFestivals)
      .catch(() => toast.error('ไม่สามารถโหลดรายการเทศกาลได้'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFestivals()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (festival: Festival) => {
    setEditingId(festival.id)
    setForm({ name: festival.name, startDate: festival.startDate, endDate: festival.endDate })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อเทศกาล')
      return
    }
    if (!form.startDate || !form.endDate) {
      toast.error('กรุณาระบุวันเริ่มต้นและวันสิ้นสุด')
      return
    }
    if (form.endDate < form.startDate) {
      toast.error('วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await festivalService.update(editingId, form)
        toast.success('แก้ไขเทศกาลสำเร็จ')
      } else {
        await festivalService.create(form)
        toast.success('เพิ่มเทศกาลสำเร็จ')
      }
      closeModal()
      loadFestivals()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'บันทึกไม่สำเร็จ'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await festivalService.remove(deleteTarget.id)
      toast.success('ลบเทศกาลสำเร็จ')
      setDeleteTarget(null)
      loadFestivals()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'ลบไม่สำเร็จ'))
    }
  }

  const inputClass =
    'ui-focus-ring w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-base font-medium text-gray-900 outline-none focus:border-yellow-400 focus:bg-white'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">จัดการเทศกาล</h1>
          <p className="mt-1 text-sm text-gray-500">เพิ่ม แก้ไข หรือลบเทศกาล / แคมเปญ ที่ใช้กรองทัวร์</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="ui-focus-ring ui-pressable rounded-2xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-dark)]"
        >
          + เพิ่มเทศกาลใหม่
        </button>
      </div>

      {loading && <p className="text-center text-gray-400">กำลังโหลด...</p>}

      {!loading && festivals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-gray-500">ยังไม่มีเทศกาล</p>
          <p className="mt-1 text-sm text-gray-400">กดปุ่ม "เพิ่มเทศกาลใหม่" เพื่อเริ่มต้น</p>
        </div>
      )}

      {!loading && festivals.length > 0 && (
        <div className="space-y-3">
          {festivals.map((festival) => (
            <div
              key={festival.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-gray-900">{festival.name}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {formatDate(festival.startDate)} – {formatDate(festival.endDate)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(festival)}
                  className="ui-focus-ring ui-pressable rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(festival)}
                  className="ui-focus-ring ui-pressable rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} width="max-w-md">
        <h3 className="mb-5 text-xl font-bold text-gray-900">
          {editingId ? 'แก้ไขเทศกาล' : 'เพิ่มเทศกาลใหม่'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">ชื่อเทศกาล</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="เช่น สงกรานต์ 2569"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">วันเริ่มต้น</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">วันสิ้นสุด</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          {form.startDate && form.endDate && form.endDate < form.startDate && (
            <p className="text-sm font-semibold text-red-600">วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น</p>
          )}
        </div>
        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="ui-focus-ring ui-pressable flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ui-focus-ring ui-pressable flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเทศกาล'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="ลบเทศกาล"
        message={`ต้องการลบ "${deleteTarget?.name || ''}" หรือไม่? หากมีทัวร์ที่ผูกกับเทศกาลนี้อยู่ จะไม่สามารถลบได้`}
        confirmText="ลบเทศกาล"
        confirmStyle="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
