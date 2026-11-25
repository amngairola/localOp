import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface BillDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading?: boolean;
}

export function BillDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  isLoading,
}: BillDeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-3 text-rose-600">
          <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delete Bill</h3>
            <p className="text-xs text-slate-500">
              This will remove the bill record and any attached invoice file.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900">&ldquo;{title}&rdquo;</span>?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
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
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? 'Deleting...' : 'Delete Bill'}
          </Button>
        </div>
      </div>
    </div>
  );
}
