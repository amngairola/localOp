import { prisma } from '../config/database';
import { Subscription, Prisma, BillingCycle, SubscriptionStatus } from '@prisma/client';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  QuerySubscriptionDto,
} from '../schemas/subscription.schema';

export interface SubscriptionSummary {
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  expiredCount: number;
  totalMonthlyCost: number;
  upcomingRenewalsCount: number;
  trialEndingSoonCount: number;
}

export class SubscriptionRepository {
  async findMany(
    userId: string,
    query: QuerySubscriptionDto
  ): Promise<{ subscriptions: Subscription[]; total: number }> {
    const where: Prisma.SubscriptionWhereInput = {
      userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.billingCycle) {
      where.billingCycle = query.billingCycle;
    }

    if (query.isTrial !== undefined) {
      where.isTrial = query.isTrial;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { provider: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take,
      }),
      prisma.subscription.count({ where }),
    ]);

    return { subscriptions, total };
  }

  async findById(userId: string, id: string): Promise<Subscription | null> {
    return prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async create(
    userId: string,
    dto: CreateSubscriptionDto,
    calculatedNextRenewal: Date
  ): Promise<Subscription> {
    return prisma.subscription.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
        provider: dto.provider ?? null,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
        billingCycle: dto.billingCycle,
        startDate: new Date(dto.startDate),
        nextRenewal: dto.nextRenewal ? new Date(dto.nextRenewal) : calculatedNextRenewal,
        status: dto.status,
        category: dto.category ?? null,
        notes: dto.notes ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        websiteUrl: dto.websiteUrl ?? null,
        isTrial: dto.isTrial,
        trialStartDate: dto.trialStartDate ? new Date(dto.trialStartDate) : null,
        trialEndDate: dto.trialEndDate ? new Date(dto.trialEndDate) : null,
        reminderDaysBefore: dto.reminderDaysBefore ?? 3,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateSubscriptionDto
  ): Promise<Subscription | null> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      return null;
    }

    const data: Prisma.SubscriptionUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.provider !== undefined) data.provider = dto.provider;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.billingCycle !== undefined) data.billingCycle = dto.billingCycle;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.nextRenewal !== undefined) data.nextRenewal = new Date(dto.nextRenewal);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.paymentMethod !== undefined) data.paymentMethod = dto.paymentMethod;
    if (dto.websiteUrl !== undefined) data.websiteUrl = dto.websiteUrl;
    if (dto.isTrial !== undefined) data.isTrial = dto.isTrial;
    if (dto.trialStartDate !== undefined) {
      data.trialStartDate = dto.trialStartDate ? new Date(dto.trialStartDate) : null;
    }
    if (dto.trialEndDate !== undefined) {
      data.trialEndDate = dto.trialEndDate ? new Date(dto.trialEndDate) : null;
    }
    if (dto.reminderDaysBefore !== undefined) {
      data.reminderDaysBefore = dto.reminderDaysBefore;
    }

    return prisma.subscription.update({
      where: { id },
      data,
    });
  }

  async pause(userId: string, id: string): Promise<Subscription | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    return prisma.subscription.update({
      where: { id },
      data: {
        status: 'PAUSED',
      },
    });
  }

  async resume(
    userId: string,
    id: string,
    nextRenewalDate?: Date
  ): Promise<Subscription | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    const data: Prisma.SubscriptionUpdateInput = {
      status: 'ACTIVE',
    };
    if (nextRenewalDate) {
      data.nextRenewal = nextRenewalDate;
    }

    return prisma.subscription.update({
      where: { id },
      data,
    });
  }

  async cancel(
    userId: string,
    id: string,
    cancellationReason?: string | null,
    cancelledAt?: Date
  ): Promise<Subscription | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    return prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: cancelledAt || new Date(),
        cancellationReason: cancellationReason ?? existing.cancellationReason,
      },
    });
  }

  async renew(
    userId: string,
    id: string,
    nextRenewal: Date,
    isTrial: boolean = false
  ): Promise<Subscription | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    return prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        nextRenewal,
        isTrial,
      },
    });
  }

  async delete(userId: string, id: string): Promise<Subscription | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    return prisma.subscription.delete({
      where: { id },
    });
  }

  async getSummary(userId: string): Promise<SubscriptionSummary> {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activeSubscriptions,
      pausedCount,
      cancelledCount,
      expiredCount,
      upcomingRenewalsCount,
      trialEndingSoonCount,
    ] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { amount: true, billingCycle: true },
      }),
      prisma.subscription.count({
        where: { userId, status: 'PAUSED' },
      }),
      prisma.subscription.count({
        where: { userId, status: 'CANCELLED' },
      }),
      prisma.subscription.count({
        where: { userId, status: 'EXPIRED' },
      }),
      prisma.subscription.count({
        where: {
          userId,
          status: 'ACTIVE',
          nextRenewal: { gte: now, lte: in30Days },
        },
      }),
      prisma.subscription.count({
        where: {
          userId,
          status: 'ACTIVE',
          isTrial: true,
          trialEndDate: { gte: now, lte: in7Days },
        },
      }),
    ]);

    // Calculate normalized monthly cost for all active subscriptions
    const totalMonthlyCost = activeSubscriptions.reduce((acc, sub) => {
      const amount = Number(sub.amount);
      let monthlyEquivalent = amount;
      switch (sub.billingCycle) {
        case 'WEEKLY':
          monthlyEquivalent = (amount * 52) / 12;
          break;
        case 'MONTHLY':
          monthlyEquivalent = amount;
          break;
        case 'QUARTERLY':
          monthlyEquivalent = amount / 3;
          break;
        case 'YEARLY':
          monthlyEquivalent = amount / 12;
          break;
        case 'CUSTOM':
          monthlyEquivalent = amount;
          break;
      }
      return acc + monthlyEquivalent;
    }, 0);

    return {
      activeCount: activeSubscriptions.length,
      pausedCount,
      cancelledCount,
      expiredCount,
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      upcomingRenewalsCount,
      trialEndingSoonCount,
    };
  }
}

export const subscriptionRepository = new SubscriptionRepository();
