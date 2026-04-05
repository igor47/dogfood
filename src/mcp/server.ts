import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDefaultDog } from "@src/db/dogs"
import { listRecentEntries } from "@src/db/entries"
import type { FoodCategory } from "@src/db/foods"
import { createFood, listFoods } from "@src/db/foods"
import { registerLogBowelTool } from "@src/services/logBowel"
import { registerLogHealthTool } from "@src/services/logHealth"
import { registerLogMealTool } from "@src/services/logMeal"
import { registerLogTreatTool } from "@src/services/logTreat"
import { z } from "zod"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "dogfood",
    version: "1.0.0",
  })

  registerLogMealTool(server)
  registerLogTreatTool(server)
  registerLogBowelTool(server)
  registerLogHealthTool(server)

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
      const food = createFood({
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

  server.registerTool(
    "list_foods",
    {
      description:
        "List all defined foods in the catalog, optionally filtered by category (meal or treat).",
      inputSchema: {
        category: z
          .enum(["meal", "treat"])
          .optional()
          .describe("Filter by category, or omit for all"),
      },
    },
    async ({ category }) => {
      const foods = listFoods(category)
      if (foods.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No foods defined${category ? ` in category '${category}'` : ""}. Add foods via the web UI at /foods.`,
            },
          ],
        }
      }
      const lines = foods.map((f) => {
        const cal = f.calories_per_unit != null ? `, ${f.calories_per_unit} cal/${f.unit}` : ""
        return `- [${f.id}] ${f.name}${f.brand ? ` (${f.brand})` : ""} — ${f.category}, unit: ${f.unit}${cal}`
      })
      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )

  server.registerTool(
    "get_recent_entries",
    {
      description: "Get recent health log entries for the dog.",
      inputSchema: {
        limit: z.number().optional().default(20),
        entry_type: z
          .enum(["food", "bowel", "health", "all"])
          .optional()
          .default("all")
          .describe("Filter by entry type"),
      },
    },
    async ({ limit, entry_type }) => {
      const dog = getDefaultDog()
      const entries = listRecentEntries(dog.id, limit, entry_type)
      if (entries.length === 0) {
        return { content: [{ type: "text" as const, text: "No entries found." }] }
      }
      const lines = entries.map((e) => `[${e.occurred_at}] ${e.entry_type}: ${e.summary}`)
      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )

  server.registerTool(
    "get_dog_profile",
    {
      description: "Get the dog's profile information.",
    },
    async () => {
      const dog = getDefaultDog()
      const info = [
        `Name: ${dog.name}`,
        dog.breed ? `Breed: ${dog.breed}` : null,
        dog.birth_date ? `Birth date: ${dog.birth_date}` : null,
        dog.weight_kg != null ? `Weight: ${dog.weight_kg} kg` : null,
        dog.notes ? `Notes: ${dog.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n")
      return { content: [{ type: "text" as const, text: info }] }
    }
  )

  return server
}
