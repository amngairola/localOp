'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Subscription, BillingCycle, SubscriptionStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Calendar, AlertCircle, CreditCard, Sparkles, Globe } from 'lucide-react';
import { format } from 'date-fns';

const subscriptionFormSchema = z.object({
  name: z.string().trim().min(1, 'Subscription name is required').max(255),
  provider: z.string().trim().max(255).optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().trim().min(1),
  billingCycle: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  startDate: z.string().min(1, 'Start date is required'),
  nextRenewal: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED']),
  category: z.string().trim().max(100).optional(),
  paymentMethod: z.string().trim().max(100).optional(),
  websiteUrl: z.string().trim().max(500).optional(),
  isTrial: z.boolean(),
  trialStartDate: z.string().optional(),
  trialEndDate: z.string().optional(),
  reminderDaysBefore: z.number().int().min(0).max(60),
  description: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    provider?: string | null;
    amount: number;
    currency: string;
    billingCycle: BillingCycle;
    startDate: string;
    nextRenewal?: string;
    status: SubscriptionStatus;
    category?: string | null;
    paymentMethod?: string | null;
    websiteUrl?: string | null;
    isTrial: boolean;
    trialStartDate?: string | null;
    trialEndDate?: string | null;
    reminderDaysBefore?: number;
    description?: string | null;
    notes?: string | null;
  }) => void;
  subscriptionToEdit?: Subscription | null;
  isLoading?: boolean;
}

