
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
    // State from parent
    bulkFrom: string;
    bulkTo: string;
    bulkCapacity: number;
    bulkDuration: number;
    bulkDays: Set<number>;
    roundTemplates: { roundName: string; timeSlot: string }[];
    // Actions
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

export default function ScheduleSection({
    schedules,
    tourType,
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
    handleBulkAdd
}: ScheduleSectionProps) {
    return (
        <div>
            <span className="text-sm font-bold text-gray-800 block mb-3">กำหนดการ</span>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3 space-y-2">
                <p className="text-xs font-bold text-orange-700">เพิ่มหลายวันพร้อมกัน (Bulk Add)</p>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">{tourType === 'package' ? 'จาก' : 'วันที่'}</span>
                        <input
                            type="date"
                            value={bulkFrom}
                            onChange={(e) => {
                                setBulkFrom(e.target.value)
                                if (tourType === 'one_day') setBulkTo(e.target.value)
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                        />
                    </div>
                    {tourType === 'package' && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">ถึง</span>
                            <input
                                type="date"
                                value={bulkTo}
                                onChange={(e) => setBulkTo(e.target.value)}
                                className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                            />
                        </div>
                    )}

                    {tourType === 'package' && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">ระยะเวลา</span>
                            <input
                                type="number"
                                min={1}
                                value={bulkDuration}
                                onChange={(e) => setBulkDuration(Number(e.target.value))}
                                className="w-12 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-orange-400"
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
                            className="w-14 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-orange-400"
                        />
                        <span className="text-xs text-gray-500">คน/รอบ</span>
                    </div>
                </div>

                {tourType === 'package' && (
                    <div className="flex gap-1.5 flex-wrap">
                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((label, dayIdx) => (
                            <button
                                key={dayIdx}
                                type="button"
                                onClick={() => {
                                    const next = new Set(bulkDays);
                                    next.has(dayIdx) ? next.delete(dayIdx) : next.add(dayIdx);
                                    setBulkDays(next);
                                }}
                                className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${bulkDays.has(dayIdx)
                                    ? 'bg-orange-400 text-white'
                                    : 'bg-white border border-gray-300 text-gray-500'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {tourType === 'one_day' && (
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-blue-700">⏱ รอบเวลา (Join Trip)</p>
                            <button
                                type="button"
                                onClick={() => setRoundTemplates([...roundTemplates, { roundName: '', timeSlot: '' }])}
                                className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
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
                                    className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-400"
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
                                    className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-400"
                                />
                                {roundTemplates.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setRoundTemplates(roundTemplates.filter((_, i) => i !== ri))}
                                        className="text-red-400 hover:text-red-600 text-xs"
                                    >✕</button>
                                )}
                            </div>
                        ))}
                        <p className="text-xs text-blue-400">ถ้าไม่กรอกเวลา = สร้าง 1 รอบต่อวัน (ทัวร์ปกติ)</p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleBulkAdd}
                    disabled={!bulkFrom || !bulkTo}
                    className="text-xs font-semibold text-white bg-orange-400 hover:bg-orange-500 disabled:opacity-40 px-4 py-1.5 rounded-full transition-colors"
                >
                    สร้างกำหนดการ
                </button>
            </div>

            <button
                type="button"
                onClick={addSchedule}
                className="text-xs font-semibold text-orange-500 border border-orange-300 hover:bg-orange-50 px-3 py-1 rounded-full transition-colors mb-2"
            >
                + เพิ่มทีละรอบ
            </button>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {schedules.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm flex-wrap">
                        <input
                            type="date"
                            value={s.startDate}
                            onChange={(e) => updateSchedule(i, 'startDate', e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                        />
                        {tourType === 'package' && (
                            <>
                                <span className="text-gray-400">ถึง</span>
                                <input
                                    type="date"
                                    value={s.endDate}
                                    onChange={(e) => updateSchedule(i, 'endDate', e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-yellow-400"
                                />
                            </>
                        )}
                        {tourType === 'one_day' && (
                            <input
                                type="text"
                                value={s.timeSlot}
                                onChange={(e) => updateSchedule(i, 'timeSlot', e.target.value)}
                                placeholder="เช่น 08:00-12:00"
                                title="ช่วงเวลา (Join Trip)"
                                className="w-32 bg-gray-50 border border-blue-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                            />
                        )}
                        {tourType === 'one_day' && (
                            <input
                                type="text"
                                value={s.roundName}
                                onChange={(e) => updateSchedule(i, 'roundName', e.target.value)}
                                placeholder="ชื่อรอบ เช่น รอบเช้า"
                                title="ชื่อรอบ"
                                className="w-28 bg-gray-50 border border-blue-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                            />
                        )}
                        <input
                            type="number"
                            value={s.maxCapacity}
                            onChange={(e) => updateSchedule(i, 'maxCapacity', Number(e.target.value))}
                            min={1}
                            className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-yellow-400"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {tourType === 'one_day' ? 'คน/รอบ' : 'คน/กรุ๊ป'}
                        </span>
                        <input
                            type="checkbox"
                            checked={s.enabled}
                            onChange={(e) => updateSchedule(i, 'enabled', e.target.checked)}
                            className="accent-yellow-500"
                        />
                        <button
                            type="button"
                            onClick={() => removeSchedule(i)}
                            className="text-red-400 hover:text-red-600 text-xs"
                            title="ลบรอบนี้"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                {schedules.length === 0 && (
                    <p className="text-xs text-gray-400 py-2">ยังไม่มีกำหนดการ</p>
                )}
            </div>

            {schedules.filter(s => s.enabled).length > 0 && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-500">สรุปกำหนดการ</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            รวม {schedules.filter(s => s.enabled).length} รอบ
                        </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p>📅 <strong>จำนวนวัน:</strong> {new Set(schedules.filter(s => s.enabled).map(s => s.startDate)).size} วัน</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {Array.from(new Set(schedules.filter(s => s.enabled).map(s => s.startDate)))
                                .sort()
                                .slice(0, 5)
                                .map(d => (
                                    <span key={d} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px]">
                                        {new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                    </span>
                                ))
                            }
                            {new Set(schedules.filter(s => s.enabled).map(s => s.startDate)).size > 5 && (
                                <span className="text-gray-400 pl-1">...และอื่นๆ</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
