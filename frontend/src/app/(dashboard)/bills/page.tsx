'use client';

import React, { useState } from 'react';
import {
  useBills,
  useBillSummary,
  useCreateBill,
  useUpdateBill,
  useMarkBillPaid,
  useDeleteBill,
} from '@/features/bills/hooks/useBills';
import { BillCard } from '@/features/bills/components/BillCard';
import { BillFormDialog } from '@/features/bills/components/BillFormDialog';
import { BillDeleteDialog } from '@/features/bills/components/BillDeleteDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bill, BillCategory, BillStatus } from '@/types';
import {
  Receipt,
  Plus,
  Search,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  TrendingDown,
} from 'lucide-react';

export default function BillsPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | BillStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | BillCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  // TanStack Query hooks
  const { data: bills = [], isLoading, isError, error, refetch } = useBills({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    category: categoryFilter === 'ALL' ? undefined : categoryFilter,
    search: searchQuery ? searchQuery : undefined,
  });

  const { data: summary } = useBillSummary();

  const createMutation = useCreateBill();
  const updateMutation = useUpdateBill();
  const markPaidMutation = useMarkBillPaid();
  const deleteMutation = useDeleteBill();

  const handleOpenCreate = () => {
    setBillToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (bill: Bill) => {
    setBillToEdit(bill);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: {
    title: string;
    description?: string | null;
    provider?: string | null;
    amount: number;
    currency: string;
    dueDate: string;
    category: BillCategory;
    isRecurring: boolean;
    billingCycle?: any;
    invoiceNumber?: string | null;
    file?: File;
  }) => {
    try {
      if (billToEdit) {
        await updateMutation.mutateAsync({
          id: billToEdit.id,
          payload: {
            title: formData.title,
            description: formData.description,
            provider: formData.provider,
            amount: formData.amount,
            currency: formData.currency,
            dueDate: formData.dueDate,
            category: formData.category,
            isRecurring: formData.isRecurring,
            billingCycle: formData.billingCycle,
            invoiceNumber: formData.invoiceNumber,
          },
        });
      } else {
        await createMutation.mutateAsync({
          payload: {
            title: formData.title,
            description: formData.description,
            provider: formData.provider,
            amount: formData.amount,
            currency: formData.currency,
            dueDate: formData.dueDate,
            category: formData.category,
            isRecurring: formData.isRecurring,
            billingCycle: formData.billingCycle,
            invoiceNumber: formData.invoiceNumber,
          },
          file: formData.file,
        });
      }
      setIsFormOpen(false);
      setBillToEdit(null);
    } catch (err) {
      console.error('Failed to save bill:', err);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaidMutation.mutateAsync({ id });
    } catch (err) {
      console.error('Failed to mark bill paid:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!billToDelete) return;
    try {
      await deleteMutation.mutateAsync(billToDelete.id);
      setBillToDelete(null);
    } catch (err) {
      console.error('Failed to delete bill:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-sky-600" />
            Bills & Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track utility bills, invoices, due dates, payments, and recurring charges.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Bill
        </Button>
      </div>

      {/* ── Metric Stat Cards ───────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Unpaid Bills</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{summary.unpaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500">{summary.unpaidCount} bills pending payment</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Overdue Amount</span>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-600">
                ₹{summary.overdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500">{summary.overdueCount} bills requiring immediate attention</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Paid This Month</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{summary.paidThisMonthAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500">Recorded payments in current cycle</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bills by title, vendor, invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            {(['ALL', 'UNPAID', 'PAID', 'OVERDUE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL'
                  ? 'All'
                  : status === 'UNPAID'
                  ? 'Upcoming'
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="UTILITIES">Utilities</option>
            <option value="RENT">Rent</option>
            <option value="INTERNET">Internet</option>
            <option value="PHONE">Phone</option>
            <option value="INSURANCE">Insurance</option>
            <option value="MEDICAL">Medical</option>
            <option value="EDUCATION">Education</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* ── Content States ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-6 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-rose-900">
            Failed to load bills
          </h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'An error occurred while communicating with the API.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="bg-white border-rose-200 text-rose-700 gap-1.5 text-xs hover:bg-rose-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : bills.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Receipt className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No bills found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'No bills match your current filters. Try resetting search or filter criteria.'
                : 'You have no bills logged yet. Add your utility bills or invoices to monitor due dates.'}
            </p>
          </div>
          <div>
            <Button
              onClick={handleOpenCreate}
              className="bg-sky-600 hover:bg-sky-700 text-white gap-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Your First Bill
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onMarkPaid={handleMarkPaid}
              onEdit={handleOpenEdit}
              onDelete={(id) => setBillToDelete(bill)}
              isMarkingPaid={markPaidMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <BillFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setBillToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        billToEdit={billToEdit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <BillDeleteDialog
        isOpen={Boolean(billToDelete)}
        onClose={() => setBillToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={billToDelete?.title || ''}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
