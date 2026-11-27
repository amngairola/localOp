import { z } from 'zod';

export const NotificationTypeEnum = z.enum([
  'REMINDER_DUE',
  'REMINDER_UPCOMING',
  'BILL_DUE',
  'BILL_OVERDUE',
  'SUBSCRIPTION_RENEWAL',
  'TRIAL_ENDING',
  'BUDGET_WARNING',
  'BUDGET_EXCEEDED',
  'SYSTEM',
]);

export const NotificationPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const NotificationStatusEnum = z.enum(['UNREAD', 'READ', 'ARCHIVED']);

export const queryNotificationSchema = z.object({
  status: z.enum(['UNREAD', 'READ', 'ALL']).default('ALL'),
  type: NotificationTypeEnum.optional(),
  priority: NotificationPriorityEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateNotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  reminderLeadMinutes: z.coerce.number().int().min(5).max(1440).optional(),
  billLeadDays: z.coerce.number().int().min(1).max(30).optional(),
  subscriptionLeadDays: z.coerce.number().int().min(1).max(30).optional(),
  trialLeadDays: z.coerce.number().int().min(1).max(30).optional(),
  budgetThresholdPercent: z.coerce.number().int().min(50).max(100).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be in HH:MM format')
    .nullable()
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be in HH:MM format')
    .nullable()
    .optional(),
});

export const triggerJobSchema = z.object({
  force: z.boolean().optional().default(false),
  categories: z.array(z.string()).optional(),
});

export type QueryNotificationDto = z.infer<typeof queryNotificationSchema>;
export type UpdateNotificationPreferencesDto = z.infer<typeof updateNotificationPreferencesSchema>;
export type TriggerJobDto = z.infer<typeof triggerJobSchema>;
