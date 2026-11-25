'use client';

import React, { useState, useMemo } from 'react';
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useCompleteReminder,
  useDeleteReminder,
} from '@/features/reminders/hooks/useReminders';
import { ReminderCard } from '@/features/reminders/components/ReminderCard';
import { ReminderFormDialog } from '@/features/reminders/components/ReminderFormDialog';
import { ReminderDeleteDialog } from '@/features/reminders/components/ReminderDeleteDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reminder, Priority, ReminderStatus } from '@/types';
import {
  Bell,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function RemindersPage() {
  // Query parameters state
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReminderStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);

  // TanStack Query hooks
  const { data: reminders = [], isLoading, isError, error, refetch } = useReminders({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
    search: searchQuery ? searchQuery : undefined,
  });

  const createMutation = useCreateReminder();
  const updateMutation = useUpdateReminder();
  const completeMutation = useCompleteReminder();
  const deleteMutation = useDeleteReminder();

  // Handlers
  const handleOpenCreate = () => {
    setReminderToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (reminder: Reminder) => {
    setReminderToEdit(reminder);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: {
    title: string;
    description?: string | null;
    dueDate: string;
    priority: Priority;
    recurrenceType: any;
    recurrenceValue?: number | null;
    notifyBefore: number;
  }) => {
    try {
      if (reminderToEdit) {
        await updateMutation.mutateAsync({
          id: reminderToEdit.id,
          payload: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsFormOpen(false);
      setReminderToEdit(null);
    } catch (err) {
      console.error('Failed to save reminder:', err);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to complete reminder:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!reminderToDelete) return;
    try {
      await deleteMutation.mutateAsync(reminderToDelete.id);
      setReminderToDelete(null);
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  // Metrics summary
  const pendingCount = useMemo(
    () => reminders.filter((r) => r.status === 'PENDING').length,
    [reminders]
  );
  const completedCount = useMemo(
    () => reminders.filter((r) => r.status === 'COMPLETED').length,
    [reminders]
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-sky-600" />
            Reminders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal deadlines, appointments, and recurring schedules.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Reminder
        </Button>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reminders by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            {(['ALL', 'PENDING', 'COMPLETED', 'OVERDUE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* ── Content States ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-rose-900">
            Failed to load reminders
          </h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'An error occurred while connecting to the API.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="bg-white border-rose-200 text-rose-700 gap-1.5 text-xs hover:bg-rose-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : reminders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Bell className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No reminders found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'No reminders match your current filters. Try resetting search or filter criteria.'
                : 'You have no scheduled reminders yet. Add your first reminder to stay ahead of upcoming responsibilities.'}
            </p>
          </div>
          <div>
            <Button
              onClick={handleOpenCreate}
              className="bg-sky-600 hover:bg-sky-700 text-white gap-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Your First Reminder
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={handleComplete}
              onEdit={handleOpenEdit}
              onDelete={(id) => setReminderToDelete(reminder)}
              isCompleting={completeMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <ReminderFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setReminderToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        reminderToEdit={reminderToEdit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ReminderDeleteDialog
        isOpen={Boolean(reminderToDelete)}
        onClose={() => setReminderToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={reminderToDelete?.title || ''}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
