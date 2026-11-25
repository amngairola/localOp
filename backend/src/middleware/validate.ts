import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

function formatZodError(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

/**
 * Validates req.body against a Zod schema.
 * On failure throws ValidationError (422) with field-level details.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError('Request body validation failed', formatZodError(result.error)));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 * On failure throws ValidationError (422) with field-level details.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new ValidationError('Query parameter validation failed', formatZodError(result.error)));
    }
    // Cast — query params are always strings from Express but schema may coerce
    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}

/**
 * Validates req.params against a Zod schema.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new ValidationError('Route parameter validation failed', formatZodError(result.error)));
    }
    next();
  };
}
