import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, isAppError } from '../utils/errors';
import { errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

const isProd = process.env.NODE_ENV === 'production';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // ── Operational / known errors ───────────────────────────────────────────
  if (isAppError(error)) {
    if (error.statusCode >= 500) {
      logger.error({ err: error, url: req.url, method: req.method }, error.message);
    } else {
      logger.warn({ err: error, url: req.url }, error.message);
    }

    const details = 'details' in error ? (error as { details?: unknown }).details : undefined;
    errorResponse(res, error.statusCode, error.message, error.code, isProd ? undefined : details);
    return;
  }

  // ── Prisma known errors ──────────────────────────────────────────────────
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn({ code: error.code, meta: error.meta }, 'Prisma error');

    if (error.code === 'P2002') {
      errorResponse(res, 409, 'A record with that value already exists', 'CONFLICT');
      return;
    }
    if (error.code === 'P2025') {
      errorResponse(res, 404, 'Record not found', 'NOT_FOUND');
      return;
    }
    if (error.code === 'P2003') {
      errorResponse(res, 400, 'Related record not found', 'FOREIGN_KEY_ERROR');
      return;
    }

    errorResponse(res, 400, 'Database operation failed', error.code);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.warn({ err: error }, 'Prisma validation error');
    errorResponse(res, 400, 'Invalid database query', 'DB_VALIDATION_ERROR');
    return;
  }

  // ── SyntaxError from JSON parsing ────────────────────────────────────────
  if (error instanceof SyntaxError && 'body' in error) {
    errorResponse(res, 400, 'Invalid JSON in request body', 'INVALID_JSON');
    return;
  }

  // ── Unknown / unexpected errors ──────────────────────────────────────────
  logger.error({ err: error, url: req.url, method: req.method }, 'Unexpected error');
  errorResponse(
    res,
    500,
    isProd ? 'Internal server error' : (error instanceof Error ? error.message : 'Unknown error'),
    'INTERNAL_ERROR',
  );
}
