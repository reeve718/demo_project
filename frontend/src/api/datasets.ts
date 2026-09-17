import { http } from './http';
import type {
  ApiSuccess,
  DatasetDetail,
  DatasetSummary,
  PaginationMeta,
} from '../types';

export interface ListDatasetsParams {
  q?: string;
  theme?: string;
  page?: number;
  pageSize?: number;
}

export interface ListDatasetsResult {
  items: DatasetSummary[];
  meta: PaginationMeta;
}

/**
 * GET /datasets — list with optional keyword/theme filter and pagination.
 */
export async function listDatasets(
  params: ListDatasetsParams = {},
): Promise<ListDatasetsResult> {
  const res = await http.get<ApiSuccess<DatasetSummary[]>>('/datasets', { params });
  return {
    items: res.data.data ?? [],
    meta: {
      page: Number(res.data.meta?.page ?? params.page ?? 1),
      pageSize: Number(res.data.meta?.pageSize ?? params.pageSize ?? 10),
      total: Number(res.data.meta?.total ?? 0),
      requestId: typeof res.data.meta?.requestId === 'string' ? res.data.meta.requestId : undefined,
    },
  };
}

/**
 * GET /datasets/:slug — full metadata + fields schema.
 */
export async function getDatasetBySlug(slug: string): Promise<DatasetDetail> {
  const res = await http.get<ApiSuccess<DatasetDetail>>(`/datasets/${encodeURIComponent(slug)}`);
  return res.data.data;
}