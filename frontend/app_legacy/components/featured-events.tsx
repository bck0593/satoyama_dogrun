"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, ChevronRight } from "lucide-react"
import { fetchEvents } from "@/src/lib/api"
import type { Event } from "@/src/types"
import EventCard from "./event-card"
import SectionHeading from "./section-heading"

export default function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetchEvents({ page: 1 })
        setEvents(response.items.slice(0, 3))
      } catch (error) {
        console.error("Failed to load featured events:", error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  if (loading) {
    return (
      <div className="px-4 mb-8">
        <SectionHeading title="注目のイベント" icon={<Calendar className="w-5 h-5" />} />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <SectionHeading title="注目のイベント" icon={<Calendar className="w-5 h-5" />} />
        <Link
          href="/events"
          className="flex items-center text-sm text-brand-primary hover:text-brand-primary/80 transition-colors"
        >
          すべて見る
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
