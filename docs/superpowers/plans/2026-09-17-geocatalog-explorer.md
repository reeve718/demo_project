# GeoCatalog Explorer Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable MVP GIS dataset catalogue and interactive map viewer named "GeoCatalog Explorer" using Vue 3 + NestJS + PostGIS, fully runnable via `docker compose up --build`.

**Architecture:** Single repo with three Docker services (frontend, backend, db). Frontend (Vue 3 + Vite + TS + Pinia + MapLibre) talks only to backend (NestJS + TypeORM). Backend talks only to PostGIS. Synthetic seed data only — no external APIs, no auth, no real-world data.

**Tech Stack:** Vue 3, Vite, TypeScript, Vue Router, Pinia, MapLibre GL JS, Vitest, Vue Test Utils, NestJS, TypeORM, PostgreSQL 16 + PostGIS 3.4, Docker Compose, Jest, Supertest.

---

## Phase 1: Repository Skeleton & Tooling

### Task 1: Root scaffolding

**Files:**
- Create: `README.md` (placeholder, replaced later)
- Create: `.gitignore`
- Create: `.env.example`
- Create: `docker-compose.yml` (placeholder, replaced later)
- Create: `screenshots/.gitkeep`

- [ ] Initialize git repo: `git init`
- [ ] Write `.gitignore` (Node, Vue build output, env, dist, coverage, IDE files)
- [ ] Write `.env.example` with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `BACKEND_PORT`, `FRONTEND_PORT`, `VITE_API_BASE_URL`
- [ ] Create `screenshots/.gitkeep`
- [ ] Commit: `chore: initial repository scaffolding`

### Task 2: Documentation skeleton

**Files:**
- Create: `docs/architecture.md` (placeholder)
- Create: `docs/test-plan.md` (placeholder)
- Create: `docs/decisions.md` (placeholder)

- [ ] Stub each doc with one-line placeholder
- [ ] Commit: `docs: add architecture, test-plan, decisions stubs`

---

## Phase 2: Database

### Task 3: PostGIS schema

**Files:**
- Create: `db/init/01-schema.sql`

- [ ] Enable PostGIS extension
- [ ] Create `datasets` table (UUID id, slug unique, title, description, theme, publisher, license, tags text[], updated_at, bbox geometry(POLYGON,4326), fields jsonb, created_at)
- [ ] Create `geo_features` table (UUID id, dataset_id FK, external_id, name, properties jsonb, geom geometry(GEOMETRY,4326), created_at, updated_at)
- [ ] Add indexes: unique on datasets.slug, B-tree on geo_features.dataset_id, GiST on geo_features.geom, optional GIN on geo_features.properties
- [ ] Add SQL comments explaining each index's purpose
- [ ] Commit: `feat(db): add postgis schema for datasets and geo_features`

### Task 4: Seed data

**Files:**
- Create: `db/init/02-seed-data.sql`

- [ ] Insert 3 datasets (Flood Risk Zones polygons, Fire Stations points, Public Facilities mixed)
- [ ] Insert 5–10 polygon features, 8–15 points, 10–20 mixed around Hong Kong synthetic bounding box (114.0–114.4, 22.2–22.5)
- [ ] Use `ST_SetSRID(ST_MakePoint(lon, lat), 4326)` for points; polygons via `ST_GeomFromGeoJSON` or `ST_MakePolygon`
- [ ] Compute and persist each dataset's bbox via `ST_Envelope(ST_Collect(geom))`
- [ ] Commit: `feat(db): add synthetic seed data for three demo datasets`

---

## Phase 3: Backend (NestJS)

