import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  billsApi,
  CreateBillPayload,
  UpdateBillPayload,
  QueryBillsParams,
} from '../api/bills.api';

export const BILLS_QUERY_KEY = ['bills'];
export const BILLS_SUMMARY_KEY = ['bills', 'summary'];

export function useBills(params: QueryBillsParams = {}) {
  return useQuery({
    queryKey: [...BILLS_QUERY_KEY, params],
    queryFn: () => billsApi.list(params),
  });
}

export function useBillSummary() {
  return useQuery({
    queryKey: BILLS_SUMMARY_KEY,
    queryFn: () => billsApi.getSummary(),
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: [...BILLS_QUERY_KEY, id],
    queryFn: () => billsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, file }: { payload: CreateBillPayload; file?: File }) =>
      billsApi.create(payload, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBillPayload }) =>
      billsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });
}

export function useMarkBillPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentDate }: { id: string; paymentDate?: string }) =>
      billsApi.markPaid(id, paymentDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });
}

export function useUploadInvoiceAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      billsApi.uploadAttachment(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });
}
