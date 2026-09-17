# Decisions

Short, ADR-style notes explaining the most consequential technology and
design choices for this MVP. Each entry states the decision, the context,
and the alternatives that were considered.

---

## 1. Why Vue 3 + Pinia

**Decision:** Use Vue 3 with the Composition API (`<script setup lang="ts">`)
for all UI code, and Pinia for application state.

**Context:** We need a reactive, type-safe SPA framework with a small
maintenance footprint.

**Alternatives considered:**

- React + Redux Toolkit: comparable capability, but Vue's single-file
  components keep small GIS UIs compact and the Composition API removes
  most reasons to reach for a state library.
- Svelte: lighter, but the team familiarity with Vue is higher.

**Why we chose this:**

- Vue 3's `<script setup>` plus TypeScript provides an ergonomic,
  type-safe development flow with very little boilerplate.
- Pinia replaces Vuex with a flatter API and excellent TypeScript
  inference. It also explicitly forbids non-serialisable state, which
  keeps our MapLibre integration honest (the Map instance is never
  stored in Pinia).
- Vue Router 4 covers the route layout (including `?dataset=` query
  params on `/map`) without extras.

---

## 2. Why NestJS

**Decision:** Build the API with NestJS + TypeORM.

**Context:** We need a maintainable, well-structured Node/TypeScript API
that supports parameterised SQL, validation, OpenAPI docs, and middleware.

**Alternatives considered:**

- Express + ad-hoc structure: flexible but the conventions have to be
  invented and enforced by code review.
- Fastify: faster, but NestJS' module system is a stronger fit for an
  MVP because each module is a clear unit (datasets, features, health,
  database).

**Why we chose this:**

- NestJS gives us a clear controller → service → repository layering
  out of the box.
- Built-in support for `class-validator`, Swagger, exception filters, and
  interceptors covers the "boring" infrastructure that every API needs.
- TypeORM's parameterised query API (`repo.query(...)` with bound
  parameters) lines up exactly with the requirement to never concatenate
  user input into SQL.

---

## 3. Why PostGIS

**Decision:** Use PostgreSQL 16 + PostGIS 3.4.

**Context:** Spatial filtering and bounding-box queries are core to the
product. We need a database that can answer "give me features in this
area" efficiently and idiomatically.

**Alternatives considered:**

- A non-spatial store + a JS-side filter: would force the API to ship
  every feature to the browser and filter there — wrong for any
  realistic dataset size.
- SQLite + a custom spatial extension: poor fit for a Docker-first MVP
  that already wants a real database server.

**Why we chose this:**

- PostGIS has the spatial predicates, types, and indexes we need
  (`ST_Intersects`, `ST_MakeEnvelope`, GiST index on geometry).
- The seed/initialisation story (`/docker-entrypoint-initdb.d`) is
  trivial with the official `postgis/postgis` image.
- A single GiST index covers both the bbox pre-filter (`geom && ...`)
  and the exact intersection (`ST_Intersects`), keeping query planning
  straightforward.

---

## 4. Why bbox API queries instead of loading all features

**Decision:** The API exposes a bbox-driven feature endpoint, and the
frontend refetches features when the map's visible area changes.

**Context:** Real datasets can be large. Even synthetic datasets in this
demo could grow past the response size that is comfortable for the
browser.

**Alternatives considered:**

- `GET /datasets/:slug/features/all`: trivial, but defeats the point of
  pagination at the source.
- Server-side rendered tiles (MVT / vector tiles): correct for very large
  data, but overkill for an MVP with three small datasets.

**Why we chose this:**

- A bbox query limits both the work the database does and the size of
  the response.
- Debouncing the bbox watch (250 ms) plus an AbortController keeps the
  request rate sensible even when the user pans rapidly.
- Hard caps (limit ≤ 500, area ≤ 1 sq deg) make response-time behaviour
  predictable and prevent accidental "give me the whole world" requests.

---

## 5. Why MapLibre GL JS

**Decision:** Use MapLibre GL JS for the interactive map.

**Context:** We need a vector-tile-ready, free, open-source web map
library without API keys or vendor lock-in.

**Alternatives considered:**

- Leaflet: simpler API, but raster-only and missing some of the smooth
  layer + source abstractions we use here.
- Mapbox GL JS: requires an API key and has restrictive commercial
  licensing.
- CesiumJS / ArcGIS SDK: explicitly out of scope per the project brief.

**Why we chose this:**

- MapLibre is a fully open-source continuation of the last BSD-licensed
  Mapbox GL JS, so the API matches the patterns documented online.
- The styling model (sources + layers) fits GeoJSON perfectly — we add
  one source and three layers (fill / line / circle) and let the library
  handle click hit-testing.
- A minimal local blank style (`public/map-style.json`) means the demo
  works without an internet basemap.

---

## 6. Why Docker Compose rather than Kubernetes

**Decision:** Ship the MVP as a single `docker compose` deployment.

**Context:** The project is a learning/demo MVP intended to run locally
on a developer's machine or a single small VM.

**Alternatives considered:**

- Kubernetes manifests: powerful but adds a huge operational burden
  (ingress, secrets, persistence, multi-pod coordination) for an MVP.
- Bare-metal instructions: easier to read but harder to reproduce.

**Why we chose this:**

- `docker compose up --build` is a single, well-understood command.
- Health checks + `depends_on: { db: { condition: service_healthy } }`
  give us a robust boot sequence without needing an orchestrator.
- A named volume (`geocatalog_pgdata`) preserves seed data across
  restarts, which matters when iterating.
- The migration story to Kubernetes later (Helm chart, separate
  services) is straightforward when the services are already clearly
  separated.

---

## 7. Why no authentication

**Decision:** Omit authentication entirely.

**Context:** The MVP is single-tenant demo data with no editing or
upload workflow.

**Alternatives considered:**

- JWT + refresh tokens: real but adds a full auth surface (login,
  refresh, password reset, role management) for no MVP benefit.

**Why we chose this:**

- Authentication is a frequent source of scope creep on small projects.
- The brief explicitly lists auth as out-of-scope.
- When adding it later, the consistent `ApiSuccess` envelope and the
  request-id middleware make it easy to thread a user principal through.

---

## 8. Why request ids and a global exception filter

**Decision:** Every request gets a stable id; every thrown error is
funnelled through one filter.

**Context:** Production debugging needs correlation between logs and
client-visible errors.

**Alternatives considered:**

- Logging every controller manually: repetitive and easy to forget.

**Why we chose this:**

- A single middleware sets the id once; a single filter normalises every
  error path. The shape of the error envelope is the same for validation
  failures, 404s, and unexpected server errors.
- The id appears in the response header (`X-Request-Id`) and the error
  envelope, so the user can paste it when filing a bug.

---

## 9. Why a minimal blank map style

**Decision:** Use a tiny local `map-style.json` instead of a public basemap.

**Context:** Public basemap services can rate-limit, change URLs, or
require API keys.

**Alternatives considered:**

- A free tile provider: convenient but adds an external dependency to
  the MVP.

**Why we chose this:**

- The MVP demonstrates the spatial feature flow. The basemap is
  incidental.
- A blank style removes any external network dependency from the demo
  and keeps the build truly self-contained.
- Adding a public style later is a one-file change to `MapView.vue`.