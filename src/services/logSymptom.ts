import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDefaultDog } from "@src/db/dogs"
import type { Severity, SymptomType } from "@src/db/symptom-entries"
import { createSymptomEntry, type SymptomEntry } from "@src/db/symptom-entries"
import { z } from "zod"

export interface LogSymptomInput {
  symptom_type: SymptomType
  severity?: Severity
  occurred_at?: string
  notes?: string
}

export function logSymptom(input: LogSymptomInput): SymptomEntry {
  const dog = getDefaultDog()
  return createSymptomEntry({
    dog_id: dog.id,
    symptom_type: input.symptom_type,
    severity: input.severity,
    occurred_at: input.occurred_at || new Date().toISOString(),
    notes: input.notes,
  })
}

export function registerLogSymptomTool(server: McpServer) {
  server.registerTool(
    "log_symptom",
    {
      description:
        "Log a symptom observation: vomiting, diarrhea, gas, appetite_change, energy_level, skin_irritation, eye_ear_issue, limping, anxiety, coughing_sneezing, seizure, or other.",
      inputSchema: {
        symptom_type: z
          .enum([
            "vomiting",
            "diarrhea",
            "gas",
            "appetite_change",
            "energy_level",
            "skin_irritation",
            "eye_ear_issue",
            "limping",
            "anxiety",
            "coughing_sneezing",
            "seizure",
            "other",
          ])
          .describe("Type of symptom"),
        severity: z
          .number()
          .min(1)
          .max(5)
          .optional()
          .default(3)
          .describe("1=mild/low, 3=moderate, 5=severe/high"),
        occurred_at: z
          .string()
          .optional()
          .describe(
            "ISO 8601 datetime (e.g. 2026-03-28T16:00:00Z or 2026-03-28T09:00:00-07:00). Defaults to now."
          ),
        notes: z.string().optional(),
      },
      outputSchema: {
        entry_id: z.string().describe("ID of the created symptom entry"),
        entry_type: z.literal("symptom"),
        summary: z.string().describe("Human-readable summary of what was logged"),
      },
    },
    async ({ symptom_type, severity, occurred_at, notes }) => {
      const entry = logSymptom({
        symptom_type: symptom_type as SymptomType,
        severity: severity as Severity,
        occurred_at,
        notes,
      })
      return {
        content: [],
        structuredContent: {
          entry_id: entry.id,
          entry_type: "symptom" as const,
          summary: `Logged ${entry.symptom_type} (severity: ${entry.severity}/5)`,
        },
      }
    }
  )
}
