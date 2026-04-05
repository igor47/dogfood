import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDefaultDog } from "@src/db/dogs"
import type { HealthEntryType, Severity } from "@src/db/health-entries"
import { createHealthEntry, type HealthEntry } from "@src/db/health-entries"
import { z } from "zod"

export interface LogHealthInput {
  entry_type: HealthEntryType
  severity?: Severity
  occurred_at?: string
  notes?: string
}

export function logHealth(input: LogHealthInput): HealthEntry {
  const dog = getDefaultDog()
  return createHealthEntry({
    dog_id: dog.id,
    entry_type: input.entry_type,
    severity: input.severity,
    occurred_at: input.occurred_at || new Date().toISOString(),
    notes: input.notes,
  })
}

export function registerLogHealthTool(server: McpServer) {
  server.registerTool(
    "log_health",
    {
      description:
        "Log a health observation: energy, activity, vomiting, gas, appetite_change, lethargy, water_intake, weight, medication, vet_visit, or other.",
      inputSchema: {
        entry_type: z
          .enum([
            "energy",
            "activity",
            "vomiting",
            "gas",
            "appetite_change",
            "lethargy",
            "water_intake",
            "weight",
            "medication",
            "vet_visit",
            "other",
          ])
          .describe("Type of health observation"),
        severity: z
          .number()
          .min(1)
          .max(5)
          .optional()
          .default(1)
          .describe("1=mild/low, 5=severe/high"),
        occurred_at: z
          .string()
          .optional()
          .describe(
            "ISO 8601 datetime (e.g. 2026-03-28T16:00:00Z or 2026-03-28T09:00:00-07:00). Defaults to now."
          ),
        notes: z.string().optional(),
      },
    },
    async ({ entry_type, severity, occurred_at, notes }) => {
      const entry = logHealth({
        entry_type: entry_type as HealthEntryType,
        severity: severity as Severity,
        occurred_at,
        notes,
      })
      return {
        content: [
          {
            type: "text" as const,
            text: `Logged ${entry.entry_type} (severity: ${entry.severity}/5)`,
          },
        ],
      }
    }
  )
}
