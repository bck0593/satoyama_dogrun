"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const sliderImages = [
  {
    id: 1,
    src: "/images/slider/SL1.jpg",
    alt: "しまなみサンセットマルシェ (今治港)",
  },
  {
    id: 2,
    src: "/images/slider/SL2.png",
    alt: "アシさとクラブ体験会 (里山スタジアム)",
  },
  {
    id: 3,
    src: "/images/slider/SL3.jpg",
    alt: "FC今治ホームゲーム応援デー (里山スタジアム)",
  },
  {
    id: 4,
    src: "/images/slider/SL4.jpg",
    alt: "犬のしつけ教室 (今治ドッグラン)",
  },
]

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderImages.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? sliderImages.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderImages.length)
  }

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-2xl bg-gray-100">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {sliderImages.map((image) => (
          <div key={image.id} className="w-full h-full flex-shrink-0">
            <img src={image.src || "/images/FC今治コミュニティ.jpg"} alt={image.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
        aria-label="前の画像"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
        aria-label="次の画像"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/50"}`}
            aria-label={`画像 ${index + 1} に移動`}
          />
        ))}
      </div>
    </div>
  )
}
