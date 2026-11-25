'use client';

import React, { useState, useEffect } from 'react';
import { Reminder, Priority, ReminderStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  Repeat,
  AlertTriangle,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  isCompleting?: boolean;
}

export function ReminderCard({
  reminder,
  onComplete,
  onEdit,
  onDelete,
  isCompleting,
}: ReminderCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dueDate = new Date(reminder.dueDate);
  const isOverdue =
    mounted && reminder.status === 'PENDING' && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = mounted && reminder.status === 'PENDING' && isToday(dueDate);

  const getPriorityVariant = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return 'urgent';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'outline';
    }
  };

  return (
    <Card
      className={`transition-all hover:shadow-md border-l-4 ${
        reminder.status === 'COMPLETED'
          ? 'border-l-emerald-500 opacity-75'
          : isOverdue
          ? 'border-l-rose-500'
          : isDueToday
          ? 'border-l-amber-500'
          : 'border-l-sky-500'
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Main Info */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-semibold text-base text-slate-900 truncate ${
                  reminder.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                }`}
              >
                {reminder.title}
              </h3>
              <Badge variant={getPriorityVariant(reminder.priority)}>
                {reminder.priority}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="gap-1 text-[11px]">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
              {isDueToday && (
                <Badge variant="warning" className="text-[11px]">
                  Due Today
                </Badge>
              )}
            </div>

            {reminder.description && (
              <p className="text-sm text-slate-500 line-clamp-2">
                {reminder.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
              <span
                className={`flex items-center gap-1.5 font-medium ${
                  isOverdue
                    ? 'text-rose-600'
                    : isDueToday
                    ? 'text-amber-700'
                    : 'text-slate-600'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                {mounted ? format(dueDate, 'PPP') : 'Scheduled date'}
              </span>

              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {mounted ? format(dueDate, 'p') : '09:00 AM'}
              </span>

              {reminder.recurrenceType !== 'NONE' && (
                <span className="flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-medium text-[11px]">
                  <Repeat className="h-3 w-3" />
                  {reminder.recurrenceType}
                  {reminder.recurrenceValue && reminder.recurrenceValue > 1
                    ? ` (${reminder.recurrenceValue})`
                    : ''}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 self-start">
            {reminder.status !== 'COMPLETED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onComplete(reminder.id)}
                disabled={isCompleting}
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 gap-1 text-xs h-8"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(reminder)}
              className="h-8 w-8 text-slate-500 hover:text-slate-900"
              title="Edit Reminder"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(reminder.id)}
              className="h-8 w-8 text-slate-500 hover:text-rose-600"
              title="Delete Reminder"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
