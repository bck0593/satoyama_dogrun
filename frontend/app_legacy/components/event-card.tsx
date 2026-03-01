import Image from "next/image"
import Link from "next/link"

import { formatEventDate } from "@/app/lib/date-utils"

import type { Event } from "@/src/types"

import TagBadge from "./tag-badge"
import VenuePill from "./venue-pill"

const FALLBACK_HERO = "/images/fc-imabari-community.jpg"

interface EventCardProps {
  event: Event
  className?: string
}

export default function EventCard({ event, className = "" }: EventCardProps) {
  const imageSrc = event.hero_image_url || FALLBACK_HERO

  return (
    <Link href={`/events/${event.slug}`}>
      <div
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}
      >
        <div className="relative h-48 w-full">
          <Image src={imageSrc} alt={event.title} fill className="object-cover" />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-strong leading-tight flex-1 text-balance">{event.title}</h3>
            {event.venue && <VenuePill venue={event.venue} />}
          </div>

          {event.summary && <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{event.summary}</p>}

          <div className="text-sm text-gray-500">{formatEventDate(event.start_at, event.end_at)}</div>

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {event.tags.length > 3 && (
                <span className="text-xs text-gray-400 px-2 py-1">+{event.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
