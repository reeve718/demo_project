import { http } from './http';
import type {
  ApiSuccess,
  BboxFeatureCollectionEnvelope,
  BboxTuple,
  GeoFeature,
} from '../types';

export interface BboxQuery {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  limit?: number;
}

/**
 * GET /datasets/:slug/features — features inside the bbox.
 */
export async function fetchFeaturesByBbox(
  slug: string,
  bbox: BboxQuery,
  signal?: AbortSignal,
): Promise<BboxFeatureCollectionEnvelope> {
  const res = await http.get<ApiSuccess<BboxFeatureCollectionEnvelope>>(
    `/datasets/${encodeURIComponent(slug)}/features`,
    {
      params: {
        minLon: bbox.minLon,
        minLat: bbox.minLat,
        maxLon: bbox.maxLon,
        maxLat: bbox.maxLat,
        limit: bbox.limit ?? 200,
      },
      signal,
    },
  );
  return res.data.data;
}

export interface SingleFeatureResult {
  feature: GeoFeature;
  dataset: { slug: string; title: string };
}

/**
 * GET /features/:id — single feature plus its parent dataset.
 */
export async function getFeatureById(id: string): Promise<SingleFeatureResult> {
  const res = await http.get<
    ApiSuccess<{
      type: 'Feature';
      id: string;
      geometry: GeoJSON.Geometry;
      properties: GeoFeature['properties'];
      dataset: { slug: string; title: string };
    }>
  >(`/features/${encodeURIComponent(id)}`);
  const data = res.data.data;
  return {
    feature: {
      type: 'Feature',
      id: data.id,
      geometry: data.geometry,
      properties: data.properties,
    },
    dataset: data.dataset,
  };
}

/** Fits a bounding box onto MapLibre's `LngLatBoundsLike` format. */
export function bboxToLngLatBounds(bbox: BboxTuple): [
  [number, number],
  [number, number],
] {
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];
}