import { randomUUID } from "node:crypto"
import { dirname } from "node:path"

const repoRoot = dirname(import.meta.dir)

export const config = {
  repoRoot,
  port: parseInt(process.env.PORT || "3002", 10),
  sqlitePath: process.env.SQLITE_PATH || "./data/db/dogfood.db",
  uploadDir: process.env.UPLOAD_DIR || "./data/uploads",
  publicUrl: process.env.PUBLIC_URL || "",
  uploadSigningKey: process.env.UPLOAD_SIGNING_KEY || randomUUID(),
  mcpBearerToken: process.env.MCP_BEARER_TOKEN || "",
  displayTz: process.env.DISPLAY_TZ || "UTC",
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const

// Print config as JSON when run directly
if (import.meta.main) {
  console.log(JSON.stringify(config, null, 2))
}
