export function formatEventDate(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)

  const startDate = start.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })

  const startTime = start.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const endTime = end.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  // Same day
  if (start.toDateString() === end.toDateString()) {
    return `${startDate} ${startTime}-${endTime}`
  }

  // Different days
  const endDate = end.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })

  return `${startDate} ${startTime} - ${endDate} ${endTime}`
}

export function formatReportDate(publishedAt: string): string {
  const date = new Date(publishedAt)

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
}

export function formatDetailDate(dateString: string): string {
  const date = new Date(dateString)

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })
}

export function formatDetailTime(dateString: string): string {
  const date = new Date(dateString)

  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}
