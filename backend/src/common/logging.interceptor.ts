import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

import { REQUEST_ID_HEADER } from './request-id.middleware';

/**
 * Lightweight access logger. One structured line per request that includes
 * the request id, status code, and elapsed milliseconds.
 *
 * Avoid logging bodies / payloads to keep this safe for production use.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.log(req, res, startedAt),
        error: () => this.log(req, res, startedAt),
      }),
    );
  }

  private log(req: Request & { id?: string }, res: Response, startedAt: bigint): void {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const requestId = (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? req.id ?? '-';
    this.logger.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsedMs.toFixed(1)}ms) [${requestId}]`,
    );
  }
}