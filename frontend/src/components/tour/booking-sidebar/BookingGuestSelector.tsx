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
    return (
        <div className="mb-4">
            <label className="text-sm font-semibold text-gray-600 mb-0 block">
                จำนวนผู้เดินทาง
                {tour.minPeople && (
                    <span className="block text-[11.5px] font-normal text-gray-500 mt-0.5 mb-2.5">
                        *แพ็กเกจไพรเวท ต้องจองขั้นต่ำ {tour.minPeople} ท่านขึ้นไป
                    </span>
                )}
            </label>
            <div className={`grid grid-cols-2 gap-3 ${!tour.minPeople ? 'mt-3' : ''}`}>
                {[
                    {
                        label: 'ผู้ใหญ่',
                        value: adults,
                        min: tour.minPeople ? Math.max(1, tour.minPeople) : 1,
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
                            {/* 🔴 ปุ่ม + (ใส่ isMaxReached เพื่อล็อคเมื่อคนเต็ม) */}
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
