const TOKYO_TIMEZONE_OFFSET = "+09:00";

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateString(): string {
  return toDateString(new Date());
}

export function toTokyoDateTimeValue(date: string, time: string): number {
  const hhmm = time.slice(0, 5);
  return new Date(`${date}T${hhmm}:00${TOKYO_TIMEZONE_OFFSET}`).getTime();
}

/** Format an ISO datetime as `YYYY/MM/DD HH:mm` (ja-JP), or `fallback` when missing/invalid. */
export function formatDateTimeJa(value: string | null | undefined, fallback = "-"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format an ISO datetime as `HH:mm` (ja-JP), or `fallback` when missing/invalid. */
export function formatClockJa(value: string | null | undefined, fallback = "--:--"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}
