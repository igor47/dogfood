import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getDefaultDog } from "@src/db/dogs"

export function registerGetDogProfileTool(server: McpServer) {
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
}
