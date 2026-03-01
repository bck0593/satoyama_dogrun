"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const sliderImages = [
  {
    src: "/images/slider/SL1.jpg",
    alt: "里山ドッグランの風景",
    title: "犬の保育園とは？",
    description: "日常的なケアと成長サポートを安心の環境で。",
  },
  {
    src: "/images/slider/SL2.png",
    alt: "FC今治里山ドッグラン",
    title: "FC今治 里山ドッグラン",
    description: "予約から当日チェックインまでスマホで完結。",
  },
  {
    src: "/images/slider/SL3.jpg",
    alt: "スタジアム周辺の散歩風景",
    title: "地域とつながるドッグライフ",
    description: "イベント・保育園・交流の情報をひとつに。",
  },
  {
    src: "/images/slider/SL4.jpg",
    alt: "ドッグランで遊ぶ犬",
    title: "利用中ステータスを可視化",
    description: "混雑状況を確認して快適に過ごせます。",
  },
];

export function HomeHeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
  };

  return (
    <div className="relative h-[220px] overflow-hidden border border-[#ced9ea] shadow-[0_10px_24px_rgba(13,44,92,0.15)]">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {sliderImages.map((item) => (
          <div key={item.src} className="relative h-full w-full flex-shrink-0">
            <Image src={item.src} alt={item.alt} fill className="object-cover" priority={item === sliderImages[0]} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            <div className="absolute bottom-4 left-4 max-w-[76%] rounded-xl bg-[#4b5f36]/82 px-3 py-2 text-white backdrop-blur-[1px]">
              <p className="text-lg font-bold leading-tight">{item.title}</p>
              <p className="mt-1 text-[11px] text-white/90">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={goToPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/24 p-2 text-white transition hover:bg-black/40"
        aria-label="前の画像"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={goToNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/24 p-2 text-white transition hover:bg-black/40"
        aria-label="次の画像"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            aria-label={`スライド${index + 1}`}
            className={`rounded-full transition-all ${
              index === currentIndex ? "h-2 w-4 bg-white" : "h-2 w-2 bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
