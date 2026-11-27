import { z } from 'zod';

export const SubscriptionStatusEnum = z.enum(['ACTIVE', 'CANCELLED', 'PAUSED', 'EXPIRED']);
export const BillingCycleEnum = z.enum([
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM',
]);

export const createSubscriptionSchema = z.object({
  name: z.string().trim().min(1, 'Subscription name is required').max(255, 'Name too long'),
  description: z.string().trim().max(1000).optional().nullable(),
  provider: z.string().trim().max(255).optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  currency: z.string().trim().min(1).max(10).default('INR'),
  billingCycle: BillingCycleEnum.default('MONTHLY'),
  startDate: z.string().datetime({ message: 'Invalid ISO start date' }),
  nextRenewal: z.string().datetime({ message: 'Invalid ISO next renewal date' }).optional(),
  status: SubscriptionStatusEnum.default('ACTIVE'),
  category: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  paymentMethod: z.string().trim().max(100).optional().nullable(),
  websiteUrl: z.string().trim().max(500).optional().nullable(),
  isTrial: z.boolean().default(false),
  trialStartDate: z.string().datetime().optional().nullable(),
  trialEndDate: z.string().datetime().optional().nullable(),
  reminderDaysBefore: z.coerce.number().int().min(0).max(60).default(3).optional().nullable(),
});

export const updateSubscriptionSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(255).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  provider: z.string().trim().max(255).optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than zero').optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  billingCycle: BillingCycleEnum.optional(),
  startDate: z.string().datetime().optional(),
  nextRenewal: z.string().datetime().optional(),
  status: SubscriptionStatusEnum.optional(),
  category: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  paymentMethod: z.string().trim().max(100).optional().nullable(),
  websiteUrl: z.string().trim().max(500).optional().nullable(),
  isTrial: z.boolean().optional(),
  trialStartDate: z.string().datetime().optional().nullable(),
  trialEndDate: z.string().datetime().optional().nullable(),
  reminderDaysBefore: z.coerce.number().int().min(0).max(60).optional().nullable(),
});

export const cancelSubscriptionSchema = z.object({
  cancellationReason: z.string().trim().max(500).optional().nullable(),
  cancellationDate: z.string().datetime().optional().nullable(),
});

export const renewSubscriptionSchema = z.object({
  renewalDate: z.string().datetime().optional().nullable(),
});

export const querySubscriptionSchema = z.object({
  status: SubscriptionStatusEnum.optional(),
  category: z.string().optional(),
  billingCycle: BillingCycleEnum.optional(),
  isTrial: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().trim().optional(),
  sortBy: z
    .enum(['nextRenewal', 'amount', 'name', 'createdAt', 'startDate'])
    .default('nextRenewal'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
export type CancelSubscriptionDto = z.infer<typeof cancelSubscriptionSchema>;
export type RenewSubscriptionDto = z.infer<typeof renewSubscriptionSchema>;
export type QuerySubscriptionDto = z.infer<typeof querySubscriptionSchema>;
