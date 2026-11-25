import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { errorResponse } from '../utils/response';

export const expenseRouter = Router();

expenseRouter.use(authenticate);

expenseRouter.get('/', (_req, res) => {
  errorResponse(res, 501, 'Expenses endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
expenseRouter.post('/', (_req, res) => {
  errorResponse(res, 501, 'Expenses endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
expenseRouter.get('/:id', (_req, res) => {
  errorResponse(res, 501, 'Expenses endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
expenseRouter.put('/:id', (_req, res) => {
  errorResponse(res, 501, 'Expenses endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
expenseRouter.delete('/:id', (_req, res) => {
  errorResponse(res, 501, 'Expenses endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
