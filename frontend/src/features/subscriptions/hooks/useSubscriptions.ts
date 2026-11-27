import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  subscriptionsApi,
  CreateSubscriptionPayload,
  UpdateSubscriptionPayload,
  QuerySubscriptionsParams,
  CancelSubscriptionPayload,
} from '../api/subscriptions.api';

export const SUBSCRIPTIONS_QUERY_KEY = ['subscriptions'];
export const SUBSCRIPTIONS_SUMMARY_KEY = ['subscriptions', 'summary'];

export function useSubscriptions(params: QuerySubscriptionsParams = {}) {
  return useQuery({
    queryKey: [...SUBSCRIPTIONS_QUERY_KEY, params],
    queryFn: () => subscriptionsApi.list(params),
  });
}

export function useSubscriptionSummary() {
  return useQuery({
    queryKey: SUBSCRIPTIONS_SUMMARY_KEY,
    queryFn: () => subscriptionsApi.getSummary(),
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: [...SUBSCRIPTIONS_QUERY_KEY, id],
    queryFn: () => subscriptionsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) =>
      subscriptionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSubscriptionPayload;
    }) => subscriptionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: CancelSubscriptionPayload;
    }) => subscriptionsApi.cancel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}

export function useRenewSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, renewalDate }: { id: string; renewalDate?: string }) =>
      subscriptionsApi.renew(id, renewalDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}

export function useGenerateBillFromSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.createBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}
