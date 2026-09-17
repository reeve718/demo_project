-- =============================================================================
-- GeoCatalog Explorer — Synthetic seed data
-- =============================================================================
-- IMPORTANT: All coordinates below are SYNTHETIC and chosen for plausibility
-- only. They do not represent real-world flood zones, real fire stations,
-- or real public facilities. Coordinates fall within a small bounding box
-- near Hong Kong (lon 114.0–114.4, lat 22.2–22.5) so all three datasets
-- appear together in the demo map view.
--
-- The data is loaded only on first database creation, alongside 01-schema.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: build a rectangular polygon (lon, lat) WKT given two corners
-- -----------------------------------------------------------------------------
-- We avoid PostGIS JSON constructors so the script stays readable.

-- -----------------------------------------------------------------------------
-- Dataset 1: Flood Risk Zones (Environment theme, polygons)
-- -----------------------------------------------------------------------------
INSERT INTO datasets (slug, title, description, theme, publisher, license, tags, bbox, fields)
VALUES (
    'flood-risk-zones',
    'Flood Risk Zones',
    'Synthetic polygon dataset representing broad flood-risk categories for a small demo area. Polygons do not correspond to any real flood model.',
    'Environment',
    'Demo GIS Team',
    'Synthetic demo data — not for operational use',
    ARRAY['flood','risk','environment','polygon'],
    ST_MakeEnvelope(114.10, 22.25, 114.30, 22.40, 4326),
    '[
        {"name":"zone_id","alias":"Zone ID","type":"text","nullable":false},
        {"name":"risk_level","alias":"Risk Level","type":"text","nullable":false},
        {"name":"area_km2","alias":"Approx. Area (km²)","type":"number","nullable":true}
    ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO geo_features (dataset_id, external_id, name, properties, geom)
SELECT d.id, 'FRZ-' || lpad(i::text, 2, '0'),
       'Flood Zone ' || lpad(i::text, 2, '0'),
       jsonb_build_object(
           'zone_id', 'FRZ-' || lpad(i::text, 2, '0'),
           'risk_level', (ARRAY['low','medium','high'])[1 + (i % 3)],
           'area_km2', round((0.5 + (i % 5) * 0.4)::numeric, 2)
       ),
       ST_SetSRID(ST_GeomFromText(
           'POLYGON((' ||
           (114.10 + 0.02 * (i-1))::text || ' ' || (22.25 + 0.02 * (i-1))::text || ',' ||
           (114.10 + 0.02 * (i-1) + 0.05)::text || ' ' || (22.25 + 0.02 * (i-1))::text || ',' ||
           (114.10 + 0.02 * (i-1) + 0.05)::text || ' ' || (22.25 + 0.02 * (i-1) + 0.04)::text || ',' ||
           (114.10 + 0.02 * (i-1))::text       || ' ' || (22.25 + 0.02 * (i-1) + 0.04)::text || ',' ||
           (114.10 + 0.02 * (i-1))::text || ' ' || (22.25 + 0.02 * (i-1))::text ||
           '))'
       ), 4326)
FROM datasets d, generate_series(1, 8) AS s(i)
WHERE d.slug = 'flood-risk-zones'
ON CONFLICT DO NOTHING;

-- Refresh dataset bbox from its features (defensive — covers schema drift).
UPDATE datasets d
SET bbox = ST_Envelope(ST_Collect(f.geom))
FROM geo_features f
WHERE f.dataset_id = d.id AND d.slug = 'flood-risk-zones';

-- -----------------------------------------------------------------------------
-- Dataset 2: Fire Stations (Public Safety theme, points)
-- -----------------------------------------------------------------------------
INSERT INTO datasets (slug, title, description, theme, publisher, license, tags, bbox, fields)
VALUES (
    'fire-stations',
    'Fire Stations',
    'Synthetic point dataset of fictional fire station locations used purely for demonstration. No real facility locations are included.',
    'Public Safety',
    'Demo GIS Team',
    'Synthetic demo data — not for operational use',
    ARRAY['fire','station','safety','point'],
    ST_MakeEnvelope(114.05, 22.22, 114.35, 22.45, 4326),
    '[
        {"name":"station_id","alias":"Station ID","type":"text","nullable":false},
        {"name":"status","alias":"Status","type":"text","nullable":false},
        {"name":"staff","alias":"Staff Count","type":"number","nullable":true}
    ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO geo_features (dataset_id, external_id, name, properties, geom)
SELECT d.id,
       'FS-' || lpad(i::text, 2, '0'),
       'Fire Station ' || lpad(i::text, 2, '0'),
       jsonb_build_object(
           'station_id', 'FS-' || lpad(i::text, 2, '0'),
           'status', (ARRAY['active','active','active','planned'])[1 + (i % 4)],
           'staff', 20 + (i * 3) % 40
       ),
       ST_SetSRID(ST_MakePoint(114.05 + 0.022 * i, 22.22 + 0.018 * i), 4326)
FROM datasets d, generate_series(1, 12) AS s(i)
WHERE d.slug = 'fire-stations'
ON CONFLICT DO NOTHING;

UPDATE datasets d
SET bbox = ST_Envelope(ST_Collect(f.geom))
FROM geo_features f
WHERE f.dataset_id = d.id AND d.slug = 'fire-stations';

-- -----------------------------------------------------------------------------
-- Dataset 3: Public Facilities (Community theme, points)
-- -----------------------------------------------------------------------------
INSERT INTO datasets (slug, title, description, theme, publisher, license, tags, bbox, fields)
VALUES (
    'public-facilities',
    'Public Facilities',
    'Synthetic mixed-use point dataset of fictional community facilities (libraries, community centres, sports halls). Used purely for demonstration.',
    'Community',
    'Demo GIS Team',
    'Synthetic demo data — not for operational use',
    ARRAY['community','facility','point'],
    ST_MakeEnvelope(114.08, 22.20, 114.38, 22.48, 4326),
    '[
        {"name":"facility_id","alias":"Facility ID","type":"text","nullable":false},
        {"name":"type","alias":"Type","type":"text","nullable":false},
        {"name":"capacity","alias":"Capacity","type":"number","nullable":true}
    ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO geo_features (dataset_id, external_id, name, properties, geom)
SELECT d.id,
       'PF-' || lpad(i::text, 3, '0'),
       'Public Facility ' || lpad(i::text, 3, '0'),
       jsonb_build_object(
           'facility_id', 'PF-' || lpad(i::text, 3, '0'),
           'type', (ARRAY['library','community_centre','sports_hall','clinic'])[1 + (i % 4)],
           'capacity', 50 + (i * 7) % 200
       ),
       ST_SetSRID(ST_MakePoint(114.08 + 0.018 * (i % 8), 22.20 + 0.022 * i), 4326)
FROM datasets d, generate_series(1, 16) AS s(i)
WHERE d.slug = 'public-facilities'
ON CONFLICT DO NOTHING;

UPDATE datasets d
SET bbox = ST_Envelope(ST_Collect(f.geom))
FROM geo_features f
WHERE f.dataset_id = d.id AND d.slug = 'public-facilities';