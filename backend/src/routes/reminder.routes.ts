import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import { reminderController } from '../controllers/reminder.controller';
import {
  createReminderSchema,
  updateReminderSchema,
  queryReminderSchema,
} from '../schemas/reminder.schema';

export const reminderRouter = Router();

// Enforce authentication on all reminder routes
reminderRouter.use(authenticate);

reminderRouter.get('/', validateQuery(queryReminderSchema), reminderController.list);
reminderRouter.post('/', validateBody(createReminderSchema), reminderController.create);
reminderRouter.get('/:id', reminderController.getById);
reminderRouter.patch('/:id', validateBody(updateReminderSchema), reminderController.update);
reminderRouter.delete('/:id', reminderController.delete);
reminderRouter.post('/:id/complete', reminderController.complete);
