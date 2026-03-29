# Dogfood Project Guidelines

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install`
- Bun automatically loads .env, so don't use dotenv.

## Development commands

- `mise run app:dev` — Dev server with hot reload (port 3002)
- `mise run check` — Biome lint + TypeScript typecheck
- `mise run check-fix` — Auto-fix lint/formatting, then typecheck
- `mise run test` — Run tests (`NODE_ENV=test`)

## Framework

This project uses **Hono** as the web framework with JSX rendering and **HTMX** for interactivity.

- Server-side rendering via `hono/jsx-renderer`
- All routes use `c.render()` for full-page or `c.html()` for HTMX partials
- Bootstrap 5 dark theme (via CDN)
- HTMX + idiomorph for dynamic behavior without client-side JS
- Use `hx-swap="outerHTML"` with `hx-push-url` for filter-style interactions

## MCP server

This app exposes an MCP (Model Context Protocol) endpoint at `/mcp` for integration
with Claude Code, claude.ai, and other MCP clients.

- MCP tools are defined in `src/mcp/server.ts` using `registerTool` (not deprecated `tool()`)
- Transport is handled by `@hono/mcp` `StreamableHTTPTransport` in `src/routes/mcp.ts`
- Stateless mode (no session tracking)
- Optional bearer token auth via `MCP_BEARER_TOKEN` env var
- MCP route is mounted before the JSX renderer in `src/app.ts` (JSON-RPC, not HTML)
- Tests use `InMemoryTransport.createLinkedPair()` + `Client` from the SDK

## Database

SQLite via `bun:sqlite`. WAL mode, foreign keys enabled.

- DB file: `./data/db/dogfood.db` (configurable via `SQLITE_PATH`)
- Migrations are `.sql` files in `src/migrations/`, auto-run on startup
- Don't use better-sqlite3 — use `bun:sqlite`
- CRUD modules in `src/db/` use `getDb()` singleton, return typed interfaces
- Tests use in-memory SQLite via `setDb(new Database(":memory:"))`

## Type conventions

- Enum-like values (food types, bowel colors, health entry types, severity levels) are
  defined as `const` arrays with `{ value, label }` objects in the DB modules
- TypeScript union types are derived via `(typeof ARRAY)[number]["value"]`
- Components import these arrays for rendering — DB modules are the single source of truth
- Don't duplicate value lists in components or routes

## Testing

- `useTestApp()` from `src/test/app.ts` sets up fresh in-memory DB per test
- Test factories in `src/test/factories/entries.ts`
- HTTP helpers in `src/test/http.ts` (`makeRequest`, `parseHtml`, `expectElement`)
- MCP tool tests use `InMemoryTransport` + `Client` to call tools directly
- Use `linkedom` for DOM assertions in route tests

## Project structure

```
main.ts                          # Entry point (Bun.serve)
src/
├── app.ts                       # Hono app with middleware & routes
├── config.ts                    # Environment variable configuration
├── db.ts                        # SQLite singleton
├── db/
│   ├── migrate.ts               # SQL migration runner
│   ├── dogs.ts                  # Dog CRUD
│   ├── foods.ts                 # Food catalog CRUD
│   ├── food-entries.ts          # Food entry (meal/treat) CRUD
│   ├── bowel-entries.ts         # Bowel entry CRUD
│   ├── health-entries.ts        # Health observation CRUD
│   └── entries.ts               # Unified timeline queries
├── mcp/
│   └── server.ts                # MCP server with tool definitions
├── components/
│   ├── Layout.tsx               # HTML shell
│   ├── EntryTimeline.tsx        # Timeline with type filters
│   ├── MealEntryForm.tsx        # Meal logging form
│   ├── TreatEntryForm.tsx       # Treat logging form
│   ├── BowelEntryForm.tsx       # Bowel movement form
│   └── HealthEntryForm.tsx      # Health observation form
├── routes/
│   ├── health.ts                # Health check endpoints
│   ├── index.tsx                # Dashboard + timeline partial
│   ├── entries.tsx              # Entry forms + dog profile
│   ├── foods.tsx                # Food catalog management
│   └── mcp.ts                   # MCP transport endpoint
├── middleware/
│   ├── requestLogging.ts
│   ├── htmx.ts
│   └── cachingServeStatic.ts
├── lib/
│   ├── logger.ts
│   └── ids.ts
├── migrations/                  # SQL migration files (001-005)
└── test/
    ├── app.ts                   # Test setup (useTestApp)
    ├── http.ts                  # HTTP test helpers
    └── factories/
        └── entries.ts           # Test data factories
```

## APIs

- `bun:sqlite` for SQLite. Don't use better-sqlite3.
- `@modelcontextprotocol/sdk` + `@hono/mcp` for MCP.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile.
