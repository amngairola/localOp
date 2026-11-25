import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { prisma } from '../config/database';
import { successResponse } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export const authRouter = Router();

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile from the database.
 */
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!profile) {
    throw new NotFoundError('Profile');
  }

  successResponse(res, profile, 'Profile retrieved successfully');
});
