import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import {
  notificationService,
  NotificationService,
} from '../services/notification.service';
import {
  successResponse,
  noContentResponse,
} from '../utils/response';
import {
  QueryNotificationDto,
  UpdateNotificationPreferencesDto,
  TriggerJobDto,
} from '../schemas/notification.schema';

export class NotificationController {
  constructor(private service: NotificationService = notificationService) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const query = req.query as unknown as QueryNotificationDto;
    const result = await this.service.listNotifications(userId, query);
    successResponse(
      res,
      result.notifications,
      'Notifications retrieved successfully',
      result.pagination
    );
  };

  unreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const result = await this.service.getUnreadCount(userId);
    successResponse(res, result, 'Unread notification count retrieved');
  };

  markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await this.service.markAsRead(userId, id);
    successResponse(res, notification, 'Notification marked as read');
  };

  markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const result = await this.service.markAllAsRead(userId);
    successResponse(res, result, 'All notifications marked as read');
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteNotification(userId, id);
    noContentResponse(res);
  };

  getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const prefs = await this.service.getPreferences(userId);
    successResponse(res, prefs, 'Notification preferences retrieved');
  };

  updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const dto = req.body as UpdateNotificationPreferencesDto;
    const prefs = await this.service.updatePreferences(userId, dto);
    successResponse(res, prefs, 'Notification preferences updated');
  };

  // Scheduled HTTP trigger endpoint (Secured with CRON_SECRET)
  processJobs = async (req: Request, res: Response): Promise<void> => {
    const secret =
      req.headers['x-cron-secret'] ||
      req.headers['authorization'] ||
      (req.query.secret as string);

    const { force } = req.body as TriggerJobDto;
    const result = await this.service.triggerBackgroundJobs(secret as string, force);

    if (result.status === 'SKIPPED') {
      res.status(409).json({
        success: false,
        message: 'Job execution skipped: overlapping run in progress',
        data: result,
      });
      return;
    }

    successResponse(res, result, 'Background notification job executed');
  };

  jobStatus = async (_req: Request, res: Response): Promise<void> => {
    const status = await this.service.getLatestJobStatus();
    successResponse(res, status, 'Latest job status retrieved');
  };
}

export const notificationController = new NotificationController();
