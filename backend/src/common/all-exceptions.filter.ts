import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiErrorBody } from './api-error.interface';
import { REQUEST_ID_HEADER } from './request-id.middleware';

/**
 * Catches every uncaught error, normalises it into the standard error
 * envelope, and never leaks stack traces to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = this.readRequestId(req);

    const { status, code, message, details } = this.normalise(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${req.method} ${req.originalUrl} -> ${status} ${code} [${requestId}]`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${req.method} ${req.originalUrl} -> ${status} ${code} [${requestId}] ${message}`,
      );
    }

    const body: ApiErrorBody = {
      error: {
        code,
        message,
        requestId,
        ...(details !== undefined ? { details } : {}),
      },
    };

    res.status(status).json(body);
  }

  private readRequestId(req: Request): string | undefined {
    const headerVal = req.headers[REQUEST_ID_HEADER];
    if (typeof headerVal === 'string' && headerVal.length > 0) return headerVal;
    const alt = (req as Request & { id?: string }).id;
    return typeof alt === 'string' ? alt : undefined;
  }

  private normalise(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();

      if (resp && typeof resp === 'object') {
        const r = resp as { code?: unknown; message?: unknown; details?: unknown };
        const code = typeof r.code === 'string' ? r.code : this.defaultCodeForStatus(status);
        const message =
          typeof r.message === 'string'
            ? r.message
            : Array.isArray(r.message)
              ? r.message.join('; ')
              : exception.message;
        return { status, code, message, details: r.details };
      }

      return {
        status,
        code: this.defaultCodeForStatus(status),
        message: exception.message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    };
  }

  private defaultCodeForStatus(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'ERROR';
    }
  }
}