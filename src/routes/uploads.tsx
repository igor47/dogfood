import { deleteUpload, getUpload, uploadFilePath } from "@src/db/uploads"
import { Hono } from "hono"

export const uploadsRoutes = new Hono()

// Serve an uploaded file
uploadsRoutes.get("/uploads/:id", async (c) => {
  const upload = getUpload(c.req.param("id"))
  if (!upload) return c.text("Not found", 404)

  const path = uploadFilePath(upload.id, upload.content_type)
  const file = Bun.file(path)
  if (!(await file.exists())) return c.text("File not found", 404)

  c.header("Content-Type", upload.content_type)
  c.header("Content-Length", file.size.toString())
  c.header("Cache-Control", "public, max-age=31536000, immutable")
  c.header("Content-Disposition", `inline; filename="${upload.original_filename}"`)

  return c.body(await file.bytes())
})

// Delete an uploaded file
uploadsRoutes.delete("/uploads/:id", (c) => {
  deleteUpload(c.req.param("id"))
  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})
