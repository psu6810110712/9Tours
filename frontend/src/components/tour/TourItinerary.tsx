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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
      <h2 className="font-bold text-gray-800 mb-4">กำหนดการ</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="relative flex-shrink-0 w-5">
              <span className="absolute top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#5DC7EA]" />
              {i < items.length - 1 && <span className="absolute top-4 left-1/2 -translate-x-1/2 w-[2px] h-[calc(100%-8px)] bg-[#DDF2FB]" />}
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">{item.time}</p>
              <p className="font-medium text-gray-800 text-sm">{item.title}</p>
              {item.description && (
                <p className="text-gray-500 text-xs mt-1">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
