import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { errorResponse } from '../utils/response';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', (_req, res) => {
  errorResponse(res, 501, 'Notifications endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
notificationRouter.patch('/:id/read', (_req, res) => {
  errorResponse(res, 501, 'Notifications endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
notificationRouter.post('/mark-all-read', (_req, res) => {
  errorResponse(res, 501, 'Notifications endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
notificationRouter.get('/preferences', (_req, res) => {
  errorResponse(res, 501, 'Notifications endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
notificationRouter.put('/preferences', (_req, res) => {
  errorResponse(res, 501, 'Notifications endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
