import { reminderRepository, ReminderRepository } from '../repositories/reminder.repository';
import { CreateReminderDto, UpdateReminderDto, QueryReminderDto } from '../schemas/reminder.schema';
import { NotFoundError } from '../utils/errors';
import { Reminder, RecurrenceType } from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export class ReminderService {
  constructor(private repo: ReminderRepository = reminderRepository) {}

  async listReminders(userId: string, query: QueryReminderDto) {
    const { reminders, total } = await this.repo.findMany(userId, query);

    const now = new Date();
    // Dynamic overdue calculation for display
    const enriched = reminders.map((rem) => {
      if (rem.status === 'PENDING' && new Date(rem.dueDate) < now) {
        return { ...rem, isOverdue: true };
      }
      return { ...rem, isOverdue: false };
    });

    return {
      reminders: enriched,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrev: query.page > 1,
      },
    };
  }

  async getReminder(userId: string, id: string): Promise<Reminder> {
    const reminder = await this.repo.findById(userId, id);
    if (!reminder) {
      throw new NotFoundError('Reminder');
    }
    return reminder;
  }

  async createReminder(userId: string, dto: CreateReminderDto): Promise<Reminder> {
    return this.repo.create(userId, dto);
  }

  async updateReminder(userId: string, id: string, dto: UpdateReminderDto): Promise<Reminder> {
    const updated = await this.repo.update(userId, id, dto);
    if (!updated) {
      throw new NotFoundError('Reminder');
    }
    return updated;
  }

  async completeReminder(
    userId: string,
    id: string
  ): Promise<{ completed: Reminder; nextOccurrence?: Reminder }> {
    const reminder = await this.repo.findById(userId, id);
    if (!reminder) {
      throw new NotFoundError('Reminder');
    }

    const completed = await this.repo.complete(userId, id);
    if (!completed) {
      throw new NotFoundError('Reminder');
    }

    // Handle Recurring Reminder Generation Idempotently
    let nextOccurrence: Reminder | undefined;

    if (reminder.recurrenceType !== 'NONE') {
      const nextDueDate = this.calculateNextDueDate(
        new Date(reminder.dueDate),
        reminder.recurrenceType,
        reminder.recurrenceValue || 1
      );

      // Create the next reminder occurrence linked in the recurrence chain
      nextOccurrence = await this.repo.create(
        userId,
        {
          title: reminder.title,
          description: reminder.description,
          dueDate: nextDueDate.toISOString(),
          priority: reminder.priority,
          recurrenceType: reminder.recurrenceType,
          recurrenceValue: reminder.recurrenceValue,
          notifyBefore: reminder.notifyBefore,
        },
        reminder.id
      );
    }

    return { completed, nextOccurrence };
  }

  async deleteReminder(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError('Reminder');
    }
  }

  private calculateNextDueDate(
    currentDueDate: Date,
    recurrence: RecurrenceType,
    interval: number = 1
  ): Date {
    switch (recurrence) {
      case 'DAILY':
        return addDays(currentDueDate, interval);
      case 'WEEKLY':
        return addWeeks(currentDueDate, interval);
      case 'MONTHLY':
        return addMonths(currentDueDate, interval);
      case 'YEARLY':
        return addYears(currentDueDate, interval);
      case 'CUSTOM':
        return addDays(currentDueDate, interval);
      default:
        return addDays(currentDueDate, 1);
    }
  }
}

export const reminderService = new ReminderService();
