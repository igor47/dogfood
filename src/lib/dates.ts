import { config } from "@src/config"
import { DateTime } from "luxon"

/**
 * Parse any date string and return UTC SQLite datetime format (YYYY-MM-DD HH:MM:SS).
 * Accepts ISO 8601 with or without timezone offsets, SQL format, etc.
 * If no timezone is specified, assumes DISPLAY_TZ (for UI form inputs).
 * Returns null if the input is not a valid date.
 */
export function toUtcSqlite(input: string): string | null {
  // Check if input has an explicit timezone offset (Z, +HH:MM, -HH:MM)
  const hasOffset = /[Zz]$|[+-]\d{2}:\d{2}$/.test(input.trim())

  // Try ISO first — use display timezone as default for naive inputs
  let dt = DateTime.fromISO(input, { zone: hasOffset ? undefined : config.displayTz })
  if (!dt.isValid) {
    // Try SQL format (always naive, so use display timezone)
    dt = DateTime.fromSQL(input, { zone: config.displayTz })
  }
  if (!dt.isValid) {
    // Try JS Date as last resort
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return null
    dt = DateTime.fromJSDate(d)
  }
  return dt.toUTC().toFormat("yyyy-MM-dd HH:mm:ss")
}

/**
 * Parse a UTC SQLite datetime string into a Luxon DateTime in the display timezone.
 */
function fromSqlite(dateStr: string): DateTime {
  // Try SQL format first (YYYY-MM-DD HH:MM:SS)
  const dt = DateTime.fromSQL(dateStr, { zone: "utc" })
  if (dt.isValid) return dt.setZone(config.displayTz)
  // Fall back to ISO
  const iso = DateTime.fromISO(dateStr, { zone: "utc" })
  if (iso.isValid) return iso.setZone(config.displayTz)
  // Last resort
  return DateTime.fromJSDate(new Date(dateStr)).setZone(config.displayTz)
}

/**
 * Format a SQLite datetime for the timeline: "Today at 5:00 PM", "Yesterday at 3:00 PM",
 * or "Mar 25 at 2:00 PM" for older dates.
 */
export function formatDatetime(dateStr: string): string {
  const dt = fromSqlite(dateStr)
  if (!dt.isValid) return "Invalid Date"

  const now = DateTime.now().setZone(config.displayTz)
  if (dt.hasSame(now, "day")) {
    return `Today at ${dt.toFormat("h:mm a")}`
  }
  if (dt.hasSame(now.minus({ days: 1 }), "day")) {
    return `Yesterday at ${dt.toFormat("h:mm a")}`
  }
  return dt.toFormat("MMM d 'at' h:mm a")
}

/**
 * Convert a UTC SQLite datetime to a value for <input type="datetime-local"> in DISPLAY_TZ.
 * Returns "YYYY-MM-DDTHH:MM" format.
 */
export function toLocalInputValue(dateStr: string): string {
  const dt = fromSqlite(dateStr)
  if (!dt.isValid) return ""
  return dt.toFormat("yyyy-MM-dd'T'HH:mm")
}

/**
 * Get today's start and end as UTC SQLite datetime strings, based on DISPLAY_TZ.
 */
export function todayUtcRange(): { start: string; end: string } {
  const now = DateTime.now().setZone(config.displayTz)
  const start = now.startOf("day").toUTC().toFormat("yyyy-MM-dd HH:mm:ss")
  const end = now.endOf("day").toUTC().toFormat("yyyy-MM-dd HH:mm:ss")
  return { start, end }
}

/**
 * Format a SQLite datetime as time only: "5:00 PM"
 */
export function formatTime(dateStr: string): string {
  const dt = fromSqlite(dateStr)
  if (!dt.isValid) return "Invalid Date"
  return dt.toFormat("h:mm a")
}
