import { useEffect, useState } from 'react'
import { adminService } from '../../services/adminService'
import { toast } from 'react-hot-toast'
import type { Booking } from '../../types/booking'

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
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

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

    // Sorting Logic
    const sortedBookings = [...filtered].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue: any = a[key as keyof Booking];
        let bValue: any = b[key as keyof Booking];

        if (key === 'user.name') {
            aValue = a.user?.name || '';
            bValue = b.user?.name || '';
        } else if (key === 'tourCode') {
            aValue = a.schedule?.tour?.tourCode || '';
            bValue = b.schedule?.tour?.tourCode || '';
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'asc' ? '⬆️' : '⬇️';
    };

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
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="overflow-x-auto overflow-y-scroll relative">
                            <table className="w-full table-fixed text-sm text-left min-w-[1040px]">
                                <thead className="bg-yellow-50 text-gray-700 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="w-28 px-5 py-3 font-semibold cursor-pointer hover:bg-yellow-100 transition-colors whitespace-nowrap" onClick={() => handleSort('id')}>รหัสจอง {getSortIcon('id')}</th>
                                        <th className="w-36 px-5 py-3 font-semibold cursor-pointer hover:bg-yellow-100 transition-colors whitespace-nowrap" onClick={() => handleSort('createdAt')}>วันที่จอง {getSortIcon('createdAt')}</th>
                                        <th className="w-48 px-5 py-3 font-semibold cursor-pointer hover:bg-yellow-100 transition-colors whitespace-nowrap" onClick={() => handleSort('user.name')}>ลูกค้า {getSortIcon('user.name')}</th>
                                        <th className="w-48 px-5 py-3 font-semibold cursor-pointer hover:bg-yellow-100 transition-colors whitespace-nowrap" onClick={() => handleSort('tourCode')}>ทัวร์ {getSortIcon('tourCode')}</th>
                                        <th className="w-32 px-5 py-3 font-semibold cursor-pointer hover:bg-yellow-100 transition-colors whitespace-nowrap" onClick={() => handleSort('totalPrice')}>ยอดชำระ {getSortIcon('totalPrice')}</th>
                                        <th className="w-32 px-5 py-3 font-semibold whitespace-nowrap">สถานะ</th>
                                        <th className="w-36 px-5 py-3 font-semibold text-right whitespace-nowrap">ดำเนินการ</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {sortedBookings.map((booking) => {
                                        const hasSlip = booking.payments && booking.payments.length > 0 && booking.payments[0].slipUrl
                                        return (
                                            <tr
                                                key={booking.id}
                                                className="border-t border-gray-100 hover:bg-yellow-50/60 transition-colors"
                                            >
                                                <td className="w-28 px-5 py-4 text-gray-800 font-medium whitespace-nowrap">#{booking.id}</td>
                                                <td className="w-36 px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                                                    {new Date(booking.createdAt).toLocaleString('th-TH')}
                                                </td>
                                                <td className="w-48 px-5 py-4 text-gray-600 truncate max-w-[12rem]">
                                                    {booking.user?.name || `User ${booking.userId}`}
                                                </td>
                                                <td className="w-48 px-5 py-4 text-gray-600 truncate max-w-[12rem]">
                                                    {booking.schedule?.tour?.tourCode || '-'} <br />
                                                    <span className="text-xs text-gray-400">{booking.paxCount} ท่าน</span>
                                                </td>
                                                <td className="w-32 px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                    ฿{Number(booking.totalPrice).toLocaleString()}
                                                </td>
                                                <td className="w-32 px-5 py-4 whitespace-nowrap">
                                                    {getStatusBadge(booking.status)}
                                                </td>
                                                <td className="w-36 px-5 py-4 flex justify-end whitespace-nowrap">
                                                    {hasSlip ? (
                                                        <button
                                                            onClick={() => handleOpenModal(booking)}
                                                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 px-4 py-2 rounded-lg text-sm font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm"
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
                    </div>
                )}
            </main>

            {/* 🛑 Check Slip Modal 🛑 */}
            {
                isModalOpen && selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน (จอง #{selectedBooking.id})</h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-between text-sm">
                                    <div>
                                        <p className="text-gray-500">ยอดที่ต้องชำระ:</p>
                                        <p className="text-lg font-bold text-gray-900">฿{Number(selectedBooking.totalPrice).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500">วันเวลาที่อัปโหลดสลิป:</p>
                                        <p className="font-medium text-gray-800">
                                            {selectedBooking.payments && selectedBooking.payments[0]
                                                ? new Date(selectedBooking.payments[0].uploadedAt.endsWith('Z') ? selectedBooking.payments[0].uploadedAt : selectedBooking.payments[0].uploadedAt + 'Z').toLocaleString('th-TH')
                                                : '-'}
                                        </p>
                                    </div>
                                </div>

                                {selectedBooking.payments && selectedBooking.payments.length > 0 && selectedBooking.payments[0].slipUrl ? (
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

                                {selectedBooking.specialRequest && (
                                    <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                        <p className="text-sm font-bold text-orange-800 mb-1">คำขอเพิ่มเติมจากลูกค้า:</p>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedBooking.specialRequest}</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                                <button
                                    onClick={handleCloseModal}
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    ปิด
                                </button>

                                {selectedBooking.status === 'awaiting_approval' && (
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

                                {['confirmed', 'success', 'canceled'].includes(selectedBooking.status) && (
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
                    </div>
                )
            }
        </>
    )
}
