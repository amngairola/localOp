import {
  SubscriptionRepository,
  subscriptionRepository,
  SubscriptionSummary,
} from '../repositories/subscription.repository';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  QuerySubscriptionDto,
  CancelSubscriptionDto,
  RenewSubscriptionDto,
} from '../schemas/subscription.schema';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { Subscription, BillingCycle, Bill } from '@prisma/client';
import {
  addWeeks,
  addMonths,
  addYears,
  addDays,
  isPast,
  isBefore,
  differenceInDays,
} from 'date-fns';
import { prisma } from '../config/database';

export interface EnhancedSubscription extends Subscription {
  monthlyEquivalentCost: number;
  isOverdue: boolean;
  isRenewalUpcoming: boolean;
  isTrialEndingSoon: boolean;
  isTrialExpired: boolean;
}

export class SubscriptionService {
  constructor(private repo: SubscriptionRepository = subscriptionRepository) {}

  /**
   * Calculates next renewal date based on billing cycle, preserving date safety.
   * date-fns addMonths handles month-end overflow correctly (e.g., Jan 31 -> Feb 28).
   */
  calculateNextRenewal(baseDate: Date, cycle: BillingCycle): Date {
    switch (cycle) {
      case 'WEEKLY':
        return addWeeks(baseDate, 1);
      case 'MONTHLY':
        return addMonths(baseDate, 1);
      case 'QUARTERLY':
        return addMonths(baseDate, 3);
      case 'YEARLY':
        return addYears(baseDate, 1);
      case 'CUSTOM':
        return addDays(baseDate, 30);
      default:
        return addMonths(baseDate, 1);
    }
  }

  /**
   * Normalizes any billing cycle amount to an equivalent monthly cost.
   */
  normalizeMonthlyCost(amount: number, cycle: BillingCycle): number {
    let cost = amount;
    switch (cycle) {
      case 'WEEKLY':
        cost = (amount * 52) / 12;
        break;
      case 'MONTHLY':
        cost = amount;
        break;
      case 'QUARTERLY':
        cost = amount / 3;
        break;
      case 'YEARLY':
        cost = amount / 12;
        break;
      case 'CUSTOM':
        cost = amount;
        break;
    }
    return Math.round(cost * 100) / 100;
  }

  private enhanceSubscription(sub: Subscription): EnhancedSubscription {
    const now = new Date();
    const nextRenewal = new Date(sub.nextRenewal);
    const amount = Number(sub.amount);
    const monthlyEquivalentCost = this.normalizeMonthlyCost(amount, sub.billingCycle);

    const isOverdue = sub.status === 'ACTIVE' && isBefore(nextRenewal, now);
    const reminderDays = sub.reminderDaysBefore ?? 7;
    const daysUntilRenewal = differenceInDays(nextRenewal, now);
    const isRenewalUpcoming =
      sub.status === 'ACTIVE' &&
      !isOverdue &&
      daysUntilRenewal >= 0 &&
      daysUntilRenewal <= reminderDays;

    let isTrialEndingSoon = false;
    let isTrialExpired = false;

    if (sub.isTrial && sub.trialEndDate) {
      const trialEnd = new Date(sub.trialEndDate);
      const daysUntilTrialEnd = differenceInDays(trialEnd, now);
      isTrialExpired = isBefore(trialEnd, now);
      isTrialEndingSoon = !isTrialExpired && daysUntilTrialEnd >= 0 && daysUntilTrialEnd <= 7;
    }

    return {
      ...sub,
      monthlyEquivalentCost,
      isOverdue,
      isRenewalUpcoming,
      isTrialEndingSoon,
      isTrialExpired,
    };
  }

  async listSubscriptions(
    userId: string,
    query: QuerySubscriptionDto
  ): Promise<{
    subscriptions: EnhancedSubscription[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { subscriptions, total } = await this.repo.findMany(userId, query);

    const enhanced = subscriptions.map((s) => this.enhanceSubscription(s));

    return {
      subscriptions: enhanced,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getSubscription(userId: string, id: string): Promise<EnhancedSubscription> {
    const sub = await this.repo.findById(userId, id);
    if (!sub) {
      throw new NotFoundError('Subscription');
    }
    return this.enhanceSubscription(sub);
  }

  async createSubscription(
    userId: string,
    dto: CreateSubscriptionDto
  ): Promise<EnhancedSubscription> {
    const startDate = new Date(dto.startDate);
    const calculatedRenewal = this.calculateNextRenewal(startDate, dto.billingCycle);

    // Validation for trial dates if marked as trial
    if (dto.isTrial && dto.trialStartDate && dto.trialEndDate) {
      if (new Date(dto.trialEndDate) <= new Date(dto.trialStartDate)) {
        throw new ValidationError('Trial end date must be after trial start date');
      }
    }

    const created = await this.repo.create(userId, dto, calculatedRenewal);
    return this.enhanceSubscription(created);
  }

  async updateSubscription(
    userId: string,
    id: string,
    dto: UpdateSubscriptionDto
  ): Promise<EnhancedSubscription> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Subscription');
    }

    if (dto.isTrial && dto.trialStartDate && dto.trialEndDate) {
      if (new Date(dto.trialEndDate) <= new Date(dto.trialStartDate)) {
        throw new ValidationError('Trial end date must be after trial start date');
      }
    }

    const updated = await this.repo.update(userId, id, dto);
    if (!updated) {
      throw new NotFoundError('Subscription');
    }
    return this.enhanceSubscription(updated);
  }

  async pauseSubscription(userId: string, id: string): Promise<EnhancedSubscription> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Subscription');
    }

