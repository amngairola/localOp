import { api } from '@/lib/api/client';
import { Reminder, Priority, ReminderStatus, RecurrenceType } from '@/types';

export interface CreateReminderPayload {
  title: string;
  description?: string | null;
  dueDate: string;
  priority?: Priority;
  recurrenceType?: RecurrenceType;
  recurrenceValue?: number | null;
  notifyBefore?: number;
}

export interface UpdateReminderPayload {
  title?: string;
  description?: string | null;
  dueDate?: string;
  status?: ReminderStatus;
  priority?: Priority;
  recurrenceType?: RecurrenceType;
  recurrenceValue?: number | null;
  notifyBefore?: number;
}

export interface QueryRemindersParams {
  status?: ReminderStatus;
  priority?: Priority;
  search?: string;
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RemindersResponse {
  data: Reminder[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const remindersApi = {
  list: async (params: QueryRemindersParams = {}): Promise<Reminder[]> => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<Reminder[]>(`/reminders${qs}`);
  },

  getById: async (id: string): Promise<Reminder> => {
    return api.get<Reminder>(`/reminders/${id}`);
  },

  create: async (payload: CreateReminderPayload): Promise<Reminder> => {
    return api.post<Reminder>('/reminders', payload);
  },

  update: async (id: string, payload: UpdateReminderPayload): Promise<Reminder> => {
    return api.patch<Reminder>(`/reminders/${id}`, payload);
  },

  complete: async (id: string): Promise<{ completed: Reminder; nextOccurrence?: Reminder }> => {
    return api.post<{ completed: Reminder; nextOccurrence?: Reminder }>(`/reminders/${id}/complete`);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/reminders/${id}`);
  },
};
