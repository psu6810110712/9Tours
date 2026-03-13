interface ScheduleRow {
    startDate: string;
    endDate: string;
    timeSlot: string;
    roundName: string;
    maxCapacity: number;
    enabled: boolean;
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
    roundTemplates: { roundName: string; timeSlot: string }[];
    setBulkFrom: (val: string) => void;
    setBulkTo: (val: string) => void;
    setBulkCapacity: (val: number) => void;
    setBulkDuration: (val: number) => void;
    setBulkDays: (val: Set<number>) => void;
    setRoundTemplates: (val: { roundName: string; timeSlot: string }[]) => void;
    addSchedule: () => void;
    removeSchedule: (index: number) => void;
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
    roundTemplates,
    setBulkFrom,
    setBulkTo,
    setBulkCapacity,
    setBulkDuration,
    setBulkDays,
    setRoundTemplates,
    addSchedule,
    removeSchedule,
    updateSchedule,
    handleBulkAdd,
}: ScheduleSectionProps) {
    const capacityLabel = bookingMode === 'private' ? 'คน/กรุ๊ป' : 'คน/รอบ';

    return (
        <div>
            <span className="mb-3 block text-xl font-bold text-gray-800">กำหนดรอบที่เปิดจอง</span>

            <div className="mb-3 space-y-2 rounded-xl border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-bold text-orange-700">เพิ่มหลายวันพร้อมกัน (Bulk Add)</p>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">จาก</span>
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
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">ถึง</span>
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
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                        />
                    </div>

                    {tourType === 'package' && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">ระยะเวลา</span>
                            <input
                                type="number"
                                min={1}
                                value={bulkDuration}
                                onChange={(e) => setBulkDuration(Number(e.target.value))}
                                className="w-12 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs outline-none focus:border-orange-400"
                            />
                            <span className="text-xs text-gray-500">วัน</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={bulkCapacity}
                            min={1}
                            onChange={(e) => setBulkCapacity(Number(e.target.value))}
                            className="w-14 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs outline-none focus:border-orange-400"
                        />
                        <span className="text-xs text-gray-500">{capacityLabel}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {DAY_LABELS.map((label, dayIdx) => (
                        <button
                            key={dayIdx}
                            type="button"
                            onClick={() => {
                                const next = new Set(bulkDays);
                                next.has(dayIdx) ? next.delete(dayIdx) : next.add(dayIdx);
                                setBulkDays(next);
                            }}
                            className={`h-8 w-8 rounded-full text-xs font-semibold transition-colors ${
                                bulkDays.has(dayIdx)
                                    ? 'bg-orange-400 text-white'
                                    : 'border border-gray-300 bg-white text-gray-500'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {bookingMode === 'join' && (
                    <div className="space-y-1.5 rounded-lg border border-blue-200 bg-blue-50 p-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-blue-700">รอบเวลา (Join Trip)</p>
                            <button
                                type="button"
                                onClick={() => setRoundTemplates([...roundTemplates, { roundName: '', timeSlot: '' }])}
                                className="text-xs font-semibold text-blue-500 hover:text-blue-700"
                            >
                                + เพิ่มรอบ
                            </button>
                        </div>

                        {roundTemplates.map((rt, ri) => (
                            <div key={ri} className="flex items-center gap-1.5">
                                <input
                                    type="text"
                                    value={rt.timeSlot}
                                    onChange={(e) => {
                                        const next = [...roundTemplates];
                                        next[ri] = { ...next[ri], timeSlot: e.target.value };
                                        setRoundTemplates(next);
                                    }}
                                    placeholder="เช่น 08:00-12:00"
                                    className="flex-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400"
                                />
                                <input
                                    type="text"
                                    value={rt.roundName}
                                    onChange={(e) => {
                                        const next = [...roundTemplates];
                                        next[ri] = { ...next[ri], roundName: e.target.value };
                                        setRoundTemplates(next);
                                    }}
                                    placeholder="ชื่อรอบ เช่น รอบเช้า"
                                    className="flex-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400"
                                />
                                {roundTemplates.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setRoundTemplates(roundTemplates.filter((_, i) => i !== ri))}
                                        className="text-xs text-red-400 hover:text-red-600"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}

                        <p className="text-xs text-blue-400">ถ้าไม่กรอกเวลา ระบบจะสร้าง 1 รอบต่อวันให้อัตโนมัติ</p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleBulkAdd}
                    disabled={!bulkFrom || !bulkTo}
                    className="rounded-full bg-orange-400 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-40"
                >
                    สร้างกำหนดการ
                </button>
            </div>

            <button
                type="button"
                onClick={addSchedule}
                className="mb-2 rounded-full border border-orange-300 px-3 py-1 text-xs font-semibold text-orange-500 transition-colors hover:bg-orange-50"
            >
                + เพิ่มทีละรอบ
            </button>

            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {schedules.map((s, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                        <input
                            type="date"
                            value={s.startDate}
                            onChange={(e) => updateSchedule(i, 'startDate', e.target.value)}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                        />

                        {tourType === 'package' && (
                            <>
                                <span className="text-gray-400">ถึง</span>
                                <input
                                    type="date"
                                    value={s.endDate}
                                    onChange={(e) => updateSchedule(i, 'endDate', e.target.value)}
                                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                                />
                            </>
                        )}

                        {bookingMode === 'join' && (
                            <input
                                type="text"
                                value={s.timeSlot}
                                onChange={(e) => updateSchedule(i, 'timeSlot', e.target.value)}
                                placeholder="เช่น 08:00-12:00"
                                title="ช่วงเวลา"
                                className="w-32 rounded-lg border border-blue-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                            />
                        )}

                        {bookingMode === 'join' && (
                            <input
                                type="text"
                                value={s.roundName}
                                onChange={(e) => updateSchedule(i, 'roundName', e.target.value)}
                                placeholder="ชื่อรอบ เช่น รอบเช้า"
                                title="ชื่อรอบ"
                                className="w-28 rounded-lg border border-blue-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                            />
                        )}

                        <input
                            type="number"
                            value={s.maxCapacity}
                            onChange={(e) => updateSchedule(i, 'maxCapacity', Number(e.target.value))}
                            min={1}
                            className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-xs outline-none focus:border-yellow-400"
                        />
                        <span className="whitespace-nowrap text-xs text-gray-500">{capacityLabel}</span>

                        <input
                            type="checkbox"
                            checked={s.enabled}
                            onChange={(e) => updateSchedule(i, 'enabled', e.target.checked)}
                            className="accent-yellow-500"
                        />

                        <button
                            type="button"
                            onClick={() => removeSchedule(i)}
                            className="text-xs text-red-400 hover:text-red-600"
                            title="ลบรอบนี้"
                        >
                            ×
                        </button>
                    </div>
                ))}

                {schedules.length === 0 && (
                    <p className="py-2 text-xs text-gray-400">ยังไม่มีกำหนดการ</p>
                )}
            </div>

            {schedules.filter((s) => s.enabled).length > 0 && (
                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500">สรุปกำหนดการ</p>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                            รวม {schedules.filter((s) => s.enabled).length} รอบ
                        </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                        <p>
                            <strong>จำนวนวัน:</strong>{' '}
                            {new Set(schedules.filter((s) => s.enabled).map((s) => s.startDate)).size} วัน
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {Array.from(new Set(schedules.filter((s) => s.enabled).map((s) => s.startDate)))
                                .sort()
                                .slice(0, 5)
                                .map((date) => (
                                    <span key={date} className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px]">
                                        {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                    </span>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
