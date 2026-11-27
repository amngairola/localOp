import { api } from '@/lib/api/client';
import {
  Subscription,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionSummary,
  Bill,
} from '@/types';

export interface CreateSubscriptionPayload {
  name: string;
  description?: string | null;
  provider?: string | null;
  amount: number;
  currency?: string;
  billingCycle?: BillingCycle;
  startDate: string;
  nextRenewal?: string;
  status?: SubscriptionStatus;
  category?: string | null;
  notes?: string | null;
  paymentMethod?: string | null;
  websiteUrl?: string | null;
  isTrial?: boolean;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  reminderDaysBefore?: number | null;
}

export interface UpdateSubscriptionPayload {
  name?: string;
  description?: string | null;
  provider?: string | null;
  amount?: number;
  currency?: string;
  billingCycle?: BillingCycle;
  startDate?: string;
  nextRenewal?: string;
  status?: SubscriptionStatus;
  category?: string | null;
  notes?: string | null;
  paymentMethod?: string | null;
  websiteUrl?: string | null;
  isTrial?: boolean;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  reminderDaysBefore?: number | null;
}

export interface QuerySubscriptionsParams {
  status?: SubscriptionStatus;
  category?: string;
  billingCycle?: BillingCycle;
  isTrial?: boolean;
  search?: string;
  sortBy?: 'nextRenewal' | 'amount' | 'name' | 'createdAt' | 'startDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CancelSubscriptionPayload {
  cancellationReason?: string | null;
  cancellationDate?: string | null;
}

export const subscriptionsApi = {
  list: async (params: QuerySubscriptionsParams = {}): Promise<Subscription[]> => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.billingCycle) query.set('billingCycle', params.billingCycle);
    if (params.isTrial !== undefined) query.set('isTrial', String(params.isTrial));
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<Subscription[]>(`/subscriptions${qs}`);
  },

  getSummary: async (): Promise<SubscriptionSummary> => {
    return api.get<SubscriptionSummary>('/subscriptions/summary');
  },

  getById: async (id: string): Promise<Subscription> => {
    return api.get<Subscription>(`/subscriptions/${id}`);
  },

  create: async (payload: CreateSubscriptionPayload): Promise<Subscription> => {
    return api.post<Subscription>('/subscriptions', payload);
  },

  update: async (
    id: string,
    payload: UpdateSubscriptionPayload
  ): Promise<Subscription> => {
    return api.patch<Subscription>(`/subscriptions/${id}`, payload);
  },

  pause: async (id: string): Promise<Subscription> => {
    return api.post<Subscription>(`/subscriptions/${id}/pause`);
  },

  resume: async (id: string): Promise<Subscription> => {
    return api.post<Subscription>(`/subscriptions/${id}/resume`);
  },

  cancel: async (
    id: string,
    payload: CancelSubscriptionPayload = {}
  ): Promise<Subscription> => {
    return api.post<Subscription>(`/subscriptions/${id}/cancel`, payload);
  },

  renew: async (id: string, renewalDate?: string): Promise<Subscription> => {
    return api.post<Subscription>(`/subscriptions/${id}/renew`, { renewalDate });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/subscriptions/${id}`);
  },

  createBill: async (id: string): Promise<Bill> => {
    return api.post<Bill>(`/subscriptions/${id}/create-bill`);
  },
};
