interface ItineraryItem {
  day?: number
  time: string
  title: string
  description: string
}

interface TourItineraryProps {
  items: ItineraryItem[]
}

export default function TourItinerary({ items }: TourItineraryProps) {
  if (items.length === 0) return null

  // เช็คว่ามีข้อมูลแบบ "วัน" หรือไม่
  const hasDays = items.some(item => item.day)

  // ถ้าไม่มีวัน (One Day Trip) -> แสดงแบบเดิม
  if (!hasDays) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">กำหนดการ</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 relative">
              {/* เส้นเชื่อม timeline */}
              <div className="relative flex-shrink-0 w-5 flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5DC7EA] z-10" />
                {i < items.length - 1 && (
                  <span className="absolute top-2.5 bottom-[-12px] w-[2px] bg-[#DDF2FB]" />
                )}
              </div>

              <div className="flex-1 bg-gray-50 rounded-lg p-3.5 mb-1">
                <p className="text-sm font-medium text-gray-500 mb-0.5">{item.time}</p>
                <p className="font-semibold text-gray-800 text-base">{item.title}</p>
                {item.description && (
                  <p className="text-gray-500 text-sm font-medium mt-1">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ถ้ามีวัน (Package Tour) -> Group by Day
  const scheduleByDay = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    const day = item.day || 1
    if (!acc[day]) acc[day] = []
    acc[day].push(item)
    return acc
  }, {})

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
      <h2 className="text-lg font-bold text-gray-900 mb-4">กำหนดการเดินทาง</h2>

      <div className="space-y-6">
        {Object.entries(scheduleByDay).sort(([a], [b]) => Number(a) - Number(b)).map(([day, dayItems]) => (
          <div key={day}>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                วันที่ {day}
              </span>
              <div className="h-[1px] flex-1 bg-gray-200"></div>
            </div>

            <div className="space-y-3 pl-2">
              {dayItems.map((item, i) => (
                <div key={i} className="flex gap-3 relative">
                  <div className="relative flex-shrink-0 w-5 flex flex-col items-center pt-1.5">
                    <span className="w-2 h-2 rounded-full border-2 border-blue-400 bg-white z-10" />
                    {i < dayItems.length - 1 && (
                      <span className="absolute top-3 bottom-[-12px] w-[1px] bg-blue-100" />
                    )}
                  </div>

                  <div className="flex-1 pb-1">
                    <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-baseline">
                      <span className="font-mono text-sm font-bold text-blue-600 min-w-[45px]">{item.time}</span>
                      <span className="font-semibold text-gray-800">{item.title}</span>
                    </div>
                    {item.description && (
                      <p className="text-gray-500 text-sm mt-0.5 ml-0 sm:ml-[53px]">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
