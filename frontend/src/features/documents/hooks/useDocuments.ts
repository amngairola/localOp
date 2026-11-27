import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi,
  UploadDocumentPayload,
  UpdateDocumentPayload,
  QueryDocumentsParams,
  CreateFolderPayload,
  UpdateFolderPayload,
} from '../api/documents.api';

export const DOCUMENTS_QUERY_KEY = ['documents'];
export const VAULT_STATS_QUERY_KEY = ['documents', 'stats'];
export const FOLDERS_QUERY_KEY = ['documents', 'folders'];

export function useDocuments(params: QueryDocumentsParams = {}) {
  return useQuery({
    queryKey: [...DOCUMENTS_QUERY_KEY, params],
    queryFn: () => documentsApi.list(params),
  });
}

export function useVaultStats() {
  return useQuery({
    queryKey: VAULT_STATS_QUERY_KEY,
    queryFn: () => documentsApi.getStats(),
  });
}

export function useFolders() {
  return useQuery({
    queryKey: FOLDERS_QUERY_KEY,
    queryFn: () => documentsApi.listFolders(),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: [...DOCUMENTS_QUERY_KEY, id],
    queryFn: () => documentsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, file }: { payload: UploadDocumentPayload; file: File }) =>
      documentsApi.upload(payload, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: VAULT_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentPayload }) =>
      documentsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...DOCUMENTS_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: VAULT_STATS_QUERY_KEY });
    },
  });
}

export function useMoveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      documentsApi.move(id, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: VAULT_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFolderPayload) => documentsApi.createFolder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: VAULT_STATS_QUERY_KEY });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFolderPayload }) =>
      documentsApi.updateFolder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: VAULT_STATS_QUERY_KEY });
    },
  });
}
