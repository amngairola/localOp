import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { errorResponse } from '../utils/response';

export const documentRouter = Router();

documentRouter.use(authenticate);

documentRouter.get('/', (_req, res) => {
  errorResponse(res, 501, 'Documents endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
documentRouter.post('/upload', (_req, res) => {
  errorResponse(res, 501, 'Documents endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
documentRouter.get('/:id', (_req, res) => {
  errorResponse(res, 501, 'Documents endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
documentRouter.delete('/:id', (_req, res) => {
  errorResponse(res, 501, 'Documents endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
