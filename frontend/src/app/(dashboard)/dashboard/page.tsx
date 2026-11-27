'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useReminders } from '@/features/reminders/hooks/useReminders';
import { useBillSummary, useBills } from '@/features/bills/hooks/useBills';
import {
  useSubscriptionSummary,
  useSubscriptions,
} from '@/features/subscriptions/hooks/useSubscriptions';
import {
  useExpenseAnalytics,
  useExpenses,
} from '@/features/expenses/hooks/useExpenses';
import {
  useVaultStats,
  useDocuments,
} from '@/features/documents/hooks/useDocuments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Receipt,
  CreditCard,
  DollarSign,
  Bot,
  Plus,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  Files,
  HardDrive,
  FolderLock,
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

export default function AuthenticatedDashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<number>(11);
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setMounted(true);
    const d = new Date();
    setCurrentMonth(d.getMonth() + 1);
    setCurrentYear(d.getFullYear());
  }, []);

  // Queries
  const { data: reminders, isLoading: remindersLoading } = useReminders({
    status: 'PENDING',
    limit: 5,
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  const { data: billSummary, isLoading: summaryLoading } = useBillSummary();
  const { data: upcomingBills, isLoading: billsLoading } = useBills({
    status: 'UNPAID',
    limit: 5,
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  const { data: subSummary, isLoading: subSummaryLoading } = useSubscriptionSummary();
  const { data: upcomingSubs, isLoading: subsLoading } = useSubscriptions({
    status: 'ACTIVE',
    limit: 5,
    sortBy: 'nextRenewal',
    sortOrder: 'asc',
  });

  const { data: expenseAnalytics, isLoading: expenseAnalyticsLoading } = useExpenseAnalytics(
    currentMonth,
    currentYear
  );

  const { data: recentExpenses, isLoading: recentExpensesLoading } = useExpenses({
    limit: 4,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const { data: vaultStats, isLoading: vaultStatsLoading } = useVaultStats();
  const { data: recentDocuments, isLoading: recentDocsLoading } = useDocuments({
    limit: 4,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const pendingRemindersCount = reminders?.length ?? 0;
  const unpaidBillsAmount = billSummary?.unpaidAmount ?? 0;
  const overdueBillsCount = billSummary?.overdueCount ?? 0;

  const activeSubsCount = subSummary?.activeCount ?? 0;
  const monthlySubBurn = subSummary?.totalMonthlyCost ?? 0;
  const trialsEndingSoonCount = subSummary?.trialEndingSoonCount ?? 0;

  const monthExpensesTotal = expenseAnalytics?.currentMonthTotal ?? 0;
  const momChangePercentage = expenseAnalytics?.momChangePercentage ?? 0;
  const isSpendingUp = (expenseAnalytics?.momChangeAmount ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your personal life operations hub is connected to your private account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/assistant">
            <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2 text-sm shadow-sm">
              <Bot className="h-4 w-4" />
              Ask LifeOps AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Pending Reminders Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Reminders</CardTitle>
            <Bell className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {pendingRemindersCount} Active
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {pendingRemindersCount === 0 ? 'No pending reminders' : 'Due soon in your schedule'}
            </p>
          </CardContent>
        </Card>

        {/* Unpaid Bills Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Unpaid Bills</CardTitle>
            <Receipt className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-28 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                ₹{unpaidBillsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-xs mt-1">
              {overdueBillsCount > 0 ? (
                <span className="text-rose-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueBillsCount} overdue
                </span>
              ) : (
                <span className="text-slate-500">
                  {billSummary?.unpaidCount ?? 0} bills pending
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {subSummaryLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {activeSubsCount} Active
              </div>
            )}
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>₹{monthlySubBurn.toFixed(2)}/mo burn</span>
              {trialsEndingSoonCount > 0 && (
                <span className="text-amber-600 font-medium">{trialsEndingSoonCount} trial alert</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Month Spending Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Month Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {expenseAnalyticsLoading ? (
              <Skeleton className="h-8 w-28 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                ₹{monthExpensesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            )}
            <div className="text-xs mt-1 flex items-center gap-1">
              {isSpendingUp ? (
                <span className="text-rose-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  +{momChangePercentage}% MoM
                </span>
              ) : (
                <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" />
                  {momChangePercentage}% MoM
                </span>
              )}
              <span className="text-slate-400">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Document Vault Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Personal Vault</CardTitle>
            <FolderLock className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {vaultStatsLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {vaultStats?.totalDocuments ?? recentDocuments?.length ?? 0} Docs
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {vaultStats ? `${(vaultStats.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB stored` : 'Encrypted storage'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Data Sections: Upcoming Reminders, Bills & Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reminders preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Upcoming Reminders</CardTitle>
              <CardDescription>Tasks needing attention</CardDescription>
            </div>
            <Link href="/reminders">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-sky-600 hover:text-sky-700">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !reminders || reminders.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No pending reminders</p>
                <Link href="/reminders">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">
                    Create Reminder
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.slice(0, 4).map((reminder) => {
                  const dueDate = parseISO(reminder.dueDate);
                  const isOverdue = mounted && isPast(dueDate);
                  return (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {reminder.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span className={isOverdue ? 'text-rose-500 font-medium' : ''}>
                            {mounted ? format(dueDate, 'MMM d, yyyy') : 'Loading...'}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          reminder.priority === 'URGENT' || reminder.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 text-[10px]'
                            : 'bg-slate-100 text-slate-600 text-[10px]'
                        }
                      >
                        {reminder.priority}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bills preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Upcoming Bills</CardTitle>
              <CardDescription>Invoices to be cleared</CardDescription>
            </div>
            <Link href="/bills">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-amber-600 hover:text-amber-700">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {billsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !upcomingBills || upcomingBills.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No unpaid bills recorded</p>
                <Link href="/bills">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">
                    Record Bill
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBills.slice(0, 4).map((bill) => {
                  const dueDate = parseISO(bill.dueDate);
                  const isOverdue = mounted && (bill.isOverdue || isPast(dueDate));
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {bill.title}
                          </p>
                          {bill.isRecurring && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              Recurring
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span className={isOverdue ? 'text-rose-500 font-medium' : ''}>
                            {mounted ? `Due ${format(dueDate, 'MMM d, yyyy')}` : 'Loading...'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        {isOverdue && (
                          <Badge variant="secondary" className="bg-rose-50 text-rose-700 text-[10px]">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Subscriptions</CardTitle>
              <CardDescription>Upcoming renewals & trials</CardDescription>
            </div>
            <Link href="/subscriptions">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-purple-600 hover:text-purple-700">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {subsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !upcomingSubs || upcomingSubs.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No active subscriptions</p>
                <Link href="/subscriptions">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">
                    Track Subscription
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingSubs.slice(0, 4).map((sub) => {
                  const renewalDate = parseISO(sub.nextRenewal);
                  const isRenewalPast = mounted && isPast(renewalDate);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {sub.name}
                          </p>
                          {sub.isTrial && (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] px-1 py-0">
                              Trial
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span className={isRenewalPast ? 'text-rose-500 font-medium' : ''}>
                            {mounted ? `Renews ${format(renewalDate, 'MMM d')}` : 'Loading...'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          ₹{Number(sub.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {sub.billingCycle.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses Section */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            </div>
            <CardDescription>Latest personal expenses logged in your account</CardDescription>
          </div>
          <Link href="/expenses">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-emerald-600 hover:text-emerald-700">
              View All
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentExpensesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !recentExpenses || recentExpenses.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No expenses logged yet</p>
              <Link href="/expenses">
                <Button variant="outline" size="sm" className="mt-3 text-xs">
                  Log Expense
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{exp.title}</p>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{Number(exp.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                      {exp.category.replace('_', ' ')}
                    </span>
                    <span>
                      {mounted ? format(new Date(exp.date), 'MMM d') : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Vault Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-2">
              <Files className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base font-semibold">Vault Documents</CardTitle>
            </div>
            <CardDescription>Recently stored records, policies, IDs, and invoices</CardDescription>
          </div>
          <Link href="/documents">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-indigo-600 hover:text-indigo-700">
              View Vault
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentDocsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !recentDocuments || recentDocuments.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Files className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No documents in vault yet</p>
              <Link href="/documents">
                <Button variant="outline" size="sm" className="mt-3 text-xs">
                  Upload Document
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href="/documents"
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors block"
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                    <span className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-semibold">
                      {doc.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span className="truncate max-w-[130px]">{doc.originalName}</span>
                    <span>
                      {(doc.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Launchpad & Assistant CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription>Add new responsibilities to your personal ledger</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/reminders">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200">
                <Plus className="h-3.5 w-3.5 text-sky-600" />
                Add Reminder
              </Button>
            </Link>
            <Link href="/bills">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200">
                <Plus className="h-3.5 w-3.5 text-amber-600" />
                Record Bill
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200">
                <Plus className="h-3.5 w-3.5 text-purple-600" />
                Track Subscription
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200">
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                Log Expense
              </Button>
            </Link>
            <Link href="/documents" className="col-span-2">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <Plus className="h-3.5 w-3.5 text-indigo-600" />
                Upload Document to Vault
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-sky-950 text-white border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-sky-400 text-sky-300 text-xs">
                AI Ready
              </Badge>
            </div>
            <CardTitle className="text-lg text-white">Ask LifeOps Assistant</CardTitle>
            <CardDescription className="text-slate-300">
              Your assistant executes tool calls directly against your private PostgreSQL database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-white/10 p-3 text-xs text-slate-200">
              Try asking: &ldquo;How much did I spend on groceries this month vs my budget?&rdquo;
            </div>
            <Link href="/assistant">
              <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white gap-2 text-xs w-full">
                Open Assistant Chat
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
