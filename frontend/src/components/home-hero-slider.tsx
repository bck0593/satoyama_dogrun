"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { apiClient } from "@/src/lib/api";
import { resolveMediaUrl } from "@/src/lib/media";
import type { HomeHeroSlide } from "@/src/lib/types";

type SliderItem = {
  id: string | number;
  image_url: string;
  alt_text: string;
  title: string;
  description: string;
};

const fallbackSlides: SliderItem[] = [
  {
    id: "fallback-1",
    image_url: "/images/slider/SL1.jpg",
    alt_text: "里山ドッグランの風景",
    title: "里山の自然に囲まれたドッグラン",
    description: "犬と飼い主が安心して過ごせる空間を提供します。",
  },
  {
    id: "fallback-2",
    image_url: "/images/slider/SL2.png",
    alt_text: "FC今治里山ドッグラン",
    title: "FC今治 里山ドッグラン",
    description: "予約からチェックインまでスマートに利用できます。",
  },
  {
    id: "fallback-3",
    image_url: "/images/slider/SL3.jpg",
    alt_text: "スタジアム周辺の散歩コース",
    title: "地域とつながるドッグライフ",
    description: "イベント情報や施設情報をひとつに。",
  },
  {
    id: "fallback-4",
    image_url: "/images/slider/SL4.jpg",
    alt_text: "ドッグランで遊ぶ犬",
    title: "利用中ステータスをリアルタイム確認",
    description: "混雑状況を見ながら快適に利用できます。",
  },
];

function mapSlideFromApi(slide: HomeHeroSlide): SliderItem {
  return {
    id: slide.id,
    image_url: resolveMediaUrl(slide.image_url || slide.image),
    alt_text: slide.alt_text || slide.title,
    title: slide.title,
    description: slide.description || "",
  };
}

export function HomeHeroSlider() {
  const [slides, setSlides] = useState<SliderItem[]>(fallbackSlides);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const payload = await apiClient.getHomeHeroSlides();
        if (payload.length > 0) {
          setSlides(payload.map(mapSlideFromApi));
          setCurrentIndex(0);
        }
      } catch {
        // keep fallback slides
      }
    };

    loadSlides().catch(() => null);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [slides]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative h-[220px] overflow-hidden border border-[#ced9ea] shadow-[0_10px_24px_rgba(13,44,92,0.15)]">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((item, index) => (
          <div key={item.id} className="relative h-full w-full flex-shrink-0">
            <img
              src={item.image_url}
              alt={item.alt_text}
              className="h-full w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            <div className="absolute bottom-4 left-4 max-w-[76%] rounded-xl bg-[#4b5f36]/82 px-3 py-2 text-white backdrop-blur-[1px]">
              <p className="text-lg font-bold leading-tight">{item.title}</p>
              {item.description ? <p className="mt-1 text-[11px] text-white/90">{item.description}</p> : null}
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <>
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
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`スライド${index + 1}`}
                className={`rounded-full transition-all ${index === currentIndex ? "h-2 w-4 bg-white" : "h-2 w-2 bg-white/70"}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
