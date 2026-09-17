import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import type { ApiError } from '../types';

/**
 * Base URL for the API. Vite injects `import.meta.env.VITE_API_BASE_URL`
 * at build time.
 *
 * The default is a relative `/api/v1` so the request is routed through the
 * same origin (nginx proxies it to the backend container in production /
 * docker). This avoids CORS issues without requiring any backend changes.
 *
 * For development against a standalone backend on a different port, set
 * VITE_API_BASE_URL=http://localhost:3000/api/v1.
 */
const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

/**
 * Public configuration read by tests so they can stub the base URL.
 */
export const httpConfig = { baseURL } as const;

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

/**
 * Normalises an Axios error into the standard `ApiError` envelope shape.
 * If the backend returned the envelope, we surface it directly; otherwise
 * we synthesise a stable shape so the UI never has to defend against
 * `undefined.message`.
 */
export function normaliseError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiError>;
    if (axiosErr.response?.data && typeof axiosErr.response.data === 'object') {
      const body = axiosErr.response.data;
      if ('error' in body && body.error) {
        return body as ApiError;
      }
    }
    return {
      error: {
        code: axiosErr.response?.status === 404 ? 'NOT_FOUND' : 'NETWORK_ERROR',
        message: axiosErr.message || 'Network error',
      },
    };
  }
  return {
    error: {
      code: 'UNKNOWN_ERROR',
      message: err instanceof Error ? err.message : 'Unknown error',
    },
  };
}

/**
 * Convenience helper for endpoints that want to honour an AbortController
 * signal via Axios' `cancelToken`/signal pattern.
 */
export function withSignal<T>(config: AxiosRequestConfig = {}): AxiosRequestConfig {
  return config;
}

export default http;