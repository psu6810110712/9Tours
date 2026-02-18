interface ItineraryItem {
  time: string
  title: string
  description: string
}

interface TourItineraryProps {
  items: ItineraryItem[]
}

export default function TourItinerary({ items }: TourItineraryProps) {
  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-xl p-5 mb-4">
      <h2 className="font-bold text-gray-800 mb-4">กำหนดการ</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4">
            <div className="text-right flex-shrink-0 w-28">
              <span className="text-xs font-semibold text-[#F5A623] bg-[#F5A623]/10 px-2 py-1 rounded">
                {item.time}
              </span>
            </div>
            <div className="flex-1 border-l-2 border-gray-100 pl-4 pb-2">
              <p className="font-medium text-gray-800 text-sm">{item.title}</p>
              {item.description && (
                <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
