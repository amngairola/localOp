import { z } from 'zod';

export const ReminderStatusEnum = z.enum(['PENDING', 'COMPLETED', 'OVERDUE', 'DISMISSED']);
export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const RecurrenceTypeEnum = z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']);

export const createReminderSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().trim().max(1000, 'Description too long').optional().nullable(),
  dueDate: z.string().datetime({ message: 'Invalid ISO due date' }),
  priority: PriorityEnum.default('MEDIUM'),
  recurrenceType: RecurrenceTypeEnum.default('NONE'),
  recurrenceValue: z.number().int().positive().optional().nullable(),
  notifyBefore: z.number().int().min(0).default(60),
});

export const updateReminderSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(255).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  dueDate: z.string().datetime({ message: 'Invalid ISO due date' }).optional(),
  status: ReminderStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  recurrenceType: RecurrenceTypeEnum.optional(),
  recurrenceValue: z.number().int().positive().optional().nullable(),
  notifyBefore: z.number().int().min(0).optional(),
});

export const queryReminderSchema = z.object({
  status: ReminderStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateReminderDto = z.infer<typeof createReminderSchema>;
export type UpdateReminderDto = z.infer<typeof updateReminderSchema>;
export type QueryReminderDto = z.infer<typeof queryReminderSchema>;
