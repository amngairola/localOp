'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExpenseCategory, BudgetStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Target, AlertCircle } from 'lucide-react';

const budgetFormSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().positive('Budget amount must be greater than zero'),
  currency: z.string().trim().min(1),
  category: z.string().optional(),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

interface BudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    month: number;
    year: number;
    amount: number;
    currency: string;
    category?: ExpenseCategory | null;
  }) => void;
  budgetToEdit?: BudgetStatus | null;
  defaultMonth?: number;
  defaultYear?: number;
  isLoading?: boolean;
}

export function BudgetDialog({
  isOpen,
  onClose,
  onSubmit,
  budgetToEdit,
  defaultMonth,
  defaultYear,
  isLoading,
}: BudgetDialogProps) {
  const initialMonth = defaultMonth || 11;
  const initialYear = defaultYear || 2026;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      month: initialMonth,
      year: initialYear,
      amount: 0,
      currency: 'INR',
      category: 'OVERALL',
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    const d = new Date();
    const activeMonth = defaultMonth || d.getMonth() + 1;
    const activeYear = defaultYear || d.getFullYear();

    if (budgetToEdit) {
      reset({
        month: budgetToEdit.month,
        year: budgetToEdit.year,
        amount: Number(budgetToEdit.amount),
        currency: budgetToEdit.currency || 'INR',
        category: budgetToEdit.category || 'OVERALL',
      });
    } else {
      reset({
        month: activeMonth,
        year: activeYear,
        amount: 0,
        currency: 'INR',
        category: 'OVERALL',
      });
    }
  }, [isOpen, budgetToEdit, defaultMonth, defaultYear, reset]);

  if (!isOpen) return null;

  const onFormSubmit = (data: BudgetFormData) => {
    onSubmit({
      month: data.month,
      year: data.year,
      amount: data.amount,
      currency: data.currency,
      category: data.category === 'OVERALL' ? null : (data.category as ExpenseCategory),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {budgetToEdit ? 'Update Monthly Budget' : 'Configure Monthly Budget'}
              </h3>
              <p className="text-xs text-slate-500">Set spending limits to monitor consumption.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Month</label>
              <select
                {...register('month', { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Year</label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Scope / Category</label>
            <select
              {...register('category')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none bg-white"
            >
              <option value="OVERALL">Overall Total Monthly Budget</option>
              <option value="FOOD">Food & Dining</option>
              <option value="GROCERIES">Groceries</option>
              <option value="TRANSPORT">Transportation</option>
              <option value="SHOPPING">Shopping</option>
              <option value="HOUSING">Housing</option>
              <option value="UTILITIES">Utilities</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="EDUCATION">Education</option>
              <option value="TRAVEL">Travel</option>
              <option value="PERSONAL_CARE">Personal Care</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Budget Limit (INR) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="e.g. 25000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
            {errors.amount && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" /> {errors.amount.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              type="submit"
              size="sm"
              disabled={isLoading}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs"
            >
              {isLoading ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
