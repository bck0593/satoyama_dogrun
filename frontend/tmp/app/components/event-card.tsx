import Image from "next/image"
import Link from "next/link"
import type { Event } from "@/src/types"
import TagBadge from "./tag-badge"
import VenuePill from "./venue-pill"
import { formatEventDate } from "@/app/lib/date-utils"

interface EventCardProps {
  event: Event
  className?: string
}

export default function EventCard({ event, className = "" }: EventCardProps) {
  return (
    <Link href={`/events/${event.slug}`}>
      <div
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}
      >
        {event.hero_image_url && (
          <div className="relative h-48 w-full">
            <Image src={event.hero_image_url || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg text-strong leading-tight flex-1 mr-2">{event.title}</h3>
            {event.venue && <VenuePill venue={event.venue} />}
          </div>

          {event.summary && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.summary}</p>}

          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">{formatEventDate(event.start_at, event.end_at)}</div>
          </div>

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
