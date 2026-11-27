import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import { subscriptionController } from '../controllers/subscription.controller';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  querySubscriptionSchema,
  cancelSubscriptionSchema,
  renewSubscriptionSchema,
} from '../schemas/subscription.schema';

export const subscriptionRouter = Router();

// Enforce authentication on all subscription routes
subscriptionRouter.use(authenticate);

subscriptionRouter.get(
  '/',
  validateQuery(querySubscriptionSchema),
  subscriptionController.list
);
subscriptionRouter.get('/summary', subscriptionController.summary);
subscriptionRouter.post(
  '/',
  validateBody(createSubscriptionSchema),
  subscriptionController.create
);
subscriptionRouter.get('/:id', subscriptionController.getById);
subscriptionRouter.patch(
  '/:id',
  validateBody(updateSubscriptionSchema),
  subscriptionController.update
);
subscriptionRouter.delete('/:id', subscriptionController.delete);
subscriptionRouter.post('/:id/pause', subscriptionController.pause);
subscriptionRouter.post('/:id/resume', subscriptionController.resume);
subscriptionRouter.post(
  '/:id/cancel',
  validateBody(cancelSubscriptionSchema),
  subscriptionController.cancel
);
subscriptionRouter.post(
  '/:id/renew',
  validateBody(renewSubscriptionSchema),
  subscriptionController.renew
);
subscriptionRouter.post('/:id/create-bill', subscriptionController.createBill);
