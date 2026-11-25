import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bill, BillCategory, BillingCycle } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Calendar, Upload, AlertCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';

const billFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  provider: z.string().trim().max(255).optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().trim().min(1),
  dueDate: z.string().min(1, 'Due date is required'),
  category: z.enum([
    'UTILITIES',
    'RENT',
    'INSURANCE',
    'INTERNET',
    'PHONE',
    'MEDICAL',
    'EDUCATION',
    'ENTERTAINMENT',
    'FOOD',
    'TRANSPORT',
    'SHOPPING',
    'OTHER',
  ]),
  isRecurring: z.boolean(),
  billingCycle: z
    .enum(['MONTHLY', 'YEARLY', 'QUARTERLY', 'WEEKLY', 'CUSTOM'])
    .optional()
    .nullable(),
  invoiceNumber: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
});

type BillFormData = z.infer<typeof billFormSchema>;

interface BillFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string | null;
    provider?: string | null;
    amount: number;
    currency: string;
    dueDate: string;
    category: BillCategory;
    isRecurring: boolean;
    billingCycle?: BillingCycle | null;
    invoiceNumber?: string | null;
    file?: File;
  }) => void;
  billToEdit?: Bill | null;
  isLoading?: boolean;
}

export function BillFormDialog({
  isOpen,
  onClose,
  onSubmit,
  billToEdit,
  isLoading,
}: BillFormDialogProps) {
  const isEditing = Boolean(billToEdit);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      title: '',
      provider: '',
      amount: 0,
      currency: 'INR',
      dueDate: '',
      category: 'UTILITIES',
      isRecurring: false,
      billingCycle: 'MONTHLY',
      invoiceNumber: '',
      description: '',
    },
  });

  const isRecurring = watch('isRecurring');

  useEffect(() => {
    if (!isOpen) return;

    setSelectedFile(null);

    if (billToEdit) {
      const d = new Date(billToEdit.dueDate);
      reset({
        title: billToEdit.title,
        provider: billToEdit.provider || '',
        amount: Number(billToEdit.amount),
        currency: billToEdit.currency || 'INR',
        dueDate: format(d, 'yyyy-MM-dd'),
        category: billToEdit.category,
        isRecurring: Boolean(billToEdit.isRecurring),
        billingCycle: billToEdit.billingCycle || 'MONTHLY',
        invoiceNumber: billToEdit.invoiceNumber || '',
        description: billToEdit.description || billToEdit.notes || '',
      });
    } else {
      const now = new Date();
      reset({
        title: '',
        provider: '',
        amount: 0,
        currency: 'INR',
        dueDate: format(now, 'yyyy-MM-dd'),
        category: 'UTILITIES',
        isRecurring: false,
        billingCycle: 'MONTHLY',
        invoiceNumber: '',
        description: '',
      });
    }
  }, [billToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onFormSubmit = (data: BillFormData) => {
    const dueDateIso = new Date(`${data.dueDate}T09:00:00`).toISOString();

    onSubmit({
      title: data.title,
      description: data.description ? data.description : null,
      provider: data.provider ? data.provider : null,
      amount: data.amount,
      currency: data.currency,
      dueDate: dueDateIso,
      category: data.category as BillCategory,
      isRecurring: data.isRecurring,
      billingCycle: data.isRecurring ? (data.billingCycle as BillingCycle) : null,
      invoiceNumber: data.invoiceNumber ? data.invoiceNumber : null,
      file: selectedFile || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Bill / Invoice' : 'Add New Bill / Invoice'}
              </h2>
              <p className="text-xs text-slate-500">Record recurring or one-time payments.</p>
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
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Bill Title <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Electricity Bill, High Speed Fiber, Health Insurance"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {errors.title && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" /> {errors.title.message}
              </p>
            )}
          </div>

          {/* Provider & Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Provider / Vendor</label>
              <input
                {...register('provider')}
                placeholder="e.g. BESCOM, Airtel, HDFC"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                {...register('category')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              >
                <option value="UTILITIES">Utilities</option>
                <option value="RENT">Rent</option>
                <option value="INTERNET">Internet</option>
                <option value="PHONE">Phone / Mobile</option>
                <option value="INSURANCE">Insurance</option>
                <option value="MEDICAL">Medical</option>
                <option value="EDUCATION">Education</option>
                <option value="ENTERTAINMENT">Entertainment</option>
                <option value="FOOD">Food & Groceries</option>
                <option value="TRANSPORT">Transport</option>
                <option value="SHOPPING">Shopping</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Amount & Due Date Row */}
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {errors.amount && (
                <p className="text-xs text-rose-500">{errors.amount.message}</p>
              )}
            </div>

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
          </div>

          {/* Recurring Option */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                {...register('isRecurring')}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="isRecurring" className="text-xs font-semibold text-slate-800 cursor-pointer">
                This is a recurring bill
              </label>
            </div>

            {isRecurring && (
              <div className="pt-2">
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Billing Frequency
                </label>
                <select
                  {...register('billingCycle')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  When marked as paid, LifeOps automatically schedules the next period&apos;s bill.
                </p>
              </div>
            )}
          </div>

          {/* Invoice Number & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Invoice # (Optional)</label>
              <input
                {...register('invoiceNumber')}
                placeholder="e.g. INV-2026-901"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notes (Optional)</label>
              <input
                {...register('description')}
                placeholder="e.g. Consumer ID: 884729"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Invoice File Attachment */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              Attach Invoice PDF or Image (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
            {selectedFile && (
              <p className="text-xs text-emerald-600 font-medium">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
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
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
