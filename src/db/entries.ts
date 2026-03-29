import { getDb } from "../db"

export interface TimelineEntry {
  id: string
  dog_id: string
  entry_type: "food" | "bowel" | "health"
  summary: string
  occurred_at: string
  created_at: string
}

export function listRecentEntries(
  dogId: string,
  limit = 20,
  type: "food" | "bowel" | "health" | "all" = "all"
): TimelineEntry[] {
  const db = getDb()

  const parts: string[] = []

  if (type === "all" || type === "food") {
    parts.push(`
      SELECT id, dog_id, 'food' AS entry_type,
        entry_kind || ': ' || food_name ||
        COALESCE(' — ' || quantity || ' ' || unit, '') ||
        COALESCE(' (' || CAST(CAST(calories AS INTEGER) AS TEXT) || ' cal)', '') AS summary,
        meal_time AS occurred_at, created_at
      FROM food_entries WHERE dog_id = ?
    `)
  }

  if (type === "all" || type === "bowel") {
    parts.push(`
      SELECT id, dog_id, 'bowel' AS entry_type,
        'Bowel movement (consistency: ' || consistency || '/7)' AS summary,
        occurred_at, created_at
      FROM bowel_entries WHERE dog_id = ?
    `)
  }

  if (type === "all" || type === "health") {
    parts.push(`
      SELECT id, dog_id, 'health' AS entry_type,
        entry_type || ' (severity: ' || severity || '/5)' AS summary,
        occurred_at, created_at
      FROM health_entries WHERE dog_id = ?
    `)
  }

  if (parts.length === 0) return []

  const sql = `${parts.join(" UNION ALL ")} ORDER BY occurred_at DESC LIMIT ?`
  const params = [...parts.map(() => dogId), limit]

  return db.query(sql).all(...params) as TimelineEntry[]
}
