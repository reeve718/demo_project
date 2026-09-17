# GeoCatalog Explorer

> A personal learning/demo project showcasing a small, modern full-stack GIS
> application: dataset catalogue, keyword + theme search, dataset detail page,
> interactive MapLibre map, bbox-driven spatial feature queries, and a fully
> Dockerised local stack.

**This project is not affiliated with or derived from any government, public
sector, or commercial GIS system. All data is synthetic.**

---

## 1. Project Overview

GeoCatalog Explorer demonstrates how to build a maintainable GIS MVP with a
clear separation between the browser, an HTTP API, and a spatial database. The
focus is on **clean architecture**, **safe data access**, and **responsive
GIS UX** — not on production scale or feature completeness.

The frontend is a single-page application that renders the catalogue and an
interactive map. The backend is a NestJS REST API that mediates every request
to a PostgreSQL + PostGIS database. All spatial filtering happens in the
database using parameterised PostGIS queries; the browser never talks to
Postgres directly.

---

## 2. Key Features

- Paginated dataset catalogue with **keyword search** and **theme filter**
- **Dataset detail page** with metadata, licence, tags, spatial extent, and
  attribute schema
- **Interactive map explorer** with MapLibre GL JS — no API key required
- **Layer visibility toggle**, **dataset selector**, and **fit-to-bounds**
- **Click a feature** to see its attributes safely rendered
- **Zoom to feature** action
- **Bbox-driven feature queries** with debouncing, abort, and explicit
  maximum payload size
- **Loading / error / empty / success** UI states across catalogue and map
- **Responsive layout**: full desktop grid, tablet drawer, mobile bottom
  sheet — touch targets ≥40 px, no dense tables on small screens
- **Consistent API envelopes** for success and error responses, plus a
  request-id correlation header
- **Swagger / OpenAPI** documentation at `/api/docs`
- **Docker Compose** orchestration for db, backend, and frontend

---

## 3. Technology Stack

| Layer | Tech |
|-------|------|
| Frontend | Vue 3 (Composition API, `<script setup>`), Vite, TypeScript, Vue Router, Pinia, MapLibre GL JS, Vitest, Vue Test Utils, Axios |
| Backend | NestJS, TypeORM, class-validator, class-transformer, Swagger, Jest, Supertest |
| Database | PostgreSQL 16 with PostGIS 3.4 (GiST + B-tree + GIN indexes) |
| Tooling | Docker Compose, nginx (frontend runtime) |

---

## 4. Architecture Diagram

```mermaid
flowchart LR
  Browser[Browser] --> Frontend[Vue 3 + TypeScript]
  Frontend -->|REST /api/v1| API[NestJS REST API]
  API -->|TypeORM + parameterised SQL| DB[(PostgreSQL + PostGIS)]
  Frontend --> Map[MapLibre GL JS]
```

A more detailed layer breakdown lives in [docs/architecture.md](docs/architecture.md).

---

## 5. Project Structure

```
geocatalog-explorer/
├── README.md
├── docker-compose.yml
├── .env.example
├── docs/
│   ├── architecture.md
│   ├── test-plan.md
│   └── decisions.md
├── db/
│   └── init/
│       ├── 01-schema.sql
│       └── 02-seed-data.sql
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── common/             # request id, logging, exception filter
│   │   ├── datasets/           # catalogue module
│   │   ├── features/           # spatial feature module
│   │   ├── health/             # liveness probe
│   │   ├── database/           # TypeORM connection
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── test/                   # Supertest e2e suite
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── api/                # axios client + typed wrappers
│   │   ├── components/         # reusable UI (common, datasets, map)
│   │   ├── composables/        # useDebounce, useAbortableRequest, useMapFeatureQuery
│   │   ├── router/
│   │   ├── stores/             # Pinia stores
│   │   ├── types/
│   │   ├── views/              # route components
│   │   ├── styles/
│   │   ├── App.vue
│   │   └── main.ts
│   └── tests/                  # Vitest specs
└── screenshots/
```

---

## 6. Local Setup

Prerequisites: Docker + Docker Compose (Docker Desktop 4.x or recent Docker
Engine + Compose v2).

```bash
git clone <this-repo> geocatalog-explorer
cd geocatalog-explorer
cp .env.example .env       # tweak only if defaults conflict with your host
docker compose up --build
```

Once the containers are healthy:

