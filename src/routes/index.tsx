import { Hono } from "hono"

export const indexRoutes = new Hono()

indexRoutes.get("/", (c) => {
  return c.render(
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <h1>Dogfood</h1>
          <p class="text-muted">Dog digestive health tracker. Coming soon.</p>
        </div>
      </div>
    </div>,
    { title: "Dogfood" }
  )
})
