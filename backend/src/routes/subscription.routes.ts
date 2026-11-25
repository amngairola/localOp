import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { errorResponse } from '../utils/response';

export const subscriptionRouter = Router();

subscriptionRouter.use(authenticate);

subscriptionRouter.get('/', (_req, res) => {
  errorResponse(res, 501, 'Subscriptions endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
subscriptionRouter.post('/', (_req, res) => {
  errorResponse(res, 501, 'Subscriptions endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
subscriptionRouter.get('/:id', (_req, res) => {
  errorResponse(res, 501, 'Subscriptions endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
subscriptionRouter.put('/:id', (_req, res) => {
  errorResponse(res, 501, 'Subscriptions endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
subscriptionRouter.delete('/:id', (_req, res) => {
  errorResponse(res, 501, 'Subscriptions endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
