import { Timestamp } from "@src/components/Timestamp"
import { CONSISTENCY_SCALE } from "@src/db/bowel-entries"
import type { TimelineEntry } from "@src/services/listEntries"

function editUrl(entry: TimelineEntry): string {
  if (entry.entry_type === "food") {
    return `/entries/${entry.entry.entry_kind === "treat" ? "treat" : "meal"}/${entry.entry.id}/edit`
  }
  return `/entries/${entry.entry_type}/${entry.entry.id}/edit`
}

// Canonical display config: label, icon, badge class per sub-type
const DISPLAY_CONFIG: Record<string, { label: string; icon: string; badge: string }> = {
  // Food
  meal: { label: "Meal", icon: "bi-egg-fried", badge: "bg-success" },
  treat: { label: "Treat", icon: "bi-gift", badge: "bg-success" },
  // Bowel
  bowel: { label: "Bowel Movement", icon: "bi-circle-fill", badge: "bg-warning text-dark" },
  // Symptoms
  vomiting: { label: "Vomiting", icon: "bi-emoji-dizzy", badge: "bg-info" },
  diarrhea: { label: "Diarrhea", icon: "bi-droplet-fill", badge: "bg-info" },
  gas: { label: "Gas / Flatulence", icon: "bi-cloud", badge: "bg-info" },
  appetite_change: { label: "Appetite Change", icon: "bi-cup-straw", badge: "bg-info" },
  energy_level: { label: "Energy Level", icon: "bi-lightning", badge: "bg-info" },
  skin_irritation: { label: "Skin / Coat", icon: "bi-bandaid", badge: "bg-info" },
  eye_ear_issue: { label: "Eye / Ear", icon: "bi-eye", badge: "bg-info" },
  limping: { label: "Limping", icon: "bi-crutch", badge: "bg-info" },
  anxiety: { label: "Anxiety", icon: "bi-exclamation-triangle", badge: "bg-info" },
  coughing_sneezing: { label: "Coughing / Sneezing", icon: "bi-wind", badge: "bg-info" },
  seizure: { label: "Seizure", icon: "bi-activity", badge: "bg-danger" },
  // Events
  medication: { label: "Medication", icon: "bi-capsule", badge: "bg-primary" },
  vet_visit: { label: "Vet Visit", icon: "bi-hospital", badge: "bg-primary" },
  weight_check: { label: "Weight Check", icon: "bi-speedometer", badge: "bg-primary" },
  grooming: { label: "Grooming", icon: "bi-scissors", badge: "bg-primary" },
  refused_meal: { label: "Refused Meal", icon: "bi-x-circle", badge: "bg-danger" },
  playdate: { label: "Playdate", icon: "bi-people", badge: "bg-primary" },
  walk: { label: "Walk", icon: "bi-signpost-split", badge: "bg-primary" },
  training: { label: "Training", icon: "bi-mortarboard", badge: "bg-primary" },
  other: { label: "Other", icon: "bi-record-circle", badge: "bg-secondary" },
}

const DEFAULT_CONFIG = { label: "Entry", icon: "bi-record-circle", badge: "bg-secondary" }

function getSubType(entry: TimelineEntry): string {
  switch (entry.entry_type) {
    case "food":
      return entry.entry.entry_kind
    case "bowel":
      return "bowel"
    case "symptom":
      return entry.entry.symptom_type
    case "event":
      return entry.entry.event_type
  }
}

function getConfig(entry: TimelineEntry) {
  return DISPLAY_CONFIG[getSubType(entry)] || DEFAULT_CONFIG
}

function getSummary(entry: TimelineEntry): string | null {
  switch (entry.entry_type) {
    case "food": {
      const e = entry.entry
      let s = e.food_name
      if (e.quantity != null && e.unit) s += ` — ${e.quantity} ${e.unit}`
      if (e.calories != null) s += ` (${e.calories} cal)`
      return s
    }
    case "bowel": {
      const e = entry.entry
      const label = CONSISTENCY_SCALE.find((c) => c.value === e.consistency)?.label
      return `${e.consistency}/7${label ? ` — ${label}` : ""}${e.color ? `, ${e.color}` : ""}`
    }
    case "symptom":
      return `severity: ${entry.entry.severity}/5`
    case "event": {
      const e = entry.entry
      const parts: string[] = []
      if (e.medication_name) parts.push(e.medication_name)
      if (e.medication_dose) parts.push(`(${e.medication_dose})`)
      if (e.weight_kg != null) parts.push(`${e.weight_kg} kg`)
      return parts.length > 0 ? parts.join(" ") : null
    }
  }
}

function getNotes(entry: TimelineEntry): string | null {
  return entry.entry.notes ?? null
}

function getOccurredAt(entry: TimelineEntry): string {
  return entry.entry.occurred_at
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
          {entries.map((entry) => {
            const config = getConfig(entry)
            const summary = getSummary(entry)
            const notes = getNotes(entry)
            return (
              <a
                href={editUrl(entry)}
                class="list-group-item list-group-item-action d-flex gap-3 py-2"
              >
                <span
                  class={`badge rounded-pill ${config.badge} d-flex align-items-center justify-content-center`}
                  style="width: 32px; height: 32px;"
                >
                  <i class={`bi ${config.icon}`} />
                </span>
                <div class="flex-grow-1 min-width-0">
                  <div class="d-flex justify-content-between align-items-baseline">
                    <div>
                      <strong>{config.label}</strong>
                      {summary && <span class="text-muted ms-1">— {summary}</span>}
                    </div>
                    <small class="text-muted text-nowrap ms-2">
                      <Timestamp datetime={getOccurredAt(entry)} />
                    </small>
                  </div>
                  {notes && <div class="text-muted small text-truncate">{notes}</div>}
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
