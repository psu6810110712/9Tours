import React from 'react';

interface ItineraryItem {
    day?: number;
    time: string;
    title: string;
    description: string;
}

interface ItinerarySectionProps {
    itinerary: ItineraryItem[];
    tourType: 'package' | 'one_day';
    setItinerary: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
}

export default function ItinerarySection({
    itinerary,
    tourType,
    setItinerary,
}: ItinerarySectionProps) {
    const addItinerary = () => {
        setItinerary([...itinerary, { day: tourType === 'package' ? 1 : undefined, time: '', title: '', description: '' }]);
    };

    const removeItinerary = (index: number) => {
        setItinerary(itinerary.filter((_, i) => i !== index));
    };

    const updateItinerary = (index: number, field: keyof ItineraryItem, value: string | number) => {
        setItinerary(itinerary.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    แผนการเดินทาง (Itinerary)
                </h2>
                <button
                    type="button"
                    onClick={addItinerary}
                    className="text-primary font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    เพิ่มกิจกรรม
                </button>
            </div>

            <div className="space-y-4">
                {itinerary.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 group">
                        {tourType === 'package' && (
                            <div className="w-24 shrink-0">
                                <label className="block text-xs font-bold text-gray-500 mb-1">วันที่</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="Day 1"
                                    value={item.day || ''}
                                    onChange={(e) => updateItinerary(index, 'day', parseInt(e.target.value))}
                                />
                            </div>
                        )}
                        <div className="w-32 shrink-0">
                            <label className="block text-xs font-bold text-gray-500 mb-1">เวลา</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                placeholder="08:00"
                                value={item.time}
                                onChange={(e) => updateItinerary(index, 'time', e.target.value)}
                            />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">กิจกรรม</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-bold"
                                    placeholder="ชื่อกิจกรรม"
                                    value={item.title}
                                    onChange={(e) => updateItinerary(index, 'title', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียด</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-gray-600"
                                    placeholder="รายละเอียดเพิ่มเติม..."
                                    value={item.description}
                                    onChange={(e) => updateItinerary(index, 'description', e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeItinerary(index)}
                            className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all self-center ml-2"
                            title="ลบกิจกรรม"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}

                {itinerary.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium">ยังไม่มีแผนการเดินทาง</p>
                        <p className="text-gray-400 text-sm mt-1">คลิกปุ่ม "เพิ่มกิจกรรม" ด้านบนเพื่อเริ่มสร้างแผน</p>
                    </div>
                )}
            </div>
        </div>
    );
}
