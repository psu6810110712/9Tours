import type { Tour } from '../../../types/tour';

interface BookingGuestSelectorProps {
    tour: Tour;
    adults: number;
    setAdults: (val: number) => void;
    children: number;
    setChildren: (val: number) => void;
    isMaxReached: boolean;
    hasSelectedSchedule: boolean;
}

export default function BookingGuestSelector({
    tour,
    adults,
    setAdults,
    children,
    setChildren,
    isMaxReached,
    hasSelectedSchedule
}: BookingGuestSelectorProps) {
    const isPrivate = !!tour.minPeople;

    // Private Tour: แสดงข้อความ capacity แทน +/- selector
    if (isPrivate) {
        return (
            <div className="mb-4">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    จำนวนผู้เดินทาง
                </label>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-amber-100 p-1.5 rounded-lg">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-800">
                                รองรับ {tour.minPeople}–{tour.maxPeople || tour.minPeople} ท่าน
                            </p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                ราคาเหมา · ไม่คิดรายหัว
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Join Tour: แสดง +/- selector ผู้ใหญ่ + เด็ก
    return (
        <div className="mb-4">
            <label className="text-sm font-semibold text-gray-600 mb-0 block">
                จำนวนผู้เดินทาง
            </label>
            <div className="grid grid-cols-2 gap-3 mt-3">
                {[
                    {
                        label: 'ผู้ใหญ่',
                        value: adults,
                        min: 1,
                        set: setAdults
                    },
                    { label: 'เด็ก', value: children, min: 0, set: setChildren },
                ].map(({ label, value, min, set }) => (
                    <div key={label}>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">{label}</label>
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            {/* ปุ่ม - */}
                            <button
                                onClick={() => set(Math.max(min, value - 1))}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={value <= min}
                            >
                                -
                            </button>
                            <span className="flex-1 text-center text-base font-semibold text-gray-900">{value}</span>
                            {/* ปุ่ม + */}
                            <button
                                onClick={() => set(value + 1)}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isMaxReached || !hasSelectedSchedule}
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
