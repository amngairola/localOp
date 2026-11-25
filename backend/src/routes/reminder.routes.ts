import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { errorResponse } from '../utils/response';

export const reminderRouter = Router();

reminderRouter.use(authenticate);

reminderRouter.get('/', (_req, res) => {
  errorResponse(res, 501, 'Reminders endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
reminderRouter.post('/', (_req, res) => {
  errorResponse(res, 501, 'Reminders endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
reminderRouter.get('/:id', (_req, res) => {
  errorResponse(res, 501, 'Reminders endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
reminderRouter.put('/:id', (_req, res) => {
  errorResponse(res, 501, 'Reminders endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
reminderRouter.delete('/:id', (_req, res) => {
  errorResponse(res, 501, 'Reminders endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
