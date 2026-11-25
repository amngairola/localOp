import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  remindersApi,
  CreateReminderPayload,
  UpdateReminderPayload,
  QueryRemindersParams,
} from '../api/reminders.api';

export const REMINDERS_QUERY_KEY = ['reminders'];

export function useReminders(params: QueryRemindersParams = {}) {
  return useQuery({
    queryKey: [...REMINDERS_QUERY_KEY, params],
    queryFn: () => remindersApi.list(params),
  });
}

export function useReminder(id: string) {
  return useQuery({
    queryKey: [...REMINDERS_QUERY_KEY, id],
    queryFn: () => remindersApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReminderPayload) => remindersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_QUERY_KEY });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReminderPayload }) =>
      remindersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_QUERY_KEY });
    },
  });
}

export function useCompleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => remindersApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_QUERY_KEY });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => remindersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_QUERY_KEY });
    },
  });
}
