import { Request, Response, NextFunction } from 'express';
import { verifySupabaseToken } from '../config/supabase';
import { prisma } from '../config/database';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Middleware: verifies the Supabase Bearer token, upserts a Profile row,
 * and attaches userId + userEmail to the request object.
 */
export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7);
    const user = await verifySupabaseToken(token);

    // Upsert profile — ensures a row exists for every authenticated user
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        email: user.email ?? '',
        name:
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === 'string'
              ? user.user_metadata.name
              : null,
        avatarUrl:
          typeof user.user_metadata?.avatar_url === 'string'
            ? user.user_metadata.avatar_url
            : null,
      },
      update: {
        email: user.email ?? '',
      },
    });

    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    logger.debug({ error }, 'Authentication failed');
    next(error);
  }
}

/**
 * Optional auth — attaches userId if a valid token is present, but does not
 * block the request if no token is supplied.
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  return authenticate(req, _res, next);
}
