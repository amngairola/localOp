'use client';

import React, { useState, useMemo } from 'react';
import {
  useDocuments,
  useVaultStats,
  useFolders,
  useUploadDocument,
  useUpdateDocument,
  useMoveDocument,
  useDeleteDocument,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
} from '@/features/documents/hooks/useDocuments';
import { documentsApi } from '@/features/documents/api/documents.api';
import { Document, Folder, DocumentCategory } from '@/types';
import { FolderSidebar } from '@/features/documents/components/FolderSidebar';
import { FolderDialog } from '@/features/documents/components/FolderDialog';
import {
  DocumentCard,
  formatFileSize,
} from '@/features/documents/components/DocumentCard';
import { DocumentUploadDialog } from '@/features/documents/components/DocumentUploadDialog';
import { DocumentPreviewDialog } from '@/features/documents/components/DocumentPreviewDialog';
import { DocumentEditDialog } from '@/features/documents/components/DocumentEditDialog';
import { DocumentMoveDialog } from '@/features/documents/components/DocumentMoveDialog';
import { DocumentDeleteDialog } from '@/features/documents/components/DocumentDeleteDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  Search,
  Grid,
  List,
  Files,
  HardDrive,
  Folder as FolderIcon,
  Layers,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function DocumentsPage() {
  // Navigation & filter state
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined
  ); // undefined = all, 'root' = unfiled, or folder.id
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);

  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [moveDoc, setMoveDoc] = useState<Document | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useVaultStats();
  const { data: folders = [], isLoading: foldersLoading } = useFolders();
  const {
    data: documents = [],
    isLoading: docsLoading,
    error: docsError,
  } = useDocuments({
    category:
      categoryFilter !== 'ALL'
        ? (categoryFilter as DocumentCategory)
        : undefined,
    folderId: selectedFolderId,
    search: searchQuery.trim() || undefined,
  });

  // Mutations
  const uploadMutation = useUploadDocument();
  const updateMutation = useUpdateDocument();
  const moveMutation = useMoveDocument();
  const deleteMutation = useDeleteDocument();
  const createFolderMutation = useCreateFolder();
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();

  // Handle file download
  const handleDownload = async (doc: Document) => {
    try {
      let downloadUrl = doc.signedUrl;
      if (!downloadUrl) {
        downloadUrl = await documentsApi.getSignedUrl(doc.id);
      }
      const a = window.document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.originalName || doc.name;
      a.target = '_blank';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (err: any) {
      alert(`Could not download file: ${err?.message || 'Unknown error'}`);
    }
  };

  const currentFolder = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === 'root') return null;
    return folders.find((f) => f.id === selectedFolderId);
  }, [folders, selectedFolderId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Personal Vault & Documents
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Encrypted, secure storage for invoices, identification, medical, and personal records.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Vault Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Documents</p>
              {statsLoading ? (
                <Skeleton className="h-6 w-12 mt-1" />
              ) : (
                <p className="text-xl font-bold text-slate-900">
                  {stats?.totalDocuments ?? documents.length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Vault Storage Used</p>
              {statsLoading ? (
                <Skeleton className="h-6 w-16 mt-1" />
              ) : (
                <p className="text-xl font-bold text-slate-900">
                  {formatFileSize(stats?.totalSizeBytes || 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <FolderIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Active Folders</p>
              {statsLoading ? (
                <Skeleton className="h-6 w-12 mt-1" />
              ) : (
                <p className="text-xl font-bold text-slate-900">
                  {stats?.totalFolders ?? folders.length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Categories</p>
              {statsLoading ? (
                <Skeleton className="h-6 w-12 mt-1" />
              ) : (
                <p className="text-xl font-bold text-slate-900">
                  {stats?.categoryBreakdown?.length || 9}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Folder Sidebar */}
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          totalDocumentCount={stats?.totalDocuments ?? documents.length}
          onSelectFolder={(id) => setSelectedFolderId(id)}
          onCreateFolder={() => {
            setFolderToEdit(null);
            setIsFolderDialogOpen(true);
          }}
          onEditFolder={(folder) => {
            setFolderToEdit(folder);
            setIsFolderDialogOpen(true);
          }}
          onDeleteFolder={(folder) => setFolderToDelete(folder)}
        />

        {/* Right Documents Workspace */}
        <div className="flex-1 w-full space-y-4">
          {/* Controls Bar: Search, Category Filter, View Mode */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents or tags..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filters and View Toggle */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                <option value="IDENTITY">Identity Documents</option>
                <option value="FINANCIAL">Financial</option>
                <option value="INSURANCE">Insurance</option>
                <option value="LEGAL">Legal</option>
                <option value="MEDICAL">Medical</option>
                <option value="EDUCATION">Education</option>
                <option value="EMPLOYMENT">Employment</option>
                <option value="PERSONAL">Personal</option>
                <option value="OTHER">Other</option>
              </select>

              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-xs text-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${
                    viewMode === 'list'
                      ? 'bg-white shadow-xs text-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Folder Breadcrumb */}
          {currentFolder && (
            <div className="flex items-center justify-between px-2 text-xs text-slate-500">
              <div className="flex items-center space-x-1.5">
                <span>Folder:</span>
                <span
                  className="font-semibold text-slate-800 px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${currentFolder.color}15`, color: currentFolder.color }}
                >
                  {currentFolder.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedFolderId(undefined)}
                className="text-indigo-600 hover:underline"
              >
                Clear folder filter
              </button>
            </div>
          )}

          {/* Error Message */}
          {docsError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Failed to load documents. Please check backend connection.</span>
            </div>
          )}

          {/* Documents Grid / List */}
          {docsLoading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton
                  key={i}
                  className={viewMode === 'grid' ? 'h-52 rounded-xl' : 'h-20 rounded-xl'}
                />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Files className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-base mb-1">
                No documents found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {searchQuery || categoryFilter !== 'ALL' || selectedFolderId
                  ? 'No documents matched your current search or filters. Try clearing filters.'
                  : 'Your personal vault is empty. Upload invoices, identity docs, insurance policies, and receipts securely.'}
              </p>
              <Button
                onClick={() => setIsUploadOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  viewMode={viewMode}
                  onPreview={(d) => setPreviewDoc(d)}
                  onDownload={handleDownload}
                  onMove={(d) => setMoveDoc(d)}
                  onEdit={(d) => setEditDoc(d)}
                  onDelete={(d) => setDeleteDoc(d)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals and Dialogs */}
      <DocumentUploadDialog
        isOpen={isUploadOpen}
        folders={folders}
        initialFolderId={selectedFolderId}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={async (payload, file) => {
          await uploadMutation.mutateAsync({ payload, file });
        }}
      />

      <DocumentPreviewDialog
        isOpen={Boolean(previewDoc)}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
      />

      <DocumentEditDialog
        isOpen={Boolean(editDoc)}
        document={editDoc}
        onClose={() => setEditDoc(null)}
        onSubmit={async (payload) => {
          if (editDoc) {
            await updateMutation.mutateAsync({ id: editDoc.id, payload });
          }
        }}
      />

      <DocumentMoveDialog
        isOpen={Boolean(moveDoc)}
        document={moveDoc}
        folders={folders}
        onClose={() => setMoveDoc(null)}
        onSubmit={async (targetFolderId) => {
          if (moveDoc) {
            await moveMutation.mutateAsync({
              id: moveDoc.id,
              folderId: targetFolderId,
            });
          }
        }}
      />

      <DocumentDeleteDialog
        isOpen={Boolean(deleteDoc)}
        document={deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={async () => {
          if (deleteDoc) {
            await deleteMutation.mutateAsync(deleteDoc.id);
          }
        }}
      />

      <FolderDialog
        isOpen={isFolderDialogOpen}
        folder={folderToEdit}
        onClose={() => {
          setIsFolderDialogOpen(false);
          setFolderToEdit(null);
        }}
        onSubmit={async (data) => {
          if (folderToEdit) {
            await updateFolderMutation.mutateAsync({
              id: folderToEdit.id,
              payload: data,
            });
          } else {
            await createFolderMutation.mutateAsync(data);
          }
        }}
      />

      {/* Folder Delete Confirmation */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg">
              Delete Folder &ldquo;{folderToDelete.name}&rdquo;?
            </h3>
            <p className="text-sm text-slate-600">
              Documents inside this folder will <strong className="text-slate-900">NOT</strong> be deleted. They will safely be moved to root (unfiled).
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setFolderToDelete(null)}
                disabled={deleteFolderMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await deleteFolderMutation.mutateAsync(folderToDelete.id);
                  if (selectedFolderId === folderToDelete.id) {
                    setSelectedFolderId(undefined);
                  }
                  setFolderToDelete(null);
                }}
                disabled={deleteFolderMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {deleteFolderMutation.isPending ? 'Deleting...' : 'Delete Folder'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
