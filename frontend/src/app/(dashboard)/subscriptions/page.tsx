'use client';

import React, { useState } from 'react';
import {
  useSubscriptions,
  useSubscriptionSummary,
  useCreateSubscription,
  useUpdateSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
  useRenewSubscription,
  useDeleteSubscription,
  useGenerateBillFromSubscription,
} from '@/features/subscriptions/hooks/useSubscriptions';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import { SubscriptionFormDialog } from '@/features/subscriptions/components/SubscriptionFormDialog';
import { SubscriptionCancelDialog } from '@/features/subscriptions/components/SubscriptionCancelDialog';
import { SubscriptionDeleteDialog } from '@/features/subscriptions/components/SubscriptionDeleteDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  Plus,
  Search,
  RotateCw,
  Sparkles,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Subscription, SubscriptionStatus, BillingCycle } from '@/types';

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [cycleFilter, setCycleFilter] = useState<string>('ALL');

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);

  const [cancelModalSub, setCancelModalSub] = useState<Subscription | null>(null);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useSubscriptionSummary();

  const queryParams = {
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as SubscriptionStatus) : undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    billingCycle: cycleFilter !== 'ALL' ? (cycleFilter as BillingCycle) : undefined,
    sortBy: 'nextRenewal' as const,
    sortOrder: 'asc' as const,
  };

  const {
    data: subscriptions,
    isLoading: isSubscriptionsLoading,
    isError,
    refetch,
  } = useSubscriptions(queryParams);

  // Mutations
  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const cancelMutation = useCancelSubscription();
  const renewMutation = useRenewSubscription();
  const deleteMutation = useDeleteSubscription();
  const generateBillMutation = useGenerateBillFromSubscription();

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleOpenCreate = () => {
    setSubscriptionToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (subscription: Subscription) => {
    setSubscriptionToEdit(subscription);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (subscriptionToEdit) {
        await updateMutation.mutateAsync({
          id: subscriptionToEdit.id,
          payload: formData,
        });
        showNotification(`Updated ${formData.name} successfully.`);
      } else {
        await createMutation.mutateAsync(formData);
        showNotification(`Added ${formData.name} to subscriptions.`);
      }
      setIsFormOpen(false);
      setSubscriptionToEdit(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save subscription');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseMutation.mutateAsync(id);
      showNotification('Subscription paused.');
    } catch (err: any) {
      alert(err.message || 'Failed to pause subscription');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeMutation.mutateAsync(id);
      showNotification('Subscription resumed.');
    } catch (err: any) {
      alert(err.message || 'Failed to resume subscription');
    }
  };

  const handleCancelConfirm = async (id: string, reason?: string) => {
    try {
      await cancelMutation.mutateAsync({
        id,
        payload: { cancellationReason: reason },
      });
      setCancelModalSub(null);
      showNotification('Subscription marked as cancelled.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription');
    }
  };

  const handleRenew = async (id: string) => {
    try {
      await renewMutation.mutateAsync({ id });
      showNotification('Renewal date rolled forward to next billing cycle.');
    } catch (err: any) {
      alert(err.message || 'Failed to renew subscription');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteSubId) return;
    try {
      await deleteMutation.mutateAsync(deleteSubId);
      setDeleteSubId(null);
      showNotification('Subscription deleted permanently.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete subscription');
    }
  };

  const handleGenerateBill = async (id: string) => {
    try {
      await generateBillMutation.mutateAsync(id);
      showNotification('Generated bill record in your Bills ledger.');
    } catch (err: any) {
      alert(err.message || 'Failed to generate bill from subscription');
    }
  };

  const isActionLoading =
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    cancelMutation.isPending ||
    renewMutation.isPending ||
    deleteMutation.isPending ||
    generateBillMutation.isPending;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions & Services</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track recurring software, streaming, and membership services with renewal dates.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 text-sm shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Subscriptions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Services</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-20 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {summary?.activeCount ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {summary?.pausedCount ?? 0} paused · {summary?.cancelledCount ?? 0} cancelled
            </p>
          </CardContent>
        </Card>

        {/* Monthly Recurring Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Monthly Burn</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-28 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                ₹{(summary?.totalMonthlyCost ?? 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Normalized monthly cost</p>
          </CardContent>
        </Card>

        {/* Upcoming Renewals (30d) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Upcoming Renewals</CardTitle>
            <Calendar className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {summary?.upcomingRenewalsCount ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Due within the next 30 days</p>
          </CardContent>
        </Card>

        {/* Trials Ending Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Trial Watch</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {summary?.trialEndingSoonCount ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Ending in the next 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, provider, or category..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Category Select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Categories</option>
            <option value="ENTERTAINMENT">Entertainment</option>
            <option value="SOFTWARE">Software & Cloud</option>
            <option value="PRODUCTIVITY">Productivity</option>
            <option value="FITNESS">Fitness</option>
            <option value="UTILITIES">Utilities</option>
            <option value="EDUCATION">Education</option>
            <option value="FINANCE">Finance</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Billing Cycle Select */}
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Cycles</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>
      </div>

      {/* Main Content / Subscription Grid */}
      {isSubscriptionsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
          <h3 className="font-semibold text-base">Failed to load subscriptions</h3>
          <p className="text-xs mt-1 text-rose-600">
            There was an issue connecting to your account.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4 text-xs border-rose-300 hover:bg-rose-100"
          >
            Try Again
          </Button>
        </div>
      ) : !subscriptions || subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || cycleFilter !== 'ALL'
              ? 'No subscriptions match your filters'
              : 'No subscriptions tracked yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || cycleFilter !== 'ALL'
              ? 'Try adjusting your search terms or filters to find what you are looking for.'
              : 'Add your Netflix, Spotify, AWS, GitHub Copilot, gym, and other recurring memberships to never miss a renewal or unexpected charge.'}
          </p>
          <Button
            onClick={handleOpenCreate}
            className="mt-5 bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Subscription
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeleteSubId(id)}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={(s) => setCancelModalSub(s)}
              onRenew={handleRenew}
              onGenerateBill={handleGenerateBill}
              isActionLoading={isActionLoading}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <SubscriptionFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSubscriptionToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        subscriptionToEdit={subscriptionToEdit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <SubscriptionCancelDialog
        isOpen={Boolean(cancelModalSub)}
        subscription={cancelModalSub}
        onClose={() => setCancelModalSub(null)}
        onConfirm={handleCancelConfirm}
        isLoading={cancelMutation.isPending}
      />

      <SubscriptionDeleteDialog
        isOpen={Boolean(deleteSubId)}
        onClose={() => setDeleteSubId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
