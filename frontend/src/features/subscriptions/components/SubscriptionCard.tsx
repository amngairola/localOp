'use client';

import React, { useState, useEffect } from 'react';
import { Subscription } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  XCircle,
  RotateCw,
  Edit2,
  Trash2,
  ExternalLink,
  CreditCard,
  FilePlus,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (subscription: Subscription) => void;
  onRenew: (id: string) => void;
  onGenerateBill: (id: string) => void;
  isActionLoading?: boolean;
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onCancel,
  onRenew,
  onGenerateBill,
  isActionLoading,
}: SubscriptionCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextRenewalDate = new Date(subscription.nextRenewal);
  const isOverdue =
    mounted &&
    subscription.status === 'ACTIVE' &&
    isPast(nextRenewalDate) &&
    !isToday(nextRenewalDate);

  const daysToRenewal = mounted ? differenceInDays(nextRenewalDate, new Date()) : null;
  const isRenewalSoon =
    mounted &&
    subscription.status === 'ACTIVE' &&
    daysToRenewal !== null &&
    daysToRenewal >= 0 &&
    daysToRenewal <= (subscription.reminderDaysBefore ?? 7);

  // Status badge styling
  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>;
      case 'PAUSED':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Paused</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Expired</Badge>;
      default:
        return <Badge variant="secondary">{subscription.status}</Badge>;
    }
  };

  const getCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'WEEKLY':
        return '/ week';
      case 'MONTHLY':
        return '/ month';
      case 'QUARTERLY':
        return '/ quarter';
      case 'YEARLY':
        return '/ year';
      case 'CUSTOM':
        return 'custom';
      default:
        return '';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-5 space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 text-base truncate">
                {subscription.name}
              </h3>
              {getStatusBadge()}
              {subscription.isTrial && (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 gap-1 text-[10px]">
                  <Sparkles className="h-2.5 w-2.5" />
                  Free Trial
                </Badge>
              )}
            </div>

            {subscription.provider && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {subscription.provider}
              </p>
            )}
          </div>

          {/* Action icon buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600"
              onClick={() => onEdit(subscription)}
              title="Edit Subscription"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-rose-600"
              onClick={() => onDelete(subscription.id)}
              title="Delete Subscription"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Pricing & Normalization */}
        <div className="flex items-baseline justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div>
            <span className="text-xl font-bold text-slate-900">
              ₹{Number(subscription.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500 ml-1">
              {getCycleLabel(subscription.billingCycle)}
            </span>
          </div>

          {subscription.billingCycle !== 'MONTHLY' && subscription.monthlyEquivalentCost && (
            <Badge variant="outline" className="text-[11px] text-slate-600 bg-white">
              ≈ ₹{subscription.monthlyEquivalentCost.toFixed(2)} / mo
            </Badge>
          )}
        </div>

        {/* Key Information & Renewal Date */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Next Renewal:
            </span>
            <span
              className={`font-medium ${
                isOverdue
                  ? 'text-rose-600 font-semibold'
                  : isRenewalSoon
                  ? 'text-amber-600 font-semibold'
                  : 'text-slate-800'
              }`}
            >
              {mounted ? format(nextRenewalDate, 'MMM d, yyyy') : 'Loading...'}
            </span>
          </div>

          {/* Overdue / Renewal Soon Alert Pills */}
          {isOverdue && (
            <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium pt-0.5">
              <AlertTriangle className="h-3 w-3" />
              Renewal overdue! Service may lapse.
            </div>
          )}

          {isRenewalSoon && !isOverdue && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium pt-0.5">
              <Clock className="h-3 w-3" />
              Renewing in {daysToRenewal} day{daysToRenewal === 1 ? '' : 's'}
            </div>
          )}

          {/* Payment Method / Category Row */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            {subscription.paymentMethod ? (
              <span className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-slate-400" />
                {subscription.paymentMethod}
              </span>
            ) : (
              <span>Payment: Not specified</span>
            )}

            {subscription.category && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                {subscription.category}
              </Badge>
            )}
          </div>

          {/* Website Link */}
          {subscription.websiteUrl && (
            <div className="pt-1">
              <a
                href={subscription.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 underline"
              >
                Manage service on provider portal
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {subscription.status === 'ACTIVE' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => onRenew(subscription.id)}
                  disabled={isActionLoading}
                  title="Advance next renewal cycle"
                >
                  <RotateCw className="h-3.5 w-3.5 text-sky-600" />
                  Renew
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => onPause(subscription.id)}
                  disabled={isActionLoading}
                >
                  <Pause className="h-3.5 w-3.5 text-amber-600" />
                  Pause
                </Button>
              </>
            )}

            {subscription.status === 'PAUSED' && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => onResume(subscription.id)}
                disabled={isActionLoading}
              >
                <Play className="h-3.5 w-3.5 text-emerald-600" />
                Resume
              </Button>
            )}

            {subscription.status !== 'CANCELLED' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs gap-1 text-slate-500 hover:text-rose-600"
                onClick={() => onCancel(subscription)}
                disabled={isActionLoading}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>

          {/* Generate Bill Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1 text-slate-600 hover:text-sky-600 ml-auto"
            onClick={() => onGenerateBill(subscription.id)}
            disabled={isActionLoading}
            title="Create an invoice/bill entry for this renewal in your ledger"
          >
            <FilePlus className="h-3.5 w-3.5" />
            Create Bill
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
