import { StreamableHTTPTransport } from "@hono/mcp"
import { config } from "@src/config"
import { createMcpServer } from "@src/mcp/server"
import { Hono } from "hono"

export const mcpRoutes = new Hono()

const mcpServer = createMcpServer()
const transport = new StreamableHTTPTransport({
  sessionIdGenerator: undefined, // stateless — no session tracking
})

mcpRoutes.all("/mcp", async (c) => {
  // Bearer token auth if configured
  if (config.mcpBearerToken) {
    const auth = c.req.header("Authorization")
    if (auth !== `Bearer ${config.mcpBearerToken}`) {
      return c.json({ error: "Unauthorized" }, 401)
    }
  }

  if (!mcpServer.isConnected()) {
    await mcpServer.connect(transport)
  }

  return transport.handleRequest(c)
})
