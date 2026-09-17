-- =============================================================================
-- GeoCatalog Explorer — schema bootstrap
-- =============================================================================
-- The synthetic seed data is now loaded from `db/seed/` by the `seed` service
-- (see backend/scripts/seed-public-data.mjs). This file is kept for backwards
-- compatibility but is intentionally empty; the loader handles all inserts.
--
-- To swap in your own public data:
--   1. Edit db/seed/manifest.json
--   2. Drop GeoJSON FeatureCollections into db/seed/datasets/<slug>.geojson
--   3. Run `docker compose up --build`
--
-- See db/seed/README.md for the full format spec.
-- =============================================================================

SELECT 'Seed handled by /seed service; see db/seed/README.md.' AS notice;