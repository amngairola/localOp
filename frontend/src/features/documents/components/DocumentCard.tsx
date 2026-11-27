'use client';

import React from 'react';
import { Document } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCheck,
  File,
  Eye,
  Download,
  FolderInput,
  Edit,
  Trash2,
  Calendar,
  HardDrive,
  Tag,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DocumentCardProps {
  document: Document;
  viewMode: 'grid' | 'list';
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onMove: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getDocumentIcon(type: string, mimeType: string) {
  if (type === 'PDF' || mimeType === 'application/pdf') {
    return <FileText className="w-8 h-8 text-rose-500" />;
  }
  if (type === 'IMAGE' || mimeType.startsWith('image/')) {
    return <FileImage className="w-8 h-8 text-blue-500" />;
  }
  if (type === 'SPREADSHEET' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
  }
  if (type === 'INVOICE' || type === 'RECEIPT') {
    return <FileCheck className="w-8 h-8 text-amber-500" />;
  }
  return <File className="w-8 h-8 text-slate-500" />;
}

const CATEGORY_COLORS: Record<string, string> = {
  IDENTITY: 'bg-blue-50 text-blue-700 border-blue-200',
  FINANCIAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INSURANCE: 'bg-purple-50 text-purple-700 border-purple-200',
  LEGAL: 'bg-amber-50 text-amber-700 border-amber-200',
  MEDICAL: 'bg-rose-50 text-rose-700 border-rose-200',
  EDUCATION: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  EMPLOYMENT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  PERSONAL: 'bg-teal-50 text-teal-700 border-teal-200',
  OTHER: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function DocumentCard({
  document,
  viewMode,
  onPreview,
  onDownload,
  onMove,
  onEdit,
  onDelete,
}: DocumentCardProps) {
  const formattedDate = (() => {
    try {
      return format(parseISO(document.createdAt), 'MMM d, yyyy');
    } catch {
      return 'Recent';
    }
  })();

  const badgeClass = CATEGORY_COLORS[document.category] || CATEGORY_COLORS.OTHER;

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group">
        <div className="flex items-center space-x-3 min-w-0 flex-1 pr-4">
          <div className="p-2 bg-slate-50 rounded-lg group-hover:scale-105 transition-transform flex-shrink-0">
            {getDocumentIcon(document.type, document.mimeType)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-slate-900 truncate">
                {document.name}
              </h4>
              <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                {document.category}
              </Badge>
              {document.folder && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-medium"
                  style={{ borderLeftColor: document.folder.color || '#64748b', borderLeftWidth: '3px' }}
                >
                  {document.folder.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
              <span>{document.originalName}</span>
              <span>•</span>
              <span>{formatFileSize(document.size)}</span>
              <span>•</span>
              <span>{formattedDate}</span>
              {document.tags && document.tags.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>{document.tags.slice(0, 3).join(', ')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPreview(document)}
            title="Preview"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload(document)}
            title="Download"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove(document)}
            title="Move to Folder"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <FolderInput className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(document)}
            title="Edit Details"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(document)}
            title="Delete"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-105 transition-transform">
            {getDocumentIcon(document.type, document.mimeType)}
          </div>
          <Badge variant="outline" className={`text-xs ${badgeClass}`}>
            {document.category}
          </Badge>
        </div>

        <h4 className="text-sm font-semibold text-slate-900 truncate mb-1" title={document.name}>
          {document.name}
        </h4>
        <p className="text-xs text-slate-500 truncate mb-2" title={document.originalName}>
          {document.originalName}
        </p>

        {document.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
            {document.description}
          </p>
        )}

        {document.folder && (
          <div className="mb-3">
            <span
              className="text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-medium inline-block truncate max-w-full"
              style={{ borderLeftColor: document.folder.color || '#64748b', borderLeftWidth: '3px' }}
            >
              {document.folder.name}
            </span>
          </div>
        )}

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {document.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="flex items-center space-x-1">
            <HardDrive className="w-3 h-3" />
            <span>{formatFileSize(document.size)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </span>
        </div>

        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => onPreview(document)}
            title="Preview"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload(document)}
            title="Download"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove(document)}
            title="Move to Folder"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <FolderInput className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(document)}
            title="Edit Details"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(document)}
            title="Delete"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
