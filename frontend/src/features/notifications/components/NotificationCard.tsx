'use client';

import React from 'react';
import Link from 'next/link';
import { AppNotification, NotificationType, NotificationPriority } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Receipt,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NotificationCardProps {
  notification: AppNotification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'REMINDER_DUE':
    case 'REMINDER_UPCOMING':
      return <Bell className="w-4 h-4 text-sky-600" />;
    case 'BILL_DUE':
      return <Receipt className="w-4 h-4 text-amber-600" />;
    case 'BILL_OVERDUE':
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    case 'SUBSCRIPTION_RENEWAL':
      return <CreditCard className="w-4 h-4 text-purple-600" />;
    case 'TRIAL_ENDING':
      return <Clock className="w-4 h-4 text-indigo-600" />;
    case 'BUDGET_WARNING':
      return <DollarSign className="w-4 h-4 text-amber-600" />;
    case 'BUDGET_EXCEEDED':
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    case 'SYSTEM':
    default:
      return <Info className="w-4 h-4 text-slate-500" />;
  }
}

export function getPriorityBadge(priority: NotificationPriority) {
  switch (priority) {
    case 'URGENT':
      return <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] px-1.5 py-0">URGENT</Badge>;
    case 'HIGH':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">HIGH</Badge>;
    case 'NORMAL':
      return <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] px-1.5 py-0">NORMAL</Badge>;
    case 'LOW':
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0">LOW</Badge>;
  }
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationCardProps) {
  const isUnread = notification.status === 'UNREAD';

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true });
    } catch {
      return 'recently';
    }
  })();

  const content = (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h4 className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'} truncate`}>
          {notification.title}
        </h4>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {getPriorityBadge(notification.priority)}
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-sky-600 block" title="Unread" />
          )}
        </div>
      </div>
      <p className="text-xs text-slate-600 line-clamp-2 mb-1.5 leading-relaxed">
        {notification.body}
      </p>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{timeAgo}</span>
        {notification.link && (
          <span className="flex items-center space-x-1 text-sky-600 font-medium">
            <span>View record</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        isUnread
          ? 'bg-sky-50/40 border-sky-200 hover:bg-sky-50/70 shadow-xs'
          : 'bg-white border-slate-200 hover:border-slate-300'
      } flex items-start space-x-3 group`}
    >
      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>

      {notification.link ? (
        <Link href={notification.link} className="flex-1 min-w-0" onClick={() => {
          if (isUnread && onMarkAsRead) onMarkAsRead(notification.id);
        }}>
          {content}
        </Link>
      ) : (
        content
      )}

      {/* Action buttons */}
      <div className="flex items-center space-x-1 flex-shrink-0 pt-0.5">
        {isUnread && onMarkAsRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Mark as read"
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && !compact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            title="Delete notification"
            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
