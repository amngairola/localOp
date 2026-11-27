'use client';

import React, { useState } from 'react';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/features/notifications/hooks/useNotifications';
import { NotificationCard } from '@/features/notifications/components/NotificationCard';
import { NotificationType } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  CheckCheck,
  Filter,
  RefreshCw,
  Settings,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const { data: countData } = useUnreadCount();
  const unreadCount = countData?.unreadCount ?? 0;

  const {
    data: notifications = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useNotifications({
    status: statusFilter,
    type: typeFilter !== 'ALL' ? (typeFilter as NotificationType) : undefined,
  });

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time reminders, payment deadlines, subscription renewals, and personal finance alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-sky-600 border-sky-200 hover:bg-sky-50"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark all as read
            </Button>
          )}

          <Link href="/settings">
            <Button variant="outline" size="sm" className="text-xs text-slate-600">
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Preferences
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs text-slate-500"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Category Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          {(['ALL', 'UNREAD', 'READ'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Alerts' : tab === 'UNREAD' ? 'Unread' : 'Archived / Read'}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Categories</option>
            <option value="REMINDER_DUE">Reminders (Due / Upcoming)</option>
            <option value="BILL_DUE">Bills (Due Soon)</option>
            <option value="BILL_OVERDUE">Bills (Overdue)</option>
            <option value="SUBSCRIPTION_RENEWAL">Subscription Renewals</option>
            <option value="TRIAL_ENDING">Trial Alerts</option>
            <option value="BUDGET_WARNING">Budget Alerts</option>
            <option value="SYSTEM">System Notices</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Could not load notifications. Please check backend connection.</span>
        </div>
      )}

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">
            No notifications found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'No notifications match your current filter settings. Try clearing the filter.'
              : 'You are all caught up! You will receive alerts when reminders or bills are approaching.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
