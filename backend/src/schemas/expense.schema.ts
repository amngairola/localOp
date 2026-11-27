import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum([
  'FOOD',
  'GROCERIES',
  'TRANSPORT',
  'HOUSING',
  'UTILITIES',
  'ENTERTAINMENT',
  'HEALTHCARE',
  'EDUCATION',
  'SHOPPING',
  'RENT',
  'INSURANCE',
  'SAVINGS',
  'INVESTMENT',
  'PERSONAL',
  'PERSONAL_CARE',
  'TRAVEL',
  'OTHER',
]);

export const PaymentMethodEnum = z.enum([
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'UPI',
  'NET_BANKING',
  'WALLET',
  'OTHER',
]);

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().max(1000).optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  currency: z.string().trim().min(1).max(10).default('INR'),
  category: ExpenseCategoryEnum.default('OTHER'),
  date: z.string().datetime({ message: 'Invalid ISO transaction date' }),
  paymentMethod: PaymentMethodEnum.optional().nullable(),
  merchant: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  tags: z
    .union([
      z.array(z.string().trim()),
      z.string().transform((val) =>
        val
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    ])
    .optional()
    .default([]),
});

export const updateExpenseSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(255).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than zero').optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  category: ExpenseCategoryEnum.optional(),
  date: z.string().datetime({ message: 'Invalid ISO transaction date' }).optional(),
  paymentMethod: PaymentMethodEnum.optional().nullable(),
  merchant: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  tags: z
    .union([
      z.array(z.string().trim()),
      z.string().transform((val) =>
        val
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    ])
    .optional(),
});

export const queryExpenseSchema = z.object({
  category: ExpenseCategoryEnum.optional(),
  paymentMethod: PaymentMethodEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  currency: z.string().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['date', 'amount', 'title', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const setBudgetSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  amount: z.coerce.number().positive('Budget amount must be greater than zero'),
  currency: z.string().trim().min(1).max(10).default('INR'),
  category: ExpenseCategoryEnum.optional().nullable(),
});

export const queryBudgetSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  currency: z.string().optional(),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
export type QueryExpenseDto = z.infer<typeof queryExpenseSchema>;
export type SetBudgetDto = z.infer<typeof setBudgetSchema>;
export type QueryBudgetDto = z.infer<typeof queryBudgetSchema>;
