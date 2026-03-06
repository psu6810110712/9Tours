import { useEffect, useState } from 'react'
import { adminService } from '../../services/adminService'
import { toast } from 'react-hot-toast'
import type { Booking } from '../../types/booking'
import Modal from '../../components/common/Modal'

const FILTER_TABS = [
    { label: 'ทั้งหมด', value: 'all' },
    { label: 'รอตรวจสอบสลิป', value: 'awaiting_approval' },
    { label: 'พนักงานยืนยันแล้ว', value: 'confirmed' },
    { label: 'ยกเลิกแล้ว', value: 'canceled' },
] as const

type FilterValue = (typeof FILTER_TABS)[number]['value']

export default function AdminBookings() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterValue>('awaiting_approval')
    const [search, setSearch] = useState('')

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const fetchBookings = async () => {
        try {
            setLoading(true)
            const data = await adminService.getAllBookings()
            setBookings(data)
        } catch (error) {
            console.error(error)
            toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings()
    }, [])

    const handleOpenModal = (booking: Booking) => {
        setSelectedBooking(booking)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setSelectedBooking(null)
        setIsModalOpen(false)
    }

    const handleUpdateStatus = async (status: string) => {
        if (!selectedBooking) return
        try {
            setIsProcessing(true)
            await adminService.updateBookingStatus(selectedBooking.id, status)
            toast.success('อัปเดตสถานะสำเร็จ')
            // Update local state without refetching all
            setBookings((prev) =>
                prev.map((b) => (b.id === selectedBooking.id ? { ...b, status } : b))
            )
            handleCloseModal()
        } catch (error) {
            console.error(error)
            toast.error('ไม่สามารถอัปเดตสถานะได้')
        } finally {
            setIsProcessing(false)
        }
    }

    const filtered = bookings.filter((b) => {
        if (filter === 'awaiting_approval' && b.status !== 'awaiting_approval') return false
        if (filter === 'confirmed' && !['confirmed', 'success'].includes(b.status)) return false
        if (filter === 'canceled' && b.status !== 'canceled') return false

        if (search.trim()) {
            const term = search.trim().toLowerCase()
            // ค้นหาจากชื่อผู้ใช้ หรือ รหัสทัวร์
            const userName = b.user?.name?.toLowerCase() || ''
            const tourCode = b.schedule?.tour?.tourCode?.toLowerCase() || ''
            return userName.includes(term) || tourCode.includes(term) || b.id.toString() === term
        }
        return true
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_payment':
                return <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold">รอชำระเงิน</span>
            case 'awaiting_approval':
                return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">รอตรวจสอบ</span>
            case 'confirmed':
            case 'success':
                return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">ยืนยันแล้ว</span>
            case 'canceled':
                return <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">ยกเลิกแล้ว</span>
            default:
                return <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{status}</span>
        }
    }

    return (
        <>
            <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน</h1>
                </div>

                {/* แถว filter tabs + ค้นหา */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${filter === tab.value
                                ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                                : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}

                    {/* ช่องค้นหา */}
                    <div className="relative ml-auto">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหารหัสจอง, ชื่อลูกค้า, ทัวร์..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:border-yellow-400 w-64"
                        />
                    </div>
                </div>

                {/* ตาราง */}
                {loading ? (
                    <p className="text-center text-gray-400 py-16">กำลังโหลดข้อมูลการจอง...</p>
                ) : filtered.length === 0 ? (
                    <p className="text-center text-gray-400 py-16">ไม่มีรายการ</p>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-yellow-50 text-gray-700 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-5 py-3 font-semibold">รหัสจอง</th>
                                    <th className="text-left px-5 py-3 font-semibold">วันที่จอง</th>
                                    <th className="text-left px-5 py-3 font-semibold">ลูกค้า</th>
                                    <th className="text-left px-5 py-3 font-semibold">ทัวร์</th>
                                    <th className="text-left px-5 py-3 font-semibold">ยอดชำระ</th>
                                    <th className="text-left px-5 py-3 font-semibold">สถานะ</th>
                                    <th className="px-5 py-3 font-semibold text-right">ดำเนินการ</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtered.map((booking) => {
                                    const hasSlip = booking.payments && booking.payments.length > 0 && booking.payments[0].slipUrl
                                    return (
                                        <tr
                                            key={booking.id}
                                            className="border-t border-gray-100 hover:bg-yellow-50/60 transition-colors"
                                        >
                                            <td className="px-5 py-4 text-gray-800 font-medium">#{booking.id}</td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">
                                                {new Date(booking.createdAt).toLocaleString('th-TH')}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {booking.user?.name || `User ${booking.userId}`}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {booking.schedule?.tour?.tourCode || '-'} <br />
                                                <span className="text-xs text-gray-400">{booking.paxCount} ท่าน</span>
                                            </td>
                                            <td className="px-5 py-4 font-medium text-gray-900">
                                                ฿{Number(booking.totalPrice).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                {getStatusBadge(booking.status)}
                                            </td>
                                            <td className="px-5 py-4 flex justify-end">
                                                {hasSlip ? (
                                                    <button
                                                        onClick={() => handleOpenModal(booking)}
                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                    >
                                                        ดูสลิปโอนเงิน
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">ยังไม่มีสลิป</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* 🛑 Check Slip Modal 🛑 */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} width="max-w-lg">
                <div className="flex flex-col max-h-[90vh]">
                    <div className="pb-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน (จอง #{selectedBooking?.id})</h2>
                        <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                    </div>

                    <div className="py-6 overflow-y-auto">
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-between text-sm">
                            <div>
                                <p className="text-gray-500">ยอดที่ต้องชำระ:</p>
                                <p className="text-lg font-bold text-gray-900">฿{Number(selectedBooking?.totalPrice).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500">วันเวลาที่อัปโหลดสลิป:</p>
                                <p className="font-medium text-gray-800">
                                    {selectedBooking?.payments && selectedBooking.payments[0]
                                        ? new Date(selectedBooking.payments[0].uploadedAt).toLocaleString('th-TH')
                                        : '-'}
                                </p>
                            </div>
                        </div>

                        {selectedBooking?.payments && selectedBooking.payments.length > 0 && selectedBooking.payments[0].slipUrl ? (
                            <div className="border rounded-xl  overflow-hidden bg-gray-100 flex justify-center items-center p-2">
                                <img
                                    src={`http://localhost:3000/${selectedBooking.payments[0].slipUrl}`}
                                    alt="Payment Slip"
                                    className="max-h-[500px] object-contain rounded-lg"
                                />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">ไม่พบรูปภาพสลิป</p>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 -mx-8 -mb-8 px-8 py-4 rounded-b-[2rem]">
                        <button
                            onClick={handleCloseModal}
                            disabled={isProcessing}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                        >
                            ปิด
                        </button>

                        {selectedBooking?.status === 'awaiting_approval' && (
                            <>
                                <button
                                    onClick={() => handleUpdateStatus('canceled')}
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 text-sm font-semibold bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    ไม่อนุมัติ/ยกเลิก
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus('confirmed')}
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 text-sm font-semibold bg-green-500 text-white hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    อนุมัติรายการ
                                </button>
                            </>
                        )}

                        {selectedBooking && ['confirmed', 'success', 'canceled'].includes(selectedBooking.status) && (
                            <button
                                onClick={() => handleUpdateStatus('awaiting_approval')}
                                disabled={isProcessing}
                                className="px-5 py-2.5 text-sm font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-xl transition-colors disabled:opacity-50"
                            >
                                เปลี่ยนสถานะกลับเป็น รอตรวจสอบ
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

        </>
    )
}
