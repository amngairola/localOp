'use client';

import React, { useState } from 'react';
import { Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, XCircle } from 'lucide-react';

interface SubscriptionCancelDialogProps {
  isOpen: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onConfirm: (id: string, reason?: string) => void;
  isLoading?: boolean;
}

export function SubscriptionCancelDialog({
  isOpen,
  subscription,
  onClose,
  onConfirm,
  isLoading,
}: SubscriptionCancelDialogProps) {
  const [reason, setReason] = useState('');

  if (!isOpen || !subscription) return null;

  const handleConfirm = () => {
    onConfirm(subscription.id, reason.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600">
            <XCircle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">Cancel Subscription</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-sm text-slate-600">
          <p>
            Are you sure you want to mark <span className="font-semibold text-slate-900">{subscription.name}</span> as cancelled?
          </p>

          <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              This will pause reminders and record the cancellation date in your financial history. Remember to cancel on the provider&apos;s website as well.
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Reason for Cancellation (Optional)
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Too expensive, switched to alternative, rarely used"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            Keep Subscription
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
          >
            {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
