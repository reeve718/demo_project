# Test Plan

This document covers automated suites, GIS functional cases, responsive
checks, and the manual UAT flow. The aim is not exhaustive coverage — the
goal is to demonstrate that the MVP behaves as advertised and that future
regressions in the most failure-prone paths are caught early.

## Automated Suites

### Frontend (Vitest)

| Test | Location | What it asserts |
|------|----------|-----------------|
| Dataset store empty | `tests/datasetStore.spec.ts` | `fetchDatasets()` transitions to `empty` when API returns 0 items. |
| Dataset store error | `tests/datasetStore.spec.ts` | `fetchDatasets()` transitions to `error` and stores the message when the API rejects. |
| Dataset store loading flag | `tests/datasetStore.spec.ts` | The store sets `loadingStatus` to `loading` synchronously and resolves to the next state. |
| Reset filters | `tests/datasetStore.spec.ts` | `resetFilters()` clears both keyword and theme. |
| DatasetCard render | `tests/components/DatasetCard.spec.ts` | Title, theme, and tags render. The card links to `/datasets/:slug`. |
| EmptyState | `tests/components/EmptyState.spec.ts` | Renders title and message; default props are sensible. |
| FeatureDetails | `tests/components/FeatureDetails.spec.ts` | Renders properties, handles null/undefined values safely, emits `zoom` and `close`, shows empty state when `feature` is null. |

Run with `npm --prefix frontend test`.

### Backend (Jest)

| Test | Location | What it asserts |
|------|----------|-----------------|
| Health endpoint | `src/health/health.controller.spec.ts` | Returns `{ data: { status: 'ok', service: 'geocatalog-api' } }`. |
| Datasets service — empty | `src/datasets/datasets.service.spec.ts` | Returns empty items and total=0. |
| Datasets service — projection | `src/datasets/datasets.service.spec.ts` | Bbox projection walks polygon coordinates and returns a flat tuple. |
| Datasets service — 404 | `src/datasets/datasets.service.spec.ts` | Throws `ApiException(404)` when slug is not found. |
| Bbox validation | `src/features/bbox-validation.spec.ts` | Rejects invalid ordering, out-of-range coordinates, oversized area, oversized limit. |

Run with `npm --prefix backend test`.

### End-to-End (Jest + Supertest)

Located in `backend/test/datasets.e2e-spec.ts`. Requires a running PostGIS
container with the seed data.

| Case | Expectation |
|------|-------------|
| `GET /api/v1/health` | 200 + `data.status === 'ok'` |
| `GET /api/v1/datasets` | 200 + `Array.isArray(data)` + meta with `page`, `pageSize`, `total` |
| `GET /api/v1/datasets/no-such-slug` | 404 + error envelope |
| bbox with `minLon=200` | 400 + error envelope (out-of-range) |
| bbox covering demo area | 200 + `data.type === 'FeatureCollection'` |

Run with `docker compose up -d db && npm --prefix backend run test:e2e`.

## GIS Functional Cases (manual)

These cover behaviours that are difficult or expensive to automate without
a real browser and PostGIS instance.

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| G1 | Fit to dataset extent | Open `/map?dataset=flood-risk-zones`. | Map fits to the polygon dataset's bbox; the polygons are visible. |
| G2 | Layer visibility toggle | Open `/map?dataset=fire-stations`. Toggle the layer checkbox. | Points disappear and reappear; no console errors. |
| G3 | Click feature on map | Click a marker. | The right-side panel updates with attributes; the marker turns amber to indicate selection. |
| G4 | Zoom to feature | Click a feature, then click **Zoom to feature**. | Map animates to a closer zoom centred on the feature. |
| G5 | Bbox query while panning | Pan the map slowly. | A new features request fires after ~250 ms; no request fires on every pixel. |
| G6 | Aborting older requests | Pan quickly across the map. | The previous in-flight request is cancelled; only the latest is reflected in the UI. |
| G7 | Oversized bbox | Issue `GET /api/v1/datasets/flood-risk-zones/features?minLon=0&minLat=0&maxLon=10&maxLat=10` | 400 + `BBOX_TOO_LARGE` |
| G8 | Unknown dataset | `GET /api/v1/datasets/unknown/features?...` | 404 + `DATASET_NOT_FOUND` |
| G9 | Empty bbox | Pan to an area with no features. | UI shows the `EmptyState` overlay; no console errors. |

## Responsive Test Cases

Resize the browser to common breakpoints and verify the following:

| Breakpoint | Expectation |
|------------|-------------|
| ≥1280 px | Three-column grid (left sidebar / map / right sidebar). |
| 1024 px | Left sidebar collapses into a slide-up drawer; right sidebar remains. |
| ≤768 px | Map fills most of the viewport. Left sidebar accessible via the **☰ Layers** button. Right panel becomes a fixed bottom sheet. Buttons are ≥40 × 40 px. |

Touch-target audit:

- All buttons in the catalogue and map views should be at least 40 × 40 px.
- Inputs and selects should be at least 40 px tall.
- Touching a feature on a small screen opens the bottom sheet without
  obscuring the map controls.

## Manual UAT Flow

1. `docker compose up --build`
2. Visit http://localhost:5173
3. Verify the catalogue loads with three datasets.
4. Search for "flood"; verify the filter narrows results and the empty
   state appears for nonsense queries.
5. Open the flood-risk-zones detail page; verify metadata and fields.
6. Click **Open in Map**; verify the map fits to the polygon extent.
7. Toggle the layer off; verify the polygons disappear.
8. Click a polygon; verify the right panel populates with attributes and
   the **Zoom to feature** button works.
9. Pan the map far away; verify the empty state appears.
10. Resize the browser to a mobile viewport and verify the layout
    described above.
11. Visit http://localhost:3000/api/docs to confirm Swagger loads.
12. Visit `/about` and confirm the disclaimer mentions the project is
    not affiliated with any external system.

## What This Plan Deliberately Does Not Cover

- Visual regression testing.
- Performance / load tests beyond the bbox hard limits.
- Cross-browser pixel-perfect layout — the responsive cases are manual.
- Security / auth testing — the MVP has no authentication.