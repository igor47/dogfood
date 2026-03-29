import { DateTime } from "luxon"

/**
 * Parse any date string and return UTC SQLite datetime format (YYYY-MM-DD HH:MM:SS).
 * Accepts ISO 8601 with or without timezone offsets, SQL format, etc.
 * If no timezone is specified, assumes UTC.
 * Returns null if the input is not a valid date.
 */
export function toUtcSqlite(input: string): string | null {
  // Try ISO first (handles offsets like "2026-03-28T05:00:00-07:00")
  let dt = DateTime.fromISO(input, { zone: "utc" })
  if (!dt.isValid) {
    // Try SQL format
    dt = DateTime.fromSQL(input, { zone: "utc" })
  }
  if (!dt.isValid) {
    // Try JS Date as last resort
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return null
    dt = DateTime.fromJSDate(d).toUTC()
  }
  return dt.toUTC().toFormat("yyyy-MM-dd HH:mm:ss")
}

/**
 * Parse a UTC SQLite datetime string into a Luxon DateTime.
 */
function fromSqlite(dateStr: string): DateTime {
  // Try SQL format first (YYYY-MM-DD HH:MM:SS)
  const dt = DateTime.fromSQL(dateStr, { zone: "utc" })
  if (dt.isValid) return dt
  // Fall back to ISO
  const iso = DateTime.fromISO(dateStr, { zone: "utc" })
  if (iso.isValid) return iso
  // Last resort
  return DateTime.fromJSDate(new Date(dateStr))
}

/**
 * Format a SQLite datetime for the timeline: "Today at 5:00 PM", "Yesterday at 3:00 PM",
 * or "Mar 25 at 2:00 PM" for older dates.
 */
export function formatDatetime(dateStr: string): string {
  const dt = fromSqlite(dateStr).toLocal()
  if (!dt.isValid) return "Invalid Date"

  const now = DateTime.local()
  if (dt.hasSame(now, "day")) {
    return `Today at ${dt.toFormat("h:mm a")}`
  }
  if (dt.hasSame(now.minus({ days: 1 }), "day")) {
    return `Yesterday at ${dt.toFormat("h:mm a")}`
  }
  return dt.toFormat("MMM d 'at' h:mm a")
}

/**
 * Format a SQLite datetime as time only: "5:00 PM"
 */
export function formatTime(dateStr: string): string {
  const dt = fromSqlite(dateStr).toLocal()
  if (!dt.isValid) return "Invalid Date"
  return dt.toFormat("h:mm a")
}
