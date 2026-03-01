"use client"

import Link from "next/link"
import Image from "next/image"
import type { Provider } from "@/src/types"

interface ProviderGridProps {
  providers: Provider[]
}

export default function ProviderGrid({ providers }: ProviderGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {providers.map((provider) => (
        <Link
          key={provider.id}
          href={`/events?provider=${provider.id}`}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <Image
              src={provider.logo_url || "/images/FC今治コミュニティ.jpg?height=40&width=40"}
              alt={provider.name}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="text-xs font-medium text-gray-900 text-center leading-tight">{provider.name}</span>
          <span className="text-xs text-gray-500 mt-1">{provider.category}</span>
        </Link>
      ))}
    </div>
  )
}
