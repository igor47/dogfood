import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { BowelColor, Consistency, Urgency } from "@src/db/bowel-entries"
import { type BowelEntry, createBowelEntry } from "@src/db/bowel-entries"
import { getDefaultDog } from "@src/db/dogs"
import { z } from "zod"

export interface LogBowelInput {
  consistency: Consistency
  color?: BowelColor
  has_blood?: boolean
  has_mucus?: boolean
  straining?: boolean
  urgency?: Urgency
  occurred_at?: string
  notes?: string
}

export function logBowel(input: LogBowelInput): BowelEntry {
  const dog = getDefaultDog()
  return createBowelEntry({
    dog_id: dog.id,
    consistency: input.consistency,
    color: input.color,
    has_blood: input.has_blood,
    has_mucus: input.has_mucus,
    straining: input.straining,
    urgency: input.urgency,
    occurred_at: input.occurred_at || new Date().toISOString(),
    notes: input.notes,
  })
}

export function registerLogBowelTool(server: McpServer) {
  server.registerTool(
    "log_bowel_movement",
    {
      description:
        "Log a bowel movement. Consistency uses a 1-7 Bristol-like scale: 1=hard pellets, 2=lumpy sausage, 3=sausage with cracks, 4=smooth soft sausage (ideal), 5=soft blobs, 6=mushy, 7=liquid.",
      inputSchema: {
        consistency: z.number().min(1).max(7).describe("Bristol scale 1-7"),
        color: z.string().optional().describe("e.g. brown, dark brown, yellow, green, black, red"),
        has_blood: z.boolean().optional(),
        has_mucus: z.boolean().optional(),
        straining: z.boolean().optional(),
        urgency: z
          .number()
          .min(0)
          .max(2)
          .optional()
          .describe("0=normal, 1=somewhat, 2=very urgent"),
        occurred_at: z
          .string()
          .optional()
          .describe(
            "ISO 8601 datetime (e.g. 2026-03-28T16:00:00Z or 2026-03-28T09:00:00-07:00). Defaults to now."
          ),
        notes: z.string().optional(),
      },
    },
    async ({
      consistency,
      color,
      has_blood,
      has_mucus,
      straining,
      urgency,
      occurred_at,
      notes,
    }) => {
      const entry = logBowel({
        consistency: consistency as Consistency,
        color: color as BowelColor | undefined,
        has_blood,
        has_mucus,
        straining,
        urgency: urgency as Urgency | undefined,
        occurred_at,
        notes,
      })
      return {
        content: [
          {
            type: "text" as const,
            text: `Logged bowel movement (consistency: ${entry.consistency}/7)`,
          },
        ],
      }
    }
  )
}
