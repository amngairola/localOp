import { Router } from 'express';
import { authRouter } from './auth.routes';
import { dashboardRouter } from './dashboard.routes';
import { reminderRouter } from './reminder.routes';
import { billRouter } from './bill.routes';
import { subscriptionRouter } from './subscription.routes';
import { expenseRouter } from './expense.routes';
import { taskRouter } from './task.routes';
import { documentRouter } from './document.routes';
import { aiRouter } from './ai.routes';
import { notificationRouter } from './notification.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/reminders', reminderRouter);
apiRouter.use('/bills', billRouter);
apiRouter.use('/subscriptions', subscriptionRouter);
apiRouter.use('/expenses', expenseRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/notifications', notificationRouter);
