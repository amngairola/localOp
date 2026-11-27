'use client';

import React, { useState, useEffect } from 'react';
import { Expense } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CreditCard,
  Tag,
  Paperclip,
  ExternalLink,
  Edit2,
  Trash2,
  Store,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { expensesApi } from '../api/expenses.api';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  isLoading,
}: ExpenseCardProps) {
  const [mounted, setMounted] = useState(false);
  const [openingReceipt, setOpeningReceipt] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenReceipt = async () => {
    if (expense.signedReceiptUrl) {
      window.open(expense.signedReceiptUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      setOpeningReceipt(true);
      const url = await expensesApi.getReceiptUrl(expense.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      alert(err.message || 'Failed to open receipt');
    } finally {
      setOpeningReceipt(false);
    }
  };

  const formattedDate = mounted
    ? format(new Date(expense.date), 'MMM d, yyyy')
    : 'Loading...';

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 space-y-3">
        {/* Header: Title, Merchant, and Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm truncate">
              {expense.title}
            </h3>
            {expense.merchant && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Store className="h-3 w-3 text-slate-400" />
                {expense.merchant}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="text-base font-bold text-slate-900">
              ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 justify-end">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Badges: Category & Payment Method */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[11px] font-medium bg-slate-100 text-slate-700">
            {expense.category.replace('_', ' ')}
          </Badge>

          {expense.paymentMethod && (
            <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 gap-1">
              <CreditCard className="h-2.5 w-2.5" />
              {expense.paymentMethod.replace('_', ' ')}
            </Badge>
          )}

          {expense.receiptPath && (
            <button
              onClick={handleOpenReceipt}
              disabled={openingReceipt}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 hover:text-sky-700 underline"
            >
              <Paperclip className="h-3 w-3" />
              {openingReceipt ? 'Loading...' : 'Receipt'}
              <ExternalLink className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        {/* Notes & Description */}
        {expense.notes && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
            {expense.notes}
          </p>
        )}

        {/* Tags */}
        {expense.tags && expense.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <Tag className="h-3 w-3 text-slate-400" />
            {expense.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(expense)}
            disabled={isLoading}
            className="h-7 text-xs text-slate-500 hover:text-slate-800 gap-1"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(expense.id)}
            disabled={isLoading}
            className="h-7 text-xs text-rose-500 hover:text-rose-700 gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
