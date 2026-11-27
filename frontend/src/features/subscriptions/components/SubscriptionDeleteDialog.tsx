'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';

interface SubscriptionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SubscriptionDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SubscriptionDeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">Delete Subscription</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="py-4 text-sm text-slate-600">
          Are you sure you want to delete this subscription? This will permanently remove its tracking history and reminder configuration.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
          >
            {isLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </div>
      </div>
    </div>
  );
}
