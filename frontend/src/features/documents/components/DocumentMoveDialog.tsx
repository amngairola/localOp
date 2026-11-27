'use client';

import React, { useState } from 'react';
import { Document, Folder } from '@/types';
import { Button } from '@/components/ui/button';
import { X, FolderInput, Inbox, Folder as FolderIcon } from 'lucide-react';

interface DocumentMoveDialogProps {
  isOpen: boolean;
  document: Document | null;
  folders: Folder[];
  onClose: () => void;
  onSubmit: (folderId: string | null) => Promise<void>;
}

export function DocumentMoveDialog({
  isOpen,
  document,
  folders,
  onClose,
  onSubmit,
}: DocumentMoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    document?.folderId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(selectedFolderId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to move document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FolderInput className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Move Document</h3>
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
            <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-600 mb-2">
            Select a target folder for <span className="font-semibold text-slate-900">{document.name}</span>:
          </p>

          <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2">
            {/* Root / Unfiled option */}
            <label
              className={`flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                selectedFolderId === null
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="folderSelection"
                checked={selectedFolderId === null}
                onChange={() => setSelectedFolderId(null)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <Inbox className="w-4 h-4 text-slate-500" />
              <span className="text-sm">Root (Unfiled / No folder)</span>
            </label>

            {/* Custom Folders */}
            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              return (
                <label
                  key={folder.id}
                  className={`flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="folderSelection"
                    checked={isSelected}
                    onChange={() => setSelectedFolderId(folder.id)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <FolderIcon
                    className="w-4 h-4"
                    style={{ color: folder.color || '#64748b' }}
                  />
                  <span className="text-sm truncate">{folder.name}</span>
                </label>
              );
            })}
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
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Moving...' : 'Move to Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
