import { useState } from 'react'

interface TourGalleryProps {
  images: string[]
  name: string
}

export default function TourGallery({ images, name }: TourGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="mb-6">
      <div className="rounded-xl overflow-hidden h-80 mb-2">
        <img
          src={images[activeIndex] || images[0]}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}>
              <img
                src={img}
                alt=""
                className={`w-20 h-14 object-cover rounded-lg flex-shrink-0 transition-opacity ${
                  activeIndex === i
                    ? 'opacity-100 ring-2 ring-[#F5A623]'
                    : 'opacity-60 hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
