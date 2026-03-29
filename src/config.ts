import { dirname } from "node:path"

const repoRoot = dirname(import.meta.dir)

export const config = {
  repoRoot,
  port: parseInt(process.env.PORT || "3002", 10),
  sqlitePath: process.env.SQLITE_PATH || "./data/db/dogfood.db",
  mcpBearerToken: process.env.MCP_BEARER_TOKEN || "",
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const

// Print config as JSON when run directly
if (import.meta.main) {
  console.log(JSON.stringify(config, null, 2))
}
