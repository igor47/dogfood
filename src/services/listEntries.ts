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

export interface ListEntriesOpts {
  limit?: number
  type?: EntryTypeFilter
  after?: string
  before?: string
}

export function listRecentEntries(dogId: string, opts: ListEntriesOpts = {}): TimelineEntry[] {
  const { limit = 20, type = "all", after, before } = opts
  const db = getDb()

  const parts: string[] = []
  const params: (string | number)[] = []

  // If before is a bare date (no time), use < next day for full-day inclusion
  let beforeBound = before
  let beforeOp = "<="
  if (before && !before.includes(" ")) {
    const d = new Date(`${before}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + 1)
    beforeBound = d.toISOString().slice(0, 10)
    beforeOp = "<"
  }

  function addPart(sql: string, dateCol: string, dogIdCol = "dog_id") {
    const clauses = [`${dogIdCol} = ?`]
    params.push(dogId)
    if (after) {
      clauses.push(`${dateCol} >= ?`)
      params.push(after)
    }
    if (beforeBound) {
      clauses.push(`${dateCol} ${beforeOp} ?`)
      params.push(beforeBound)
    }
    parts.push(sql.replace("__WHERE__", clauses.join(" AND ")))
  }

  if (type === "all" || type === "food") {
    addPart(
      `SELECT food_entries.id, food_entries.dog_id, 'food' AS entry_type, food_entries.entry_kind,
        food_entries.entry_kind || ': ' || food_entries.food_name ||
        COALESCE(' — ' || food_entries.quantity || ' ' || food_entries.unit, '') ||
        COALESCE(' (' || CAST(food_entries.quantity * foods.calories_per_unit AS INTEGER) || ' cal)', '') AS summary,
        food_entries.occurred_at, food_entries.created_at
      FROM food_entries
      LEFT JOIN foods ON food_entries.food_id = foods.id
      WHERE __WHERE__`,
      "food_entries.occurred_at",
      "food_entries.dog_id"
    )
  }

  if (type === "all" || type === "bowel") {
    addPart(
      `SELECT id, dog_id, 'bowel' AS entry_type, NULL AS entry_kind,
        'Bowel movement (consistency: ' || consistency || '/7)' AS summary,
        occurred_at, created_at
      FROM bowel_entries WHERE __WHERE__`,
      "occurred_at"
    )
  }

  if (type === "all" || type === "symptom") {
    addPart(
      `SELECT id, dog_id, 'symptom' AS entry_type, NULL AS entry_kind,
        symptom_type || ' (severity: ' || severity || '/5)' AS summary,
        occurred_at, created_at
      FROM symptom_entries WHERE __WHERE__`,
      "occurred_at"
    )
  }

  if (type === "all" || type === "event") {
    addPart(
      `SELECT id, dog_id, 'event' AS entry_type, NULL AS entry_kind,
        event_type ||
        COALESCE(' — ' || medication_name, '') ||
        COALESCE(' — ' || weight_kg || ' kg', '') AS summary,
        occurred_at, created_at
      FROM event_entries WHERE __WHERE__`,
      "occurred_at"
    )
  }

  if (parts.length === 0) return []

  params.push(limit)
  const sql = `${parts.join(" UNION ALL ")} ORDER BY occurred_at DESC LIMIT ?`

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
      const entries = listRecentEntries(dog.id, { limit, type: entry_type as EntryTypeFilter })
      if (entries.length === 0) {
        return { content: [{ type: "text" as const, text: "No entries found." }] }
      }
      const lines = entries.map((e) => `[${e.occurred_at}] ${e.entry_type}: ${e.summary}`)
      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )
}
