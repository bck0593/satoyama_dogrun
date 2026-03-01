import { MapPin } from "lucide-react"
import type { Venue } from "@/src/types"

interface VenuePillProps {
  venue: Venue
  className?: string
}

export default function VenuePill({ venue, className = "" }: VenuePillProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium ${className}`}
    >
      <MapPin className="w-3 h-3" />
      <span className="truncate max-w-20">{venue.name}</span>
    </div>
  )
}
