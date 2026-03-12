import { useEffect, useState } from 'react'
import { adminService, type TourOverview } from '../../services/adminService'
import { toast } from 'react-hot-toast'

export default function AdminTourOverview() {
    const [tours, setTours] = useState<TourOverview[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'available' | 'full'>('all')

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const data = await adminService.getTourOverview()
                setTours(data)
            } catch {
                toast.error('ไม่สามารถโหลดข้อมูลทัวร์ได้')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filtered = tours.filter((t) => {
        const matchSearch =
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.tourCode.toLowerCase().includes(search.toLowerCase()) ||
            t.province.toLowerCase().includes(search.toLowerCase())

        if (!matchSearch) return false
        if (filter === 'full') return t.schedules.some((s) => s.availableSeats <= 0)
        if (filter === 'available') return t.schedules.some((s) => s.availableSeats > 0)
        return true
    })

    const getOccupancyColor = (percent: number) => {
        if (percent >= 100) return { bar: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-700' }
        if (percent >= 70) return { bar: 'bg-yellow-400', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' }
        return { bar: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-100 text-green-700' }
    }

    const formatDate = (d: string) => {
        if (!d) return '-'
        return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
    }

    const totalBooked = tours.reduce((sum, t) => sum + t.schedules.reduce((s, sc) => s + sc.currentBooked, 0), 0)
    const totalCapacity = tours.reduce((sum, t) => sum + t.schedules.reduce((s, sc) => s + sc.maxCapacity, 0), 0)
    const fullSchedules = tours.reduce((sum, t) => sum + t.schedules.filter((sc) => sc.availableSeats <= 0).length, 0)

    return (
        <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">ภาพรวมการจองทัวร์</h1>
                    <p className="text-gray-500 text-sm mt-1">ดูจำนวนที่นั่งที่จองแล้วในแต่ละรอบทัวร์</p>
                </div>
                <button
                    onClick={async () => {
                        setLoading(true)
                        try {
                            const data = await adminService.getTourOverview()
                            setTours(data)
                            toast.success('รีเฟรชข้อมูลแล้ว')
                        } catch {
                            toast.error('เกิดข้อผิดพลาด')
                        } finally {
                            setLoading(false)
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                    🔄 รีเฟรช
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">ที่นั่งที่จองแล้วทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-800">{totalBooked.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">จากทั้งหมด {totalCapacity.toLocaleString()} ที่นั่ง</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">จำนวนทัวร์ทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-800">{tours.length}</p>
                    <p className="text-xs text-gray-400 mt-1">ทัวร์ที่ Active ทั้งหมด</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">รอบที่เต็มแล้ว</p>
                    <p className="text-3xl font-bold text-red-500">{fullSchedules}</p>
                    <p className="text-xs text-gray-400 mt-1">รอบที่ไม่มีที่นั่งว่างเหลือ</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5">
                <input
                    placeholder="ค้นหาชื่อทัวร์, รหัส, จังหวัด..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
                {(['all', 'available', 'full'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            filter === f
                                ? 'bg-yellow-400 text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {f === 'all' ? 'ทั้งหมด' : f === 'available' ? '🟢 มีที่ว่าง' : '🔴 เต็มแล้ว'}
                    </button>
                ))}
            </div>

            {/* Tour Cards */}
            {loading ? (
                <div className="flex justify-center py-20 text-gray-400">กำลังโหลด...</div>
            ) : filtered.length === 0 ? (
                <div className="flex justify-center py-20 text-gray-400">ไม่พบทัวร์ที่ตรงกับการค้นหา</div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((tour) => (
                        <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Tour Header */}
                            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
                                {tour.images[0] ? (
                                    <img
                                        src={tour.images[0]}
                                        alt={tour.name}
                                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-yellow-50 flex items-center justify-center text-2xl flex-shrink-0">🗺️</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="font-semibold text-gray-800 truncate">{tour.name}</h2>
                                        {!tour.isActive && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">ปิดใช้งาน</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {tour.tourCode} • {tour.province} • {tour.totalSchedules} รอบ
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-lg font-bold text-gray-800">
                                        {tour.schedules.reduce((s, sc) => s + sc.currentBooked, 0)}
                                        <span className="text-sm font-normal text-gray-400">
                                            /{tour.schedules.reduce((s, sc) => s + sc.maxCapacity, 0)} ที่
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-400">รวมทุกรอบ</p>
                                </div>
                            </div>

                            {/* Schedules */}
                            {tour.schedules.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-4">ไม่มีรอบในระบบ</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {tour.schedules.map((sc) => {
                                        const colors = getOccupancyColor(sc.occupancyPercent)
                                        return (
                                            <div key={sc.id} className="px-6 py-3 flex items-center gap-4">
                                                <div className="w-44 flex-shrink-0">
                                                    <p className="text-sm font-medium text-gray-700">{sc.roundName || `รอบ ${sc.id}`}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {formatDate(sc.startDate)}
                                                        {sc.startDate !== sc.endDate ? ` – ${formatDate(sc.endDate)}` : ''}
                                                        {sc.timeSlot ? ` • ${sc.timeSlot}` : ''}
                                                    </p>
                                                </div>

                                                {/* Occupancy Bar */}
                                                <div className="flex-1">
                                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                                                            style={{ width: `${sc.occupancyPercent}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="w-28 text-right flex-shrink-0">
                                                    <span className={`text-sm font-semibold ${colors.text}`}>
                                                        {sc.currentBooked}/{sc.maxCapacity}
                                                    </span>
                                                    <span className="text-xs text-gray-400"> ที่</span>
                                                </div>

                                                <div className="w-24 flex-shrink-0 flex justify-end">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors.badge}`}>
                                                        {sc.availableSeats <= 0
                                                            ? 'เต็มแล้ว'
                                                            : `ว่าง ${sc.availableSeats} ที่`}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}
