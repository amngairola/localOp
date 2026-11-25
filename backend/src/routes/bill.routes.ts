import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { errorResponse } from '../utils/response';

export const billRouter = Router();

billRouter.use(authenticate);

billRouter.get('/', (_req, res) => {
  errorResponse(res, 501, 'Bills endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
billRouter.post('/', (_req, res) => {
  errorResponse(res, 501, 'Bills endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
billRouter.get('/:id', (_req, res) => {
  errorResponse(res, 501, 'Bills endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
billRouter.put('/:id', (_req, res) => {
  errorResponse(res, 501, 'Bills endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
billRouter.delete('/:id', (_req, res) => {
  errorResponse(res, 501, 'Bills endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