| Service | URL |
|---------|-----|
| Frontend (Vue) | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/api/docs |
| Health probe | http://localhost:3000/api/v1/health |
| Database (optional) | `postgres://geocatalog:geocatalog_dev@localhost:5432/geocatalog` |

The database is initialised automatically on first start via the SQL scripts
in `db/init/`. Schema is **not** re-run on subsequent starts — the data is
preserved in the named volume `geocatalog_pgdata`.

To reset the dataset:

```bash
docker compose down -v
docker compose up --build
```

---

## 7. Environment Variables

Defined in `.env` (copy from `.env.example`):

| Var | Default | Description |
|-----|---------|-------------|
| `POSTGRES_USER` | `geocatalog` | DB user |
| `POSTGRES_PASSWORD` | `geocatalog_dev` | DB password |
| `POSTGRES_DB` | `geocatalog` | DB name |
| `POSTGRES_PORT` | `5432` | Host port for Postgres |
| `BACKEND_PORT` | `3000` | Host port for the NestJS API |
| `FRONTEND_PORT` | `5173` | Host port for nginx (frontend) |
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | Baked into the frontend build |

The frontend container proxies `/api/*` requests to the backend container via
nginx, so the browser always talks to the same origin in production-like
deployments.

---

## 8. API Documentation

Swagger is available at `/api/docs` once the stack is running. All endpoints
are under `/api/v1` and use the following envelopes:

**Success**

```json
{
  "data": ...,
  "meta": { "requestId": "...", "page": 1, "pageSize": 10, "total": 1 }
}
```

**Error**

```json
{
  "error": {
    "code": "INVALID_BBOX",
    "message": "Bounding box coordinates are invalid.",
    "requestId": "..."
  }
}
```

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/health` | Liveness probe. Returns `{ data: { status: 'ok', service: 'geocatalog-api' } }`. |
| `GET /api/v1/datasets` | Paginated catalogue listing. Query: `q`, `theme`, `page`, `pageSize` (≤50). |
| `GET /api/v1/datasets/:slug` | Full dataset metadata + attribute schema. |
| `GET /api/v1/datasets/:slug/features` | GeoJSON FeatureCollection inside a bbox. Query: `minLon`, `minLat`, `maxLon`, `maxLat`, `limit` (≤500). Area ≤ 1.0 sq deg. |
| `GET /api/v1/features/:id` | Single feature with its parent dataset reference. |

Status codes: `200`, `400`, `404`, `500`, `503`. Stack traces are never
exposed to clients.

---

## 9. Example API Requests

```bash
# Health
curl -s http://localhost:3000/api/v1/health | jq

# Search by keyword
curl -s "http://localhost:3000/api/v1/datasets?q=flood" | jq

# Filter by theme, page 2, pageSize 3
curl -s "http://localhost:3000/api/v1/datasets?theme=Environment&page=2&pageSize=3" | jq

# Dataset detail
curl -s http://localhost:3000/api/v1/datasets/flood-risk-zones | jq

# Features inside a bbox around the demo area
curl -s "http://localhost:3000/api/v1/datasets/fire-stations/features?minLon=114.05&minLat=22.20&maxLon=114.35&maxLat=22.45&limit=50" | jq

# Invalid bbox (should return 400 with INVALID_BBOX)
curl -i "http://localhost:3000/api/v1/datasets/fire-stations/features?minLon=200&minLat=22.2&maxLon=114.3&maxLat=22.4"
```

---

## 10. Database and Spatial Query Design

The schema is created by `db/init/01-schema.sql` and seeded by
`db/init/02-seed-data.sql` (loaded automatically on first DB start).

### Tables

- `datasets` — catalogue rows with a stored bounding-box polygon (`4326`).
- `geo_features` — individual features belonging to a dataset, with
  geometry stored as `GEOMETRY(GEOMETRY, 4326)` and a flexible `properties`
  JSONB column for per-dataset attribute schemas.

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `datasets.slug` | Unique B-tree | Fast catalogue detail lookups |
| `datasets.theme` | B-tree | Speed up theme filter queries |
| `geo_features.dataset_id_idx` | B-tree | Per-dataset feature lookups |
| `geo_features_geom_gist_idx` | **GiST** | Bbox pre-filter + spatial intersection |
| `geo_features_properties_gin_idx` | GIN (`jsonb_path_ops`) | Optional JSONB containment queries |

### Spatial Query Pattern

All spatial filters are written as **parameterised SQL**:

```sql
SELECT
  id,
  external_id,
  name,
  properties,
  ST_AsGeoJSON(geom)::json AS geometry
