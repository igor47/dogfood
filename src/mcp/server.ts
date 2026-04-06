import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerAddFoodTool } from "@src/services/addFood"
import { registerAttachUploadTool } from "@src/services/attachUpload"
import { registerGetDogProfileTool } from "@src/services/getDogProfile"
import { registerGetRecentEntriesTool } from "@src/services/listEntries"
import { registerListFoodsTool } from "@src/services/listFoods"
import { registerLogBowelTool } from "@src/services/logBowel"
import { registerLogEventTool } from "@src/services/logEvent"
import { registerLogMealTool } from "@src/services/logMeal"
import { registerLogSymptomTool } from "@src/services/logSymptom"
import { registerLogTreatTool } from "@src/services/logTreat"
import { registerRequestUploadTool } from "@src/services/requestUpload"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "dogfood",
    version: "1.0.0",
  })

  registerLogMealTool(server)
  registerLogTreatTool(server)
  registerLogBowelTool(server)
  registerLogSymptomTool(server)
  registerLogEventTool(server)
  registerAddFoodTool(server)
  registerListFoodsTool(server)
  registerGetRecentEntriesTool(server)
  registerGetDogProfileTool(server)
  registerRequestUploadTool(server)
  registerAttachUploadTool(server)

  return server
}
