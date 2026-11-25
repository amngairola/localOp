import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface RequestWithId extends Request {
  id?: string;
  startTime?: number;
}

/** Attaches a unique request ID and logs method/path/duration for every request. */
export function requestLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  req.id = (req.headers['x-request-id'] as string | undefined) ?? uuidv4();
  req.startTime = Date.now();

  // Propagate request ID to the response
  res.setHeader('X-Request-Id', req.id);

  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime ?? Date.now());
    const { statusCode } = res;

    const logFn =
      statusCode >= 500
        ? logger.error.bind(logger)
        : statusCode >= 400
          ? logger.warn.bind(logger)
          : logger.info.bind(logger);

    logFn(
      {
        requestId: req.id,
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        ip,
      },
      `${method} ${url} ${statusCode} ${duration}ms`,
    );
  });

  next();
}
