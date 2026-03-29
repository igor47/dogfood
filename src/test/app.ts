import { Database } from "bun:sqlite"
import { afterEach, beforeEach } from "bun:test"
import type { Hono } from "hono"
import { createApp } from "../app"
import { closeDb, setDb } from "../db"
import { runMigrationsWithDb } from "../db/migrate"

interface TestContext {
  app: Hono
  db: Database
}

/**
 * Sets up a fresh test app for each test with an in-memory SQLite database.
 *
 * Usage:
 *   const testCtx = useTestApp()
 *   // access testCtx.app, testCtx.db in tests
 */
export function useTestApp(): TestContext {
  const ctx: TestContext = {} as TestContext

  beforeEach(() => {
    // Create in-memory database with migrations
    ctx.db = new Database(":memory:")
    ctx.db.exec("PRAGMA foreign_keys = ON")
    runMigrationsWithDb(ctx.db)

    // Inject test db into the global singleton so routes use it
    setDb(ctx.db)

    // Create app
    ctx.app = createApp()
  })

  afterEach(() => {
    closeDb()
  })

  return ctx
}
