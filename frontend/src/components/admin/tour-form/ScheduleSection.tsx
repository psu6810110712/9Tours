import { useState, useMemo } from 'react';
import ConfirmModal from '../../common/ConfirmModal';

interface ScheduleRow {
    startDate: string;
    endDate: string;
    timeSlot: string;
    roundName: string;
    maxCapacity: number;
    enabled: boolean;
}

interface BulkRound {
    roundName: string;
    timeSlot: string;
}

interface ScheduleSectionProps {
    schedules: ScheduleRow[];
    tourType: 'package' | 'one_day';
    bookingMode: 'join' | 'private';
    bulkFrom: string;
    bulkTo: string;
    bulkCapacity: number;
    bulkDuration: number;
    bulkDays: Set<number>;
    bulkRounds: BulkRound[];
    setBulkFrom: (val: string) => void;
    setBulkTo: (val: string) => void;
    setBulkCapacity: (val: number) => void;
    setBulkDuration: (val: number) => void;
    setBulkDays: (val: Set<number>) => void;
    setBulkRounds: (val: BulkRound[]) => void;
    removeSchedule: (index: number) => void;
    removeSchedules: (indices: number[]) => void;
    updateSchedule: (index: number, field: keyof ScheduleRow, value: string | number | boolean) => void;
    handleBulkAdd: () => void;
}

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function ScheduleSection({
    schedules,
    tourType,
    bookingMode,
    bulkFrom,
    bulkTo,
    bulkCapacity,
    bulkDuration,
    bulkDays,
    bulkRounds,
    setBulkFrom,
    setBulkTo,
    setBulkCapacity,
    setBulkDuration,
    setBulkDays,
    setBulkRounds,
    removeSchedule,
    removeSchedules,
    updateSchedule,
    handleBulkAdd,
}: ScheduleSectionProps) {
    const capacityLabel = bookingMode === 'private' ? 'คน/กรุ๊ป' : 'คน/รอบ';

    const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'month'; targetId: string } | { type: 'single'; index: number } | null>(null);

    // Group schedules by YYYY-MM
    const groupedSchedules = useMemo(() => {
        const grouped = new Map<string, { monthLabel: string; indices: number[]; enabledCount: number; totalCount: number }>();

        schedules.forEach((s, idx) => {
            if (!s.startDate) return;
            const d = new Date(s.startDate);
            if (isNaN(d.getTime())) return;

            const yearStr = d.getFullYear();
            const monthStr = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${yearStr}-${monthStr}`;

            // Format Thai month
            const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            const monthLabel = `${monthNames[d.getMonth()]} ${yearStr}`;

            if (!grouped.has(key)) {
                grouped.set(key, { monthLabel, indices: [], enabledCount: 0, totalCount: 0 });
            }

            const group = grouped.get(key)!;
            group.indices.push(idx);
            group.totalCount++;
            if (s.enabled) {
                group.enabledCount++;
            }
        });

        // Sort keys ascending
        return new Map([...grouped.entries()].sort());
    }, [schedules]);

    // Tailwind classes based on booking mode
    const theme = bookingMode === 'private'
        ? {
            grad: 'from-orange-50 to-orange-100/50',
            border: 'border-orange-200',
            text: 'text-orange-800',
            iconText: 'text-orange-600',
            iconBg: 'bg-orange-100',
            focus: 'focus:border-orange-400 focus:ring-orange-400',
            btnBg: 'bg-orange-500 hover:bg-orange-600',
            btnActive: 'bg-orange-500',
        }
        : {
            grad: 'from-blue-50 to-blue-100/50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            iconText: 'text-blue-600',
            iconBg: 'bg-blue-100',
            focus: 'focus:border-blue-400 focus:ring-blue-400',
            btnBg: 'bg-blue-500 hover:bg-blue-600',
            btnActive: 'bg-blue-500',
        };

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${theme.iconBg} ${theme.iconText}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">กำหนดรอบที่เปิดจอง</h2>
            </div>

            {/* Bulk Add Section */}
            <div className={`space-y-4 rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.grad} p-5 shadow-sm`}>
                <div className="flex items-center gap-2">
                    <p className={`text-lg font-bold ${theme.text}`}>กำหนดวันเริ่มต้นและสิ้นสุด</p>
                </div>

                <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                    {/* วันที่เริ่ม-จบ */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-md font-semibold text-gray-700">
                            {tourType === 'one_day' ? 'ต้องการสร้างรอบครอบคลุมช่วงไหน?' : 'ต้องการสร้างตารางเดินทางครอบคลุมช่วงไหน?'}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-medium text-gray-500">เริ่มตั้งแต่วันที่</span>
                                <input
                                    type="date"
                                    value={bulkFrom}
                                    onChange={(e) => {
                                        const newFrom = e.target.value;
                                        setBulkFrom(newFrom);

                                        if (newFrom && bulkTo) {
                                            const nextDays = new Set<number>();
                                            const start = new Date(newFrom);
                                            const end = new Date(bulkTo);
                                            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
                                                const current = new Date(start);
                                                while (current <= end) {
                                                    nextDays.add(current.getDay());
                                                    current.setDate(current.getDate() + 1);
                                                }
                                                setBulkDays(nextDays);
                                            }
                                        } else if (newFrom) {
                                            const start = new Date(newFrom);
                                            if (!isNaN(start.getTime())) {
                                                setBulkDays(new Set([start.getDay()]));
                                            }
                                        }
                                    }}
                                    className={`rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors ${theme.focus}`}
                                />
                            </div>
                            <span className="mt-5 font-medium text-gray-400">-</span>
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-medium text-gray-500">สร้างรอบไปจนถึงวันที่</span>
                                <input
                                    type="date"
                                    value={bulkTo}
                                    onChange={(e) => {
                                        const newTo = e.target.value;
                                        setBulkTo(newTo);

                                        if (bulkFrom && newTo) {
                                            const nextDays = new Set<number>();
                                            const start = new Date(bulkFrom);
                                            const end = new Date(newTo);
                                            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
                                                const current = new Date(start);
                                                while (current <= end) {
                                                    nextDays.add(current.getDay());
                                                    current.setDate(current.getDate() + 1);
                                                }
                                                setBulkDays(nextDays);
                                            }
                                        } else if (newTo) {
                                            const end = new Date(newTo);
                                            if (!isNaN(end.getTime())) {
                                                setBulkDays(new Set([end.getDay()]));
                                            }
                                        }
                                    }}
                                    className={`rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors ${theme.focus}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 border-l border-gray-200 pl-4">
                        <span className="text-md font-semibold text-gray-700">ระยะเวลาต่อ 1 ทริป</span>
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] font-medium text-gray-500">ทริปนี้เดินทางกี่วัน?</span>
                            {tourType === 'package' ? (
                                <input
                                    type="number"
                                    min={1}
                                    value={bulkDuration}
                                    onChange={(e) => setBulkDuration(Number(e.target.value))}
                                    className={`w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-sm outline-none transition-colors ${theme.focus}`}
                                />
                            ) : (
                                <input
                                    type="text"
                                    readOnly
                                    value="1 วัน"
                                    className="w-24 cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-center text-sm text-gray-500 outline-none"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 border-l border-gray-200 pl-4">
                        <span className="text-md font-semibold text-gray-700">รับจำนวน ({capacityLabel})</span>
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] font-medium text-gray-500">รับสูงสุด</span>
                            <input
                                type="number"
                                value={bulkCapacity}
                                min={1}
                                onChange={(e) => setBulkCapacity(Number(e.target.value))}
                                className={`w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-sm outline-none transition-colors ${theme.focus}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <span className="text-md font-semibold text-gray-700">เลือกวันที่จะเปิดรอบในสัปดาห์</span>
                    <div className="flex flex-wrap gap-2">
                        {DAY_LABELS.map((label, dayIdx) => (
                            <button
                                key={dayIdx}
                                type="button"
                                onClick={() => {
                                    const next = new Set(bulkDays);
                                    if (next.has(dayIdx)) {
                                        next.delete(dayIdx);
                                    } else {
                                        next.add(dayIdx);
                                    }
                                    setBulkDays(next);
                                }}
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${bulkDays.has(dayIdx)
                                    ? `${theme.btnActive} text-white shadow-md`
                                    : 'border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {bookingMode === 'join' && (
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-md font-semibold text-gray-700">กำหนดรอบเวลาต่อวัน</span>
                            <button
                                type="button"
                                onClick={() => setBulkRounds([...bulkRounds, { roundName: '', timeSlot: '' }])}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all ${theme.btnBg}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                เพิ่มรอบ
                            </button>
                        </div>
                        {bulkRounds.length === 0 && (
                            <p className="text-xs text-blue-500">ระบบจะสร้าง 1 รอบต่อวันให้อัตโนมัติ (ไม่ระบุเวลา)</p>
                        )}
                        {bulkRounds.map((round, rIdx) => (
                            <div key={rIdx} className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] font-medium text-gray-500">ชื่อรอบ</span>
                                    <input
                                        type="text"
                                        value={round.roundName}
                                        onChange={(e) => {
                                            const next = [...bulkRounds];
                                            next[rIdx] = { ...next[rIdx], roundName: e.target.value };
                                            setBulkRounds(next);
                                        }}
                                        placeholder="เช่น รอบเช้า"
                                        className={`w-32 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm outline-none ${theme.focus}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] font-medium text-gray-500">เวลาออกเดินทาง</span>
                                    <input
                                        type="time"
                                        value={round.timeSlot}
                                        onChange={(e) => {
                                            const next = [...bulkRounds];
                                            next[rIdx] = { ...next[rIdx], timeSlot: e.target.value };
                                            setBulkRounds(next);
                                        }}
                                        className={`w-32 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm outline-none ${theme.focus}`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = bulkRounds.filter((_, i) => i !== rIdx);
                                        setBulkRounds(next);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
                                    title="ลบรอบนี้"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {bulkRounds.length > 0 && (
                            <p className="text-xs text-blue-500">
                                ระบบจะสร้าง {bulkRounds.length} รอบต่อวันตามที่กำหนด
                            </p>
                        )}
                    </div>
                )}

                <div className="pt-3">
                    <button
                        type="button"
                        onClick={handleBulkAdd}
                        disabled={!bulkFrom || !bulkTo}
                        className={`inline-flex items-center gap-2 rounded-xl ${theme.btnBg} px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:hover:shadow-sm`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        สร้างกำหนดการ
                    </button>
                </div>
            </div>

            {/* List Header */}
            <div className="mt-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">รอบการเดินทางทั้งหมด</h3>
                </div>

                <div className="flex max-h-[30rem] flex-col gap-3 overflow-y-auto rounded-xl bg-gray-50/60 p-2 md:p-3">
                    {Array.from(groupedSchedules.entries()).map(([monthKey, group]) => (
                        <div key={monthKey} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between hover:border-blue-300 hover:shadow-md cursor-pointer" onClick={() => setSelectedMonthKey(monthKey)}>
                            <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-base font-bold text-gray-800">{group.monthLabel}</h4>
                                    <p className="text-xs font-semibold text-gray-500 mt-1">
                                        รอบเดินทางทั้งหมด <span className="text-gray-900 font-bold">{group.totalCount}</span> รอบ
                                        {group.enabledCount > 0 && <span> (เปิดรับจอง <span className="text-green-600 font-bold">{group.enabledCount}</span> รอบ)</span>}
                                        {group.enabledCount === 0 && <span className="text-red-500"> (ปิดทั้งหมด)</span>}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            >
                                จัดการรอบ
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {schedules.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mb-3 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-base font-bold text-gray-500">ยังไม่มีกำหนดการใดๆ</p>
                            <p className="mt-1 text-sm text-gray-400">สร้างกำหนดการแบบหลายวัน (ด้านบน) หรือเพิ่มทีละรอบได้ที่นี่</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Area */}
            {schedules.filter((s) => s.enabled).length > 0 && (
                <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <h4 className="text-sm font-bold text-gray-800">สรุปการเปิดรับจองทั้งหมด</h4>
                        </div>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                            รวม {schedules.filter((s) => s.enabled).length} รอบ
                        </span>
                    </div>

                    <div className="ml-9 space-y-2 text-sm text-gray-600">
                        <p>
                            <span className="font-semibold text-gray-700">จำนวนวันเดินทางที่เปิดรับจอง:</span>{' '}
                            <span className="font-bold text-blue-600">{new Set(schedules.filter((s) => s.enabled).map((s) => s.startDate)).size}</span> วัน
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {Array.from(new Set(schedules.filter((s) => s.enabled).map((s) => s.startDate)))
                                .sort()
                                .slice(0, 10)
                                .map((date) => (
                                    <span key={date} className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
                                        {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                    </span>
                                ))}
                            {new Set(schedules.filter((s) => s.enabled).map((s) => s.startDate)).size > 10 && (
                                <span className="rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs font-medium text-gray-500">
                                    และอื่นๆ...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for detailed view */}
            {selectedMonthKey && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
                    <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-200">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-5">
                            <h3 className="text-xl font-extrabold text-gray-800">
                                รอบของเดือน <span className="text-blue-600">{groupedSchedules.get(selectedMonthKey)?.monthLabel}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedMonthKey(null)}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white border outline-none text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500 focus:ring-2 focus:ring-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
                            <div className="flex flex-col gap-3">
                                {groupedSchedules.get(selectedMonthKey)?.indices.map((i) => {
                                    const s = schedules[i];
                                    return (
                                        <div key={i} className={`flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between ${s.enabled ? 'border-gray-200 hover:border-gray-300' : 'border-gray-100 opacity-60'}`}>


                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-bold text-gray-500">วันที่เริ่มต้น</span>
                                                    <input
                                                        type="date"
                                                        value={s.startDate}
                                                        onChange={(e) => updateSchedule(i, 'startDate', e.target.value)}
                                                        className={`rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm outline-none ${theme.focus} focus:bg-white`}
                                                    />
                                                </div>

                                                {tourType === 'package' && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[11px] font-bold text-gray-500">ถึงวันที่</span>
                                                        <input
                                                            type="date"
                                                            value={s.endDate}
                                                            onChange={(e) => updateSchedule(i, 'endDate', e.target.value)}
                                                            className={`rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm outline-none ${theme.focus} focus:bg-white`}
                                                        />
                                                    </div>
                                                )}


                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-bold text-gray-500">ชื่อรอบ</span>
                                                    <input
                                                        type="text"
                                                        value={s.roundName}
                                                        onChange={(e) => updateSchedule(i, 'roundName', e.target.value)}
                                                        placeholder="เช่น รอบเช้า"
                                                        className={`w-28 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm outline-none ${theme.focus} focus:bg-white`}
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-bold text-gray-500">เวลา</span>
                                                    <input
                                                        type="time"
                                                        value={s.timeSlot}
                                                        onChange={(e) => updateSchedule(i, 'timeSlot', e.target.value)}
                                                        className={`w-28 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm outline-none ${theme.focus} focus:bg-white`}
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-bold text-gray-500">({capacityLabel})</span>
                                                    <input
                                                        type="number"
                                                        value={s.maxCapacity}
                                                        onChange={(e) => updateSchedule(i, 'maxCapacity', Number(e.target.value))}
                                                        min={1}
                                                        className={`w-20 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-center text-sm outline-none ${theme.focus} focus:bg-white`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5 pt-2 sm:border-l sm:border-gray-100 sm:pl-5 sm:pt-0">
                                                <label className="flex cursor-pointer items-center gap-2">
                                                    <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${s.enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
                                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${s.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                                                    </div>
                                                    <span className={`text-sm font-bold ${s.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {s.enabled ? 'เปิดรับจอง' : 'ปิด'}
                                                    </span>
                                                    <input
                                                        type="checkbox"
                                                        checked={s.enabled}
                                                        onChange={(e) => updateSchedule(i, 'enabled', e.target.checked)}
                                                        className="sr-only"
                                                    />
                                                </label>

                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget({ type: 'single', index: i })}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
                                                    title="ลบรอบนี้"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedMonthKey) {
                                        setDeleteTarget({ type: 'month', targetId: selectedMonthKey });
                                    }
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                ลบทั้งเดือน
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedMonthKey(null)}
                                className={`rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg ${theme.btnBg}`}
                            >
                                ยืนยัน / ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteTarget !== null}
                title="ยืนยันการลบ"
                message={
                    deleteTarget?.type === 'month'
                        ? `คุณแน่ใจหรือไม่ว่าต้องการลบรอบทั้งหมดในเดือน ${groupedSchedules.get(deleteTarget.targetId)?.monthLabel || ''}?`
                        : 'คุณแน่ใจหรือไม่ว่าต้องการลบรอบการเดินทางนี้?'
                }
                confirmText="ลบข้อมูล"
                cancelText="ยกเลิก"
                confirmStyle="danger"
                onConfirm={() => {
                    if (deleteTarget?.type === 'month') {
                        removeSchedules(groupedSchedules.get(deleteTarget.targetId)?.indices || []);
                        setSelectedMonthKey(null);
                    } else if (deleteTarget?.type === 'single') {
                        removeSchedule(deleteTarget.index);
                    }
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
