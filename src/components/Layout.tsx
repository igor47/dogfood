import type { Child } from "hono/jsx"

export interface LayoutProps {
  children?: Child[] | Child
  title?: string
}

export const Layout = ({ children, title = "Dogfood" }: LayoutProps) => {
  return (
    <html lang="en">
      <head>
        <title>{title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" href="/static/favicon.ico" sizes="any" />
        <link rel="icon" href="/static/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/static/favicon-16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/static/favicon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/static/favicon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/static/apple-touch-icon.png" />

        {/* Bootstrap */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
          crossorigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />

        {/* HTMX */}
        <script src="/static/htmx.min.js"></script>
        <script src="/static/idiomorph-ext.min.js"></script>
      </head>
      <body data-bs-theme="dark">
        <nav class="navbar navbar-expand-lg bg-body-tertiary">
          <div class="container-fluid">
            <a class="navbar-brand" href="/">
              <i class="bi bi-heart-pulse me-1"></i>
              Dogfood
            </a>
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <a class="nav-link" href="/foods">
                  Foods
                </a>
              </li>
            </ul>
            <div class="d-flex gap-2 ms-auto">
              <a href="/entries/new/meal" class="btn btn-sm btn-outline-success">
                <i class="bi bi-plus-lg"></i> Log
              </a>
            </div>
          </div>
        </nav>

        <main class="container mt-4">{children}</main>

        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
          crossorigin="anonymous"
        />
      </body>
    </html>
  )
}
