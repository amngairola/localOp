'use client';

import React, { useState, useEffect } from 'react';
import { Folder } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Folder as FolderIcon } from 'lucide-react';

interface FolderDialogProps {
  isOpen: boolean;
  folder?: Folder | null; // if present, editing mode
  onClose: () => void;
  onSubmit: (data: { name: string; color: string }) => Promise<void>;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export function FolderDialog({
  isOpen,
  folder,
  onClose,
  onSubmit,
}: FolderDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColor(folder.color || '#6366f1');
    } else {
      setName('');
      setColor('#6366f1');
    }
    setError(null);
  }, [folder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({ name: name.trim(), color });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FolderIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">
              {folder ? 'Rename Folder' : 'New Folder'}
            </h3>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Identity Documents, Tax Records"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color Tag
            </label>
            <div className="flex items-center space-x-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
              {isSubmitting ? 'Saving...' : folder ? 'Update Folder' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
