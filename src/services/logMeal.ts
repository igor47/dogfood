import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDefaultDog } from "@src/db/dogs"
import { createFoodEntry, type FoodEntry } from "@src/db/food-entries"
import { type Food, getFood } from "@src/db/foods"
import { z } from "zod"

export interface LogMealInput {
  food_id: string
  quantity: number
  meal_time?: string
  notes?: string
}

export interface LogMealResult {
  entry: FoodEntry
  food: Food
  calories: number | null
}

export function logMeal(input: LogMealInput): LogMealResult | { error: string } {
  const dog = getDefaultDog()
  const food = getFood(input.food_id)
  if (!food) {
    return { error: `Food not found: ${input.food_id}` }
  }

  const calories =
    food.calories_per_unit != null ? Math.round(input.quantity * food.calories_per_unit) : null

  const entry = createFoodEntry({
    dog_id: dog.id,
    food_id: input.food_id,
    food_name: food.name,
    brand: food.brand ?? undefined,
    entry_kind: "meal",
    quantity: input.quantity,
    unit: food.unit,
    meal_time: input.meal_time || new Date().toISOString(),
    notes: input.notes,
  })

  return { entry, food, calories }
}

export function registerLogMealTool(server: McpServer) {
  server.registerTool(
    "log_meal",
    {
      description:
        "Log a meal the dog ate. Requires a food_id from the foods catalog. Use list_foods first to find the right food.",
      inputSchema: {
        food_id: z.string().describe("ID of the food from the catalog"),
        quantity: z.number().describe("Amount in the food's unit (e.g. 1.5 cups)"),
        meal_time: z
          .string()
          .optional()
          .describe(
            "ISO 8601 datetime (e.g. 2026-03-28T16:00:00Z or 2026-03-28T09:00:00-07:00). Defaults to now."
          ),
        notes: z.string().optional(),
      },
    },
    async ({ food_id, quantity, meal_time, notes }) => {
      const result = logMeal({ food_id, quantity, meal_time, notes })
      if ("error" in result) {
        return { content: [{ type: "text" as const, text: result.error }] }
      }

      const calStr = result.calories != null ? ` (${result.calories} cal)` : ""
      return {
        content: [
          {
            type: "text" as const,
            text: `Logged meal: ${quantity} ${result.food.unit} of ${result.food.name}${calStr}`,
          },
        ],
      }
    }
  )
}
