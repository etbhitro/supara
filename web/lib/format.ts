// Деньги (сом) и даты. Даты в данных — строки YYYY-MM-DD по местному времени.

export function formatSom(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value).toLocaleString("ru-RU")} сом`;
}

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function nightsBetween(from: string, to: string): number {
  return Math.round((fromISO(to).getTime() - fromISO(from).getTime()) / 86_400_000);
}

const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

export function formatDay(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function weekday(iso: string): string {
  return WEEKDAYS[fromISO(iso).getDay()];
}

export function isWeekend(iso: string): boolean {
  const n = fromISO(iso).getDay();
  return n === 0 || n === 6;
}

export function formatRange(from: string, to: string): string {
  return `${formatDay(from)} – ${formatDay(to)}`;
}
