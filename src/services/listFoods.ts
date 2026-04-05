import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { FoodCategory } from "@src/db/foods"
import { listFoods } from "@src/db/foods"
import { z } from "zod"

export function registerListFoodsTool(server: McpServer) {
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
      const foods = listFoods(category as FoodCategory | undefined)
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
}
