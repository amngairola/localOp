import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReminderService } from '../services/reminder.service';
import { ReminderRepository } from '../repositories/reminder.repository';
import { NotFoundError } from '../utils/errors';
import { Reminder } from '@prisma/client';

describe('ReminderService', () => {
  let mockRepo: ReminderRepository;
  let service: ReminderService;

  const mockReminder: Reminder = {
    id: 'rem-123',
    userId: 'user-1',
    title: 'Pay electricity bill',
    description: 'Avoid fine',
    dueDate: new Date('2026-12-05T10:00:00Z'),
    status: 'PENDING',
    priority: 'HIGH',
    recurrenceType: 'MONTHLY',
    recurrenceValue: 1,
    notifyBefore: 60,
    notifiedAt: null,
    completedAt: null,
    parentId: null,
    createdAt: new Date('2026-11-20T10:00:00Z'),
    updatedAt: new Date('2026-11-20T10:00:00Z'),
  };

  beforeEach(() => {
    mockRepo = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      complete: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReminderRepository;

    service = new ReminderService(mockRepo);
  });

  describe('createReminder', () => {
    it('creates a reminder with valid data for the authenticated user', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(mockReminder);

      const result = await service.createReminder('user-1', {
        title: 'Pay electricity bill',
        dueDate: '2026-12-05T10:00:00Z',
        priority: 'HIGH',
        recurrenceType: 'MONTHLY',
        recurrenceValue: 1,
        notifyBefore: 60,
      });

      expect(mockRepo.create).toHaveBeenCalledWith('user-1', {
        title: 'Pay electricity bill',
        dueDate: '2026-12-05T10:00:00Z',
        priority: 'HIGH',
        recurrenceType: 'MONTHLY',
        recurrenceValue: 1,
        notifyBefore: 60,
      });
      expect(result).toEqual(mockReminder);
    });
  });

  describe('getReminder & User Isolation', () => {
    it('returns reminder when owned by the user', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockReminder);

      const result = await service.getReminder('user-1', 'rem-123');
      expect(result).toEqual(mockReminder);
      expect(mockRepo.findById).toHaveBeenCalledWith('user-1', 'rem-123');
    });

    it('throws NotFoundError when another user attempts to access the reminder', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.getReminder('attacker-user', 'rem-123')).rejects.toThrow(NotFoundError);
      expect(mockRepo.findById).toHaveBeenCalledWith('attacker-user', 'rem-123');
    });
  });

  describe('completeReminder with Recurrence', () => {
    it('completes reminder and automatically creates next monthly occurrence', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockReminder);
      vi.mocked(mockRepo.complete).mockResolvedValue({
        ...mockReminder,
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      const nextOccurrence: Reminder = {
        ...mockReminder,
        id: 'rem-456',
        parentId: 'rem-123',
        dueDate: new Date('2027-01-05T10:00:00Z'),
      };
      vi.mocked(mockRepo.create).mockResolvedValue(nextOccurrence);

      const result = await service.completeReminder('user-1', 'rem-123');

      expect(mockRepo.complete).toHaveBeenCalledWith('user-1', 'rem-123');
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      // Next occurrence due date should be 1 month later
      const createdDto = vi.mocked(mockRepo.create).mock.calls[0][1];
      expect(new Date(createdDto.dueDate).getUTCMonth()).toBe(0); // January (next month after December)
      expect(result.nextOccurrence).toBeDefined();
    });

    it('does not create next occurrence for non-recurring reminders', async () => {
      const nonRecurring = { ...mockReminder, recurrenceType: 'NONE' as const };
      vi.mocked(mockRepo.findById).mockResolvedValue(nonRecurring);
      vi.mocked(mockRepo.complete).mockResolvedValue({
        ...nonRecurring,
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      const result = await service.completeReminder('user-1', 'rem-123');

      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(result.nextOccurrence).toBeUndefined();
    });
  });

  describe('deleteReminder & User Isolation', () => {
    it('successfully deletes a reminder owned by the user', async () => {
      vi.mocked(mockRepo.delete).mockResolvedValue(true);

      await expect(service.deleteReminder('user-1', 'rem-123')).resolves.not.toThrow();
      expect(mockRepo.delete).toHaveBeenCalledWith('user-1', 'rem-123');
    });

    it('throws NotFoundError if a user tries to delete a reminder they do not own', async () => {
      vi.mocked(mockRepo.delete).mockResolvedValue(false);

      await expect(service.deleteReminder('wrong-user', 'rem-123')).rejects.toThrow(NotFoundError);
    });
  });
});
