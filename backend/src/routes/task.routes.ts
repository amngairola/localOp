import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { errorResponse } from '../utils/response';

export const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.get('/', (_req, res) => {
  errorResponse(res, 501, 'Tasks endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
taskRouter.post('/', (_req, res) => {
  errorResponse(res, 501, 'Tasks endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
taskRouter.get('/:id', (_req, res) => {
  errorResponse(res, 501, 'Tasks endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
taskRouter.put('/:id', (_req, res) => {
  errorResponse(res, 501, 'Tasks endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
taskRouter.delete('/:id', (_req, res) => {
  errorResponse(res, 501, 'Tasks endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
