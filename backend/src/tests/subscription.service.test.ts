import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { Subscription, Prisma } from '@prisma/client';

describe('SubscriptionService', () => {
  let mockRepo: SubscriptionRepository;
  let service: SubscriptionService;

  const mockSubscription: Subscription = {
    id: 'sub-001',
    userId: 'user-alpha',
    name: 'Netflix Premium',
    description: '4K family plan',
    provider: 'Netflix',
    amount: new Prisma.Decimal(649),
    currency: 'INR',
    billingCycle: 'MONTHLY',
    startDate: new Date('2026-01-15T00:00:00Z'),
    nextRenewal: new Date('2026-12-15T00:00:00Z'),
    status: 'ACTIVE',
    category: 'ENTERTAINMENT',
    notes: 'Family profile',
    paymentMethod: 'HDFC Credit Card',
    websiteUrl: 'https://netflix.com',
    isTrial: false,
    trialStartDate: null,
    trialEndDate: null,
    reminderDaysBefore: 3,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date('2026-01-15T00:00:00Z'),
    updatedAt: new Date('2026-11-20T00:00:00Z'),
  };

  beforeEach(() => {
    mockRepo = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      cancel: vi.fn(),
      renew: vi.fn(),
      delete: vi.fn(),
      getSummary: vi.fn(),
    } as unknown as SubscriptionRepository;

    service = new SubscriptionService(mockRepo);
  });

  describe('Monthly Cost Normalization', () => {
    it('normalizes weekly, monthly, quarterly, and yearly costs accurately', () => {
      // Weekly: 100 * 52 / 12 = 433.33
      expect(service.normalizeMonthlyCost(100, 'WEEKLY')).toBe(433.33);

      // Monthly: 649
      expect(service.normalizeMonthlyCost(649, 'MONTHLY')).toBe(649);

      // Quarterly: 900 / 3 = 300
      expect(service.normalizeMonthlyCost(900, 'QUARTERLY')).toBe(300);

      // Yearly: 1200 / 12 = 100
      expect(service.normalizeMonthlyCost(1200, 'YEARLY')).toBe(100);

      // Custom: stays raw amount
      expect(service.normalizeMonthlyCost(250, 'CUSTOM')).toBe(250);
    });
  });

  describe('Renewal Date Calculations & Month-End Handling', () => {
    it('accurately advances renewal for weekly, monthly, quarterly, and yearly cycles', () => {
      const base = new Date('2026-01-15T10:00:00Z');

      const weekly = service.calculateNextRenewal(base, 'WEEKLY');
      expect(weekly.toISOString().slice(0, 10)).toBe('2026-01-22');

      const monthly = service.calculateNextRenewal(base, 'MONTHLY');
      expect(monthly.toISOString().slice(0, 10)).toBe('2026-02-15');

      const quarterly = service.calculateNextRenewal(base, 'QUARTERLY');
      expect(quarterly.toISOString().slice(0, 10)).toBe('2026-04-15');

      const yearly = service.calculateNextRenewal(base, 'YEARLY');
      expect(yearly.toISOString().slice(0, 10)).toBe('2027-01-15');
    });

    it('safely handles month-end dates like Jan 31 rolling into February', () => {
      // 2026 is not a leap year, so Jan 31 + 1 month rolls to Feb 28
      const jan31 = new Date('2026-01-31T00:00:00Z');
      const febRenewal = service.calculateNextRenewal(jan31, 'MONTHLY');
      expect(febRenewal.getUTCMonth()).toBe(1); // 1 = February
      expect(febRenewal.getUTCDate()).toBe(28);

      // Aug 31 rolls into Sep 30
      const aug31 = new Date('2026-08-31T00:00:00Z');
      const sepRenewal = service.calculateNextRenewal(aug31, 'MONTHLY');
      expect(sepRenewal.getUTCMonth()).toBe(8); // 8 = September
      expect(sepRenewal.getUTCDate()).toBe(30);
    });
  });

  describe('createSubscription', () => {
    it('creates a subscription with calculated renewal date', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(mockSubscription);

      const result = await service.createSubscription('user-alpha', {
        name: 'Netflix Premium',
        amount: 649,
        currency: 'INR',
        billingCycle: 'MONTHLY',
        startDate: '2026-01-15T00:00:00Z',
        status: 'ACTIVE',
        category: 'ENTERTAINMENT',
        isTrial: false,
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        'user-alpha',
        expect.objectContaining({ name: 'Netflix Premium', amount: 649 }),
        expect.any(Date)
      );
      expect(result.id).toBe('sub-001');
      expect(result.monthlyEquivalentCost).toBe(649);
    });

    it('throws ValidationError if trial end date is before or equal to trial start date', async () => {
      await expect(
        service.createSubscription('user-alpha', {
          name: 'Free Trial App',
          amount: 199,
          currency: 'INR',
          billingCycle: 'MONTHLY',
          startDate: '2026-01-15T00:00:00Z',
          status: 'ACTIVE',
          isTrial: true,
          trialStartDate: '2026-01-15T00:00:00Z',
          trialEndDate: '2026-01-10T00:00:00Z', // Invalid: before start
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('User Isolation & Retrieve', () => {
    it('returns subscription for authorized user with computed enhancement fields', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockSubscription);

      const result = await service.getSubscription('user-alpha', 'sub-001');
      expect(result.id).toBe('sub-001');
      expect(result.monthlyEquivalentCost).toBe(649);
      expect(result.isOverdue).toBe(false);
    });

    it('throws NotFoundError when user attempts to access another user subscription', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.getSubscription('user-beta', 'sub-001')).rejects.toThrow(
        NotFoundError
      );
      expect(mockRepo.findById).toHaveBeenCalledWith('user-beta', 'sub-001');
    });
  });

  describe('Trial Expiration and Status Indicators', () => {
    it('identifies trial ending soon when trialEndDate is within 7 days', async () => {
      const now = new Date();
      const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const trialSub: Subscription = {
        ...mockSubscription,
        isTrial: true,
        trialStartDate: now,
        trialEndDate: in3Days,
      };

      vi.mocked(mockRepo.findById).mockResolvedValue(trialSub);

      const result = await service.getSubscription('user-alpha', 'sub-001');
      expect(result.isTrialEndingSoon).toBe(true);
      expect(result.isTrialExpired).toBe(false);
    });

    it('identifies expired trial when trialEndDate is in the past', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const trialSub: Subscription = {
        ...mockSubscription,
        isTrial: true,
        trialStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        trialEndDate: pastDate,
      };

      vi.mocked(mockRepo.findById).mockResolvedValue(trialSub);

      const result = await service.getSubscription('user-alpha', 'sub-001');
      expect(result.isTrialExpired).toBe(true);
      expect(result.isTrialEndingSoon).toBe(false);
    });
  });

  describe('Lifecycle: Pause, Resume, Cancel, and Renew', () => {
    it('pauses an active subscription', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockSubscription);
      vi.mocked(mockRepo.pause).mockResolvedValue({
        ...mockSubscription,
        status: 'PAUSED',
      });

      const result = await service.pauseSubscription('user-alpha', 'sub-001');
      expect(result.status).toBe('PAUSED');
      expect(mockRepo.pause).toHaveBeenCalledWith('user-alpha', 'sub-001');
    });

    it('is idempotent when pausing an already paused subscription', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue({
        ...mockSubscription,
        status: 'PAUSED',
      });

      const result = await service.pauseSubscription('user-alpha', 'sub-001');
      expect(result.status).toBe('PAUSED');
      expect(mockRepo.pause).not.toHaveBeenCalled();
    });

    it('rejects pausing a cancelled subscription with ConflictError', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue({
        ...mockSubscription,
        status: 'CANCELLED',
      });

      await expect(service.pauseSubscription('user-alpha', 'sub-001')).rejects.toThrow(
        ConflictError
      );
    });

    it('resumes a paused subscription and advances renewal if expired while paused', async () => {
      const pastRenewal = new Date('2026-01-01T00:00:00Z');
      vi.mocked(mockRepo.findById).mockResolvedValue({
        ...mockSubscription,
        status: 'PAUSED',
        nextRenewal: pastRenewal,
      });

      vi.mocked(mockRepo.resume).mockImplementation(async (_u, _id, newDate) => ({
        ...mockSubscription,
        status: 'ACTIVE',
        nextRenewal: newDate!,
      }));

      const result = await service.resumeSubscription('user-alpha', 'sub-001');
      expect(result.status).toBe('ACTIVE');
      expect(mockRepo.resume).toHaveBeenCalledWith('user-alpha', 'sub-001', expect.any(Date));
      expect(result.nextRenewal.getTime()).toBeGreaterThan(Date.now());
    });

    it('cancels an active subscription recording cancellationReason and timestamp', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockSubscription);
      vi.mocked(mockRepo.cancel).mockResolvedValue({
        ...mockSubscription,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Too expensive',
      });

      const result = await service.cancelSubscription('user-alpha', 'sub-001', {
        cancellationReason: 'Too expensive',
      });

      expect(result.status).toBe('CANCELLED');
      expect(mockRepo.cancel).toHaveBeenCalledWith(
        'user-alpha',
        'sub-001',
        'Too expensive',
        expect.any(Date)
      );
    });

    it('renews an active subscription and rolls renewal forward to next cycle', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockSubscription);
      const nextMonth = service.calculateNextRenewal(
        mockSubscription.nextRenewal,
        mockSubscription.billingCycle
      );

      vi.mocked(mockRepo.renew).mockResolvedValue({
        ...mockSubscription,
        nextRenewal: nextMonth,
      });

      const result = await service.renewSubscription('user-alpha', 'sub-001', {});
      expect(result.status).toBe('ACTIVE');
      expect(mockRepo.renew).toHaveBeenCalledWith(
        'user-alpha',
        'sub-001',
        expect.any(Date),
        false
      );
    });
  });

  describe('deleteSubscription', () => {
    it('deletes subscription for authorized owner', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockSubscription);
      vi.mocked(mockRepo.delete).mockResolvedValue(mockSubscription);

      await service.deleteSubscription('user-alpha', 'sub-001');
      expect(mockRepo.delete).toHaveBeenCalledWith('user-alpha', 'sub-001');
    });

    it('throws NotFoundError when subscription does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.deleteSubscription('user-alpha', 'unknown-id')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
