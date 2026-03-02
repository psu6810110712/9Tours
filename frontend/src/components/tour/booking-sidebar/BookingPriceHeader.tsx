import type { Tour } from '../../../types/tour';

interface BookingPriceHeaderProps {
    tour: Tour;
}

export default function BookingPriceHeader({ tour }: BookingPriceHeaderProps) {
    const isPrivate = !!tour.minPeople;

    return (
        <div className="mb-4">
            {isPrivate && (
                <div className="text-[13px] font-bold text-amber-600 mb-1.5 flex items-center gap-1.5">
                    <span></span>
                </div>
            )}
            {tour.originalPrice && (
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-400 line-through">
                        ฿{Number(tour.originalPrice).toLocaleString()}
                    </p>
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                        -{Math.round((1 - Number(tour.price) / Number(tour.originalPrice)) * 100)}%
                    </span>
                </div>
            )}

            {isPrivate ? (
                /* Private Tour: แสดง "เริ่มต้นที่ ฿X" */
                <div>
                    <span className="text-sm font-medium text-gray-500">เริ่มต้นที่</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[32px] leading-none font-bold text-[#111827]">
                            ฿{Number(tour.price).toLocaleString()}
                        </span>
                        <span className="text-base font-medium text-gray-600">
                            บาท
                        </span>
                    </div>
                </div>
            ) : (
                /* Join Tour: แสดงราคาผู้ใหญ่ + เด็ก */
                <div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[32px] leading-none font-bold text-[#111827]">
                            ฿{Number(tour.price).toLocaleString()}
                        </span>
                        <span className="text-base font-medium text-gray-600">
                            บาท / คน
                        </span>
                    </div>
                    {tour.childPrice != null && tour.childPrice !== tour.price && (
                        <p className="text-sm text-gray-500 mt-1">
                            เด็ก ฿{Number(tour.childPrice).toLocaleString()} / คน
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