### Task 5: Backend bootstrap

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/nest-cli.json`, `backend/Dockerfile`, `backend/.dockerignore`, `backend/.gitignore`

- [ ] Pin Node 20, NestJS 10, TypeORM 0.3, pg 8, class-validator, class-transformer, swagger
- [ ] Add scripts: `build`, `start`, `start:dev`, `start:prod`, `test`, `test:e2e`
- [ ] Configure tsconfig with strict mode, target ES2022
- [ ] Multi-stage Dockerfile (build + runtime with prod deps)
- [ ] Commit: `feat(backend): bootstrap nestjs project`

### Task 6: Database module & entities

**Files:**
- Create: `backend/src/database/database.module.ts`
- Create: `backend/src/database/typeorm.config.ts`
- Create: `backend/src/datasets/entities/dataset.entity.ts`
- Create: `backend/src/features/entities/geo-feature.entity.ts`

- [ ] TypeORM config from env vars with autoLoadEntities
- [ ] Dataset entity maps to `datasets` table; GeoFeature entity maps to `geo_features`
- [ ] Register entities in module
- [ ] Commit: `feat(backend): add typeorm entities and database module`

### Task 7: Common infrastructure

**Files:**
- Create: `backend/src/common/request-id.middleware.ts`
- Create: `backend/src/common/logging.interceptor.ts`
- Create: `backend/src/common/all-exceptions.filter.ts`
- Create: `backend/src/common/api-success.interface.ts`
- Create: `backend/src/common/api-error.interface.ts`

- [ ] Generate UUID per request, attach to `X-Request-Id` header
- [ ] Logging interceptor logs method + status + duration + requestId
- [ ] Exception filter normalises errors to `{ error: { code, message, requestId } }`, never exposes stack
- [ ] Commit: `feat(backend): add request id, logging, and exception filter`

### Task 8: Datasets module

**Files:**
- Create: `backend/src/datasets/datasets.module.ts`
- Create: `backend/src/datasets/datasets.controller.ts`
- Create: `backend/src/datasets/datasets.service.ts`
- Create: `backend/src/datasets/dto/list-datasets.query.ts`
- Create: `backend/src/datasets/dto/dataset-summary.dto.ts`
- Create: `backend/src/datasets/dto/dataset-detail.dto.ts`

- [ ] `GET /api/v1/datasets` — search title/description/tags with ILIKE, optional theme filter, pagination (page, pageSize 1–50), return `{ data, meta: { page, pageSize, total, requestId } }`
- [ ] `GET /api/v1/datasets/:slug` — return detail with fields, 404 if missing
- [ ] Register controller/service in module
- [ ] Commit: `feat(backend): add datasets listing and detail endpoints`

### Task 9: Features module

**Files:**
- Create: `backend/src/features/features.module.ts`
- Create: `backend/src/features/features.controller.ts`
- Create: `backend/src/features/features.service.ts`
- Create: `backend/src/features/dto/bbox-query.dto.ts`

- [ ] `GET /api/v1/datasets/:slug/features` — required minLon/minLat/maxLon/maxLat, optional limit (default 200, max 500)
- [ ] Validate lon/lat ranges, min<max, max area <= 1.0 sq deg
- [ ] Parameterised SQL using `ST_MakeEnvelope` + `ST_Intersects` + `geom &&`
- [ ] Return GeoJSON FeatureCollection with metadata (requestId, count, bbox)
- [ ] `GET /api/v1/features/:id` — single feature with dataset ref, 404 if missing
- [ ] Commit: `feat(backend): add spatial features endpoint with bbox validation`

### Task 10: Health module & app wiring

**Files:**
- Create: `backend/src/health/health.module.ts`
- Create: `backend/src/health/health.controller.ts`
- Create: `backend/src/app.module.ts`
- Create: `backend/src/main.ts`

- [ ] Health endpoint returns `{ data: { status: 'ok', service: 'geocatalog-api' } }`
- [ ] `main.ts` enables global ValidationPipe (whitelist + transform), registers global filter, Swagger at `/api/docs`, listens on port 3000
- [ ] Global prefix `/api/v1` except Swagger path
- [ ] Commit: `feat(backend): add health endpoint and wire global pipes/filters`

### Task 11: Backend tests

**Files:**
- Create: `backend/src/health/health.controller.spec.ts`
- Create: `backend/src/datasets/datasets.service.spec.ts`
- Create: `backend/src/features/bbox-validation.spec.ts`
- Create: `backend/test/datasets.e2e-spec.ts`
- Create: `backend/test/jest-e2e.json`

- [ ] Unit test: health controller
- [ ] Unit test: datasets service mocked repo — empty result, error path
- [ ] Unit test: bbox validation — rejects invalid order, out-of-range coords, oversized area
- [ ] E2E tests are documented but not auto-run (PostGIS not available in CI for MVP); include clear run instructions in README
- [ ] Commit: `test(backend): add unit tests for health, datasets service, bbox validation`

---

## Phase 4: Frontend (Vue 3)

### Task 12: Frontend bootstrap

**Files:**
- Create: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/index.html`, `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/.gitignore`
- Create: `frontend/.env.example`

