import { format } from "date-fns";

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

export function formatDateDisplay(value: Date | string | null | undefined, fallback = "-"): string {
  if (!value) return fallback;

  if (typeof value === "string") {
    const match = value.match(DATE_ONLY_RE);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : format(date, "dd-MM-yyyy");
}
