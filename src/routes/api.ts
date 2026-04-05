import { config } from "@src/config"
import { saveUploadedFile } from "@src/db/uploads"
import { Hono } from "hono"

export const apiRoutes = new Hono()

// Bearer token auth middleware for API routes
apiRoutes.use("/api/*", async (c, next) => {
  if (config.mcpBearerToken) {
    const auth = c.req.header("Authorization")
    if (auth !== `Bearer ${config.mcpBearerToken}`) {
      return c.json({ error: "Unauthorized" }, 401)
    }
  }
  return next()
})

// Upload a file, get back an upload_id to use with the attach_upload MCP tool
apiRoutes.post("/api/uploads", async (c) => {
  const body = await c.req.parseBody()
  const file = body.file

  if (!(file instanceof File)) {
    return c.json({ error: "Missing 'file' field in multipart form data" }, 400)
  }

  const result = await saveUploadedFile(file)
  if ("error" in result) {
    return c.json({ error: result.error }, 400)
  }

  return c.json({
    upload_id: result.id,
    original_filename: result.original_filename,
    content_type: result.content_type,
    size_bytes: result.size_bytes,
  })
})
