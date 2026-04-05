import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerAddFoodTool } from "@src/services/addFood"
import { registerGetDogProfileTool } from "@src/services/getDogProfile"
import { registerGetRecentEntriesTool } from "@src/services/listEntries"
import { registerListFoodsTool } from "@src/services/listFoods"
import { registerLogBowelTool } from "@src/services/logBowel"
import { registerLogHealthTool } from "@src/services/logHealth"
import { registerLogMealTool } from "@src/services/logMeal"
import { registerLogTreatTool } from "@src/services/logTreat"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "dogfood",
    version: "1.0.0",
  })

  registerLogMealTool(server)
  registerLogTreatTool(server)
  registerLogBowelTool(server)
  registerLogHealthTool(server)
  registerAddFoodTool(server)
  registerListFoodsTool(server)
  registerGetRecentEntriesTool(server)
  registerGetDogProfileTool(server)

  return server
}
