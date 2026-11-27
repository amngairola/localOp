import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../services/notification.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationJobProcessor } from '../jobs/notificationJobProcessor';
import { EmailService } from '../services/email.service';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { Notification, NotificationPreference } from '@prisma/client';

describe('NotificationService & NotificationJobProcessor', () => {
  let mockRepo: NotificationRepository;
  let mockEmail: EmailService;
  let jobProcessor: NotificationJobProcessor;
  let service: NotificationService;

  const mockNotification: Notification = {
    id: 'notif-001',
    userId: 'user-alpha',
    type: 'BILL_DUE',
    title: 'Electricity Bill Due',
    body: 'Your electricity bill of INR 2500 is due on Dec 1, 2026',
    priority: 'HIGH',
    status: 'UNREAD',
    link: '/bills',
    reminderId: null,
    billId: 'bill-001',
    subscriptionId: null,
    expenseId: null,
    idempotencyKey: 'bill_due_bill-001_2026-12-01',
    metadata: null,
    emailSent: false,
    emailSentAt: null,
    readAt: null,
    createdAt: new Date('2026-11-27T10:00:00Z'),
    updatedAt: new Date('2026-11-27T10:00:00Z'),
  };

  const mockPreferences: NotificationPreference = {
    id: 'pref-001',
    userId: 'user-alpha',
    emailEnabled: true,
    inAppEnabled: true,
    reminderLeadMinutes: 60,
    billLeadDays: 3,
    subscriptionLeadDays: 7,
    trialLeadDays: 3,
    budgetThresholdPercent: 80,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockRepo = {
      findMany: vi.fn(),
      findById: vi.fn(),
      countUnread: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      getPreferences: vi.fn(),
      upsertPreferences: vi.fn(),
      findActiveJob: vi.fn(),
      createJobLog: vi.fn(),
      updateJobLog: vi.fn(),
      getLatestJobLog: vi.fn(),
      findAllUsersWithPreferences: vi.fn(),
      findDueRemindersForUser: vi.fn(),
      findUpcomingBillsForUser: vi.fn(),
      findOverdueBillsForUser: vi.fn(),
      findRenewingSubscriptionsForUser: vi.fn(),
      findExpiringTrialsForUser: vi.fn(),
      findBudgetsForUser: vi.fn(),
      getMonthSpendingByCategory: vi.fn(),
    } as unknown as NotificationRepository;

    mockEmail = {
      sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123', provider: 'mock' }),
      renderReminderEmail: vi.fn().mockReturnValue({ subject: 'Reminder', html: '<p>Rem</p>', text: 'Rem' }),
      renderBillEmail: vi.fn().mockReturnValue({ subject: 'Bill', html: '<p>Bill</p>', text: 'Bill' }),
      renderSubscriptionEmail: vi.fn().mockReturnValue({ subject: 'Sub', html: '<p>Sub</p>', text: 'Sub' }),
      renderBudgetEmail: vi.fn().mockReturnValue({ subject: 'Budget', html: '<p>Bgt</p>', text: 'Bgt' }),
    } as unknown as EmailService;

    jobProcessor = new NotificationJobProcessor(mockRepo, mockEmail);
    service = new NotificationService(mockRepo, jobProcessor);
  });

  describe('Notification CRUD', () => {
    it('lists notifications with pagination metadata', async () => {
      vi.mocked(mockRepo.findMany).mockResolvedValue({
        notifications: [mockNotification],
        total: 1,
      });

      const result = await service.listNotifications('user-alpha', {
        status: 'ALL',
        page: 1,
        limit: 10,
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockRepo.findMany).toHaveBeenCalledWith('user-alpha', expect.objectContaining({ page: 1, limit: 10 }));
    });

    it('returns unread notification count for user', async () => {
      vi.mocked(mockRepo.countUnread).mockResolvedValue(5);

      const result = await service.getUnreadCount('user-alpha');
      expect(result.unreadCount).toBe(5);
      expect(mockRepo.countUnread).toHaveBeenCalledWith('user-alpha');
    });

    it('marks a notification as read', async () => {
      const readNotification = { ...mockNotification, status: 'READ' as const, readAt: new Date() };
      vi.mocked(mockRepo.markAsRead).mockResolvedValue(readNotification);

      const result = await service.markAsRead('user-alpha', 'notif-001');
      expect(result.status).toBe('READ');
      expect(mockRepo.markAsRead).toHaveBeenCalledWith('user-alpha', 'notif-001');
    });

    it('throws NotFoundError when marking non-existent notification as read', async () => {
      vi.mocked(mockRepo.markAsRead).mockResolvedValue(null);

      await expect(service.markAsRead('user-alpha', 'notif-missing')).rejects.toThrow(NotFoundError);
    });

    it('marks all notifications as read for user', async () => {
      vi.mocked(mockRepo.markAllAsRead).mockResolvedValue({ count: 4 });

      const result = await service.markAllAsRead('user-alpha');
      expect(result.count).toBe(4);
      expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('user-alpha');
    });

    it('deletes notification when owned by user', async () => {
      vi.mocked(mockRepo.delete).mockResolvedValue(mockNotification);

      await service.deleteNotification('user-alpha', 'notif-001');
      expect(mockRepo.delete).toHaveBeenCalledWith('user-alpha', 'notif-001');
    });

    it('throws NotFoundError when deleting non-existent or other user notification', async () => {
      vi.mocked(mockRepo.delete).mockResolvedValue(null);

      await expect(service.deleteNotification('user-alpha', 'alien-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Notification Preferences', () => {
    it('retrieves user notification preferences', async () => {
      vi.mocked(mockRepo.getPreferences).mockResolvedValue(mockPreferences);

      const result = await service.getPreferences('user-alpha');
      expect(result.reminderLeadMinutes).toBe(60);
      expect(result.quietHoursEnabled).toBe(true);
    });

    it('updates user notification preferences', async () => {
      const updated = { ...mockPreferences, reminderLeadMinutes: 120, emailEnabled: false };
      vi.mocked(mockRepo.upsertPreferences).mockResolvedValue(updated);

      const result = await service.updatePreferences('user-alpha', {
        reminderLeadMinutes: 120,
        emailEnabled: false,
      });

      expect(result.reminderLeadMinutes).toBe(120);
      expect(result.emailEnabled).toBe(false);
      expect(mockRepo.upsertPreferences).toHaveBeenCalledWith('user-alpha', {
        reminderLeadMinutes: 120,
        emailEnabled: false,
      });
    });
  });

  describe('Quiet Hours Evaluation', () => {
    it('returns true during overnight quiet hours (e.g. 23:00 when 22:00-08:00)', () => {
      const date = new Date('2026-11-27T23:30:00');
      expect(jobProcessor.isQuietHours(mockPreferences, date)).toBe(true);
    });

    it('returns true during morning quiet hours (e.g. 05:00 when 22:00-08:00)', () => {
      const date = new Date('2026-11-27T05:30:00');
      expect(jobProcessor.isQuietHours(mockPreferences, date)).toBe(true);
    });

    it('returns false outside quiet hours (e.g. 14:00 when 22:00-08:00)', () => {
      const date = new Date('2026-11-27T14:30:00');
      expect(jobProcessor.isQuietHours(mockPreferences, date)).toBe(false);
    });

    it('returns false if quietHoursEnabled is false', () => {
      const date = new Date('2026-11-27T23:30:00');
      expect(jobProcessor.isQuietHours({ ...mockPreferences, quietHoursEnabled: false }, date)).toBe(false);
    });
  });

  describe('Background Job Processor & Idempotency', () => {
    beforeEach(() => {
      vi.mocked(mockRepo.createJobLog).mockResolvedValue({
        id: 'job-101',
        jobName: 'NOTIFICATION_CHECKS',
        status: 'RUNNING',
        stats: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        durationMs: null,
      });
      vi.mocked(mockRepo.updateJobLog).mockResolvedValue({} as any);
      vi.mocked(mockRepo.findActiveJob).mockResolvedValue(null);
    });

    it('skips job execution if another job is already running', async () => {
      vi.mocked(mockRepo.findActiveJob).mockResolvedValue({
        id: 'active-job',
        jobName: 'NOTIFICATION_CHECKS',
        status: 'RUNNING',
        stats: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        durationMs: null,
      });

      const result = await jobProcessor.processAllNotifications(false);
      expect(result.status).toBe('SKIPPED');
      expect(mockRepo.createJobLog).not.toHaveBeenCalled();
    });

    it('processes upcoming reminders and creates in-app notification', async () => {
      vi.mocked(mockRepo.findAllUsersWithPreferences).mockResolvedValue([
        {
          userId: 'user-alpha',
          email: 'alpha@lifeops.app',
          name: 'Alpha User',
          prefs: { ...mockPreferences, quietHoursEnabled: false },
        },
      ]);

      vi.mocked(mockRepo.findDueRemindersForUser).mockResolvedValue([
        {
          id: 'rem-1',
          userId: 'user-alpha',
          title: 'Car Insurance Renewal',
          description: null,
          dueDate: new Date(Date.now() + 30 * 60 * 1000), // 30 mins from now
          status: 'PENDING',
          priority: 'HIGH',
          recurrenceType: 'NONE',
          recurrenceValue: null,
          notifyBefore: 60,
          notifiedAt: null,
          completedAt: null,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.mocked(mockRepo.findUpcomingBillsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findOverdueBillsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findRenewingSubscriptionsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findExpiringTrialsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findBudgetsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findByIdempotencyKey).mockResolvedValue(null);

      const result = await jobProcessor.processAllNotifications(true);

      expect(result.status).toBe('COMPLETED');
      expect(result.stats.remindersProcessed).toBe(1);
      expect(result.stats.notificationsCreated).toBe(1);
      expect(result.stats.emailsSent).toBe(1);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-alpha',
          type: 'REMINDER_UPCOMING',
          title: 'Reminder: Car Insurance Renewal',
          reminderId: 'rem-1',
        })
      );
    });

    it('deduplicates and skips already-notified records', async () => {
      vi.mocked(mockRepo.findAllUsersWithPreferences).mockResolvedValue([
        {
          userId: 'user-alpha',
          email: 'alpha@lifeops.app',
          name: 'Alpha User',
          prefs: mockPreferences,
        },
      ]);

      vi.mocked(mockRepo.findDueRemindersForUser).mockResolvedValue([
        {
          id: 'rem-1',
          userId: 'user-alpha',
          title: 'Doctor Appointment',
          description: null,
          dueDate: new Date(Date.now() + 10 * 60 * 1000),
          status: 'PENDING',
          priority: 'MEDIUM',
          recurrenceType: 'NONE',
          recurrenceValue: null,
          notifyBefore: 60,
          notifiedAt: null,
          completedAt: null,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.mocked(mockRepo.findUpcomingBillsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findOverdueBillsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findRenewingSubscriptionsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findExpiringTrialsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findBudgetsForUser).mockResolvedValue([]);

      // Simulate already-existing notification
      vi.mocked(mockRepo.findByIdempotencyKey).mockResolvedValue(mockNotification);

      const result = await jobProcessor.processAllNotifications(true);

      expect(result.stats.duplicatesSkipped).toBe(1);
      expect(result.stats.notificationsCreated).toBe(0);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('generates overdue bill notification with URGENT priority', async () => {
      vi.mocked(mockRepo.findAllUsersWithPreferences).mockResolvedValue([
        {
          userId: 'user-alpha',
          email: 'alpha@lifeops.app',
          name: 'Alpha',
          prefs: { ...mockPreferences, quietHoursEnabled: false },
        },
      ]);
      vi.mocked(mockRepo.findDueRemindersForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findUpcomingBillsForUser).mockResolvedValue([
        {
          id: 'bill-overdue-1',
          userId: 'user-alpha',
          title: 'WiFi Bill',
          amount: 1200 as any,
          currency: 'INR',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day overdue
          paymentDate: null,
          category: 'UTILITIES',
          status: 'UNPAID',
          isRecurring: false,
          billingCycle: null,
          notes: null,
          attachmentUrl: null,
          attachmentPath: null,
          documentId: null,
          invoiceNumber: null,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.mocked(mockRepo.findOverdueBillsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findRenewingSubscriptionsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findExpiringTrialsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findBudgetsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findByIdempotencyKey).mockResolvedValue(null);

      const result = await jobProcessor.processAllNotifications(true);

      expect(result.stats.billsProcessed).toBe(1);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BILL_OVERDUE',
          priority: 'URGENT',
          title: 'Overdue Bill: WiFi Bill',
        })
      );
    });

    it('handles email provider failure gracefully without failing the job', async () => {
      vi.mocked(mockRepo.findAllUsersWithPreferences).mockResolvedValue([
        {
          userId: 'user-alpha',
          email: 'alpha@lifeops.app',
          name: 'Alpha',
          prefs: { ...mockPreferences, quietHoursEnabled: false },
        },
      ]);
      vi.mocked(mockRepo.findDueRemindersForUser).mockResolvedValue([
        {
          id: 'rem-fail',
          userId: 'user-alpha',
          title: 'Meeting',
          description: null,
          dueDate: new Date(Date.now() + 10 * 60 * 1000),
          status: 'PENDING',
          priority: 'MEDIUM',
          recurrenceType: 'NONE',
          recurrenceValue: null,
          notifyBefore: 60,
          notifiedAt: null,
          completedAt: null,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.mocked(mockRepo.findUpcomingBillsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findOverdueBillsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findRenewingSubscriptionsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findExpiringTrialsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findBudgetsForUser).mockResolvedValue([]);
      vi.mocked(mockRepo.findByIdempotencyKey).mockResolvedValue(null);

      // Simulate email provider failure
      vi.mocked(mockEmail.sendEmail).mockResolvedValue({
        success: false,
        error: 'API rate limit exceeded',
        provider: 'mock',
      });

      const result = await jobProcessor.processAllNotifications(true);

      // In-app notification was still created!
      expect(result.status).toBe('COMPLETED');
      expect(result.stats.notificationsCreated).toBe(1);
      expect(result.stats.emailsSent).toBe(0);
    });
  });

  describe('Scheduler Secret Authentication', () => {
    it('throws UnauthorizedError when secret is missing or invalid', async () => {
      await expect(service.triggerBackgroundJobs('invalid-secret')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('triggers job successfully when valid secret is provided', async () => {
      vi.mocked(mockRepo.findAllUsersWithPreferences).mockResolvedValue([]);
      vi.mocked(mockRepo.createJobLog).mockResolvedValue({
        id: 'job-1',
        jobName: 'NOTIFICATION_CHECKS',
        status: 'RUNNING',
      } as any);
      vi.mocked(mockRepo.updateJobLog).mockResolvedValue({} as any);

      const result = await service.triggerBackgroundJobs('lifeops-cron-secret-2026', true);
      expect(result.status).toBe('COMPLETED');
    });
  });
});
