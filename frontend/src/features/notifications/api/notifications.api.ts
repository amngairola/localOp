import { api } from '@/lib/api/client';
import {
  AppNotification,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
} from '@/types';

export interface QueryNotificationsParams {
  status?: 'UNREAD' | 'READ' | 'ALL';
  type?: NotificationType;
  priority?: NotificationPriority;
  page?: number;
  limit?: number;
}

export interface UpdatePreferencesPayload {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  reminderLeadMinutes?: number;
  billLeadDays?: number;
  subscriptionLeadDays?: number;
  trialLeadDays?: number;
  budgetThresholdPercent?: number;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

export const notificationsApi = {
  list: async (params: QueryNotificationsParams = {}): Promise<AppNotification[]> => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.type) query.append('type', params.type);
    if (params.priority) query.append('priority', params.priority);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    return api.get<AppNotification[]>(endpoint);
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    return api.get<{ unreadCount: number }>('/notifications/unread-count');
  },

  markAsRead: async (id: string): Promise<AppNotification> => {
    return api.patch<AppNotification>(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    return api.post<{ count: number }>('/notifications/mark-all-read');
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/notifications/${id}`);
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    return api.get<NotificationPreferences>('/notifications/preferences');
  },

  updatePreferences: async (
    payload: UpdatePreferencesPayload
  ): Promise<NotificationPreferences> => {
    return api.put<NotificationPreferences>('/notifications/preferences', payload);
  },
};
