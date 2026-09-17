import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain-specific HTTP exception that carries a stable error `code` in
 * addition to the standard HTTP status. The global exception filter
 * projects this into the standard `ApiErrorBody` envelope.
 */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}