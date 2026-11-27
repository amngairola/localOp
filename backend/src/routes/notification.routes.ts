import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import { notificationController } from '../controllers/notification.controller';
import {
  queryNotificationSchema,
  updateNotificationPreferencesSchema,
  triggerJobSchema,
} from '../schemas/notification.schema';

export const notificationRouter = Router();

// --- Scheduled Job Endpoints (Publicly routable for cron triggers, secured by CRON_SECRET) ---
notificationRouter.post(
  '/jobs/process',
  validateBody(triggerJobSchema),
  notificationController.processJobs
);
notificationRouter.get('/jobs/status', notificationController.jobStatus);

// --- User-Scoped Authenticated Routes ---
notificationRouter.use(authenticate);

notificationRouter.get('/', validateQuery(queryNotificationSchema), notificationController.list);
notificationRouter.get('/unread-count', notificationController.unreadCount);
notificationRouter.patch('/:id/read', notificationController.markAsRead);
notificationRouter.post('/mark-all-read', notificationController.markAllAsRead);
notificationRouter.delete('/:id', notificationController.delete);

notificationRouter.get('/preferences', notificationController.getPreferences);
notificationRouter.put(
  '/preferences',
  validateBody(updateNotificationPreferencesSchema),
  notificationController.updatePreferences
);
notificationRouter.patch(
  '/preferences',
  validateBody(updateNotificationPreferencesSchema),
  notificationController.updatePreferences
);
