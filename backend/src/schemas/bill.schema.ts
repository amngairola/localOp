import { z } from 'zod';

export const BillStatusEnum = z.enum(['UNPAID', 'PAID', 'OVERDUE', 'CANCELLED']);
export const BillCategoryEnum = z.enum([
  'UTILITIES',
  'RENT',
  'INSURANCE',
  'INTERNET',
  'PHONE',
  'MEDICAL',
  'EDUCATION',
  'ENTERTAINMENT',
  'FOOD',
  'TRANSPORT',
  'SHOPPING',
  'OTHER',
]);
export const BillingCycleEnum = z.enum([
  'MONTHLY',
  'YEARLY',
  'QUARTERLY',
  'WEEKLY',
  'CUSTOM',
]);

export const createBillSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().trim().max(1000).optional().nullable(),
  provider: z.string().trim().max(255).optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  currency: z.string().trim().min(1).max(10).default('INR'),
  dueDate: z.string().datetime({ message: 'Invalid ISO due date' }),
  category: BillCategoryEnum.default('OTHER'),
  status: BillStatusEnum.default('UNPAID'),
  isRecurring: z.boolean().default(false),
  billingCycle: BillingCycleEnum.optional().nullable(),
  invoiceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateBillSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(255).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  provider: z.string().trim().max(255).optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than zero').optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  dueDate: z.string().datetime({ message: 'Invalid ISO due date' }).optional(),
  category: BillCategoryEnum.optional(),
  status: BillStatusEnum.optional(),
  isRecurring: z.boolean().optional(),
  billingCycle: BillingCycleEnum.optional().nullable(),
  invoiceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const markBillPaidSchema = z.object({
  paymentDate: z.string().datetime({ message: 'Invalid ISO payment date' }).optional(),
});

export const queryBillSchema = z.object({
  status: BillStatusEnum.optional(),
  category: BillCategoryEnum.optional(),
  isRecurring: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['dueDate', 'amount', 'createdAt', 'title']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateBillDto = z.infer<typeof createBillSchema>;
export type UpdateBillDto = z.infer<typeof updateBillSchema>;
export type MarkBillPaidDto = z.infer<typeof markBillPaidSchema>;
export type QueryBillDto = z.infer<typeof queryBillSchema>;
