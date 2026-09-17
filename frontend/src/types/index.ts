/**
 * Shared frontend type definitions.
 *
 * These mirror the shapes returned by the NestJS API and are kept in sync
 * with the DTOs in `backend/src/`. Keeping types strict here means most
 * API mistakes surface at compile time.
 */

export type RequestStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error';

/** [minLon, minLat, maxLon, maxLat] in WGS84. */
export type BboxTuple = [number, number, number, number];

export interface DatasetField {
  name: string;
  alias: string;
  type: string;
  nullable: boolean;
}

export interface DatasetSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: string;
  publisher: string;
  license: string;
  updatedAt: string;
  tags: string[];
  bbox: BboxTuple;
}

export interface DatasetDetail extends DatasetSummary {
  fields: DatasetField[];
}

export interface GeoFeatureProperties {
  name?: string;
  type?: string;
  status?: string;
  external_id?: string;
  [key: string]: unknown;
}

export interface GeoFeature {
  type: 'Feature';
  id: string;
  geometry: GeoJSON.Geometry;
  properties: GeoFeatureProperties;
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export interface BboxFeatureCollectionEnvelope extends GeoFeatureCollection {
  meta: {
    requestId?: string;
    datasetSlug: string;
    bbox: BboxTuple;
    returned: number;
    limit: number;
  };
}

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  requestId?: string;
}

/**
 * Maps a DatasetField `type` string into a safer UI hint. Unknown values
 * fall through as 'text' so we never render an undefined icon.
 */
export type DatasetFieldKind = 'text' | 'number' | 'date' | 'boolean';