import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDb } from "@src/db"
import type { BowelEntry } from "@src/db/bowel-entries"
import { getBowelEntry } from "@src/db/bowel-entries"
import { getDefaultDog } from "@src/db/dogs"
import type { EventEntry } from "@src/db/event-entries"
import { getEventEntry } from "@src/db/event-entries"
import type { FoodEntry } from "@src/db/food-entries"
import { getFoodEntry } from "@src/db/food-entries"
import type { SymptomEntry } from "@src/db/symptom-entries"
import { getSymptomEntry } from "@src/db/symptom-entries"
import { z } from "zod"

export type EntryTypeFilter = "food" | "bowel" | "symptom" | "event" | "all"

export interface ListEntriesOpts {
  limit?: number
  type?: EntryTypeFilter
  after?: string
  before?: string
}

interface EntryRef {
  id: string
  entry_type: "food" | "bowel" | "symptom" | "event"
  occurred_at: string
}

export type TimelineEntry =
  | { entry_type: "food"; entry: FoodEntry }
  | { entry_type: "bowel"; entry: BowelEntry }
  | { entry_type: "symptom"; entry: SymptomEntry }
  | { entry_type: "event"; entry: EventEntry }

function queryEntryRefs(dogId: string, opts: ListEntriesOpts): EntryRef[] {
  const { limit, type = "all", after, before } = opts
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

  function addPart(table: string, entryType: string, dateCol = "occurred_at", dogIdCol = "dog_id") {
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
    parts.push(
      `SELECT id, '${entryType}' AS entry_type, ${dateCol} AS occurred_at FROM ${table} WHERE ${clauses.join(" AND ")}`
    )
  }

  if (type === "all" || type === "food") {
    addPart("food_entries", "food")
  }
  if (type === "all" || type === "bowel") {
    addPart("bowel_entries", "bowel")
  }
  if (type === "all" || type === "symptom") {
    addPart("symptom_entries", "symptom")
  }
  if (type === "all" || type === "event") {
    addPart("event_entries", "event")
  }

  if (parts.length === 0) return []

  let sql = `${parts.join(" UNION ALL ")} ORDER BY occurred_at DESC`
  if (limit) {
    sql += " LIMIT ?"
    params.push(limit)
  }
  return db.query(sql).all(...params) as EntryRef[]
}

export function listRecentEntries(dogId: string, opts: ListEntriesOpts = {}): TimelineEntry[] {
  const refs = queryEntryRefs(dogId, opts)

  return refs
    .map((ref): TimelineEntry | null => {
      switch (ref.entry_type) {
        case "food": {
          const entry = getFoodEntry(ref.id)
          return entry ? { entry_type: "food", entry } : null
        }
        case "bowel": {
          const entry = getBowelEntry(ref.id)
          return entry ? { entry_type: "bowel", entry } : null
        }
        case "symptom": {
          const entry = getSymptomEntry(ref.id)
          return entry ? { entry_type: "symptom", entry } : null
        }
        case "event": {
          const entry = getEventEntry(ref.id)
          return entry ? { entry_type: "event", entry } : null
        }
        default:
          return null
      }
    })
    .filter((e): e is TimelineEntry => e !== null)
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
      const lines = entries.map((e) => {
        const occurred = "occurred_at" in e.entry ? e.entry.occurred_at : ""
        return `[${occurred}] ${e.entry_type}: ${JSON.stringify(e.entry)}`
      })
      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )
}
