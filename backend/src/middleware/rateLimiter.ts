import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response';
import { Request, Response } from 'express';

function rateLimitHandler(_req: Request, res: Response): void {
  errorResponse(res, 429, 'Too many requests — please slow down', 'RATE_LIMITED');
}

/** General API: 100 requests per 15 minutes */
export const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Use userId if available (injected by auth middleware), else IP
    const authReq = req as Request & { userId?: string };
    return authReq.userId ?? req.ip ?? 'unknown';
  },
});

/** AI endpoints: 20 requests per minute — LLM calls are expensive */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const authReq = req as Request & { userId?: string };
    return authReq.userId ?? req.ip ?? 'unknown';
  },
});

/** Strict: 30 requests per 15 minutes — for auth/sensitive actions */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
