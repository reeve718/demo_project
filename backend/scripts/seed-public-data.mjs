#!/usr/bin/env node
// =============================================================================
// GeoCatalog Explorer — public-data seed loader.
//
// Reads `db/seed/manifest.json` plus `db/seed/datasets/<slug>.geojson` files
// and loads them into the database via parameterised SQL.
//
// Idempotent: each dataset row is upserted; each dataset's features are
// replaced wholesale. Safe to re-run on every `docker compose up`.
//
// Run with:
//   node scripts/seed-public-data.mjs <seed-dir>
// =============================================================================

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const seedDirArg = process.argv[2] ?? process.env.SEED_DIR ?? null;
const seedDir = seedDirArg ? resolve(seedDirArg) : null;

if (!seedDir || !existsSync(seedDir)) {
  console.error(`Seed directory not found: ${seedDir ?? '(none provided)'}`);
  console.error('Usage: node scripts/seed-public-data.mjs <seed-dir>');
  process.exit(1);
}

const pgConfig = {
  host: process.env.POSTGRES_HOST ?? 'db',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  user: process.env.POSTGRES_USER ?? 'geocatalog',
  password: process.env.POSTGRES_PASSWORD ?? 'geocatalog_dev',
  database: process.env.POSTGRES_DB ?? 'geocatalog',
};

const manifestPath = resolve(seedDir, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`manifest.json not found at ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (!manifest || !Array.isArray(manifest.datasets)) {
  console.error('manifest.json must have a top-level "datasets" array');
  process.exit(1);
}

const datasetsDir = resolve(seedDir, 'datasets');
if (!existsSync(datasetsDir)) {
  console.error(`datasets/ directory not found at ${datasetsDir}`);
  process.exit(1);
}

async function main() {
  const client = new pg.Client(pgConfig);
  console.log(`Connecting to postgres://${pgConfig.user}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`);
  await client.connect();

  let totalFeatures = 0;
  try {
    await client.query('BEGIN');

    for (const ds of manifest.datasets) {
      const slug = String(ds.slug ?? '').trim();
      if (!slug) {
        throw new Error('Dataset in manifest is missing "slug"');
      }
      const fcPath = resolve(datasetsDir, `${slug}.geojson`);
      if (!existsSync(fcPath)) {
        throw new Error(`GeoJSON file missing for dataset '${slug}': ${fcPath}`);
      }
      const fc = JSON.parse(readFileSync(fcPath, 'utf8'));
      if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
        throw new Error(`Invalid FeatureCollection for '${slug}'`);
      }

      const features = fc.features.filter((f) => f?.geometry);
      console.log(`[${slug}] upserting dataset (${features.length} features)`);

      // 1. Upsert dataset row with placeholder bbox; recompute below.
      const placeholderBbox = JSON.stringify({
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      });
      const fieldsJson = JSON.stringify(Array.isArray(ds.fields) ? ds.fields : []);

      await client.query(
        `INSERT INTO datasets (
            slug, title, description, theme, publisher, license,
            tags, updated_at, bbox, fields
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), ST_GeomFromGeoJSON($8), $9::jsonb)
          ON CONFLICT (slug) DO UPDATE SET
            title       = EXCLUDED.title,
            description = EXCLUDED.description,
            theme       = EXCLUDED.theme,
            publisher   = EXCLUDED.publisher,
            license     = EXCLUDED.license,
            tags        = EXCLUDED.tags,
            updated_at  = now(),
            fields      = EXCLUDED.fields`,
        [
          slug,
          String(ds.title ?? slug),
          String(ds.description ?? ''),
          String(ds.theme ?? 'Uncategorised'),
          String(ds.publisher ?? 'Unknown'),
          String(ds.license ?? ''),
          Array.isArray(ds.tags) ? ds.tags.map(String) : [],
          placeholderBbox,
          fieldsJson,
        ],
      );

      // 2. Replace features for this dataset.
      await client.query(`DELETE FROM geo_features WHERE dataset_id = (SELECT id FROM datasets WHERE slug = $1)`, [slug]);

      for (const f of features) {
        const featureId = typeof f.id === 'string' || typeof f.id === 'number' ? String(f.id) : null;
        const name = typeof f.properties?.name === 'string' ? f.properties.name : null;
        const externalId = featureId;
        const props = f.properties ?? {};
        await client.query(
          `INSERT INTO geo_features (dataset_id, external_id, name, properties, geom)
           VALUES (
             (SELECT id FROM datasets WHERE slug = $1),
             $2, $3, $4::jsonb,
             ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)
           )`,
          [
            slug,
            externalId,
            name,
            JSON.stringify(props),
            JSON.stringify(f.geometry),
          ],
        );
      }

      // 3. Refresh dataset bbox from its features.
      await client.query(
        `UPDATE datasets
         SET bbox = (
           SELECT ST_Envelope(ST_Collect(geom))
           FROM geo_features
           WHERE dataset_id = datasets.id
         )
         WHERE slug = $1`,
        [slug],
      );

      totalFeatures += features.length;
    }

    await client.query('COMMIT');
    console.log(`Seed complete: ${manifest.datasets.length} dataset(s), ${totalFeatures} feature(s)`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});