    // Idempotent: if already PAUSED, return existing
    if (existing.status === 'PAUSED') {
      return this.enhanceSubscription(existing);
    }

    if (existing.status === 'CANCELLED') {
      throw new ConflictError('Cannot pause a cancelled subscription');
    }

    const paused = await this.repo.pause(userId, id);
    if (!paused) {
      throw new NotFoundError('Subscription');
    }
    return this.enhanceSubscription(paused);
  }

  async resumeSubscription(userId: string, id: string): Promise<EnhancedSubscription> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Subscription');
    }

    // Idempotent: if already ACTIVE, return existing
    if (existing.status === 'ACTIVE') {
      return this.enhanceSubscription(existing);
    }

    if (existing.status === 'CANCELLED') {
      throw new ConflictError('Cannot resume a cancelled subscription. Please create a new subscription.');
    }

    // If nextRenewal was in the past while paused, advance it to next future cycle
    const now = new Date();
    let nextRenewal = new Date(existing.nextRenewal);
    if (isBefore(nextRenewal, now)) {
      while (isBefore(nextRenewal, now)) {
        nextRenewal = this.calculateNextRenewal(nextRenewal, existing.billingCycle);
      }
    }

    const resumed = await this.repo.resume(userId, id, nextRenewal);
    if (!resumed) {
      throw new NotFoundError('Subscription');
    }
    return this.enhanceSubscription(resumed);
  }

  async cancelSubscription(
    userId: string,
    id: string,
    dto: CancelSubscriptionDto
  ): Promise<EnhancedSubscription> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Subscription');
    }

    // Idempotent: if already cancelled, return existing
    if (existing.status === 'CANCELLED') {
      return this.enhanceSubscription(existing);
    }

    const cancelledAt = dto.cancellationDate ? new Date(dto.cancellationDate) : new Date();
    const cancelled = await this.repo.cancel(
      userId,
      id,
      dto.cancellationReason ?? null,
      cancelledAt
    );
    if (!cancelled) {
      throw new NotFoundError('Subscription');
    }
    return this.enhanceSubscription(cancelled);
  }

  async renewSubscription(
    userId: string,
    id: string,
    dto: RenewSubscriptionDto
  ): Promise<EnhancedSubscription> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Subscription');
    }

    if (existing.status === 'CANCELLED') {
      throw new ConflictError('Cannot renew a cancelled subscription');
    }

    const baseDate = dto.renewalDate ? new Date(dto.renewalDate) : new Date(existing.nextRenewal);
    const nextRenewal = this.calculateNextRenewal(baseDate, existing.billingCycle);

    // If trial has ended, convert to non-trial
    let isTrial = existing.isTrial;
    if (isTrial && existing.trialEndDate && isPast(new Date(existing.trialEndDate))) {
      isTrial = false;
    }

    const renewed = await this.repo.renew(userId, id, nextRenewal, isTrial);
    if (!renewed) {
      throw new NotFoundError('Subscription');
    }
    return this.enhanceSubscription(renewed);
  }

  async deleteSubscription(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Subscription');
    }
    await this.repo.delete(userId, id);
  }

  async getSummary(userId: string): Promise<SubscriptionSummary> {
    return this.repo.getSummary(userId);
  }

  /**
   * Explicit optional operation: Create a Bill ledger entry from a subscription renewal.
   * Keeps subscriptions cleanly decoupled from bill generation without automatic hidden charges.
   */
  async createBillFromRenewal(
    userId: string,
    subscriptionId: string
  ): Promise<Bill> {
    const sub = await this.repo.findById(userId, subscriptionId);
    if (!sub) {
      throw new NotFoundError('Subscription');
    }

    return prisma.bill.create({
      data: {
        userId,
        title: `${sub.name} - Renewal`,
        description: `Generated bill from subscription renewal for ${sub.provider || sub.name}`,
        provider: sub.provider ?? sub.name,
        amount: sub.amount,
        currency: sub.currency,
        dueDate: sub.nextRenewal,
        category: 'OTHER',
        status: 'UNPAID',
        isRecurring: false,
        notes: `Subscription ID: ${sub.id} (${sub.billingCycle})`,
      },
    });
  }
}

export const subscriptionService = new SubscriptionService();
