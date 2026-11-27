'use client';

import React, { useState, useEffect } from 'react';
import {
  useExpenses,
  useExpenseAnalytics,
  useBudgets,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useSetBudget,
  useDeleteBudget,
} from '@/features/expenses/hooks/useExpenses';
import { ExpenseCard } from '@/features/expenses/components/ExpenseCard';
import { ExpenseFormDialog } from '@/features/expenses/components/ExpenseFormDialog';
import { BudgetDialog } from '@/features/expenses/components/BudgetDialog';
import { BudgetSection } from '@/features/expenses/components/BudgetSection';
import { ExpenseCharts } from '@/features/expenses/components/ExpenseCharts';
import { ExpenseDeleteDialog } from '@/features/expenses/components/ExpenseDeleteDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod, BudgetStatus } from '@/types';

export default function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  useEffect(() => {
    const d = new Date();
    setSelectedMonth(d.getMonth() + 1);
    setSelectedYear(d.getFullYear());
  }, []);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');

  // Dialog states
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetStatus | null>(null);

  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Queries
  const { data: analytics, isLoading: isAnalyticsLoading } = useExpenseAnalytics(
    selectedMonth,
    selectedYear
  );

  const { data: budgets, isLoading: isBudgetsLoading } = useBudgets(
    selectedMonth,
    selectedYear
  );

  // Month date range for listing transactions
  const startOfMonthIso = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
  const endOfMonthIso = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString();

  const queryParams = {
    search: search || undefined,
    category: categoryFilter !== 'ALL' ? (categoryFilter as ExpenseCategory) : undefined,
    paymentMethod:
      paymentMethodFilter !== 'ALL'
        ? (paymentMethodFilter as PaymentMethod)
        : undefined,
    startDate: startOfMonthIso,
    endDate: endOfMonthIso,
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
  };

  const {
    data: expenses,
    isLoading: isExpensesLoading,
    isError,
    refetch,
  } = useExpenses(queryParams);

  // Mutations
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const setBudgetMutation = useSetBudget();
  const deleteBudgetMutation = useDeleteBudget();

  const handleOpenCreateExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseFormOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseFormOpen(true);
  };

  const handleExpenseSubmit = async (data: any) => {
    try {
      if (expenseToEdit) {
        await updateExpenseMutation.mutateAsync({
          id: expenseToEdit.id,
          payload: data,
        });
        showToast(`Updated "${data.title}" successfully.`);
      } else {
        await createExpenseMutation.mutateAsync({
          payload: data,
          file: data.file,
        });
        showToast(`Logged "${data.title}" successfully.`);
      }
      setIsExpenseFormOpen(false);
      setExpenseToEdit(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    }
  };

  const handleDeleteExpenseConfirm = async () => {
    if (!deleteExpenseId) return;
    try {
      await deleteExpenseMutation.mutateAsync(deleteExpenseId);
      setDeleteExpenseId(null);
      showToast('Expense removed successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleBudgetSubmit = async (data: any) => {
    try {
      await setBudgetMutation.mutateAsync(data);
      setIsBudgetDialogOpen(false);
      setBudgetToEdit(null);
      showToast('Budget configured successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save budget');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudgetMutation.mutateAsync(id);
      showToast('Budget removed.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete budget');
    }
  };

  const currentTotal = analytics?.currentMonthTotal ?? 0;
  const momPercentage = analytics?.momChangePercentage ?? 0;
  const isSpendingUp = (analytics?.momChangeAmount ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses & Personal Finance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily expenditures, analyze category trends, and manage monthly budgets.
          </p>
        </div>

        {/* Action Controls & Month Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month & Year Select */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-medium py-1 px-1 focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-medium py-1 px-1 focus:outline-none"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleOpenCreateExpense}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Log Expense
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month Spending Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Month Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <Skeleton className="h-8 w-28 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                ₹{currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Previous month: ₹{(analytics?.previousMonthTotal ?? 0).toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        {/* MoM Change Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">MoM Change</CardTitle>
            {isSpendingUp ? (
              <TrendingUp className="h-4 w-4 text-rose-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <Skeleton className="h-8 w-20 mb-1" />
            ) : (
              <div
                className={`text-2xl font-bold ${
                  isSpendingUp ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {isSpendingUp ? '+' : ''}
                {momPercentage}%
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {isSpendingUp
                ? `Spent ₹${Math.abs(analytics?.momChangeAmount ?? 0).toLocaleString('en-IN')} more`
                : `Saved ₹${Math.abs(analytics?.momChangeAmount ?? 0).toLocaleString('en-IN')} vs last month`}
            </p>
          </CardContent>
        </Card>

        {/* Average Daily Spending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                ₹{(analytics?.averageDailySpending ?? 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Across active calendar days</p>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {analytics?.totalTransactionsCount ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Logged purchases this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics: Category Breakdown & Daily Trends */}
      <ExpenseCharts
        categoryBreakdown={analytics?.categoryBreakdown || []}
        dailyTrends={analytics?.dailyTrends || []}
      />

      {/* Monthly Budget Management Section */}
      <BudgetSection
        budgets={budgets || []}
        onAddBudget={() => {
          setBudgetToEdit(null);
          setIsBudgetDialogOpen(true);
        }}
        onEditBudget={(b) => {
          setBudgetToEdit(b);
          setIsBudgetDialogOpen(true);
        }}
        onDeleteBudget={handleDeleteBudget}
        isLoading={isBudgetsLoading}
      />

      {/* Filter and Search Bar for Transactions */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses by item, merchant, or notes..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
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

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="NET_BANKING">Net Banking</option>
            <option value="CASH">Cash</option>
            <option value="WALLET">Wallet</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
          <span className="text-xs text-slate-500">
            {expenses?.length ?? 0} transactions recorded
          </span>
        </div>

        {isExpensesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
            <h3 className="font-semibold text-base">Failed to load transactions</h3>
            <p className="text-xs mt-1 text-rose-600">
              There was an issue retrieving your expense records.
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
        ) : !expenses || expenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              {search || categoryFilter !== 'ALL' || paymentMethodFilter !== 'ALL'
                ? 'No transactions match your filters'
                : 'No expenses recorded for this month'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {search || categoryFilter !== 'ALL' || paymentMethodFilter !== 'ALL'
                ? 'Try adjusting your search query or category filters.'
                : 'Start tracking your spending by logging a transaction or uploading a receipt.'}
            </p>
            <Button
              onClick={handleOpenCreateExpense}
              className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Log First Expense
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleOpenEditExpense}
                onDelete={(id) => setDeleteExpenseId(id)}
                isLoading={deleteExpenseMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog Modals */}
      <ExpenseFormDialog
        isOpen={isExpenseFormOpen}
        onClose={() => {
          setIsExpenseFormOpen(false);
          setExpenseToEdit(null);
        }}
        onSubmit={handleExpenseSubmit}
        expenseToEdit={expenseToEdit}
        isLoading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
      />

      <BudgetDialog
        isOpen={isBudgetDialogOpen}
        onClose={() => {
          setIsBudgetDialogOpen(false);
          setBudgetToEdit(null);
        }}
        onSubmit={handleBudgetSubmit}
        budgetToEdit={budgetToEdit}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        isLoading={setBudgetMutation.isPending}
      />

      <ExpenseDeleteDialog
        isOpen={Boolean(deleteExpenseId)}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={handleDeleteExpenseConfirm}
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
}
