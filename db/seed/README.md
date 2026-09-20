# Seed Data Format

This directory is the canonical location for catalogue seed data. The
`seed` service in `docker compose` reads these files on startup and
inserts them into the database via parameterised SQL.

## Data provenance and attribution

The bundled GeoJSON files are downloaded from the
[Common Spatial Data Infrastructure (CSDI) Portal](https://www.csdi.gov.hk/),
an open-data service of the Government of the Hong Kong Special
Administrative Region. The CSDI Terms of Use require that any republication
identify the Government and the CSDI Portal as the source of the Data and
acknowledge the Government and the relevant organisations' intellectual
property rights. The bundled `manifest.json` lists the publisher for each
dataset, and the project `/about` page reproduces the full CSDI Terms of
Use. If you replace the bundled data with your own, keep the attribution
fields (`publisher`, `license`) accurate and update the `/about` page if
you redistribute the result publicly.

## Files

- `manifest.json` — one file describing every dataset in the catalogue
- `datasets/<slug>.geojson` — one GeoJSON FeatureCollection per dataset

## `manifest.json` schema

```json
{
  "datasets": [
    {
      "slug": "my-dataset",
      "title": "Human-readable title",
      "description": "Plain-text description (1-3 sentences).",
      "theme": "Environment",
      "publisher": "Organisation that produced the data",
      "license": "Licence name (e.g. CC-BY 4.0)",
      "tags": ["tag1", "tag2"],
      "fields": [
        {
          "name": "field_name",
          "alias": "Human-readable name",
          "type": "text|number|date",
          "nullable": true
        }
      ]
    }
  ]
}
```

Required: `slug`, `title`, `description`, `theme`, `publisher`, `license`.
Optional: `tags` (default `[]`), `fields` (default `[]`).

The `slug` must be URL-safe (lowercase letters, digits, hyphens) and is
used as the public identifier for the dataset (`/datasets/:slug`).

## GeoJSON file schema

Each `datasets/<slug>.geojson` is a standard
[GeoJSON FeatureCollection](https://datatracker.ietf.org/doc/html/rfc7946):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "stable-id-or-uuid",
      "geometry": { "type": "Point", "coordinates": [114.18, 22.32] },
      "properties": {
        "name": "Feature name (recommended)",
        "field_name": "value",
        "...": "any additional attributes"
      }
    }
  ]
}
```

- `features[].id` is optional; the loader generates a UUID if absent.
- `features[].properties.name` is recommended — it becomes the feature's
  display name in the catalogue detail / map UI.
- Any other `properties` keys are preserved in the `geo_features.properties`
  JSONB column and shown verbatim on the feature detail panel.
- Supported `geometry.type`: `Point`, `MultiPoint`, `LineString`,
  `MultiLineString`, `Polygon`, `MultiPolygon`, `GeometryCollection`.
- Coordinates must be WGS84 (`EPSG:4326`).

## Replacing or extending the bundled data

The bundled GeoJSONs come from the CSDI Portal. To swap in your own
public data (whether from CSDI or another source):

1. Edit `manifest.json` (or replace with your own).
2. Drop your GeoJSON files into `datasets/` using the matching `slug`.
3. Restart the stack:

   ```bash
   docker compose up --build
   ```

The seed service re-runs every time the stack starts, so the database
will reflect the latest files. The seed is idempotent (uses
`ON CONFLICT ... DO UPDATE`) — existing dataset metadata is updated and
features are replaced wholesale. Datasets that are removed from
`manifest.json` are also removed from the database on the next seed run.

> **Attribution reminder.** If your data originates from the CSDI Portal,
> keep `publisher` accurate (e.g. `Hong Kong Fire Services Department` or
> `Education Bureau, Hong Kong SAR Government`) and reference the CSDI
> Portal as the source. If you redistribute this project, keep the CSDI
> Terms of Use in the `/about` page.

## Resetting the catalogue

```bash
docker compose down -v   # removes the named volume `geocatalog_pgdata`
docker compose up --build
```