import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { errorResponse } from '../utils/response';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/', (_req, res) => {
  errorResponse(res, 501, 'Dashboard endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