- [ ] Vue 3, Vite 5, TS strict, Vue Router 4, Pinia 2, MapLibre GL 4, axios, vitest, @vue/test-utils, jsdom
- [ ] Dockerfile: build stage with node, runtime with nginx serving dist; SPA fallback to index.html
- [ ] nginx.conf with proxy for `/api` to backend
- [ ] Commit: `feat(frontend): bootstrap vue 3 + vite project`

### Task 13: Type definitions & API client

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/api/http.ts`
- Create: `frontend/src/api/datasets.ts`
- Create: `frontend/src/api/features.ts`

- [ ] Types: `RequestStatus`, `DatasetSummary`, `DatasetDetail`, `DatasetField`, `GeoFeature`, `GeoFeatureCollection`, `ApiSuccess<T>`, `ApiError`
- [ ] http.ts wraps axios with baseURL from `VITE_API_BASE_URL`, throws normalised `ApiError`
- [ ] Dataset and feature API functions return typed promises
- [ ] Commit: `feat(frontend): add shared types and api client`

### Task 14: Pinia stores

**Files:**
- Create: `frontend/src/stores/dataset.ts`
- Create: `frontend/src/stores/map.ts`

- [ ] datasetStore: state { datasets, total, selectedDataset, currentSearchKeyword, currentTheme, loadingStatus, errorMessage }; actions { fetchDatasets, fetchDatasetBySlug, setSearchKeyword, setTheme, resetFilters }
- [ ] mapStore: state { selectedDatasetSlug, selectedFeature, isLayerVisible, featureLoadingStatus, featureErrorMessage, currentBbox }; actions { selectDataset, fetchFeaturesByBbox, selectFeature, clearSelectedFeature, toggleLayerVisibility, setCurrentBbox }
- [ ] No MapLibre Map instance in store
- [ ] Commit: `feat(frontend): add pinia stores for dataset and map state`

### Task 15: Composables & router

**Files:**
- Create: `frontend/src/composables/useDebounce.ts`
- Create: `frontend/src/composables/useAbortableRequest.ts`
- Create: `frontend/src/composables/useMapFeatureQuery.ts`
- Create: `frontend/src/router/index.ts`

- [ ] useDebounce: returns debounced value
- [ ] useAbortableRequest: wraps fetch with AbortController, cancels previous
- [ ] useMapFeatureQuery: bbox-driven fetch with debounce + abort
- [ ] Router: `/` → redirect `/datasets`; `/datasets`, `/datasets/:slug`, `/map?dataset=...`, `/about`
- [ ] Commit: `feat(frontend): add composables and router`

### Task 16: Common components

**Files:**
- Create: `frontend/src/components/common/AppHeader.vue`
- Create: `frontend/src/components/common/AppLoading.vue`
- Create: `frontend/src/components/common/AppError.vue`
- Create: `frontend/src/components/common/EmptyState.vue`
- Create: `frontend/src/components/common/AppButton.vue`

- [ ] Each component typed props/emits, minimal markup, scoped styles
- [ ] Commit: `feat(frontend): add common components`

### Task 17: Dataset components & views

**Files:**
- Create: `frontend/src/components/datasets/DatasetSearchBar.vue`
- Create: `frontend/src/components/datasets/DatasetThemeFilter.vue`
- Create: `frontend/src/components/datasets/DatasetCard.vue`
- Create: `frontend/src/components/datasets/DatasetList.vue`
- Create: `frontend/src/components/datasets/DatasetMetadata.vue`
- Create: `frontend/src/views/DatasetCatalogueView.vue`
- Create: `frontend/src/views/DatasetDetailView.vue`
- Create: `frontend/src/views/AboutView.vue`

- [ ] Search bar emits debounced keyword; theme filter emits selected theme
- [ ] DatasetCard renders title/theme/tags/description/publisher/updated
- [ ] DatasetList handles loading/error/empty/success
- [ ] Catalogue view composes search, filter, list, pagination
- [ ] Detail view loads by slug, has Open in Map link
- [ ] Commit: `feat(frontend): add dataset components and catalogue/detail views`

### Task 18: Map components & view

**Files:**
- Create: `frontend/src/components/map/MapView.vue`
- Create: `frontend/src/components/map/LayerPanel.vue`
- Create: `frontend/src/components/map/DatasetSelector.vue`
- Create: `frontend/src/components/map/FeatureDetails.vue`
- Create: `frontend/src/components/map/MapLoadingIndicator.vue`
- Create: `frontend/src/components/map/MobileMapDrawer.vue`
- Create: `frontend/src/views/MapView.vue`

- [ ] MapView owns map instance, source/layer, click handler, cleanup on unmount
- [ ] FeatureDetails safely renders properties, has Zoom to feature button
- [ ] LayerPanel: dataset selector, layer visibility, metadata summary
- [ ] MapView.vue page lays out header / left panel / map / right details with responsive CSS
- [ ] Mobile breakpoint ≤768px: left drawer, bottom sheet for details
- [ ] Commit: `feat(frontend): add map components and map explorer view`

### Task 19: App shell

**Files:**
- Create: `frontend/src/App.vue`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/styles/main.css`

