import React from 'react';

interface BookingSummaryCardProps {
    tourCode: string;
    tourName: string;
    date: React.ReactNode;
    adults: number;
    children: number;
    adultPrice: number;
    childPrice: number;
    image: string;
    accommodation?: string; // Optional because PaymentPage data fetching logic may not have it immediately
    totalPrice?: number; // Optional because PaymentPage already has it, but BookingInfo calculates it. If not provided, it will calculate.
}

export default function BookingSummaryCard({
    tourCode,
    tourName,
    date,
    adults,
    children,
    adultPrice,
    childPrice,
    image,
    accommodation,
    totalPrice
}: BookingSummaryCardProps) {

    const calculatedTotal = totalPrice !== undefined
        ? totalPrice
        : (adults * adultPrice) + (children * childPrice);

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 h-full flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4 text-center md:text-left">
                สรุปข้อมูลการจองของท่าน
            </h3>

            <div className="flex-grow flex flex-col">
                <div className="flex flex-col sm:flex-row gap-5 mb-6">
                    <div className="flex-1 space-y-3.5 text-[15px] text-gray-700 font-medium min-w-0">
                        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[110px_1fr] items-start gap-2">
                            <span className="font-bold text-gray-800">รหัสทัวร์</span>
                            <span className="truncate">{tourCode}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[110px_1fr] items-start gap-2">
                            <span className="font-bold text-gray-800">ชื่อทัวร์</span>
                            <span className="leading-snug break-words line-clamp-2">{tourName}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[110px_1fr] items-start gap-2">
                            <span className="font-bold text-gray-800">วันที่เดินทาง</span>
                            <span className="leading-snug break-words text-sm sm:text-[15px]">{date}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[110px_1fr] items-start gap-2">
                            <span className="font-bold text-gray-800">จำนวน</span>
                            <span className="break-words">ผู้ใหญ่ {adults}, เด็ก {children}</span>
                        </div>
                        {accommodation && (
                            <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[110px_1fr] items-start gap-2">
                                <span className="font-bold text-gray-800">ที่พัก</span>
                                <span className="break-words line-clamp-2">{accommodation}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-[120px] shrink-0 order-first sm:order-last mb-4 sm:mb-0">
                        <img
                            src={image}
                            alt="Tour"
                            className="w-full h-[100px] sm:h-[120px] object-cover rounded-xl shadow-sm border border-gray-200"
                        />
                    </div>
                </div>

                {/* เส้นแบ่ง 1 */}
                <hr className="border-t border-gray-200 my-4" />

                <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                    <h4 className="font-bold text-gray-800 mb-4 text-base hidden md:block">รายละเอียดราคา</h4>
                    <div className="space-y-3 text-[15px] text-gray-700 font-medium">
                        {adults > 0 && (
                            <div className="flex justify-between items-center">
                                <span>ผู้ใหญ่</span>
                                <span className="flex-1 text-center text-gray-500">{adultPrice.toLocaleString()} × {adults}</span>
                                <span className="font-bold text-gray-800 w-28 text-right">{(adults * adultPrice).toLocaleString()} บาท</span>
                            </div>
                        )}
                        {children > 0 && (
                            <div className="flex justify-between items-center">
                                <span>เด็ก</span>
                                <span className="flex-1 text-center text-gray-500">{childPrice.toLocaleString()} × {children}</span>
                                <span className="font-bold text-gray-800 w-28 text-right">{(children * childPrice).toLocaleString()} บาท</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* เส้นแบ่ง 2 */}
                <hr className="border-t border-gray-200 mt-auto mb-6" />

                <div className="flex justify-between items-end px-1">
                    <span className="font-bold text-gray-800 text-lg">ยอดที่ต้องชำระ:</span>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-primary">{calculatedTotal.toLocaleString()}</span>
                        <span className="text-base font-bold text-gray-800 ml-1.5">บาท</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
