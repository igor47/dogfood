import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { BowelColor, Consistency, Urgency } from "@src/db/bowel-entries"
import { createBowelEntry } from "@src/db/bowel-entries"
import { getDefaultDog } from "@src/db/dogs"
import { listRecentEntries } from "@src/db/entries"
import { createFoodEntry } from "@src/db/food-entries"
import { getFood, listFoods } from "@src/db/foods"
import type { HealthEntryType, Severity } from "@src/db/health-entries"
import { createHealthEntry } from "@src/db/health-entries"
import { z } from "zod"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "dogfood",
    version: "1.0.0",
  })

  server.tool(
    "log_meal",
    "Log a meal the dog ate. Requires a food_id from the foods catalog. Use list_foods first to find the right food.",
    {
      food_id: z.string().describe("ID of the food from the catalog"),
      quantity: z.number().describe("Amount in the food's unit (e.g. 1.5 cups)"),
      meal_time: z.string().optional().describe("ISO datetime, defaults to now"),
      notes: z.string().optional(),
    },
    async ({ food_id, quantity, meal_time, notes }) => {
      const dog = getDefaultDog()
      const food = getFood(food_id)
      if (!food) {
        return { content: [{ type: "text" as const, text: `Food not found: ${food_id}` }] }
      }

      const calories =
        food.calories_per_unit != null ? Math.round(quantity * food.calories_per_unit) : null

      const _entry = createFoodEntry({
        dog_id: dog.id,
        food_id,
        food_name: food.name,
        brand: food.brand ?? undefined,
        entry_kind: "meal",
        quantity,
        unit: food.unit,
        calories: calories ?? undefined,
        meal_time,
        notes,
      })

      const calStr = calories != null ? ` (${calories} cal)` : ""
      return {
        content: [
          {
            type: "text" as const,
            text: `Logged meal: ${quantity} ${food.unit} of ${food.name}${calStr}`,
          },
        ],
      }
    }
  )

  server.tool(
    "log_treat",
    "Log a treat the dog ate. Can reference a food from the catalog or use a free-form name.",
    {
      food_id: z.string().optional().describe("ID of the treat from the catalog, if defined"),
      food_name: z.string().optional().describe("Free-form name if not using a catalog food"),
      quantity: z.number().optional().default(1).describe("How many (defaults to 1)"),
      meal_time: z.string().optional().describe("ISO datetime, defaults to now"),
      notes: z.string().optional(),
    },
    async ({ food_id, food_name, quantity, meal_time, notes }) => {
      const dog = getDefaultDog()

      let name: string
      let unit: string | undefined
      let calories: number | undefined

      if (food_id) {
        const food = getFood(food_id)
        if (!food) {
          return { content: [{ type: "text" as const, text: `Food not found: ${food_id}` }] }
        }
        name = food.name
        unit = food.unit
        if (food.calories_per_unit != null) {
          calories = Math.round(quantity * food.calories_per_unit)
        }
      } else {
        name = food_name || "Treat"
      }

      createFoodEntry({
        dog_id: dog.id,
        food_id,
        food_name: name,
        entry_kind: "treat",
        quantity,
        unit,
        calories,
        meal_time,
        notes,
      })

      const calStr = calories != null ? ` (${calories} cal)` : ""
      return {
        content: [{ type: "text" as const, text: `Logged treat: ${quantity} x ${name}${calStr}` }],
      }
    }
  )

  server.tool(
    "log_bowel_movement",
    "Log a bowel movement. Consistency uses a 1-7 Bristol-like scale: 1=hard pellets, 2=lumpy sausage, 3=sausage with cracks, 4=smooth soft sausage (ideal), 5=soft blobs, 6=mushy, 7=liquid.",
    {
      consistency: z.number().min(1).max(7).describe("Bristol scale 1-7"),
      color: z.string().optional().describe("e.g. brown, dark brown, yellow, green, black, red"),
      has_blood: z.boolean().optional(),
      has_mucus: z.boolean().optional(),
      straining: z.boolean().optional(),
      urgency: z.number().min(0).max(2).optional().describe("0=normal, 1=somewhat, 2=very urgent"),
      occurred_at: z.string().optional().describe("ISO datetime, defaults to now"),
      notes: z.string().optional(),
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
      const dog = getDefaultDog()
      const entry = createBowelEntry({
        dog_id: dog.id,
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

  server.tool(
    "log_health",
    "Log a health observation: energy, activity, vomiting, gas, appetite_change, lethargy, water_intake, weight, medication, vet_visit, or other.",
    {
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
      occurred_at: z.string().optional().describe("ISO datetime, defaults to now"),
      notes: z.string().optional(),
    },
    async ({ entry_type, severity, occurred_at, notes }) => {
      const dog = getDefaultDog()
      const entry = createHealthEntry({
        dog_id: dog.id,
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

  server.tool(
    "list_foods",
    "List all defined foods in the catalog, optionally filtered by category (meal or treat).",
    {
      category: z
        .enum(["meal", "treat"])
        .optional()
        .describe("Filter by category, or omit for all"),
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

  server.tool(
    "get_recent_entries",
    "Get recent health log entries for the dog.",
    {
      limit: z.number().optional().default(20),
      entry_type: z
        .enum(["food", "bowel", "health", "all"])
        .optional()
        .default("all")
        .describe("Filter by entry type"),
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

  server.tool("get_dog_profile", "Get the dog's profile information.", {}, async () => {
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
  })

  return server
}