- [ ] App.vue mounts AppHeader + router-view
- [ ] main.ts creates app, installs router + pinia, imports styles
- [ ] Global CSS: reset, design tokens, responsive grid utilities
- [ ] Commit: `feat(frontend): wire app shell and global styles`

### Task 20: Frontend tests

**Files:**
- Create: `frontend/tests/datasetStore.spec.ts`
- Create: `frontend/tests/components/DatasetCard.spec.ts`
- Create: `frontend/tests/components/EmptyState.spec.ts`
- Create: `frontend/tests/components/FeatureDetails.spec.ts`
- Create: `frontend/vitest.config.ts`

- [ ] DatasetCard renders title/theme/tags
- [ ] EmptyState renders friendly message
- [ ] Dataset store handles empty result and API error
- [ ] FeatureDetails safely renders missing/null fields
- [ ] Commit: `test(frontend): add vitest specs for components and store`

---

## Phase 5: Docker & Integration

### Task 21: Docker Compose

**Files:**
- Modify: `docker-compose.yml`
- Create: `db/.dockerignore` (none needed — sql only)

- [ ] Three services: `db` (postgis/postgis:16-3.4), `backend`, `frontend`
- [ ] db: healthcheck via `pg_isready`, named volume `geocatalog_pgdata`, expose 5432
- [ ] backend: depends_on db healthy, port 3000, runs TypeORM + listens
- [ ] frontend: build → nginx, port 5173→80, depends_on backend
- [ ] Network: shared default network
- [ ] Commit: `feat(docker): orchestrate db, backend, frontend services`

### Task 22: End-to-end verification

- [ ] Confirm `docker compose config` parses
- [ ] Document `docker compose up --build` in README
- [ ] Verify port mapping: 5173 (frontend), 3000 (backend + Swagger at /api/docs), 5432 (db)
- [ ] Commit: `docs: verify docker compose is internally consistent`

---

## Phase 6: Documentation

### Task 23: Final documentation

**Files:**
- Create/modify: `README.md`
- Create/modify: `docs/architecture.md`
- Create/modify: `docs/test-plan.md`
- Create/modify: `docs/decisions.md`

- [ ] README: 16 required sections + Mermaid diagram + run instructions + example curl commands + clear disclaimer (no government affiliation, synthetic data only)
- [ ] architecture.md: responsibilities, API lifecycle, bbox flow, why no MapLibre in Pinia, state lifecycle
- [ ] test-plan.md: unit, integration, GIS functional, responsive, manual UAT
- [ ] decisions.md: 6 ADRs (Vue3+Pinia, NestJS, PostGIS, bbox queries, MapLibre, Docker Compose)
- [ ] Commit: `docs: finalize readme and supporting documentation`

---

## Self-Review Notes

- Spec coverage: All 20 spec sections map to at least one task. Excluded items (auth, real STAC, Cesium, ArcGIS, AI, file upload, editing) are confirmed out-of-scope per user instructions.
- No placeholders: All filenames exact; no TBD/TODO/FIXME left in plan.
- Type consistency: `RequestStatus`, `DatasetSummary`, `GeoFeature`, `ApiSuccess<T>` defined once in Task 13 and reused.