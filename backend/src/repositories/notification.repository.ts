import { prisma } from '../config/database';
import {
  Notification,
  NotificationPreference,
  ScheduledJobLog,
  Prisma,
} from '@prisma/client';
import {
  QueryNotificationDto,
  UpdateNotificationPreferencesDto,
} from '../schemas/notification.schema';

export interface CreateNotificationInput {
  userId: string;
  type:
    | 'REMINDER_DUE'
    | 'REMINDER_UPCOMING'
    | 'BILL_DUE'
    | 'BILL_OVERDUE'
    | 'SUBSCRIPTION_RENEWAL'
    | 'TRIAL_ENDING'
    | 'BUDGET_WARNING'
    | 'BUDGET_EXCEEDED'
    | 'SYSTEM';
  title: string;
  body: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  link?: string;
  reminderId?: string | null;
  billId?: string | null;
  subscriptionId?: string | null;
  expenseId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Prisma.InputJsonValue;
  emailSent?: boolean;
  emailSentAt?: Date | null;
}

export class NotificationRepository {
  async findMany(
    userId: string,
    query: QueryNotificationDto
  ): Promise<{ notifications: Notification[]; total: number }> {
    const where: Prisma.NotificationWhereInput = { userId };

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.priority) {
      where.priority = query.priority;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          reminder: { select: { id: true, title: true, dueDate: true, priority: true } },
          bill: { select: { id: true, title: true, amount: true, currency: true, dueDate: true } },
          subscription: { select: { id: true, name: true, amount: true, currency: true, nextRenewal: true } },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async findById(userId: string, id: string): Promise<Notification | null> {
    return prisma.notification.findFirst({
      where: { id, userId },
      include: {
        reminder: true,
        bill: true,
        subscription: true,
      },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, status: 'UNREAD' },
    });
  }

  async markAsRead(userId: string, id: string): Promise<Notification | null> {
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    return prisma.notification.update({
      where: { id },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
    return { count: result.count };
  }

  async delete(userId: string, id: string): Promise<Notification | null> {
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    return prisma.notification.delete({
      where: { id },
    });
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        priority: data.priority ?? 'NORMAL',
        link: data.link,
        reminderId: data.reminderId,
        billId: data.billId,
        subscriptionId: data.subscriptionId,
        expenseId: data.expenseId,
        idempotencyKey: data.idempotencyKey,
        metadata: data.metadata,
        emailSent: data.emailSent ?? false,
        emailSentAt: data.emailSentAt,
      },
    });
  }

  async findByIdempotencyKey(key: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { idempotencyKey: key },
    });
  }

  // --- Preferences ---

  async getPreferences(userId: string): Promise<NotificationPreference> {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: false,
          inAppEnabled: true,
          reminderLeadMinutes: 60,
          billLeadDays: 3,
          subscriptionLeadDays: 7,
          trialLeadDays: 3,
          budgetThresholdPercent: 80,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        },
      });
    }

    return prefs;
  }

  async upsertPreferences(
    userId: string,
    data: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreference> {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        emailEnabled: data.emailEnabled ?? false,
        inAppEnabled: data.inAppEnabled ?? true,
        reminderLeadMinutes: data.reminderLeadMinutes ?? 60,
        billLeadDays: data.billLeadDays ?? 3,
        subscriptionLeadDays: data.subscriptionLeadDays ?? 7,
        trialLeadDays: data.trialLeadDays ?? 3,
        budgetThresholdPercent: data.budgetThresholdPercent ?? 80,
        quietHoursEnabled: data.quietHoursEnabled ?? false,
        quietHoursStart: data.quietHoursStart ?? '22:00',
        quietHoursEnd: data.quietHoursEnd ?? '08:00',
      },
      update: data,
    });
  }

  // --- Background Jobs & Execution Logs ---

  async findActiveJob(jobName: string, maxAgeMinutes = 5): Promise<ScheduledJobLog | null> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    return prisma.scheduledJobLog.findFirst({
      where: {
        jobName,
        status: 'RUNNING',
        startedAt: { gte: cutoff },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async createJobLog(data: {
    jobName: string;
    status: string;
    stats?: any;
  }): Promise<ScheduledJobLog> {
    return prisma.scheduledJobLog.create({
      data: {
        jobName: data.jobName,
        status: data.status,
        stats: data.stats,
      },
    });
  }

  async updateJobLog(
    id: string,
    data: {
      status: string;
      stats?: any;
      error?: string | null;
      completedAt?: Date;
      durationMs?: number;
    }
  ): Promise<ScheduledJobLog> {
    return prisma.scheduledJobLog.update({
      where: { id },
      data,
    });
  }

  async getLatestJobLog(jobName: string): Promise<ScheduledJobLog | null> {
    return prisma.scheduledJobLog.findFirst({
      where: { jobName },
      orderBy: { startedAt: 'desc' },
    });
  }

  // --- Background Scanning Queries ---

  async findAllUsersWithPreferences(): Promise<
    Array<{
      userId: string;
      email: string;
      name: string | null;
      prefs: NotificationPreference;
    }>
  > {
    const profiles = await prisma.profile.findMany({
      include: {
        notificationPrefs: true,
      },
    });

    return profiles.map((p) => ({
      userId: p.userId,
      email: p.email,
      name: p.name,
      prefs:
        p.notificationPrefs || {
          id: `default_${p.userId}`,
          userId: p.userId,
          emailEnabled: false,
          inAppEnabled: true,
          reminderLeadMinutes: 60,
          billLeadDays: 3,
          subscriptionLeadDays: 7,
          trialLeadDays: 3,
          budgetThresholdPercent: 80,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
    }));
  }

  async findDueRemindersForUser(userId: string, maxDueDate: Date) {
    return prisma.reminder.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: { lte: maxDueDate },
      },
    });
  }

  async findUpcomingBillsForUser(userId: string, maxDueDate: Date) {
    return prisma.bill.findMany({
      where: {
        userId,
        status: 'UNPAID',
        dueDate: { lte: maxDueDate },
      },
    });
  }

  async findOverdueBillsForUser(userId: string, now: Date) {
    return prisma.bill.findMany({
      where: {
        userId,
        status: 'UNPAID',
        dueDate: { lt: now },
      },
    });
  }

  async findRenewingSubscriptionsForUser(userId: string, maxRenewalDate: Date) {
    return prisma.subscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        nextRenewal: { lte: maxRenewalDate },
      },
    });
  }

  async findExpiringTrialsForUser(userId: string, maxTrialEndDate: Date) {
    return prisma.subscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        isTrial: true,
        trialEndDate: { lte: maxTrialEndDate },
      },
    });
  }

  async findBudgetsForUser(userId: string, month: number, year: number) {
    return prisma.budget.findMany({
      where: { userId, month, year },
    });
  }

  async getMonthSpendingByCategory(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        amount: true,
      },
    });
  }
}

export const notificationRepository = new NotificationRepository();
