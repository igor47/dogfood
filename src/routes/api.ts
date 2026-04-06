import { saveUploadedFile } from "@src/db/uploads"
import { validateSignedUpload } from "@src/lib/signing"
import { Hono } from "hono"

export const apiRoutes = new Hono()

// Signed upload endpoint — no auth needed, the signature is the auth
apiRoutes.post("/api/uploads/signed", async (c) => {
  const expires = c.req.query("expires")
  const sig = c.req.query("sig")

  if (!expires || !sig) {
    return c.json({ error: "Missing expires or sig query parameters" }, 400)
  }

  const validation = validateSignedUpload(expires, sig)
  if (!validation.valid) {
    return c.json({ error: validation.error }, 403)
  }

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
