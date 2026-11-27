import {
  NotificationRepository,
  notificationRepository,
} from '../repositories/notification.repository';
import {
  NotificationJobProcessor,
  notificationJobProcessor,
} from '../jobs/notificationJobProcessor';
import {
  QueryNotificationDto,
  UpdateNotificationPreferencesDto,
} from '../schemas/notification.schema';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { env } from '../config/env';
import { Notification, NotificationPreference } from '@prisma/client';

export class NotificationService {
  constructor(
    private repo: NotificationRepository = notificationRepository,
    private jobProcessor: NotificationJobProcessor = notificationJobProcessor
  ) {}

  async listNotifications(
    userId: string,
    query: QueryNotificationDto
  ): Promise<{
    notifications: Notification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { notifications, total } = await this.repo.findMany(userId, query);

    return {
      notifications,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.repo.countUnread(userId);
    return { unreadCount };
  }

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.repo.markAsRead(userId, id);
    if (!notification) {
      throw new NotFoundError('Notification');
    }
    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    return this.repo.markAllAsRead(userId);
  }

  async deleteNotification(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError('Notification');
    }
  }

  async getPreferences(userId: string): Promise<NotificationPreference> {
    return this.repo.getPreferences(userId);
  }

  async updatePreferences(
    userId: string,
    data: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreference> {
    return this.repo.upsertPreferences(userId, data);
  }

  // --- Background Jobs Trigger & Status ---

  async triggerBackgroundJobs(
    authHeaderOrSecret?: string,
    force = false
  ) {
    const expectedSecret = env.CRON_SECRET;
    const provided = (authHeaderOrSecret || '').replace(/^Bearer\s+/i, '').trim();

    if (provided !== expectedSecret) {
      throw new UnauthorizedError('Invalid scheduler secret');
    }

    return this.jobProcessor.processAllNotifications(force);
  }

  async getLatestJobStatus() {
    return this.repo.getLatestJobLog('NOTIFICATION_CHECKS');
  }
}

export const notificationService = new NotificationService();
