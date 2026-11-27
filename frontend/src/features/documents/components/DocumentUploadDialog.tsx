'use client';

import React, { useState, useRef } from 'react';
import { DocumentCategory, Folder } from '@/types';
import { Button } from '@/components/ui/button';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  Folder as FolderIcon,
  Tag,
  Link as LinkIcon,
} from 'lucide-react';
import { formatFileSize } from './DocumentCard';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  folders: Folder[];
  initialFolderId?: string;
  onClose: () => void;
  onSubmit: (
    payload: {
      name: string;
      description?: string;
      category: DocumentCategory;
      folderId?: string | null;
      tags?: string[];
      billId?: string | null;
      expenseId?: string | null;
      subscriptionId?: string | null;
    },
    file: File
  ) => Promise<void>;
}

const CATEGORIES: { label: string; value: DocumentCategory }[] = [
  { label: 'Identity Documents', value: 'IDENTITY' },
  { label: 'Financial', value: 'FINANCIAL' },
  { label: 'Insurance', value: 'INSURANCE' },
  { label: 'Legal', value: 'LEGAL' },
  { label: 'Medical', value: 'MEDICAL' },
  { label: 'Education', value: 'EDUCATION' },
  { label: 'Employment', value: 'EMPLOYMENT' },
  { label: 'Personal', value: 'PERSONAL' },
  { label: 'Other', value: 'OTHER' },
];

export function DocumentUploadDialog({
  isOpen,
  folders,
  initialFolderId,
  onClose,
  onSubmit,
}: DocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('IDENTITY');
  const [folderId, setFolderId] = useState<string>(
    initialFolderId && initialFolderId !== 'root' ? initialFolderId : ''
  );
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (!name.trim()) {
      // Auto-populate name with filename minus extension
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setName(baseName);
    }
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    if (!name.trim()) {
      setError('Document name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSubmit(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          folderId: folderId ? folderId : null,
          tags,
        },
        selectedFile
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Upload to Personal Vault</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File drop area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50'
                : selectedFile
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileText className="w-10 h-10 text-emerald-600 mb-2" />
                <span className="text-sm font-semibold text-slate-800 truncate max-w-xs">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {formatFileSize(selectedFile.size)} • Click to replace
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">
                  Click to select or drag and drop a file
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  PDF, Images, Word, Excel, CSV, or Text (up to 15MB)
                </span>
              </div>
            )}
          </div>

          {/* Document name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Passport, Tax Return 2025"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Folder selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Folder (Optional)
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Unfiled (Root)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tags (Comma-separated)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="identity, passport, visa"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, expiration notes, document numbers..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Uploading to Vault...' : 'Save Document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
