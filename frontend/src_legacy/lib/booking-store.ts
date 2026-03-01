import type { DogrunBooking } from "../types"

const bookings = new Map<string, DogrunBooking>()
const checkins = new Map<string, { bookingId: string; when: string }>()

export function saveBooking(booking: DogrunBooking): void {
  bookings.set(booking.id, booking)
}

export function getBooking(id: string): DogrunBooking | undefined {
  return bookings.get(id)
}

export function getAllBookings(): DogrunBooking[] {
  return Array.from(bookings.values())
}

export function updateBookingStatus(id: string, status: DogrunBooking["status"]): boolean {
  const booking = bookings.get(id)
  if (booking) {
    booking.status = status
    bookings.set(id, booking)
    return true
  }
  return false
}

export function recordCheckin(bookingId: string): void {
  checkins.set(bookingId, {
    bookingId,
    when: new Date().toISOString(),
  })
}

export function getCheckin(bookingId: string) {
  return checkins.get(bookingId)
}

export function getBookingsByDate(date: string): DogrunBooking[] {
  return Array.from(bookings.values()).filter((booking) => booking.date === date)
}

export function getBookingsByDateAndTime(date: string, time: string): DogrunBooking[] {
  return Array.from(bookings.values()).filter(
    (booking) => booking.date === date && booking.time === time && booking.status !== "cancelled",
  )
}
