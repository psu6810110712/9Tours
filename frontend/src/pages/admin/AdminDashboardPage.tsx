import { useEffect, useState } from 'react'
import { dashboardService } from '../../services/dashboardService'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, Legend,
} from 'recharts'

// ======== สี ========
const COLORS = ['#F5A623', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899']
const PIE_COLORS = ['#F5A623', '#3B82F6', '#10B981', '#8B5CF6']

interface DashboardData {
    summaryCards: {
        totalRevenue: number
        totalBookings: number
        totalViews: number
        totalCustomers: number
    }
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

    // Filter states
    const [filterTime, setFilterTime] = useState('this_month')
    const [filterRegion, setFilterRegion] = useState('all')
    const [filterTourType, setFilterTourType] = useState('all')
    const [searchCode, setSearchCode] = useState('')

    useEffect(() => {
        dashboardService.getData()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                <div className="flex items-center justify-center h-96">
                    <div className="text-gray-400 text-lg">กำลังโหลด Dashboard...</div>
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

    // Booking status chart data
    const statusChartData = [
        { name: 'Pending', value: (bookingsByStatus['pending_payment'] || 0) + (bookingsByStatus['awaiting_approval'] || 0), color: '#3B82F6' },
        { name: 'Paid', value: bookingsByStatus['success'] || 0, color: '#10B981' },
        { name: 'Cancelled', value: bookingsByStatus['canceled'] || 0, color: '#EF4444' },
        { name: 'Refund', value: (bookingsByStatus['refund_pending'] || 0) + (bookingsByStatus['refund_completed'] || 0), color: '#F5A623' },
    ]

    const pendingApproval = bookingsByStatus['awaiting_approval'] || 0
    const refundPending = bookingsByStatus['refund_pending'] || 0

    // Total bookings for current & last month from chart data
    const thisMonthTotal = bookingsOverTime.reduce((s, d) => s + d.thisMonth, 0)
    const lastMonthTotal = bookingsOverTime.reduce((s, d) => s + d.lastMonth, 0)

    // Total views for current & last month
    const currentMonthViews = viewsOverTime[viewsOverTime.length - 1]?.views || 0
    const lastMonthViews = viewsOverTime[viewsOverTime.length - 2]?.views || 0

    return (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
            {/* ========== HEADER ========== */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>

            {/* ========== FILTER BAR ========== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3 mb-5 flex flex-wrap items-center gap-3">
                {/* ช่วงเวลา */}
                <div className="flex items-center gap-1.5 text-sm">
                    <label className="text-gray-500 font-medium whitespace-nowrap">ช่วงเวลา :</label>
                    <select
                        value={filterTime}
                        onChange={e => setFilterTime(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
                    >
                        <option value="today">วันนี้</option>
                        <option value="this_week">สัปดาห์นี้</option>
                        <option value="this_month">เดือนนี้</option>
                        <option value="last_month">เดือนที่แล้ว</option>
                        <option value="this_year">ปีนี้</option>
                        <option value="all">ทั้งหมด</option>
                    </select>
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
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold px-5 py-1.5 rounded-lg transition-colors"
                >
                    ตกลง
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
            {pendingApproval > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 mb-3 flex items-center gap-2 text-sm text-yellow-800">
                    <span>⏳</span> รอยืนยันการทำรายการ : <strong>{pendingApproval} รายการ</strong>
                </div>
            )}
            {refundPending > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 mb-5 flex items-center gap-2 text-sm text-orange-800">
                    <span>↩️</span> คำขอการขอเงินคืน : <strong>{refundPending} รายการ</strong>
                </div>
            )}

            {/* ========== MAIN GRID ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* ===== LEFT COLUMN (8 cols) ===== */}
                <div className="lg:col-span-7 space-y-5">

                    {/* --- Summary Cards --- */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <SummaryCard icon="🛒" label="ยอดขายทั้งหมด" value={`฿${summaryCards.totalRevenue.toLocaleString()}`} />
                        <SummaryCard icon="🛍️" label="คำสั่งซื้อ" value={summaryCards.totalBookings.toLocaleString()} />
                        <SummaryCard icon="👁️" label="การดู" value={summaryCards.totalViews.toLocaleString()} />
                        <SummaryCard icon="👤" label="ลูกค้าใหม่" value={summaryCards.totalCustomers.toLocaleString()} />
                    </div>

                    {/* --- Top Tours Table --- */}
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <h2 className="font-bold text-gray-900 mb-4">ทัวร์ที่ได้รับความนิยม</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs">
                                    <th className="text-left pb-3 w-8">#</th>
                                    <th className="text-left pb-3">ชื่อทัวร์</th>
                                    <th className="text-left pb-3">ความนิยม(จำนวนการดู)</th>
                                    <th className="text-right pb-3">ยอดขาย</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topTours.map((tour) => (
                                    <tr key={tour.rank} className="border-t border-gray-100">
                                        <td className="py-3 text-gray-400 font-mono">{String(tour.rank).padStart(2, '0')}</td>
                                        <td className="py-3 font-medium text-gray-800">{tour.name}</td>
                                        <td className="py-3 w-48">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full"
                                                        style={{
                                                            width: `${tour.popularityPercent}%`,
                                                            background: `linear-gradient(90deg, #F5A623, #F59E0B)`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-10 text-right">{tour.popularityPercent}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right text-gray-600">{tour.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Bottom Row: Region Pie + Booking Status --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Region Pie Chart */}
                        <div className="bg-white rounded-2xl shadow-sm p-5">
                            <h2 className="font-bold text-gray-900 mb-3">ความนิยมแยกตามภูมิภาค</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={regionStats}
                                                dataKey="count"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={55}
                                                innerRadius={25}
                                            >
                                                {regionStats.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-1.5 text-xs">
                                    {regionStats.map((r, i) => (
                                        <div key={r.name} className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-gray-700 flex-1">{r.name}</span>
                                            <span className="text-gray-500 font-medium">{r.percent}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Booking Status Bar Chart */}
                        <div className="bg-white rounded-2xl shadow-sm p-5">
                            <h2 className="font-bold text-gray-900 mb-3">สถานะการจอง</h2>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statusChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {statusChartData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* --- Bookings Over Time + Conversion --- */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

                        {/* Bookings Area Chart */}
                        <div className="md:col-span-3 bg-white rounded-2xl shadow-sm p-5">
                            <h2 className="font-bold text-gray-900 mb-3">ยอดคำสั่งซื้อ</h2>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={bookingsOverTime}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="lastMonth" stroke="#D1D5DB" fill="#F3F4F6" fillOpacity={0.6} name="เดือนที่แล้ว" />
                                        <Area type="monotone" dataKey="thisMonth" stroke="#F5A623" fill="#FEF3C7" fillOpacity={0.6} name="เดือนนี้" />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center gap-8 mt-3 text-center">
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

                        {/* Conversion Rate */}
                        <div className="md:col-span-2 space-y-5">
                            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
                                <h2 className="font-bold text-gray-900 mb-2">Conversion Rate</h2>
                                <p className="text-4xl font-extrabold text-yellow-500">{conversionRate}%</p>
                                <p className="text-xs text-gray-400 mt-1">(ดู → จ่ายเงิน)</p>
                            </div>

                            {/* Province Stats */}
                            <div className="bg-white rounded-2xl shadow-sm p-5">
                                <h2 className="font-bold text-gray-900 mb-3 text-sm">ความนิยมตามจังหวัด</h2>
                                <div className="space-y-2 text-xs">
                                    {provinceStats.slice(0, 6).map((p, i) => (
                                        <div key={p.name} className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-gray-700 flex-1 truncate">{p.name}</span>
                                            <span className="text-gray-500 font-medium">{p.percent}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== RIGHT COLUMN (5 cols) ===== */}
                <div className="lg:col-span-5 space-y-5">

                    {/* Views Over Time Line Chart */}
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <h2 className="font-bold text-gray-900 mb-3">ยอดการดู</h2>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={viewsOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="views"
                                        stroke="#8B5CF6"
                                        strokeWidth={2.5}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-8 mt-3">
                            <div>
                                <p className="text-xs text-gray-400">เดือนที่แล้ว</p>
                                <p className="text-lg font-bold text-gray-800">{lastMonthViews.toLocaleString()} <span className="text-sm font-normal text-gray-400">คนดู</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">เดือนนี้</p>
                                <p className="text-lg font-bold text-gray-800">{currentMonthViews.toLocaleString()} <span className="text-sm font-normal text-gray-400">คนดู</span></p>
                            </div>
                        </div>
                    </div>

                    {/* แผนที่ (placeholder) */}
                    <div className="bg-white rounded-2xl shadow-sm p-5 min-h-[200px]"></div>
                </div>
            </div>
        </main>
    )
}

// ======== Sub-components ========

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="text-xl mb-2">{icon}</div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
    )
}
