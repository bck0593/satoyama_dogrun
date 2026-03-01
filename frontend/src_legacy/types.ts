export type Tag = {
  id: string
  name: string
  slug: string
}

export type Category = {
  id: string
  name: string
  slug: string
}

export type Provider = {
  id: "fcimabari" | "tgf" | "asisato" | "dogrun"
  name: string
  url: string
  category?: string
  logo_url?: string
}

export type Venue = {
  name: string
  address?: string
  lat?: number
  lng?: number
}

export type EventApplicationType = "internal_form" | "external_link" | "offline"

export type Event = {
  id: string
  slug: string
  title: string
  summary?: string
  body_md?: string
  hero_image_url?: string
  start_at: string // ISO
  end_at: string // ISO
  provider_id: Provider["id"]
  category?: Category
  tags: Tag[]
  venue?: Venue
  application_type: EventApplicationType
  application_url?: string
  application_note?: string
  report_slugs?: string[]
}

export type Report = {
  id: string
  slug: string
  title: string
  body_md: string
  hero_image_url?: string
  published_at: string // ISO
  provider_id?: Provider["id"]
  event_slug?: string
  tags: Tag[]
}

export type Application = {
  id: string
  event_slug: string
  created_at: string
  name: string
  email: string
  phone?: string
  headcount?: number
  payload: Record<string, unknown>
  status: "pending" | "approved" | "rejected"
}

export type Thread = {
  id: string
  title: string
  created_at: string
  author: string
  body_md: string
}

export type Comment = {
  id: string
  thread_id: string
  author: string
  body_md: string
  created_at: string
}

export type ApiResponse<T> = {
  items: T[]
  page: number
  page_size: number
  total: number
}

export type DogrunSlot = {
  date: string
  time: string
  capacity: number
  reserved: number
}

export type DogrunBooking = {
  id: string
  date: string
  time: string
  people: number
  dogs: number
  name: string
  email: string
  phone?: string
  dogs_detail?: { name?: string; breed?: string }[]
  health: { rabies: boolean; mixed_vaccine: boolean; in_heat?: boolean }
  status: "pending" | "checked_in" | "cancelled"
  qr_token?: string
  number: string
  created_at: string
}
