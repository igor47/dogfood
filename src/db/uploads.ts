import { mkdirSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { config } from "../config"
import { getDb } from "../db"
import { ulid } from "../lib/ids"

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heif",
  "application/pdf",
] as const

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export interface Upload {
  id: string
  original_filename: string
  content_type: string
  size_bytes: number
  created_at: string
}

function extFromContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/heif":
      return "heif"
    case "application/pdf":
      return "pdf"
    default:
      return "bin"
  }
}

export function uploadFilePath(id: string, contentType: string): string {
  return join(config.uploadDir, `${id}.${extFromContentType(contentType)}`)
}

export function createUpload(data: {
  original_filename: string
  content_type: string
  size_bytes: number
}): Upload {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO uploads (id, original_filename, content_type, size_bytes) VALUES (?, ?, ?, ?)`,
    [id, data.original_filename, data.content_type, data.size_bytes]
  )
  return getUpload(id)!
}

export function getUpload(id: string): Upload | null {
  const db = getDb()
  return db.query("SELECT * FROM uploads WHERE id = ?").get(id) as Upload | null
}

export function linkUploadToEntry(entryType: string, entryId: string, uploadId: string): void {
  const db = getDb()
  db.run(`INSERT INTO entry_uploads (entry_type, entry_id, upload_id) VALUES (?, ?, ?)`, [
    entryType,
    entryId,
    uploadId,
  ])
}

export function listUploadsForEntry(entryType: string, entryId: string): Upload[] {
  const db = getDb()
  return db
    .query(
      `SELECT u.* FROM uploads u
       JOIN entry_uploads eu ON eu.upload_id = u.id
       WHERE eu.entry_type = ? AND eu.entry_id = ?
       ORDER BY u.created_at ASC`
    )
    .all(entryType, entryId) as Upload[]
}

export function deleteUpload(id: string): void {
  const db = getDb()
  const upload = getUpload(id)
  if (!upload) return

  // Remove junction records first (CASCADE should handle this, but be explicit)
  db.run("DELETE FROM entry_uploads WHERE upload_id = ?", [id])
  db.run("DELETE FROM uploads WHERE id = ?", [id])

  // Remove file from disk
  const path = uploadFilePath(id, upload.content_type)
  try {
    unlinkSync(path)
  } catch {
    // File may not exist
  }
}

export async function saveUploadedFile(file: File): Promise<Upload | { error: string }> {
  if (!ALLOWED_CONTENT_TYPES.includes(file.type as AllowedContentType)) {
    return { error: `File type not allowed: ${file.type}` }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: `File too large: ${file.size} bytes (max ${MAX_FILE_SIZE})` }
  }

  const upload = createUpload({
    original_filename: file.name,
    content_type: file.type,
    size_bytes: file.size,
  })

  const path = uploadFilePath(upload.id, upload.content_type)
  mkdirSync(config.uploadDir, { recursive: true })
  await Bun.write(path, file)

  return upload
}
