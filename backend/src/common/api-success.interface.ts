/**
 * Standard API success envelope returned to clients.
 *
 * `data` carries the payload, `meta` carries request metadata such as
 * pagination counters and the request id for tracing.
 */
export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: {
    requestId?: string;
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: unknown;
  };
}