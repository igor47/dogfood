import type { TimelineEntry } from "@src/db/entries"

function entryIcon(type: string): string {
  switch (type) {
    case "food":
      return "bi-egg-fried"
    case "bowel":
      return "bi-circle-fill"
    case "health":
      return "bi-heart-pulse"
    default:
      return "bi-record-circle"
  }
}

function entryBadgeClass(type: string): string {
  switch (type) {
    case "food":
      return "bg-success"
    case "bowel":
      return "bg-warning text-dark"
    case "health":
      return "bg-info"
    default:
      return "bg-secondary"
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(`${dateStr}Z`)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

interface EntryTimelineProps {
  entries: TimelineEntry[]
  showTypeFilter?: boolean
  currentType?: string
}

export const EntryTimeline = ({ entries, showTypeFilter, currentType }: EntryTimelineProps) => {
  return (
    <div id="entry-timeline">
      {showTypeFilter && (
        <div class="btn-group mb-3" role="toolbar" aria-label="Filter entries by type">
          <button
            type="button"
            hx-get="/timeline"
            hx-target="#entry-timeline"
            hx-swap="outerHTML"
            hx-push-url="/"
            class={`btn btn-sm ${!currentType || currentType === "all" ? "btn-primary" : "btn-outline-primary"}`}
          >
            All
          </button>
          <button
            type="button"
            hx-get="/timeline?type=food"
            hx-target="#entry-timeline"
            hx-swap="outerHTML"
            hx-push-url="/?type=food"
            class={`btn btn-sm ${currentType === "food" ? "btn-success" : "btn-outline-success"}`}
          >
            Food
          </button>
          <button
            type="button"
            hx-get="/timeline?type=bowel"
            hx-target="#entry-timeline"
            hx-swap="outerHTML"
            hx-push-url="/?type=bowel"
            class={`btn btn-sm ${currentType === "bowel" ? "btn-warning" : "btn-outline-warning"}`}
          >
            Bowel
          </button>
          <button
            type="button"
            hx-get="/timeline?type=health"
            hx-target="#entry-timeline"
            hx-swap="outerHTML"
            hx-push-url="/?type=health"
            class={`btn btn-sm ${currentType === "health" ? "btn-info" : "btn-outline-info"}`}
          >
            Health
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <p class="text-muted">No entries yet. Start logging!</p>
      ) : (
        <div class="list-group">
          {entries.map((entry) => (
            <div class="list-group-item d-flex align-items-center gap-3">
              <span class={`badge rounded-pill ${entryBadgeClass(entry.entry_type)}`}>
                <i class={`bi ${entryIcon(entry.entry_type)}`}></i>
              </span>
              <div class="flex-grow-1">
                <div>{entry.summary}</div>
                <small class="text-muted">{formatTime(entry.occurred_at)}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
