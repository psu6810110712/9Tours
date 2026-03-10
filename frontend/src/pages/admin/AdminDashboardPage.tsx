import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '../../services/dashboardService'
import type { DashboardFilters } from '../../services/dashboardService'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend,
} from 'recharts'
import ThailandMap from '../../components/ThailandMap'

// ======== สี ========
// const COLORS = ['#F5A623', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899']

interface DashboardData {
    summaryCards: {
        totalRevenue: { value: number; percentChange: number }
        totalBookings: { value: number; percentChange: number }
        totalViews: { value: number; percentChange: number }
        totalCustomers: { value: number; percentChange: number }
    }
    recentBookings: {
        id: number
        bookingCode: string
        tourName: string
        customerName: string
        totalPrice: number
        status: string
        createdAt: string
    }[]
    topTours: {
        rank: number
        name: string
        province: string
        reviewCount: number
        popularityPercent: number
        revenue: number
    }[]
    bookingsByStatus: Record<string, number>
    regionStats: { name: string; count: number; percent: number }[]
    provinceStats: { name: string; count: number; percent: number }[]
    viewsOverTime: { month: string; views: number }[]
    bookingsOverTime: { day: number; thisMonth: number; lastMonth: number }[]
    conversionRate: number
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    // Filter states — ใช้ปฏิทิน (วันเริ่มต้น / วันสิ้นสุด)
    const [filterStartDate, setFilterStartDate] = useState(() => {
        const d = new Date(); d.setDate(1)
        return d.toISOString().slice(0, 10) // วันแรกของเดือนนี้
    })
    const [filterEndDate, setFilterEndDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [filterRegion, setFilterRegion] = useState('all')
    const [filterTourType, setFilterTourType] = useState('all')
    const [searchCode, setSearchCode] = useState('')

    const fetchData = useCallback((filters: DashboardFilters = {}) => {
        setLoading(true)
        dashboardService.getData(filters)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        fetchData({ startDate: filterStartDate, endDate: filterEndDate, region: filterRegion, tourType: filterTourType })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleApplyFilters = () => {
        fetchData({ startDate: filterStartDate, endDate: filterEndDate, region: filterRegion, tourType: filterTourType })
    }

    if (loading) {
        return (
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3 mb-5 h-14 w-full animate-pulse"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 space-y-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-28 animate-pulse">
                                    <div className="h-6 w-6 bg-gray-200 rounded-full mb-3"></div>
                                    <div className="h-6 w-20 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm p-5 h-64 animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-white rounded-2xl shadow-sm p-5 h-48 animate-pulse"></div>
                            <div className="bg-white rounded-2xl shadow-sm p-5 h-48 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="lg:col-span-5 space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm p-5 h-72 animate-pulse"></div>
                        <div className="bg-white rounded-2xl shadow-sm p-5 h-72 animate-pulse"></div>
                    </div>
                </div>
            </main>
        )
    }

    if (!data) {
        return (
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                <div className="text-center text-red-500 py-16">ไม่สามารถโหลดข้อมูลได้</div>
            </main>
        )
    }

    const { summaryCards, topTours, bookingsByStatus, regionStats, provinceStats, viewsOverTime, bookingsOverTime, conversionRate } = data

    // Total bookings for current & last month from chart data
    const thisMonthTotal = bookingsOverTime.reduce((s, d) => s + d.thisMonth, 0)
    const lastMonthTotal = bookingsOverTime.reduce((s, d) => s + d.lastMonth, 0)

    return (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
            {/* ========== HEADER ========== */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>

            {/* ========== FILTER BAR ========== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3 mb-5 flex flex-wrap items-center gap-3">
                {/* ช่วงเวลา — ปฏิทิน */}
                <div className="flex items-center gap-1.5 text-sm">
                    <label className="text-gray-500 font-medium whitespace-nowrap">ตั้งแต่ :</label>
                    <input
                        type="date"
                        value={filterStartDate}
                        onChange={e => setFilterStartDate(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
                    />
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                    <label className="text-gray-500 font-medium whitespace-nowrap">ถึง :</label>
                    <input
                        type="date"
                        value={filterEndDate}
                        onChange={e => setFilterEndDate(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
                    />
                </div>

                {/* ภูมิภาค */}
                <div className="flex items-center gap-1.5 text-sm">
                    <label className="text-gray-500 font-medium whitespace-nowrap">ภูมิภาค :</label>
                    <select
                        value={filterRegion}
                        onChange={e => setFilterRegion(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="north">ภาคเหนือ</option>
                        <option value="northeast">ภาคตะวันออกเฉียงเหนือ</option>
                        <option value="central">ภาคกลาง</option>
                        <option value="east">ภาคตะวันออก</option>
                        <option value="west">ภาคตะวันตก</option>
                        <option value="south">ภาคใต้</option>
                    </select>
                </div>

                {/* ประเภททัวร์ */}
                <div className="flex items-center gap-1.5 text-sm">
                    <label className="text-gray-500 font-medium whitespace-nowrap">ประเภททัวร์ :</label>
                    <select
                        value={filterTourType}
                        onChange={e => setFilterTourType(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="one_day">วันเดย์ทริป</option>
                        <option value="package">แพ็คเกจพร้อมที่พัก</option>
                    </select>
                </div>

                {/* ตกลง */}
                <button
                    onClick={handleApplyFilters}
                    disabled={loading}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold px-5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'กำลังโหลด...' : 'ตกลง'}
                </button>

                {/* ค้นหาด้วยรหัสทัวร์ */}
                <div className="ml-auto flex items-center gap-1.5">
                    <input
                        type="text"
                        value={searchCode}
                        onChange={e => setSearchCode(e.target.value)}
                        placeholder="ค้นหาด้วยรหัสทัวร์"
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 w-48 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* ========== NOTIFICATION BARS ========== */}
            {bookingsByStatus['awaiting_approval'] > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 mb-3 flex items-center gap-2 text-sm text-yellow-800">
                    <span>⏳</span> รอยืนยันการทำรายการ : <strong>{bookingsByStatus['awaiting_approval']} รายการ</strong>
                </div>
            )}
            {bookingsByStatus['refund_pending'] > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 mb-5 flex items-center gap-2 text-sm text-orange-800">
                    <span>↩️</span> คำขอการขอเงินคืน : <strong>{bookingsByStatus['refund_pending']} รายการ</strong>
                </div>
            )}

            {/* ========== MAIN GRID ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* ===== LEFT COLUMN (8 cols) ===== */}
                <div className="lg:col-span-8 space-y-5">
                    {/* --- Summary Cards --- */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <SummaryCard icon="🛒" label="ยอดขาย" value={`฿${summaryCards.totalRevenue.value.toLocaleString()}`} percentChange={summaryCards.totalRevenue.percentChange} />
                        <SummaryCard icon="🛍️" label="คำสั่งซื้อ" value={summaryCards.totalBookings.value.toLocaleString()} percentChange={summaryCards.totalBookings.percentChange} />
                        <SummaryCard icon="👁️" label="การดู" value={summaryCards.totalViews.value.toLocaleString()} percentChange={summaryCards.totalViews.percentChange} />
                        <SummaryCard icon="👤" label="ลูกค้าใหม่" value={summaryCards.totalCustomers.value.toLocaleString()} percentChange={summaryCards.totalCustomers.percentChange} />
                    </div>

                    {/* --- Revenue Line Chart --- */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">สถานะคำสั่งซื้อ (Bookings Over Time)</h2>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={bookingsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip cursor={{ stroke: '#F3F4F6', strokeWidth: 2 }} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Line type="monotone" name="เดือนนี้" dataKey="thisMonth" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }} />
                                    <Line type="monotone" name="เดือนที่แล้ว" dataKey="lastMonth" stroke="#9CA3AF" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-8 mt-4 text-center">
                            <div>
                                <p className="text-xs text-gray-400">เดือนที่แล้ว</p>
                                <p className="text-lg font-bold text-gray-800">{lastMonthTotal.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">เดือนนี้</p>
                                <p className="text-lg font-bold text-gray-800">{thisMonthTotal.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* --- Recent Bookings Table --- */}
                    <RecentBookingsTable bookings={data.recentBookings || []} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* --- Views Chart (Bar) --- */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">ยอดวิวทัวร์ (6 เดือนย้อนหลัง)</h2>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={viewsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <Tooltip cursor={{ fill: '#F3F4F6' }} />
                                        <Bar dataKey="views" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* --- Region Progress bar stats --- */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">ความนิยมแยกตามภูมิภาค</h2>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                {regionStats.map((r, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1.5 align-middle">
                                            <span className="font-semibold text-gray-700">{r.name}</span>
                                            <span className="text-gray-500 font-medium">{r.count} วิว <span className="text-amber-500 text-xs ml-1">({r.percent}%)</span></span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full" style={{ width: `${r.percent}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== RIGHT COLUMN (4 cols) ===== */}
                <div className="lg:col-span-4 space-y-5">
                    {/* --- Conversion Rate Highlight --- */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100/50 p-6 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-amber-900 mb-1">อัตราการเปลี่ยนเป็นคำสั่งซื้อ</h2>
                            <p className="text-xs text-amber-700/80">ผู้ชมที่ทำการสั่งซื้อสำเร็จ (Conversion Rate)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-extrabold text-amber-500 drop-shadow-sm">{conversionRate}%</p>
                        </div>
                    </div>

                    {/* --- Map Visualization --- */}
                    <div className="bg-white justify-between rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">ความนิยมแบ่งตามจังหวัด</h2>
                            </div>
                            <div className="h-[340px] w-full mb-4">
                                <ThailandMap regionStats={regionStats} provinceStats={provinceStats || []} />
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
                            {provinceStats.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 text-center text-gray-400 font-medium">{i + 1}</span>
                                        <span className="font-medium text-gray-700">{p.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-900 font-medium block">{p.count} วิว</span>
                                        <span className="text-xs text-amber-500 font-medium">{p.percent}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- Top Tours Table --- */}
                    <TopTours topTours={topTours} />
                </div>
            </div>
        </main>
    )
}

function TopTours({ topTours }: { topTours: NonNullable<DashboardData['topTours']> }) {
    if (!topTours || topTours.length === 0) return null

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-800">แพ็กเกจทัวร์ยอดนิยม</h2>
            </div>
            <div className="space-y-4">
                {topTours.map((t) => (
                    <div key={t.rank} className="flex items-center gap-4 group p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center text-gray-300">
                                <span className="material-symbols-outlined text-2xl">landscape</span>
                            </div>
                            {t.rank <= 3 && (
                                <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm border-2 border-white
                                    ${t.rank === 1 ? 'bg-amber-400' : t.rank === 2 ? 'bg-slate-300' : 'bg-amber-600'}`}>
                                    {t.rank}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-amber-600 transition-colors" title={t.name}>{t.name}</h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">📍 {t.province}</span>
                                <span className="flex items-center gap-1">฿ {t.revenue.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${t.popularityPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function RecentBookingsTable({ bookings }: { bookings: DashboardData['recentBookings'] }) {
    if (!bookings || bookings.length === 0) return null

    const statusMap: Record<string, { label: string; color: string }> = {
        success: { label: 'สำเร็จ', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
        pending_payment: { label: 'รอชำระเงิน', color: 'bg-amber-50 text-amber-600 border-amber-200' },
        awaiting_approval: { label: 'รอตรวจสอบ', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        confirmed: { label: 'ยืนยันแล้ว', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
        canceled: { label: 'ยกเลิก', color: 'bg-rose-50 text-rose-600 border-rose-200' },
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-800">คำสั่งซื้อล่าสุด</h2>
            </div>
            <div className="overflow-x-auto -mx-5 px-5 custom-scrollbar">
                <table className="w-full min-w-[600px] text-left text-sm text-gray-600">
                    <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-medium">
                            <th className="pb-3 px-2 font-medium">คำสั่งซื้อ</th>
                            <th className="pb-3 px-2 font-medium">ลูกค้า</th>
                            <th className="pb-3 px-2 font-medium">รายการ</th>
                            <th className="pb-3 px-2 font-medium text-right">ยอดรวม</th>
                            <th className="pb-3 px-2 font-medium text-center">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {bookings.map((b) => {
                            const statusInfo = statusMap[b.status] || { label: b.status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
                            const date = new Date(b.createdAt)

                            return (
                                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-3 px-2">
                                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer">{b.bookingCode}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{date.toLocaleDateString('th-TH')} {date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="py-3 px-2 font-medium text-gray-700">{b.customerName}</td>
                                    <td className="py-3 px-2 max-w-[200px] truncate text-gray-800" title={b.tourName}>{b.tourName}</td>
                                    <td className="py-3 px-2 text-right font-bold text-gray-900">฿{b.totalPrice.toLocaleString()}</td>
                                    <td className="py-3 px-2 flex justify-center mt-1">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ======== Sub-components ========

function SummaryCard({ icon, label, value, percentChange }: { icon: string; label: string; value: string; percentChange?: number }) {
    const isPositive = percentChange !== undefined && percentChange > 0
    const isNegative = percentChange !== undefined && percentChange < 0

    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex flex-col justify-between">
            <div>
                <div className="text-xl mb-2">{icon}</div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
            {percentChange !== undefined && (
                <div className="flex items-center gap-1 mt-3">
                    <div className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5 
                        ${isPositive ? 'bg-emerald-50 text-emerald-600' :
                            isNegative ? 'bg-rose-50 text-rose-600' :
                                'bg-gray-50 text-gray-500'}`}
                    >
                        {isPositive ? '↗' : isNegative ? '↘' : '→'} {Math.abs(percentChange)}%
                    </div>
                </div>
            )}
        </div>
    )
}
