'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Expense, ExpenseCategory, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Calendar, Upload, AlertCircle, DollarSign, Store, Tag } from 'lucide-react';
import { format } from 'date-fns';

const expenseFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  merchant: z.string().trim().max(255).optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().trim().min(1),
  date: z.string().min(1, 'Transaction date is required'),
  category: z.enum([
    'FOOD',
    'GROCERIES',
    'TRANSPORT',
    'HOUSING',
    'UTILITIES',
    'ENTERTAINMENT',
    'HEALTHCARE',
    'EDUCATION',
    'SHOPPING',
    'RENT',
    'INSURANCE',
    'SAVINGS',
    'INVESTMENT',
    'PERSONAL',
    'PERSONAL_CARE',
    'TRAVEL',
    'OTHER',
  ]),
  paymentMethod: z
    .enum([
      'CASH',
      'CREDIT_CARD',
      'DEBIT_CARD',
      'UPI',
      'NET_BANKING',
      'WALLET',
      'OTHER',
    ])
    .optional()
    .nullable(),
  tags: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    merchant?: string | null;
    amount: number;
    currency: string;
    date: string;
    category: ExpenseCategory;
    paymentMethod?: PaymentMethod | null;
    tags?: string[];
    notes?: string | null;
    file?: File;
  }) => void;
  expenseToEdit?: Expense | null;
  isLoading?: boolean;
}

export function ExpenseFormDialog({
  isOpen,
  onClose,
  onSubmit,
  expenseToEdit,
  isLoading,
}: ExpenseFormDialogProps) {
  const isEditing = Boolean(expenseToEdit);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: '',
      merchant: '',
      amount: 0,
      currency: 'INR',
      date: '',
      category: 'FOOD',
      paymentMethod: 'UPI',
      tags: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    setSelectedFile(null);

    if (expenseToEdit) {
      const dateFormatted = format(new Date(expenseToEdit.date), 'yyyy-MM-dd');
      reset({
        title: expenseToEdit.title,
        merchant: expenseToEdit.merchant || '',
        amount: Number(expenseToEdit.amount),
        currency: expenseToEdit.currency || 'INR',
        date: dateFormatted,
        category: expenseToEdit.category,
        paymentMethod: expenseToEdit.paymentMethod,
        tags: expenseToEdit.tags ? expenseToEdit.tags.join(', ') : '',
        notes: expenseToEdit.notes || '',
      });
    } else {
      const todayFormatted = format(new Date(), 'yyyy-MM-dd');
      reset({
        title: '',
        merchant: '',
        amount: 0,
        currency: 'INR',
        date: todayFormatted,
        category: 'FOOD',
        paymentMethod: 'UPI',
        tags: '',
        notes: '',
      });
    }
  }, [isOpen, expenseToEdit, reset]);

  if (!isOpen) return null;

  const onFormSubmit = (data: ExpenseFormData) => {
    const dateIso = new Date(`${data.date}T12:00:00Z`).toISOString();
    const tagList = data.tags
      ? data.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    onSubmit({
      title: data.title,
      merchant: data.merchant ? data.merchant : null,
      amount: data.amount,
      currency: data.currency,
      date: dateIso,
      category: data.category as ExpenseCategory,
      paymentMethod: data.paymentMethod ? (data.paymentMethod as PaymentMethod) : null,
      tags: tagList,
      notes: data.notes ? data.notes : null,
      file: selectedFile || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Expense' : 'Log New Expense'}
              </h2>
              <p className="text-xs text-slate-500">Record a purchase or personal expenditure.</p>
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
              Title / Item <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Lunch at Cafe, Uber ride, Grocery run"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.title && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" /> {errors.title.message}
              </p>
            )}
          </div>

          {/* Merchant & Amount Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Merchant / Payee</label>
              <input
                {...register('merchant')}
                placeholder="e.g. Starbuck, Shell, Amazon"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.amount && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> {errors.amount.message}
                </p>
              )}
            </div>
          </div>

          {/* Category & Payment Method Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                {...register('category')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
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
                <option value="RENT">Rent</option>
                <option value="INSURANCE">Insurance</option>
                <option value="SAVINGS">Savings</option>
                <option value="INVESTMENT">Investment</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Method</label>
              <select
                {...register('paymentMethod')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CASH">Cash</option>
                <option value="WALLET">Wallet</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Date & Tags Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.date && (
                <p className="text-xs text-rose-500">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Tag className="h-3 w-3 text-slate-400" />
                Tags (Comma separated)
              </label>
              <input
                {...register('tags')}
                placeholder="lunch, client, weekend"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Upload className="h-3 w-3 text-slate-400" />
              Receipt Attachment (PDF, PNG, JPG)
            </label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Notes (Optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Add memo or itemized details..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              {isLoading
                ? 'Saving...'
                : isEditing
                ? 'Update Expense'
                : 'Save Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
