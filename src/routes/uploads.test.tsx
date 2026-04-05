import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdirSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { listUploadsForEntry, setUploadDir } from "@src/db/uploads"
import { useTestApp } from "@src/test/app"
import { createTestDog, createTestEventEntry } from "@src/test/factories/entries"
import { makeRequest } from "@src/test/http"

const testCtx = useTestApp()

// Use a temp directory for uploads during tests
const testUploadDir = join(tmpdir(), `dogfood-test-uploads-${Date.now()}`)

beforeAll(() => {
  mkdirSync(testUploadDir, { recursive: true })
  setUploadDir(testUploadDir)
})

afterAll(() => {
  rmSync(testUploadDir, { recursive: true, force: true })
})

// Tiny 1x1 red PNG (68 bytes)
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
  0x44, 0xae, 0x42, 0x60, 0x82,
])

function testPngFile(name = "test.png") {
  return new File([PNG_BYTES], name, { type: "image/png" })
}

describe("uploads on event create", () => {
  test("POST /entries/new/event with file creates entry and upload", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("event_type", "vet_visit")
    form.append("files", testPngFile("receipt.png"))

    const response = await makeRequest(testCtx.app, "/entries/new/event", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    // Find the created event entry's uploads
    const { listEventEntries } = await import("@src/db/event-entries")
    const entries = listEventEntries(dog.id)
    expect(entries).toHaveLength(1)

    const uploads = listUploadsForEntry("event", entries[0]!.id)
    expect(uploads).toHaveLength(1)
    expect(uploads[0]!.original_filename).toBe("receipt.png")
    expect(uploads[0]!.content_type).toBe("image/png")

    // Verify file exists on disk
    const files = readdirSync(testUploadDir)
    expect(files.length).toBeGreaterThanOrEqual(1)
  })

  test("POST /entries/new/event with multiple files", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("event_type", "vet_visit")
    form.append("files", testPngFile("photo1.png"))
    form.append("files", testPngFile("photo2.png"))

    const response = await makeRequest(testCtx.app, "/entries/new/event", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const { listEventEntries } = await import("@src/db/event-entries")
    const entries = listEventEntries(dog.id)
    const uploads = listUploadsForEntry("event", entries[0]!.id)
    expect(uploads).toHaveLength(2)
  })

  test("POST /entries/new/event ignores disallowed content types", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("event_type", "vet_visit")
    form.append("files", new File(["hello"], "test.txt", { type: "text/plain" }))

    const response = await makeRequest(testCtx.app, "/entries/new/event", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200) // entry created, file skipped

    const { listEventEntries } = await import("@src/db/event-entries")
    const entries = listEventEntries(dog.id)
    const uploads = listUploadsForEntry("event", entries[0]!.id)
    expect(uploads).toHaveLength(0)
  })
})

describe("GET /uploads/:id", () => {
  test("serves an uploaded file with correct content-type", async () => {
    const dog = createTestDog()

    // Create event with upload
    const form = new FormData()
    form.append("event_type", "vet_visit")
    form.append("files", testPngFile("serve-test.png"))

    await makeRequest(testCtx.app, "/entries/new/event", {
      method: "POST",
      body: form,
    })

    const { listEventEntries } = await import("@src/db/event-entries")
    const entries = listEventEntries(dog.id)
    const uploads = listUploadsForEntry("event", entries[0]!.id)
    const uploadId = uploads[0]!.id

    const response = await makeRequest(testCtx.app, `/uploads/${uploadId}`)
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("image/png")

    const bytes = new Uint8Array(await response.arrayBuffer())
    expect(bytes.length).toBe(PNG_BYTES.length)
  })

  test("returns 404 for unknown upload", async () => {
    const response = await makeRequest(testCtx.app, "/uploads/nonexistent")
    expect(response.status).toBe(404)
  })
})

describe("DELETE /uploads/:id", () => {
  test("removes upload record and file", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("event_type", "vet_visit")
    form.append("files", testPngFile("delete-test.png"))

    await makeRequest(testCtx.app, "/entries/new/event", {
      method: "POST",
      body: form,
    })

    const { listEventEntries } = await import("@src/db/event-entries")
    const entries = listEventEntries(dog.id)
    const uploads = listUploadsForEntry("event", entries[0]!.id)
    const uploadId = uploads[0]!.id

    const response = await makeRequest(testCtx.app, `/uploads/${uploadId}`, {
      method: "DELETE",
    })

    expect(response.status).toBe(200)

    // Upload record should be gone
    const remaining = listUploadsForEntry("event", entries[0]!.id)
    expect(remaining).toHaveLength(0)
  })
})

describe("uploads on edit", () => {
  test("POST /entries/event/:id/edit with file adds upload", async () => {
    const dog = createTestDog()
    const entry = createTestEventEntry(dog.id, { event_type: "vet_visit" })

    const form = new FormData()
    form.append("event_type", "vet_visit")
    form.append("files", testPngFile("edit-upload.png"))

    const response = await makeRequest(testCtx.app, `/entries/event/${entry.id}/edit`, {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const uploads = listUploadsForEntry("event", entry.id)
    expect(uploads).toHaveLength(1)
    expect(uploads[0]!.original_filename).toBe("edit-upload.png")
  })
})
