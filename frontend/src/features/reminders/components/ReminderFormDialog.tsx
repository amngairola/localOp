import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Reminder, Priority, RecurrenceType } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const reminderFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().trim().max(1000).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  dueTime: z.string().min(1, 'Due time is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']),
  recurrenceValue: z.number().int().positive().optional().nullable(),
  notifyBefore: z.number().int().min(0),
});

type ReminderFormData = z.infer<typeof reminderFormSchema>;

interface ReminderFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string | null;
    dueDate: string;
    priority: Priority;
    recurrenceType: RecurrenceType;
    recurrenceValue?: number | null;
    notifyBefore: number;
  }) => void;
  reminderToEdit?: Reminder | null;
  isLoading?: boolean;
}

export function ReminderFormDialog({
  isOpen,
  onClose,
  onSubmit,
  reminderToEdit,
  isLoading,
}: ReminderFormDialogProps) {
  const isEditing = Boolean(reminderToEdit);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      dueTime: '09:00',
      priority: 'MEDIUM',
      recurrenceType: 'NONE',
      recurrenceValue: 1,
      notifyBefore: 60,
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (reminderToEdit) {
      const d = new Date(reminderToEdit.dueDate);
      reset({
        title: reminderToEdit.title,
        description: reminderToEdit.description || '',
        dueDate: format(d, 'yyyy-MM-dd'),
        dueTime: format(d, 'HH:mm'),
        priority: reminderToEdit.priority,
        recurrenceType: reminderToEdit.recurrenceType,
        recurrenceValue: reminderToEdit.recurrenceValue || 1,
        notifyBefore: reminderToEdit.notifyBefore,
      });
    } else {
      const now = new Date();
      reset({
        title: '',
        description: '',
        dueDate: format(now, 'yyyy-MM-dd'),
        dueTime: '09:00',
        priority: 'MEDIUM',
        recurrenceType: 'NONE',
        recurrenceValue: 1,
        notifyBefore: 60,
      });
    }
  }, [reminderToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onFormSubmit = (data: ReminderFormData) => {
    const combinedDate = new Date(`${data.dueDate}T${data.dueTime}:00`);

    onSubmit({
      title: data.title,
      description: data.description ? data.description : null,
      dueDate: combinedDate.toISOString(),
      priority: data.priority as Priority,
      recurrenceType: data.recurrenceType as RecurrenceType,
      recurrenceValue:
        data.recurrenceType !== 'NONE' ? data.recurrenceValue || 1 : null,
      notifyBefore: data.notifyBefore,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Reminder' : 'Create New Reminder'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set schedules, alerts, and recurring cycles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Reminder Title <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g., Pay electricity bill, Passport appointment"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {errors.title && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" /> {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Add extra context or reference numbers"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {errors.dueDate && (
                <p className="text-xs text-rose-500">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                Due Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                {...register('dueTime')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Priority & Recurrence Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Priority</label>
              <select
                {...register('priority')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Repeat</label>
              <select
                {...register('recurrenceType')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              >
                <option value="NONE">Does not repeat</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          {/* Alert Preference */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Notify in Advance
            </label>
            <select
              {...register('notifyBefore', { valueAsNumber: true })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            >
              <option value={15}>15 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
              <option value={1440}>1 day before</option>
              <option value={2880}>2 days before</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-sky-600 hover:bg-sky-700 text-white min-w-[100px]"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Reminder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
