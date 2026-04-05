import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { FoodCategory } from "@src/db/foods"
import { createFood, type Food } from "@src/db/foods"
import { z } from "zod"

export interface AddFoodInput {
  name: string
  brand?: string
  category?: FoodCategory
  unit?: string
  calories_per_unit?: number
  notes?: string
}

export function addFood(input: AddFoodInput): Food {
  return createFood({
    name: input.name,
    brand: input.brand,
    category: input.category ?? "meal",
    unit: input.unit ?? "cups",
    calories_per_unit: input.calories_per_unit,
    notes: input.notes,
  })
}

export function registerAddFoodTool(server: McpServer) {
  server.registerTool(
    "add_food",
    {
      description:
        "Add a food to the catalog. Foods define a name, brand, category (meal or treat), unit of measurement, and optional calories per unit.",
      inputSchema: {
        name: z.string().describe("Name of the food"),
        brand: z.string().optional().describe("Brand name if applicable"),
        category: z.enum(["meal", "treat"]).optional().default("meal"),
        unit: z.string().describe("Unit of measurement, e.g. cups, oz, pieces, filet"),
        calories_per_unit: z.number().optional().describe("Calories per one unit"),
        notes: z.string().optional(),
      },
    },
    async ({ name, brand, category, unit, calories_per_unit, notes }) => {
      const food = addFood({
        name,
        brand,
        category: category as FoodCategory,
        unit,
        calories_per_unit,
        notes,
      })
      const cal =
        food.calories_per_unit != null ? `, ${food.calories_per_unit} cal/${food.unit}` : ""
      return {
        content: [
          {
            type: "text" as const,
            text: `Added food: [${food.id}] ${food.name}${food.brand ? ` (${food.brand})` : ""} — ${food.category}, unit: ${food.unit}${cal}`,
          },
        ],
      }
    }
  )
}
