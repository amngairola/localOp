import {
  NotificationRepository,
  notificationRepository,
} from '../repositories/notification.repository';
import { EmailService, emailService } from '../services/email.service';
import { logger } from '../utils/logger';
import { NotificationPreference } from '@prisma/client';
import { format } from 'date-fns';

export interface JobExecutionStats {
  usersChecked: number;
  remindersProcessed: number;
  billsProcessed: number;
  subscriptionsProcessed: number;
  budgetsProcessed: number;
  notificationsCreated: number;
  emailsSent: number;
  duplicatesSkipped: number;
}

export class NotificationJobProcessor {
  constructor(
    private repo: NotificationRepository = notificationRepository,
    private email: EmailService = emailService
  ) {}

  /**
   * Evaluates if current time falls within user's configured quiet hours
   */
  isQuietHours(prefs: NotificationPreference, now: Date = new Date()): boolean {
    if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      // e.g. 13:00 to 15:00
      return currentMinutes >= startTotal && currentMinutes < endTotal;
    } else {
      // Overnight e.g. 22:00 to 08:00
      return currentMinutes >= startTotal || currentMinutes < endTotal;
    }
  }

  /**
   * Main idempotent processor for all scheduled notification checks
   */
  async processAllNotifications(force = false): Promise<{
    jobId: string;
    status: 'COMPLETED' | 'SKIPPED' | 'FAILED';
    stats: JobExecutionStats;
    error?: string;
  }> {
    const jobName = 'NOTIFICATION_CHECKS';
    const startTime = Date.now();

    // Concurrency guard: check for existing active run
    if (!force) {
      const activeJob = await this.repo.findActiveJob(jobName, 5);
      if (activeJob) {
        logger.warn(
          { activeJobId: activeJob.id, startedAt: activeJob.startedAt },
          'Scheduled notification job is already running. Skipping overlapping execution.'
        );
        return {
          jobId: activeJob.id,
          status: 'SKIPPED',
          stats: {
            usersChecked: 0,
            remindersProcessed: 0,
            billsProcessed: 0,
            subscriptionsProcessed: 0,
            budgetsProcessed: 0,
            notificationsCreated: 0,
            emailsSent: 0,
            duplicatesSkipped: 0,
          },
        };
      }
    }

    const jobLog = await this.repo.createJobLog({
      jobName,
      status: 'RUNNING',
    });

    const stats: JobExecutionStats = {
      usersChecked: 0,
      remindersProcessed: 0,
      billsProcessed: 0,
      subscriptionsProcessed: 0,
      budgetsProcessed: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      duplicatesSkipped: 0,
    };

    try {
      const users = await this.repo.findAllUsersWithPreferences();
      stats.usersChecked = users.length;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      for (const user of users) {
        const { userId, email, prefs } = user;
        const inQuietHours = this.isQuietHours(prefs, now);

        // 1. Check Reminders
        const reminderLeadMinutes = prefs.reminderLeadMinutes || 60;
        const reminderMaxDueDate = new Date(now.getTime() + reminderLeadMinutes * 60 * 1000);
        const dueReminders = await this.repo.findDueRemindersForUser(userId, reminderMaxDueDate);

        for (const rem of dueReminders) {
          stats.remindersProcessed++;
          const dateStr = rem.dueDate.toISOString().slice(0, 10);
          const idempotencyKey = `rem_${rem.id}_${dateStr}`;

          const existing = await this.repo.findByIdempotencyKey(idempotencyKey);
          if (existing) {
            stats.duplicatesSkipped++;
            continue;
          }

          let emailSent = false;
          let emailSentAt: Date | null = null;

          if (prefs.emailEnabled && email && !inQuietHours) {
            const emailContent = this.email.renderReminderEmail({
              title: rem.title,
              dueDate: format(rem.dueDate, 'PPp'),
              priority: rem.priority,
              description: rem.description,
            });
            const res = await this.email.sendEmail({
              to: email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
            if (res.success) {
              emailSent = true;
              emailSentAt = new Date();
              stats.emailsSent++;
            }
          }

          await this.repo.create({
            userId,
            type: rem.dueDate < now ? 'REMINDER_DUE' : 'REMINDER_UPCOMING',
            title: `Reminder: ${rem.title}`,
            body: `Your reminder "${rem.title}" is ${
              rem.dueDate < now ? 'now due' : `due on ${format(rem.dueDate, 'PPp')}`
            }.`,
            priority: rem.priority === 'HIGH' || rem.priority === 'URGENT' ? 'HIGH' : 'NORMAL',
            link: '/reminders',
            reminderId: rem.id,
            idempotencyKey,
            emailSent,
            emailSentAt,
          });
          stats.notificationsCreated++;
        }

        // 2. Check Upcoming Bills
        const billLeadDays = prefs.billLeadDays || 3;
        const billMaxDueDate = new Date(now.getTime() + billLeadDays * 24 * 60 * 60 * 1000);
        const upcomingBills = await this.repo.findUpcomingBillsForUser(userId, billMaxDueDate);

        for (const bill of upcomingBills) {
          stats.billsProcessed++;
          const dateStr = bill.dueDate.toISOString().slice(0, 10);
          const isOverdue = bill.dueDate < now;
          const idempotencyKey = `bill_${isOverdue ? 'overdue' : 'due'}_${bill.id}_${dateStr}`;

          const existing = await this.repo.findByIdempotencyKey(idempotencyKey);
          if (existing) {
            stats.duplicatesSkipped++;
            continue;
          }

          let emailSent = false;
          let emailSentAt: Date | null = null;

          if (prefs.emailEnabled && email && !inQuietHours) {
            const emailContent = this.email.renderBillEmail({
              title: bill.title,
              amount: Number(bill.amount),
              currency: bill.currency,
              dueDate: format(bill.dueDate, 'PP'),
              isOverdue,
            });
            const res = await this.email.sendEmail({
              to: email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
            if (res.success) {
              emailSent = true;
              emailSentAt = new Date();
              stats.emailsSent++;
            }
          }

          await this.repo.create({
            userId,
            type: isOverdue ? 'BILL_OVERDUE' : 'BILL_DUE',
            title: isOverdue ? `Overdue Bill: ${bill.title}` : `Bill Due Soon: ${bill.title}`,
            body: `${bill.title} (${bill.currency} ${bill.amount}) is ${
              isOverdue ? 'overdue' : `due on ${format(bill.dueDate, 'PP')}`
            }.`,
            priority: isOverdue ? 'URGENT' : 'HIGH',
            link: '/bills',
            billId: bill.id,
            idempotencyKey,
            emailSent,
            emailSentAt,
          });
          stats.notificationsCreated++;
        }

        // 3. Check Subscriptions Renewals & Trials
        const subLeadDays = prefs.subscriptionLeadDays || 7;
        const subMaxRenewalDate = new Date(now.getTime() + subLeadDays * 24 * 60 * 60 * 1000);
        const renewingSubs = await this.repo.findRenewingSubscriptionsForUser(userId, subMaxRenewalDate);

        for (const sub of renewingSubs) {
          stats.subscriptionsProcessed++;
          const dateStr = sub.nextRenewal.toISOString().slice(0, 10);
          const idempotencyKey = `sub_renew_${sub.id}_${dateStr}`;

          const existing = await this.repo.findByIdempotencyKey(idempotencyKey);
          if (existing) {
            stats.duplicatesSkipped++;
            continue;
          }

          let emailSent = false;
          let emailSentAt: Date | null = null;

          if (prefs.emailEnabled && email && !inQuietHours) {
            const emailContent = this.email.renderSubscriptionEmail({
              name: sub.name,
              amount: Number(sub.amount),
              currency: sub.currency,
              renewalDate: format(sub.nextRenewal, 'PP'),
              isTrialEnding: false,
            });
            const res = await this.email.sendEmail({
              to: email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
            if (res.success) {
              emailSent = true;
              emailSentAt = new Date();
              stats.emailsSent++;
            }
          }

          await this.repo.create({
            userId,
            type: 'SUBSCRIPTION_RENEWAL',
            title: `Renewal Alert: ${sub.name}`,
            body: `Your ${sub.name} subscription renews on ${format(sub.nextRenewal, 'PP')} for ${sub.currency} ${sub.amount}.`,
            priority: 'NORMAL',
            link: '/subscriptions',
            subscriptionId: sub.id,
            idempotencyKey,
            emailSent,
            emailSentAt,
          });
          stats.notificationsCreated++;
        }

        // 4. Check Expiring Trials
        const trialLeadDays = prefs.trialLeadDays || 3;
        const trialMaxDate = new Date(now.getTime() + trialLeadDays * 24 * 60 * 60 * 1000);
        const expiringTrials = await this.repo.findExpiringTrialsForUser(userId, trialMaxDate);

        for (const sub of expiringTrials) {
          if (!sub.trialEndDate) continue;
          stats.subscriptionsProcessed++;
          const dateStr = sub.trialEndDate.toISOString().slice(0, 10);
          const idempotencyKey = `sub_trial_${sub.id}_${dateStr}`;

          const existing = await this.repo.findByIdempotencyKey(idempotencyKey);
          if (existing) {
            stats.duplicatesSkipped++;
            continue;
          }

          let emailSent = false;
          let emailSentAt: Date | null = null;

          if (prefs.emailEnabled && email && !inQuietHours) {
            const emailContent = this.email.renderSubscriptionEmail({
              name: sub.name,
              amount: Number(sub.amount),
              currency: sub.currency,
              renewalDate: format(sub.trialEndDate, 'PP'),
              isTrialEnding: true,
            });
            const res = await this.email.sendEmail({
              to: email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
            if (res.success) {
              emailSent = true;
              emailSentAt = new Date();
              stats.emailsSent++;
            }
          }

          await this.repo.create({
            userId,
            type: 'TRIAL_ENDING',
            title: `Trial Ending: ${sub.name}`,
            body: `The free trial for ${sub.name} ends on ${format(sub.trialEndDate, 'PP')}. Cancel now to avoid being charged.`,
            priority: 'HIGH',
            link: '/subscriptions',
            subscriptionId: sub.id,
            idempotencyKey,
            emailSent,
            emailSentAt,
          });
          stats.notificationsCreated++;
        }

        // 5. Check Budgets
        const budgets = await this.repo.findBudgetsForUser(userId, currentMonth, currentYear);
        if (budgets.length > 0) {
          const spendingByCategory = await this.repo.getMonthSpendingByCategory(
            userId,
            currentMonth,
            currentYear
          );
          const spendingMap = new Map<string, number>();
          let totalMonthSpend = 0;

          for (const item of spendingByCategory) {
            const amt = item._sum.amount ? Number(item._sum.amount) : 0;
            spendingMap.set(item.category, amt);
            totalMonthSpend += amt;
          }

          for (const bgt of budgets) {
            stats.budgetsProcessed++;
            const spent = bgt.category
              ? spendingMap.get(bgt.category) || 0
              : totalMonthSpend;
            const budgetAmount = Number(bgt.amount);
            if (budgetAmount <= 0) continue;

            const percentage = Math.round((spent / budgetAmount) * 100);
            const isExceeded = spent >= budgetAmount;
            const isWarning = percentage >= (prefs.budgetThresholdPercent || 80);

            if (isExceeded || isWarning) {
              const categoryLabel = bgt.category ? bgt.category.replace('_', ' ') : 'Overall Monthly';
              const type = isExceeded ? 'BUDGET_EXCEEDED' : 'BUDGET_WARNING';
              const idempotencyKey = `bgt_${isExceeded ? 'exceeded' : 'warn'}_${bgt.id}_${currentMonth}_${currentYear}`;

              const existing = await this.repo.findByIdempotencyKey(idempotencyKey);
              if (existing) {
                stats.duplicatesSkipped++;
                continue;
              }

              let emailSent = false;
              let emailSentAt: Date | null = null;

              if (prefs.emailEnabled && email && !inQuietHours) {
                const emailContent = this.email.renderBudgetEmail({
                  category: categoryLabel,
                  spent,
                  budget: budgetAmount,
                  percent: percentage,
                  isExceeded,
                });
                const res = await this.email.sendEmail({
                  to: email,
                  subject: emailContent.subject,
                  html: emailContent.html,
                  text: emailContent.text,
                });
                if (res.success) {
                  emailSent = true;
                  emailSentAt = new Date();
                  stats.emailsSent++;
                }
              }

              await this.repo.create({
                userId,
                type,
                title: isExceeded
                  ? `Budget Exceeded: ${categoryLabel}`
                  : `Budget Alert: ${categoryLabel} at ${percentage}%`,
                body: `You have spent ${bgt.currency} ${spent.toFixed(2)} of your ${bgt.currency} ${budgetAmount.toFixed(2)} budget (${percentage}% consumed).`,
                priority: isExceeded ? 'HIGH' : 'NORMAL',
                link: '/expenses',
                idempotencyKey,
                emailSent,
                emailSentAt,
              });
              stats.notificationsCreated++;
            }
          }
        }
      }

      const durationMs = Date.now() - startTime;
      await this.repo.updateJobLog(jobLog.id, {
        status: 'COMPLETED',
        stats,
        completedAt: new Date(),
        durationMs,
      });

      logger.info(
        { jobId: jobLog.id, durationMs, ...stats },
        'Scheduled notification check completed successfully'
      );

      return {
        jobId: jobLog.id,
        status: 'COMPLETED',
        stats,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      logger.error({ err, jobId: jobLog.id }, 'Scheduled notification job failed');

      await this.repo.updateJobLog(jobLog.id, {
        status: 'FAILED',
        error: err?.message || 'Unknown job failure',
        completedAt: new Date(),
        durationMs,
        stats,
      });

      return {
        jobId: jobLog.id,
        status: 'FAILED',
        stats,
        error: err?.message || 'Job failure',
      };
    }
  }
}

export const notificationJobProcessor = new NotificationJobProcessor();
