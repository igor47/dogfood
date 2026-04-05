import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDefaultDog } from "@src/db/dogs"
import { createFoodEntry, type FoodEntry } from "@src/db/food-entries"
import { getFood } from "@src/db/foods"
import { z } from "zod"

export interface LogTreatInput {
  food_id?: string
  food_name?: string
  quantity?: number
  meal_time?: string
  notes?: string
}

export interface LogTreatResult {
  entry: FoodEntry
  name: string
  calories: number | null
}

export function logTreat(input: LogTreatInput): LogTreatResult | { error: string } {
  const dog = getDefaultDog()
  const quantity = input.quantity ?? 1

  let name: string
  let unit: string | undefined
  let calories: number | null = null

  if (input.food_id) {
    const food = getFood(input.food_id)
    if (!food) {
      return { error: `Food not found: ${input.food_id}` }
    }
    name = food.name
    unit = food.unit
    if (food.calories_per_unit != null) {
      calories = Math.round(quantity * food.calories_per_unit)
    }
  } else {
    name = input.food_name || "Treat"
  }

  const entry = createFoodEntry({
    dog_id: dog.id,
    food_id: input.food_id,
    food_name: name,
    entry_kind: "treat",
    quantity,
    unit,
    meal_time: input.meal_time || new Date().toISOString(),
    notes: input.notes,
  })

  return { entry, name, calories }
}

export function registerLogTreatTool(server: McpServer) {
  server.registerTool(
    "log_treat",
    {
      description:
        "Log a treat the dog ate. Can reference a food from the catalog or use a free-form name.",
      inputSchema: {
        food_id: z.string().optional().describe("ID of the treat from the catalog, if defined"),
        food_name: z.string().optional().describe("Free-form name if not using a catalog food"),
        quantity: z.number().optional().default(1).describe("How many (defaults to 1)"),
        meal_time: z
          .string()
          .optional()
          .describe(
            "ISO 8601 datetime (e.g. 2026-03-28T16:00:00Z or 2026-03-28T09:00:00-07:00). Defaults to now."
          ),
        notes: z.string().optional(),
      },
      outputSchema: {
        entry_id: z.string().describe("ID of the created food entry"),
        entry_type: z.literal("food"),
        summary: z.string().describe("Human-readable summary of what was logged"),
      },
    },
    async ({ food_id, food_name, quantity, meal_time, notes }) => {
      const result = logTreat({ food_id, food_name, quantity, meal_time, notes })
      if ("error" in result) {
        return {
          content: [{ type: "text" as const, text: result.error }],
          isError: true,
        }
      }

      const calStr = result.calories != null ? ` (${result.calories} cal)` : ""
      return {
        content: [],
        structuredContent: {
          entry_id: result.entry.id,
          entry_type: "food" as const,
          summary: `Logged treat: ${quantity} x ${result.name}${calStr}`,
        },
      }
    }
  )
}
