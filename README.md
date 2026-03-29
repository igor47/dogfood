# Dogfood

A dog digestive health tracker with MCP integration.
Track your dog's meals, treats, bowel movements, energy levels, and other health observations.
The primary interface is conversational -- tell Claude what happened and it logs it for you via MCP tools.
A web dashboard lets you browse the timeline and manage the food catalog.

## How it works

1. **Define foods** in the catalog (e.g. "Royal Canin PW kibble, 257 cal/cup") via the web UI or MCP
2. **Tell Claude** what happened -- "he had 2 oz of boiled turkey and half a cup of kibble at 4pm"
3. **Claude logs it** using MCP tools, computing calories automatically from the catalog
4. **Browse the dashboard** to see today's meals, last bowel movement, and a filterable timeline

### MCP tools

| Tool | Description |
|------|-------------|
| `add_food` | Add a food to the catalog with name, unit, and calories |
| `list_foods` | List the food catalog (filter by meal/treat) |
| `log_meal` | Log a meal referencing a catalog food + quantity |
| `log_treat` | Log a treat (catalog food or free-form name) |
| `log_bowel_movement` | Log bowel movement with Bristol scale (1-7) |
| `log_health` | Log health observation (energy, vomiting, gas, etc.) |
| `get_recent_entries` | Query the timeline |
| `get_dog_profile` | Get the dog's profile info |

## Self-hosting

Dogfood runs as a single Docker container with SQLite for storage.

### Quick start with Docker

```bash
docker run -d \
  -p 3000:3000 \
  -v dogfood-data:/app/data \
  -e MCP_BEARER_TOKEN=your-secret-token \
  ghcr.io/igor47/dogfood:latest
```

### Docker Compose

```yaml
services:
  dogfood:
    image: ghcr.io/igor47/dogfood:latest
    ports:
      - "3000:3000"
    volumes:
      - dogfood-data:/app/data
    environment:
      - MCP_BEARER_TOKEN=your-secret-token

volumes:
  dogfood-data:
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` (Docker) / `3002` (dev) | Server port |
| `SQLITE_PATH` | `./data/db/dogfood.db` | SQLite database file path |
| `MCP_BEARER_TOKEN` | *(none)* | Bearer token for MCP endpoint auth. If empty, `/mcp` is open. |

### Data persistence

Mount a volume at `/app/data`. This contains:
- `db/dogfood.db` -- SQLite database

Migrations run automatically on startup.

### Connecting Claude

#### Claude Code (CLI)

```bash
claude mcp add --transport http dogfood https://your-domain.com/mcp \
  --header "Authorization: Bearer your-secret-token"
```

#### Claude.ai (web)

1. Go to **Settings > Connectors**
2. Click "Add custom connector"
3. Enter your server URL + `/mcp` (e.g. `https://your-domain.com/mcp`)
4. In advanced settings, add the bearer token
5. Claude can now use the dogfood tools in conversations

## Development

Requires [mise](https://mise.jdx.dev/) for tool management (installs Bun automatically).

```bash
# Install dependencies
mise run install

# Start dev server (hot reload on port 3002)
mise run app:dev

# Run checks (lint + typecheck)
mise run check

# Run tests
mise run test
```

Set your MCP bearer token in `mise.local.toml` (gitignored):

```toml
[env]
MCP_BEARER_TOKEN = "your-secret-token"
```

For local development with Claude Code:

```bash
claude mcp add --transport http dogfood http://localhost:3002/mcp \
  --header "Authorization: Bearer your-secret-token"
```

## Tech stack

- [Bun](https://bun.sh) runtime
- [Hono](https://hono.dev) web framework with JSX server-side rendering
- [HTMX](https://htmx.org) + [idiomorph](https://github.com/bigskysoftware/idiomorph) for interactive UI
- [Bootstrap 5](https://getbootstrap.com) (dark theme)
- [SQLite](https://www.sqlite.org) via `bun:sqlite`
- [MCP](https://modelcontextprotocol.io) via `@hono/mcp` + `@modelcontextprotocol/sdk`
- [Biome](https://biomejs.dev) for linting/formatting
