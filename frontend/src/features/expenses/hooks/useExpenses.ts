import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  expensesApi,
  CreateExpensePayload,
  UpdateExpensePayload,
  QueryExpensesParams,
  SetBudgetPayload,
} from '../api/expenses.api';

export const EXPENSES_QUERY_KEY = ['expenses'];
export const EXPENSE_ANALYTICS_KEY = ['expenses', 'analytics'];
export const BUDGETS_QUERY_KEY = ['expenses', 'budgets'];

export function useExpenses(params: QueryExpensesParams = {}) {
  return useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, params],
    queryFn: () => expensesApi.list(params),
  });
}

export function useExpenseAnalytics(month?: number, year?: number, currency?: string) {
  return useQuery({
    queryKey: [...EXPENSE_ANALYTICS_KEY, { month, year, currency }],
    queryFn: () => expensesApi.getAnalytics(month, year, currency),
  });
}

export function useBudgets(month?: number, year?: number, currency?: string) {
  return useQuery({
    queryKey: [...BUDGETS_QUERY_KEY, { month, year, currency }],
    queryFn: () => expensesApi.getBudgets(month, year, currency),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, id],
    queryFn: () => expensesApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, file }: { payload: CreateExpensePayload; file?: File }) =>
      expensesApi.create(payload, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EXPENSE_ANALYTICS_KEY });
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpensePayload }) =>
      expensesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EXPENSE_ANALYTICS_KEY });
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EXPENSE_ANALYTICS_KEY });
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
    },
  });
}

export function useSetBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetBudgetPayload) => expensesApi.setBudget(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY });
    },
  });
}
