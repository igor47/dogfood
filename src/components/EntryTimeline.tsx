import { Timestamp } from "@src/components/Timestamp"
import type { TimelineEntry } from "@src/services/listEntries"

function editUrl(entry: TimelineEntry): string {
  if (entry.entry_type === "food") {
    return `/entries/${entry.entry_kind === "treat" ? "treat" : "meal"}/${entry.id}/edit`
  }
  return `/entries/${entry.entry_type}/${entry.id}/edit`
}

function entryIcon(type: string): string {
  switch (type) {
    case "food":
      return "bi-egg-fried"
    case "bowel":
      return "bi-circle-fill"
    case "symptom":
      return "bi-heart-pulse"
    case "event":
      return "bi-calendar-event"
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
    case "symptom":
      return "bg-info"
    case "event":
      return "bg-primary"
    default:
      return "bg-secondary"
  }
}

interface EntryTimelineProps {
  entries: TimelineEntry[]
  showTypeFilter?: boolean
  currentType?: string
  after?: string
  before?: string
}

export const EntryTimeline = ({
  entries,
  showTypeFilter,
  currentType,
  after,
  before,
}: EntryTimelineProps) => {
  const typeParam = currentType && currentType !== "all" ? `&type=${currentType}` : ""

  return (
    <div id="entry-timeline">
      {showTypeFilter && (
        <>
          <div class="btn-group mb-2" role="toolbar" aria-label="Filter entries by type">
            <button
              type="button"
              hx-get="/timeline"
              hx-include="#date-filters"
              hx-target="#entry-timeline"
              hx-swap="outerHTML"
              class={`btn btn-sm ${!currentType || currentType === "all" ? "btn-primary" : "btn-outline-primary"}`}
            >
              All
            </button>
            <button
              type="button"
              hx-get="/timeline?type=food"
              hx-include="#date-filters"
              hx-target="#entry-timeline"
              hx-swap="outerHTML"
              class={`btn btn-sm ${currentType === "food" ? "btn-success" : "btn-outline-success"}`}
            >
              Food
            </button>
            <button
              type="button"
              hx-get="/timeline?type=bowel"
              hx-include="#date-filters"
              hx-target="#entry-timeline"
              hx-swap="outerHTML"
              class={`btn btn-sm ${currentType === "bowel" ? "btn-warning" : "btn-outline-warning"}`}
            >
              Bowel
            </button>
            <button
              type="button"
              hx-get="/timeline?type=symptom"
              hx-include="#date-filters"
              hx-target="#entry-timeline"
              hx-swap="outerHTML"
              class={`btn btn-sm ${currentType === "symptom" ? "btn-info" : "btn-outline-info"}`}
            >
              Symptom
            </button>
            <button
              type="button"
              hx-get="/timeline?type=event"
              hx-include="#date-filters"
              hx-target="#entry-timeline"
              hx-swap="outerHTML"
              class={`btn btn-sm ${currentType === "event" ? "btn-primary" : "btn-outline-primary"}`}
            >
              Event
            </button>
          </div>
          <div id="date-filters" class="d-flex gap-2 mb-3 align-items-center">
            <input
              type="date"
              class="form-control form-control-sm"
              name="after"
              value={after || ""}
              style="max-width: 160px"
              hx-get={`/timeline?${typeParam}`}
              hx-include="#date-filters"
              hx-target="#entry-timeline"
              hx-swap="outerHTML"
              hx-trigger="change"
            />
            <span class="text-muted">to</span>
            <input
              type="date"
              class="form-control form-control-sm"
              name="before"
              value={before || ""}
              style="max-width: 160px"
              hx-get={`/timeline?${typeParam}`}
              hx-include="#date-filters"
              hx-target="#entry-timeline"
              hx-swap="outerHTML"
              hx-trigger="change"
            />
            {(after || before) && (
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                hx-get={`/timeline?${typeParam}`}
                hx-target="#entry-timeline"
                hx-swap="outerHTML"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {entries.length === 0 ? (
        <p class="text-muted">No entries yet. Start logging!</p>
      ) : (
        <div class="list-group">
          {entries.map((entry) => (
            <a
              href={editUrl(entry)}
              class="list-group-item list-group-item-action d-flex align-items-center gap-3"
            >
              <span class={`badge rounded-pill ${entryBadgeClass(entry.entry_type)}`}>
                <i class={`bi ${entryIcon(entry.entry_type)}`}></i>
              </span>
              <div class="flex-grow-1">
                <div>{entry.summary}</div>
                <small class="text-muted">
                  <Timestamp datetime={entry.occurred_at} />
                </small>
              </div>
              <i class="bi bi-pencil text-muted"></i>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
