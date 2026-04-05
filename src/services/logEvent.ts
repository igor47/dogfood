import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDefaultDog } from "@src/db/dogs"
import type { EventType } from "@src/db/event-entries"
import { createEventEntry, type EventEntry } from "@src/db/event-entries"
import { z } from "zod"

export interface LogEventInput {
  event_type: EventType
  occurred_at?: string
  notes?: string
  weight_kg?: number
  medication_name?: string
  medication_dose?: string
}

export function logEvent(input: LogEventInput): EventEntry {
  const dog = getDefaultDog()
  return createEventEntry({
    dog_id: dog.id,
    event_type: input.event_type,
    occurred_at: input.occurred_at || new Date().toISOString(),
    notes: input.notes,
    weight_kg: input.weight_kg,
    medication_name: input.medication_name,
    medication_dose: input.medication_dose,
  })
}

export function registerLogEventTool(server: McpServer) {
  server.registerTool(
    "log_event",
    {
      description:
        "Log a health event: medication, vet_visit, weight_check, grooming, or other. Use weight_kg for weight checks and medication_name/medication_dose for medications.",
      inputSchema: {
        event_type: z
          .enum(["medication", "vet_visit", "weight_check", "grooming", "other"])
          .describe("Type of event"),
        occurred_at: z
          .string()
          .optional()
          .describe(
            "ISO 8601 datetime (e.g. 2026-03-28T16:00:00Z or 2026-03-28T09:00:00-07:00). Defaults to now."
          ),
        notes: z.string().optional(),
        weight_kg: z.number().optional().describe("Weight in kg (for weight_check events)"),
        medication_name: z
          .string()
          .optional()
          .describe("Name of medication (for medication events)"),
        medication_dose: z
          .string()
          .optional()
          .describe("Dosage of medication (for medication events)"),
      },
    },
    async ({ event_type, occurred_at, notes, weight_kg, medication_name, medication_dose }) => {
      const entry = logEvent({
        event_type: event_type as EventType,
        occurred_at,
        notes,
        weight_kg,
        medication_name,
        medication_dose,
      })

      let text = `Logged ${entry.event_type}`
      if (entry.medication_name) text += ` — ${entry.medication_name}`
      if (entry.medication_dose) text += ` (${entry.medication_dose})`
      if (entry.weight_kg != null) text += ` — ${entry.weight_kg} kg`

      return {
        content: [{ type: "text" as const, text }],
      }
    }
  )
}
