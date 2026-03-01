"use client"

import Image from "next/image"
import Link from "next/link"

type CategoryImage = {
  src: string
  width: number
  height: number
}

type Category = {
  id: string
  name: string
  href: string
  image?: CategoryImage
}

const FALLBACK_IMAGE: CategoryImage = {
  src: "/images/FC今治コミュニティ.jpg",
  width: 1200,
  height: 630,
}

const categories: Category[] = [
  {
    id: "events",
    name: "イベント",
    href: "/events",
  },
  {
    id: "asisato",
    name: "アシさとクラブ",
    href: "/asisato/membership",
    image: {
      src: "/images/アシさとクラブ.jpg",
      width: 736,
      height: 530,
    },
  },
  {
    id: "dogrun",
    name: "ドッグラン",
    href: "/dogrun",
    image: {
      src: "/images/ドッグラン.png",
      width: 924,
      height: 321,
    },
  },
]

export default function CategoryIconGrid() {
  const eventsCategory = categories.find((cat) => cat.id === "events")
  const otherCategories = categories.filter((cat) => cat.id !== "events")

  return (
    <div className="px-4 -mt-4 mb-6 space-y-4">
      {eventsCategory && (
        <div className="w-full">
          <Link
            href={eventsCategory.href}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow w-full"
          >
            <div className="relative w-full aspect-[2/1] mb-3 overflow-hidden rounded-lg">
              <Image
                src={(eventsCategory.image ?? FALLBACK_IMAGE).src}
                alt={eventsCategory.name}
                width={(eventsCategory.image ?? FALLBACK_IMAGE).width}
                height={(eventsCategory.image ?? FALLBACK_IMAGE).height}
                className="h-full w-full object-contain rounded-xl"
                priority
                sizes="(max-width:640px) 100vw, 320px"
              />
            </div>
            <span className="text-sm font-medium text-gray-900 text-center leading-tight">
              {eventsCategory.name}
            </span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {otherCategories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow"
          >
            <div className="relative w-full aspect-[2/1] mb-3 overflow-hidden rounded-lg">
              <Image
                src={(category.image ?? FALLBACK_IMAGE).src}
                alt={category.name}
                width={(category.image ?? FALLBACK_IMAGE).width}
                height={(category.image ?? FALLBACK_IMAGE).height}
                className="h-full w-full object-contain rounded-xl"
                sizes="(max-width:640px) 100vw, 320px"
              />
            </div>
            <span className="text-sm font-medium text-gray-900 text-center leading-tight">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

