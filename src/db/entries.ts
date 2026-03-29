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
      SELECT food_entries.id, food_entries.dog_id, 'food' AS entry_type,
        food_entries.entry_kind || ': ' || food_entries.food_name ||
        COALESCE(' — ' || food_entries.quantity || ' ' || food_entries.unit, '') ||
        COALESCE(' (' || CAST(food_entries.quantity * foods.calories_per_unit AS INTEGER) || ' cal)', '') AS summary,
        food_entries.meal_time AS occurred_at, food_entries.created_at
      FROM food_entries
      LEFT JOIN foods ON food_entries.food_id = foods.id
      WHERE food_entries.dog_id = ?
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
