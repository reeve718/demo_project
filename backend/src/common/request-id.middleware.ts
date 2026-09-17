import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Attaches a stable request id to every incoming request.
 *
 * If the client already supplied an `X-Request-Id` header (for example
 * from a reverse proxy), we honour it. Otherwise we generate a UUID v4.
 *
 * The id is exposed in:
 *   - response headers (`X-Request-Id`)
 *   - `req.id` for downstream middleware / interceptors
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction): void {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : uuidv4();
    req.id = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  }
}