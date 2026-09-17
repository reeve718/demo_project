-- =============================================================================
-- GeoCatalog Explorer — PostGIS schema
-- =============================================================================
-- This script is executed automatically the first time the `db` container is
-- created (Postgres only runs scripts in /docker-entrypoint-initdb.d once).
-- It assumes the PostGIS image (postgis/postgis:16-3.4), which already
-- contains the postgis extension, but we enable it explicitly for safety.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- -----------------------------------------------------------------------------
-- datasets
-- -----------------------------------------------------------------------------
-- One row per logical dataset (catalogue entry). `bbox` is the dataset-level
-- bounding box stored as a polygon so we can answer extent queries and use
-- GiST indexing for spatial catalogue search.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS datasets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    theme       TEXT NOT NULL,
    publisher   TEXT NOT NULL,
    license     TEXT NOT NULL,
    tags        TEXT[] NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    bbox        geometry(POLYGON, 4326) NOT NULL,
    fields      JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on slug is created automatically by UNIQUE constraint above;
-- we add an explicit named index for clarity in EXPLAIN plans.

-- Theme index for catalogue filter dropdowns (B-tree on low-cardinality text).
CREATE INDEX IF NOT EXISTS datasets_theme_idx ON datasets (theme);

-- -----------------------------------------------------------------------------
-- geo_features
-- -----------------------------------------------------------------------------
-- Individual geometry features belonging to a dataset. `properties` holds
-- user-defined attributes as JSONB so each dataset can have its own schema.
-- `geom` uses the generic GEOMETRY type because features may be points,
-- polygons, or any other shape.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS geo_features (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id  UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    external_id TEXT,
    name        TEXT,
    properties  JSONB NOT NULL DEFAULT '{}'::jsonb,
    geom        geometry(GEOMETRY, 4326) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B-tree index on dataset_id supports per-dataset feature lookups
-- (the most common access pattern in this MVP: "give me all features of
-- dataset X that fall inside bbox Y").
CREATE INDEX IF NOT EXISTS geo_features_dataset_id_idx
    ON geo_features (dataset_id);

-- GiST index on geom enables efficient bounding-box pre-filters
-- (`geom && ST_MakeEnvelope(...)`) which the planner combines with
-- ST_Intersects for an exact spatial filter. Without this index the
-- query degrades to a sequential scan as data grows.
CREATE INDEX IF NOT EXISTS geo_features_geom_gist_idx
    ON geo_features USING GIST (geom);

-- GIN index on properties supports optional JSONB containment searches
-- (`properties @> '{"status":"active"}'`). Marked optional because not
-- every query path uses it, but cheap to maintain for this dataset size.
CREATE INDEX IF NOT EXISTS geo_features_properties_gin_idx
    ON geo_features USING GIN (properties jsonb_path_ops);

-- -----------------------------------------------------------------------------
-- Trigger: keep updated_at fresh on row modification
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS geo_features_touch_updated_at ON geo_features;
CREATE TRIGGER geo_features_touch_updated_at
    BEFORE UPDATE ON geo_features
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();