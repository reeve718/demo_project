/**
 * Standard API error envelope returned to clients.
 *
 * Stack traces and internal details are deliberately NOT exposed here.
 * Use logs server-side for debugging; clients only need the code,
 * human-readable message, and request id for correlation.
 */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}