FROM geo_features
WHERE dataset_id = $1
  AND geom && ST_MakeEnvelope($2, $3, $4, $5, 4326)
  AND ST_Intersects(geom, ST_MakeEnvelope($2, $3, $4, $5, 4326))
LIMIT $6;
```

- `geom && ST_MakeEnvelope(...)` is a cheap bounding-box pre-filter
  supported by the GiST index — it cuts the candidate set down to features
  whose envelope overlaps the requested area.
- `ST_Intersects` then enforces an exact spatial intersection.
- User input is bound to `$1..$6` placeholders; the query string is never
  built via concatenation.

### Why enforce a maximum bbox area?

The MVP enforces a 1.0 sq deg upper bound on the requested bbox. This keeps
payloads bounded, prevents accidental "give me the whole world" requests, and
makes response-time behaviour predictable as the catalogue grows.

---

## 11. Testing

### Frontend (Vitest)

```bash
cd frontend
npm install
npm test
```

Coverage targets the catalogue store, common UI components, and the map
feature details panel.

### Backend (Jest)

```bash
cd backend
npm install
npm test
```

Unit tests cover:

- Health controller
- Datasets service (empty results, projection, not-found)
- Bbox validation (invalid order, out-of-range coords, oversize area, over-limit)

### End-to-end (Jest + Supertest)

E2E tests live in `backend/test/` and require a running PostGIS database
populated with the seed data:

```bash
docker compose up -d db
cd backend
npm run test:e2e
```

They cover:

- `GET /api/v1/health`
- `GET /api/v1/datasets` (data + pagination metadata)
- `GET /api/v1/datasets/:slug` 404
- bbox endpoint 400 for invalid input
- bbox endpoint 200 + FeatureCollection shape for a valid bbox

See [docs/test-plan.md](docs/test-plan.md) for the full plan, including
manual GIS functional cases and responsive test cases.

---

## 12. Responsive Design

Three layouts share the same source:

- **Desktop** (≥1024 px): three-column CSS grid — left sidebar (≈280 px),
  flexible map centre, right sidebar (≈320 px). Full-height viewport.
- **Tablet** (768–1024 px): the left sidebar collapses into a drawer; the
  right sidebar stays visible.
- **Mobile** (<768 px): the map fills most of the viewport. The left sidebar
  becomes a slide-up drawer triggered by a touch-friendly button. The
  selected-feature details become a fixed bottom sheet. Touch targets are at
  least 40 × 40 px.

The grid uses CSS only — no external UI library, no JavaScript-based layout.

---

## 13. Data Source and Licence

All data in `db/init/02-seed-data.sql` is **synthetic**. Coordinates fall in
a small bounding box near Hong Kong (114.0–114.4 lon, 22.2–22.5 lat) purely
for visualisation convenience. No real-world flood zones, emergency-service
locations, or public facilities are referenced.

Each dataset declares the licence string `Synthetic demo data — not for
operational use`.

---

## 14. Known Limitations

- Single API process; no horizontal scaling, no caching layer.
- The bbox query hard-limits area (1 sq deg) and feature count (500) — both
  appropriate for the MVP but not for production-scale data.
- Map style is a minimal blank background; no basemap tiles are fetched.
- No authentication, no per-user state, no editing workflow.
- Error reporting goes to logs only; there is no client-side telemetry.

---

## 15. Future Enhancements

- A real vector or raster basemap (still key-less via open sources).
- STAC-style catalog endpoint integration.
- Dataset edit/upload workflow with role-based authorisation.
- Server-side clustering for very dense feature layers.
- Snapshot tests for the catalogue and map views.
- A CI workflow that runs linting, builds, and the unit suites on every PR.

---

## 16. Disclaimer

This project is provided as-is for educational and demonstration purposes.
It is **not** affiliated with, endorsed by, or based on any confidential
information from any government, public-sector, or commercial GIS system. Do
not use it to make decisions about real-world geography, public safety, or
any other consequential matter.

---

## Suggested Commit Messages

This repo follows conventional commits:

```
feat(db): add postgis schema and synthetic seed data
feat(backend): nestjs api with datasets, features, health
feat(frontend): bootstrap vue 3 + vite project
feat(frontend): add pinia stores for dataset and map state
feat(frontend): add dataset catalogue and detail views
feat(frontend): add map explorer with maplibre and bbox query
feat(docker): orchestrate db, backend, frontend services
docs: finalize readme and supporting documentation
```