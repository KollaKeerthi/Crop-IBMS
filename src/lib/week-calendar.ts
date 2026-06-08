const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getFirstMondayOfYear(year: number) {
  const janFirst = new Date(year, 0, 1);
  const offset = (8 - janFirst.getDay()) % 7;
  return new Date(year, 0, 1 + offset);
}

export function getWeeksInYear(year: number) {
  const firstMonday = getFirstMondayOfYear(year);
  const nextFirstMonday = getFirstMondayOfYear(year + 1);
  return Math.ceil((nextFirstMonday.getTime() - firstMonday.getTime()) / (7 * MS_PER_DAY));
}

export function getWeekStartDate(year: number, week: number) {
  const firstMonday = getFirstMondayOfYear(year);
  const date = new Date(firstMonday);
  date.setDate(firstMonday.getDate() + (week - 1) * 7);
  return date;
}

export function getWeekEndDate(year: number, week: number) {
  const date = getWeekStartDate(year, week);
  date.setDate(date.getDate() + 6);
  return date;
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(date: Date | string | null | undefined) {
  if (!date) return "-";
  const parsed = date instanceof Date ? date : parseDateInput(date);
  if (!parsed) return "-";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${parsed.getFullYear()}`;
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}
