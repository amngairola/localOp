import { api } from '@/lib/api/client';
import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  ExpenseAnalytics,
  Budget,
  BudgetStatus,
} from '@/types';

export interface CreateExpensePayload {
  title: string;
  description?: string | null;
  amount: number;
  currency?: string;
  category?: ExpenseCategory;
  date: string;
  paymentMethod?: PaymentMethod | null;
  merchant?: string | null;
  notes?: string | null;
  tags?: string[];
}

export interface UpdateExpensePayload {
  title?: string;
  description?: string | null;
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  date?: string;
  paymentMethod?: PaymentMethod | null;
  merchant?: string | null;
  notes?: string | null;
  tags?: string[];
}

export interface QueryExpensesParams {
  category?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  currency?: string;
  search?: string;
  sortBy?: 'date' | 'amount' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SetBudgetPayload {
  month: number;
  year: number;
  amount: number;
  currency?: string;
  category?: ExpenseCategory | null;
}

export const expensesApi = {
  list: async (params: QueryExpensesParams = {}): Promise<Expense[]> => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.currency) query.set('currency', params.currency);
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<Expense[]>(`/expenses${qs}`);
  },

  getAnalytics: async (
    month?: number,
    year?: number,
    currency?: string
  ): Promise<ExpenseAnalytics> => {
    const query = new URLSearchParams();
    if (month) query.set('month', month.toString());
    if (year) query.set('year', year.toString());
    if (currency) query.set('currency', currency);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<ExpenseAnalytics>(`/expenses/analytics${qs}`);
  },

  getBudgets: async (
    month?: number,
    year?: number,
    currency?: string
  ): Promise<BudgetStatus[]> => {
    const query = new URLSearchParams();
    if (month) query.set('month', month.toString());
    if (year) query.set('year', year.toString());
    if (currency) query.set('currency', currency);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<BudgetStatus[]>(`/expenses/budgets${qs}`);
  },

  setBudget: async (payload: SetBudgetPayload): Promise<Budget> => {
    return api.post<Budget>('/expenses/budgets', payload);
  },

  deleteBudget: async (id: string): Promise<void> => {
    return api.delete<void>(`/expenses/budgets/${id}`);
  },

  getById: async (id: string): Promise<Expense> => {
    return api.get<Expense>(`/expenses/${id}`);
  },

  create: async (payload: CreateExpensePayload, file?: File): Promise<Expense> => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            formData.append(key, val.join(','));
          } else {
            formData.append(key, String(val));
          }
        }
      });
      return api.upload<Expense>('/expenses', formData);
    }
    return api.post<Expense>('/expenses', payload);
  },

  update: async (id: string, payload: UpdateExpensePayload): Promise<Expense> => {
    return api.patch<Expense>(`/expenses/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/expenses/${id}`);
  },

  uploadReceipt: async (id: string, file: File): Promise<Expense> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<Expense>(`/expenses/${id}/receipt`, formData);
  },

  getReceiptUrl: async (id: string): Promise<string> => {
    const res = await api.get<{ signedUrl: string }>(`/expenses/${id}/receipt-url`);
    return res.signedUrl;
  },
};
