import type { Tour } from '../../../types/tour';

interface BookingSummaryProps {
    tour: Tour;
    adults: number;
    children: number;
    totalPrice: number;
    isBookingDisabled: boolean;
    buttonText: string;
    onBookingClick: () => void;
}

export default function BookingSummary({
    tour,
    adults,
    children,
    totalPrice,
    isBookingDisabled,
    buttonText,
    onBookingClick
}: BookingSummaryProps) {
    return (
        <>
            <div className="border-t border-gray-100 pt-4 mb-4 space-y-2">
                {tour.minPeople ? (
                    <div className="flex justify-between items-center text-[15px]">
                        <span className="text-gray-600 font-medium">
                        </span>
                        <span className="text-gray-700 font-medium whitespace-nowrap">
                        </span>
                    </div>
                ) : (
                    <>
                        {adults > 0 && (
                            <div className="flex justify-between items-center text-[15px]">
                                <span className="text-gray-600 font-medium">
                                    ผู้ใหญ่ <span className="text-gray-400 text-[13px] font-normal">(฿{Number(tour.price).toLocaleString()} x {adults})</span>
                                </span>
                                <span className="text-gray-700 font-medium whitespace-nowrap">
                                    ฿{(Number(tour.price || 1500) * adults).toLocaleString()}
                                </span>
                            </div>
                        )}
                        {children > 0 && (
                            <div className="flex justify-between items-center text-[15px]">
                                <span className="text-gray-600 font-medium">
                                    เด็ก <span className="text-gray-400 text-[13px] font-normal">(฿{Number(tour.childPrice || 1000).toLocaleString()} x {children})</span>
                                </span>
                                <span className="text-gray-700 font-medium whitespace-nowrap">
                                    ฿{(Number(tour.childPrice || 1000) * children).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </>
                )}

                <div className="flex justify-between items-end pt-1">
                    <span className="font-bold text-gray-900 text-base pb-0.5">รวมทั้งหมด</span>
                    <span className="font-bold text-accent text-[22px] leading-none">฿{totalPrice.toLocaleString()}</span>
                </div>
            </div>

            <button
                onClick={onBookingClick}
                disabled={isBookingDisabled}
                className={`w-full font-semibold py-3 rounded-xl transition-all text-base 
          ${isBookingDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-accent text-white hover:bg-orange-500 shadow-md active:scale-[0.98]'
                    }`}
            >
                {buttonText}
            </button>
        </>
    );
}
