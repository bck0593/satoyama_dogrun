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
