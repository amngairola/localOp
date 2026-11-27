import { api } from '@/lib/api/client';
import {
  Document,
  DocumentCategory,
  Folder,
  VaultStats,
} from '@/types';

export interface UploadDocumentPayload {
  name: string;
  description?: string | null;
  category: DocumentCategory;
  folderId?: string | null;
  tags?: string[];
  billId?: string | null;
  expenseId?: string | null;
  subscriptionId?: string | null;
}

export interface UpdateDocumentPayload {
  name?: string;
  description?: string | null;
  category?: DocumentCategory;
  folderId?: string | null;
  tags?: string[];
  billId?: string | null;
  expenseId?: string | null;
  subscriptionId?: string | null;
}

export interface QueryDocumentsParams {
  category?: DocumentCategory;
  folderId?: string;
  tag?: string;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'size' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateFolderPayload {
  name: string;
  color?: string;
}

export interface UpdateFolderPayload {
  name?: string;
  color?: string;
}

export const documentsApi = {
  list: async (params: QueryDocumentsParams = {}): Promise<Document[]> => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.folderId !== undefined) {
      if (params.folderId === 'root') {
        query.append('folderId', 'null');
      } else {
        query.append('folderId', params.folderId);
      }
    }
    if (params.tag) query.append('tag', params.tag);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const endpoint = queryString ? `/documents?${queryString}` : '/documents';
    return api.get<Document[]>(endpoint);
  },

  getStats: async (): Promise<VaultStats> => {
    return api.get<VaultStats>('/documents/stats');
  },

  getById: async (id: string): Promise<Document> => {
    return api.get<Document>(`/documents/${id}`);
  },

  upload: async (payload: UploadDocumentPayload, file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    if (payload.category) formData.append('category', payload.category);
    if (payload.folderId) formData.append('folderId', payload.folderId);
    if (payload.tags && payload.tags.length > 0) {
      formData.append('tags', payload.tags.join(','));
    }
    if (payload.billId) formData.append('billId', payload.billId);
    if (payload.expenseId) formData.append('expenseId', payload.expenseId);
    if (payload.subscriptionId) formData.append('subscriptionId', payload.subscriptionId);

    return api.upload<Document>('/documents/upload', formData);
  },

  update: async (id: string, payload: UpdateDocumentPayload): Promise<Document> => {
    return api.patch<Document>(`/documents/${id}`, payload);
  },

  move: async (id: string, folderId: string | null): Promise<Document> => {
    return api.patch<Document>(`/documents/${id}/move`, { folderId });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/documents/${id}`);
  },

  getSignedUrl: async (id: string): Promise<string> => {
    const res = await api.get<{ url: string }>(`/documents/${id}/signed-url`);
    return res.url;
  },

  // Folder management
  listFolders: async (): Promise<Folder[]> => {
    return api.get<Folder[]>('/documents/folders');
  },

  createFolder: async (payload: CreateFolderPayload): Promise<Folder> => {
    return api.post<Folder>('/documents/folders', payload);
  },

  updateFolder: async (id: string, payload: UpdateFolderPayload): Promise<Folder> => {
    return api.patch<Folder>(`/documents/folders/${id}`, payload);
  },

  deleteFolder: async (id: string): Promise<void> => {
    return api.delete<void>(`/documents/folders/${id}`);
  },
};