export function SubscriptionFormDialog({
  isOpen,
  onClose,
  onSubmit,
  subscriptionToEdit,
  isLoading,
}: SubscriptionFormDialogProps) {
  const isEditing = Boolean(subscriptionToEdit);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      name: '',
      provider: '',
      amount: 0,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      startDate: '',
      nextRenewal: '',
      status: 'ACTIVE',
      category: 'ENTERTAINMENT',
      paymentMethod: '',
      websiteUrl: '',
      isTrial: false,
      trialStartDate: '',
      trialEndDate: '',
      reminderDaysBefore: 3,
      description: '',
      notes: '',
    },
  });

  const isTrial = watch('isTrial');

  useEffect(() => {
    if (!isOpen) return;

    if (subscriptionToEdit) {
      const startDateFormatted = format(new Date(subscriptionToEdit.startDate), 'yyyy-MM-dd');
      const nextRenewalFormatted = subscriptionToEdit.nextRenewal
        ? format(new Date(subscriptionToEdit.nextRenewal), 'yyyy-MM-dd')
        : '';
      const trialStartFormatted = subscriptionToEdit.trialStartDate
        ? format(new Date(subscriptionToEdit.trialStartDate), 'yyyy-MM-dd')
        : '';
      const trialEndFormatted = subscriptionToEdit.trialEndDate
        ? format(new Date(subscriptionToEdit.trialEndDate), 'yyyy-MM-dd')
        : '';

      reset({
        name: subscriptionToEdit.name,
        provider: subscriptionToEdit.provider || '',
        amount: Number(subscriptionToEdit.amount),
        currency: subscriptionToEdit.currency || 'INR',
        billingCycle: subscriptionToEdit.billingCycle,
        startDate: startDateFormatted,
        nextRenewal: nextRenewalFormatted,
        status: subscriptionToEdit.status,
        category: subscriptionToEdit.category || 'ENTERTAINMENT',
        paymentMethod: subscriptionToEdit.paymentMethod || '',
        websiteUrl: subscriptionToEdit.websiteUrl || '',
        isTrial: Boolean(subscriptionToEdit.isTrial),
        trialStartDate: trialStartFormatted,
        trialEndDate: trialEndFormatted,
        reminderDaysBefore: subscriptionToEdit.reminderDaysBefore ?? 3,
        description: subscriptionToEdit.description || '',
        notes: subscriptionToEdit.notes || '',
      });
    } else {
      const todayFormatted = format(new Date(), 'yyyy-MM-dd');
      reset({
        name: '',
        provider: '',
        amount: 0,
        currency: 'INR',
        billingCycle: 'MONTHLY',
        startDate: todayFormatted,
        nextRenewal: '',
        status: 'ACTIVE',
        category: 'ENTERTAINMENT',
        paymentMethod: '',
        websiteUrl: '',
        isTrial: false,
        trialStartDate: '',
        trialEndDate: '',
        reminderDaysBefore: 3,
        description: '',
        notes: '',
      });
    }
  }, [isOpen, subscriptionToEdit, reset]);

  if (!isOpen) return null;

  const onFormSubmit = (data: SubscriptionFormData) => {
    const startDateIso = new Date(`${data.startDate}T00:00:00Z`).toISOString();
    const nextRenewalIso = data.nextRenewal
      ? new Date(`${data.nextRenewal}T00:00:00Z`).toISOString()
      : undefined;
    const trialStartIso = data.trialStartDate
      ? new Date(`${data.trialStartDate}T00:00:00Z`).toISOString()
      : null;
    const trialEndIso = data.trialEndDate
      ? new Date(`${data.trialEndDate}T00:00:00Z`).toISOString()
      : null;

    onSubmit({
      name: data.name,
      provider: data.provider ? data.provider : null,
      amount: data.amount,
      currency: data.currency,
      billingCycle: data.billingCycle as BillingCycle,
      startDate: startDateIso,
      nextRenewal: nextRenewalIso,
      status: data.status as SubscriptionStatus,
      category: data.category ? data.category : null,
      paymentMethod: data.paymentMethod ? data.paymentMethod : null,
      websiteUrl: data.websiteUrl ? data.websiteUrl : null,
      isTrial: data.isTrial,
      trialStartDate: trialStartIso,
      trialEndDate: trialEndIso,
      reminderDaysBefore: data.reminderDaysBefore,
      description: data.description ? data.description : null,
      notes: data.notes ? data.notes : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Subscription' : 'Add Subscription'}
              </h2>
              <p className="text-xs text-slate-500">Track recurring services, renewals, and trials.</p>
            </div>
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
          {/* Service Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Subscription Name <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Netflix, Spotify Premium, Google Workspace"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {errors.name && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" /> {errors.name.message}
              </p>
            )}
          </div>

          {/* Provider & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Provider / Company</label>
              <input
                {...register('provider')}
                placeholder="e.g. Netflix Inc, Apple, AWS"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                {...register('category')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="ENTERTAINMENT">Entertainment & Streaming</option>
                <option value="SOFTWARE">Software & Cloud</option>
                <option value="PRODUCTIVITY">Productivity & Tools</option>
                <option value="FITNESS">Fitness & Health</option>
                <option value="UTILITIES">Utilities & Telecom</option>
                <option value="EDUCATION">Education & Learning</option>
                <option value="FINANCE">Finance & Banking</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Amount & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {errors.amount && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Billing Cycle</label>
              <select
                {...register('billingCycle')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="QUARTERLY">Quarterly (3 months)</option>
                <option value="WEEKLY">Weekly</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>

          {/* Start Date & Next Renewal Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {errors.startDate && (
                <p className="text-xs text-rose-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Next Renewal (Optional)
              </label>
              <input
                type="date"
                {...register('nextRenewal')}
                placeholder="Auto-calculated if blank"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Payment Method & Website URL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Method Label</label>
              <input
                {...register('paymentMethod')}
                placeholder="e.g. HDFC Credit Card, UPI"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Globe className="h-3 w-3 text-slate-400" />
                Management URL
              </label>
              <input
                {...register('websiteUrl')}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Trial Toggle & Dates */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                This is a Free Trial
              </label>
              <input
                type="checkbox"
                {...register('isTrial')}
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
            </div>

            {isTrial && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Trial Start</label>
                  <input
                    type="date"
                    {...register('trialStartDate')}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Trial End</label>
                  <input
                    type="date"
                    {...register('trialEndDate')}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reminder Preferences */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Notify Before Renewal
            </label>
            <select
              {...register('reminderDaysBefore', { valueAsNumber: true })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
            >
              <option value={1}>1 day before renewal</option>
              <option value={3}>3 days before renewal</option>
              <option value={7}>7 days before renewal</option>
              <option value={14}>14 days before renewal</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Notes (Optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="e.g. Login email or cancellation conditions"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              {isLoading
                ? 'Saving...'
                : isEditing
                ? 'Update Subscription'
                : 'Save Subscription'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
