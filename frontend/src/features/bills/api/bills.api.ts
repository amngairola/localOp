import { api } from '@/lib/api/client';
import { Bill, BillCategory, BillStatus, BillingCycle, BillSummary } from '@/types';

export interface CreateBillPayload {
  title: string;
  description?: string | null;
  provider?: string | null;
  amount: number;
  currency?: string;
  dueDate: string;
  category?: BillCategory;
  status?: BillStatus;
  isRecurring?: boolean;
  billingCycle?: BillingCycle | null;
  invoiceNumber?: string | null;
  notes?: string | null;
}

export interface UpdateBillPayload {
  title?: string;
  description?: string | null;
  provider?: string | null;
  amount?: number;
  currency?: string;
  dueDate?: string;
  category?: BillCategory;
  status?: BillStatus;
  isRecurring?: boolean;
  billingCycle?: BillingCycle | null;
  invoiceNumber?: string | null;
  notes?: string | null;
}

export interface QueryBillsParams {
  status?: BillStatus;
  category?: BillCategory;
  isRecurring?: boolean;
  search?: string;
  sortBy?: 'dueDate' | 'amount' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const billsApi = {
  list: async (params: QueryBillsParams = {}): Promise<Bill[]> => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.isRecurring !== undefined) query.set('isRecurring', String(params.isRecurring));
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<Bill[]>(`/bills${qs}`);
  },

  getSummary: async (): Promise<BillSummary> => {
    return api.get<BillSummary>('/bills/summary');
  },

  getById: async (id: string): Promise<Bill> => {
    return api.get<Bill>(`/bills/${id}`);
  },

  create: async (payload: CreateBillPayload, file?: File): Promise<Bill> => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
      return api.upload<Bill>('/bills', formData);
    }
    return api.post<Bill>('/bills', payload);
  },

  update: async (id: string, payload: UpdateBillPayload): Promise<Bill> => {
    return api.patch<Bill>(`/bills/${id}`, payload);
  },

  markPaid: async (
    id: string,
    paymentDate?: string
  ): Promise<{ paidBill: Bill; nextBill?: Bill }> => {
    return api.post<{ paidBill: Bill; nextBill?: Bill }>(`/bills/${id}/mark-paid`, {
      paymentDate,
    });
  },

  uploadAttachment: async (id: string, file: File): Promise<Bill> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<Bill>(`/bills/${id}/attachment`, formData);
  },

  getAttachmentSignedUrl: async (id: string): Promise<string> => {
    const res = await api.get<{ signedUrl: string }>(`/bills/${id}/attachment-url`);
    return res.signedUrl;
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/bills/${id}`);
  },
};
