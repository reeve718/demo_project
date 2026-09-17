import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiException } from '../common/http-exception';
import { DatasetsService } from '../datasets/datasets.service';
import { GeoFeature } from './entities/geo-feature.entity';
import {
  BboxQueryDto,
  FEATURE_LIMIT_MAX,
  MAX_BBOX_AREA_SQ_DEG,
} from './dto/bbox-query.dto';

export interface BboxFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id: string;
    geometry: unknown;
    properties: Record<string, unknown>;
  }>;
  meta: {
    requestId?: string;
    datasetSlug: string;
    bbox: [number, number, number, number];
    returned: number;
    limit: number;
  };
}

export interface SingleFeatureResult {
  type: 'Feature';
  id: string;
  geometry: unknown;
  properties: Record<string, unknown>;
  dataset: { slug: string; title: string };
  meta?: { requestId?: string };
}

/**
 * Pure validator extracted so we can unit-test the bbox rules without a DB.
 */
export function validateBbox(query: BboxQueryDto): void {
  if (query.minLon >= query.maxLon) {
    throw new ApiException(
      400,
      'INVALID_BBOX',
      'minLon must be strictly less than maxLon.',
    );
  }
  if (query.minLat >= query.maxLat) {
    throw new ApiException(
      400,
      'INVALID_BBOX',
      'minLat must be strictly less than maxLat.',
    );
  }
  const width = query.maxLon - query.minLon;
  const height = query.maxLat - query.minLat;
  const area = width * height;
  if (area > MAX_BBOX_AREA_SQ_DEG) {
    throw new ApiException(
      400,
      'BBOX_TOO_LARGE',
      `Bounding box area ${area.toFixed(4)} sq deg exceeds the maximum ${MAX_BBOX_AREA_SQ_DEG} sq deg.`,
    );
  }
  if (query.limit > FEATURE_LIMIT_MAX) {
    throw new ApiException(
      400,
      'LIMIT_TOO_LARGE',
      `Limit ${query.limit} exceeds the maximum ${FEATURE_LIMIT_MAX}.`,
    );
  }
}

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  constructor(
    @InjectRepository(GeoFeature)
    private readonly repo: Repository<GeoFeature>,
    private readonly datasetsService: DatasetsService,
  ) {}

  /**
   * Returns GeoJSON features for the given dataset that intersect the bbox.
   * Uses a parameterized SQL query so user input is never concatenated.
   */
  async findByBbox(
    slug: string,
    query: BboxQueryDto,
    requestId?: string,
  ): Promise<BboxFeatureCollection> {
    validateBbox(query);
    const dataset = await this.datasetsService.findBySlugOrFail(slug);

    // All five parameters are bound placeholders ($1..$5), no concatenation.
    const rows = await this.repo.query(
      `SELECT
         id,
         external_id,
         name,
         properties,
         ST_AsGeoJSON(geom)::json AS geometry
       FROM geo_features
       WHERE dataset_id = $1
         AND geom && ST_MakeEnvelope($2, $3, $4, $5, 4326)
         AND ST_Intersects(geom, ST_MakeEnvelope($2, $3, $4, $5, 4326))
       LIMIT $6`,
      [dataset.id, query.minLon, query.minLat, query.maxLon, query.maxLat, query.limit],
    );

    const features = (rows as Array<Record<string, unknown>>).map((row) => ({
      type: 'Feature' as const,
      id: String(row.id),
      geometry: row.geometry,
      properties: this.mergeProperties(row),
    }));

    return {
      type: 'FeatureCollection',
      features,
      meta: {
        requestId,
        datasetSlug: dataset.slug,
        bbox: [query.minLon, query.minLat, query.maxLon, query.maxLat],
        returned: features.length,
        limit: query.limit,
      },
    };
  }

  /**
   * Returns a single feature by id along with a reference to its parent
   * dataset, or throws 404 if missing.
   */
  async findById(id: string, requestId?: string): Promise<SingleFeatureResult> {
    const rows = await this.repo.query(
      `SELECT
         f.id,
         f.external_id,
         f.name,
         f.properties,
         ST_AsGeoJSON(f.geom)::json AS geometry,
         d.slug  AS dataset_slug,
         d.title AS dataset_title
       FROM geo_features f
       JOIN datasets d ON d.id = f.dataset_id
       WHERE f.id = $1
       LIMIT 1`,
      [id],
    );

    const row = (rows as Array<Record<string, unknown>>)[0];
    if (!row) {
      throw new ApiException(404, 'FEATURE_NOT_FOUND', `Feature '${id}' was not found.`);
    }

    return {
      type: 'Feature',
      id: String(row.id),
      geometry: row.geometry,
      properties: this.mergeProperties(row),
      dataset: {
        slug: String(row.dataset_slug ?? ''),
        title: String(row.dataset_title ?? ''),
      },
      meta: { requestId },
    };
  }

  /**
   * Combines the row's `properties` JSONB with the conventional `name`
   * and `external_id` columns so the frontend always has these available
   * without needing to look at extra fields.
   */
  private mergeProperties(row: Record<string, unknown>): Record<string, unknown> {
    const props =
      row.properties && typeof row.properties === 'object' && !Array.isArray(row.properties)
        ? { ...(row.properties as Record<string, unknown>) }
        : {};
    if (typeof row.name === 'string' && row.name.length > 0) props['name'] = row.name;
    if (typeof row.external_id === 'string' && row.external_id.length > 0)
      props['external_id'] = row.external_id;
    return props;
  }
}