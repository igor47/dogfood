import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDb } from "@src/db"
import { getDefaultDog } from "@src/db/dogs"
import { z } from "zod"

export interface TimelineEntry {
  id: string
  dog_id: string
  entry_type: "food" | "bowel" | "symptom" | "event"
  entry_kind: string | null
  summary: string
  occurred_at: string
  created_at: string
}

export type EntryTypeFilter = "food" | "bowel" | "symptom" | "event" | "all"

export function listRecentEntries(
  dogId: string,
  limit = 20,
  type: EntryTypeFilter = "all"
): TimelineEntry[] {
  const db = getDb()

  const parts: string[] = []

  if (type === "all" || type === "food") {
    parts.push(`
      SELECT food_entries.id, food_entries.dog_id, 'food' AS entry_type, food_entries.entry_kind,
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
      SELECT id, dog_id, 'bowel' AS entry_type, NULL AS entry_kind,
        'Bowel movement (consistency: ' || consistency || '/7)' AS summary,
        occurred_at, created_at
      FROM bowel_entries WHERE dog_id = ?
    `)
  }

  if (type === "all" || type === "symptom") {
    parts.push(`
      SELECT id, dog_id, 'symptom' AS entry_type, NULL AS entry_kind,
        symptom_type || ' (severity: ' || severity || '/5)' AS summary,
        occurred_at, created_at
      FROM symptom_entries WHERE dog_id = ?
    `)
  }

  if (type === "all" || type === "event") {
    parts.push(`
      SELECT id, dog_id, 'event' AS entry_type, NULL AS entry_kind,
        event_type ||
        COALESCE(' — ' || medication_name, '') ||
        COALESCE(' — ' || weight_kg || ' kg', '') AS summary,
        occurred_at, created_at
      FROM event_entries WHERE dog_id = ?
    `)
  }

  if (parts.length === 0) return []

  const sql = `${parts.join(" UNION ALL ")} ORDER BY occurred_at DESC LIMIT ?`
  const params = [...parts.map(() => dogId), limit]

  return db.query(sql).all(...params) as TimelineEntry[]
}

export function registerGetRecentEntriesTool(server: McpServer) {
  server.registerTool(
    "get_recent_entries",
    {
      description: "Get recent health log entries for the dog.",
      inputSchema: {
        limit: z.number().optional().default(20),
        entry_type: z
          .enum(["food", "bowel", "symptom", "event", "all"])
          .optional()
          .default("all")
          .describe("Filter by entry type"),
      },
    },
    async ({ limit, entry_type }) => {
      const dog = getDefaultDog()
      const entries = listRecentEntries(dog.id, limit, entry_type as EntryTypeFilter)
      if (entries.length === 0) {
        return { content: [{ type: "text" as const, text: "No entries found." }] }
      }
      const lines = entries.map((e) => `[${e.occurred_at}] ${e.entry_type}: ${e.summary}`)
      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )
}
