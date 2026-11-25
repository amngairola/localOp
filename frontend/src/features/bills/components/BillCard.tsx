'use client';

import React, { useState, useEffect } from 'react';
import { Bill } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Repeat,
  AlertTriangle,
  Receipt,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { billsApi } from '../api/bills.api';

interface BillCardProps {
  bill: Bill;
  onMarkPaid: (id: string) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  isMarkingPaid?: boolean;
}

export function BillCard({
  bill,
  onMarkPaid,
  onEdit,
  onDelete,
  isMarkingPaid,
}: BillCardProps) {
  const [mounted, setMounted] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dueDate = new Date(bill.dueDate);
  const isOverdue =
    mounted && bill.status === 'UNPAID' && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = mounted && bill.status === 'UNPAID' && isToday(dueDate);

  const handleDownloadAttachment = async () => {
    if (bill.signedUrl) {
      window.open(bill.signedUrl, '_blank');
      return;
    }
    if (bill.attachmentUrl) {
      window.open(bill.attachmentUrl, '_blank');
      return;
    }
    if (bill.attachmentPath) {
      try {
        setDownloadingUrl(true);
        const signedUrl = await billsApi.getAttachmentSignedUrl(bill.id);
        window.open(signedUrl, '_blank');
      } catch (err) {
        console.error('Failed to get attachment URL:', err);
      } finally {
        setDownloadingUrl(false);
      }
    }
  };

  return (
    <Card
      className={`transition-all hover:shadow-md border-l-4 ${
        bill.status === 'PAID'
          ? 'border-l-emerald-500 opacity-80'
          : isOverdue
          ? 'border-l-rose-500'
          : isDueToday
          ? 'border-l-amber-500'
          : 'border-l-sky-500'
      }`}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-semibold text-base text-slate-900 truncate ${
                  bill.status === 'PAID' ? 'text-slate-600' : ''
                }`}
              >
                {bill.title}
              </h3>
              <Badge variant="outline" className="text-xs font-medium">
                {bill.category}
              </Badge>
              {bill.status === 'PAID' ? (
                <Badge variant="success" className="gap-1 text-[11px]">
                  <CheckCircle2 className="h-3 w-3" />
                  Paid
                </Badge>
              ) : isOverdue ? (
                <Badge variant="destructive" className="gap-1 text-[11px]">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[11px]">
                  Unpaid
                </Badge>
              )}
            </div>

            {bill.provider && (
              <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                Provider: <span className="text-slate-700">{bill.provider}</span>
                {bill.invoiceNumber && (
                  <span className="text-slate-400">· #{bill.invoiceNumber}</span>
                )}
              </p>
            )}

            {(bill.description || bill.notes) && (
              <p className="text-xs text-slate-500 line-clamp-1 italic">
                {bill.description || bill.notes}
              </p>
            )}
          </div>

          {/* Amount Display */}
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-slate-900">
              {bill.currency === 'INR' ? '₹' : bill.currency + ' '}
              {Number(bill.amount).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            {bill.isRecurring && bill.billingCycle && (
              <span className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                <Repeat className="h-3 w-3 text-sky-600" />
                {bill.billingCycle.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* Due Date & Attachment Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 font-medium ${
                bill.status === 'PAID'
                  ? 'text-slate-600'
                  : isOverdue
                  ? 'text-rose-600'
                  : isDueToday
                  ? 'text-amber-700'
                  : 'text-slate-600'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {bill.status === 'PAID' && bill.paymentDate ? (
                <span>Paid on {mounted ? format(new Date(bill.paymentDate), 'PP') : ''}</span>
              ) : (
                <span>Due: {mounted ? format(dueDate, 'PP') : ''}</span>
              )}
            </span>

            {(bill.attachmentPath || bill.attachmentUrl) && (
              <button
                onClick={handleDownloadAttachment}
                disabled={downloadingUrl}
                className="flex items-center gap-1 text-sky-600 hover:text-sky-800 hover:underline font-medium"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Invoice</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {bill.status !== 'PAID' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkPaid(bill.id)}
                disabled={isMarkingPaid}
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 gap-1 text-xs h-7 px-2.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Paid
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(bill)}
              className="h-7 w-7 text-slate-500 hover:text-slate-900"
              title="Edit Bill"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(bill.id)}
              className="h-7 w-7 text-slate-500 hover:text-rose-600"
              title="Delete Bill"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
