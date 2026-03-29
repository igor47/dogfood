import { EntryTimeline } from "@src/components/EntryTimeline"
import { CONSISTENCY_SCALE, listBowelEntries } from "@src/db/bowel-entries"
import { getDefaultDog } from "@src/db/dogs"
import { listRecentEntries } from "@src/db/entries"
import { listFoodEntries } from "@src/db/food-entries"
import { Hono } from "hono"

export const indexRoutes = new Hono()

function formatTime(dateStr: string): string {
  const d = new Date(`${dateStr}Z`)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

// HTMX partial: returns just the timeline fragment
indexRoutes.get("/timeline", (c) => {
  const dog = getDefaultDog()
  const type = (c.req.query("type") as "food" | "bowel" | "health" | "all") || "all"
  const entries = listRecentEntries(dog.id, 50, type)
  return c.html(<EntryTimeline entries={entries} showTypeFilter currentType={type} />)
})

indexRoutes.get("/", (c) => {
  const dog = getDefaultDog()
  const type = (c.req.query("type") as "food" | "bowel" | "health" | "all") || "all"
  const timelineEntries = listRecentEntries(dog.id, 50, type)
  const todaysFood = listFoodEntries(dog.id, 10)
  const recentBowel = listBowelEntries(dog.id, 1)
  const lastBowel = recentBowel[0]

  return c.render(
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>{dog.name}</h1>
          {dog.breed && <p class="text-muted mb-0">{dog.breed}</p>}
        </div>
        <a href="/dog/edit" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-pencil"></i> Edit Profile
        </a>
      </div>

      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Today's Food</h6>
              {todaysFood.length === 0 ? (
                <p class="card-text text-muted">Nothing logged yet</p>
              ) : (
                <ul class="list-unstyled mb-0">
                  {todaysFood.map((f) => (
                    <li>
                      {f.food_name}
                      {f.amount && <span class="text-muted"> — {f.amount}</span>}
                      <small class="text-muted d-block">{formatTime(f.meal_time)}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Last Bowel Movement</h6>
              {!lastBowel ? (
                <p class="card-text text-muted">None logged</p>
              ) : (
                <div>
                  <span class="fs-4 fw-bold">{lastBowel.consistency}/7</span>
                  <span class="text-muted ms-2">
                    {CONSISTENCY_SCALE.find((c) => c.value === lastBowel.consistency)?.label}
                  </span>
                  {lastBowel.color && (
                    <small class="text-muted d-block">Color: {lastBowel.color}</small>
                  )}
                  <small class="text-muted d-block">{formatTime(lastBowel.occurred_at)}</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Quick Log</h6>
              <div class="d-flex flex-column gap-2">
                <a href="/entries/new/food" class="btn btn-sm btn-outline-success">
                  <i class="bi bi-egg-fried"></i> Food
                </a>
                <a href="/entries/new/bowel" class="btn btn-sm btn-outline-warning">
                  <i class="bi bi-circle-fill"></i> Bowel
                </a>
                <a href="/entries/new/health" class="btn btn-sm btn-outline-info">
                  <i class="bi bi-heart-pulse"></i> Health
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h4>Timeline</h4>
      <EntryTimeline entries={timelineEntries} showTypeFilter currentType={type} />
    </div>,
    { title: "Dogfood" }
  )
})
