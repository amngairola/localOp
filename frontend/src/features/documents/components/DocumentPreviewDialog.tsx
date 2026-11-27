'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Calendar,
  HardDrive,
  Folder as FolderIcon,
  Tag,
  Loader2,
} from 'lucide-react';
import { formatFileSize } from './DocumentCard';
import { documentsApi } from '../api/documents.api';
import { format, parseISO } from 'date-fns';

interface DocumentPreviewDialogProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
  onDownload: (doc: Document) => void;
}

export function DocumentPreviewDialog({
  isOpen,
  document,
  onClose,
  onDownload,
}: DocumentPreviewDialogProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document && isOpen) {
      if (document.signedUrl) {
        setSignedUrl(document.signedUrl);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
        documentsApi
          .getSignedUrl(document.id)
          .then((url) => setSignedUrl(url))
          .catch((err) => setError(err?.message || 'Could not load preview URL'))
          .finally(() => setLoading(false));
      }
    } else {
      setSignedUrl(null);
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const isImage =
    document.type === 'IMAGE' || document.mimeType.startsWith('image/');
  const isPdf =
    document.type === 'PDF' || document.mimeType === 'application/pdf';

  const formattedDate = (() => {
    try {
      return format(parseISO(document.createdAt), 'MMMM d, yyyy h:mm a');
    } catch {
      return 'Recent';
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 pr-4">
            <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {document.name}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {document.originalName} • {formatFileSize(document.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload(document)}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download
            </Button>
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content / Preview Area */}
        <div className="flex-1 bg-slate-100 p-4 overflow-y-auto flex items-center justify-center min-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center space-y-2 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-sm">Generating secure preview...</span>
            </div>
          ) : error ? (
            <div className="bg-white p-6 rounded-xl border border-rose-200 text-center max-w-md shadow-sm">
              <p className="text-sm text-rose-600 mb-3">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(document)}
              >
                Try Direct Download
              </Button>
            </div>
          ) : isImage && signedUrl ? (
            <div className="max-h-[60vh] max-w-full overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={document.name}
                className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : isPdf && signedUrl ? (
            <iframe
              src={`${signedUrl}#toolbar=0`}
              title={document.name}
              className="w-full h-[60vh] rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md shadow-sm">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-800 text-base mb-1">
                Preview Not Available
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                This file format ({document.mimeType}) cannot be rendered directly in the browser. You can securely download it to view on your device.
              </p>
              <Button
                onClick={() => onDownload(document)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download {document.originalName}
              </Button>
            </div>
          )}
        </div>

        {/* Footer Metadata */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex-shrink-0 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-xs">
              {document.category}
            </Badge>
            {document.folder && (
              <span className="flex items-center space-x-1 font-medium text-slate-700">
                <FolderIcon
                  className="w-3.5 h-3.5"
                  style={{ color: document.folder.color || '#64748b' }}
                />
                <span>{document.folder.name}</span>
              </span>
            )}
            <span>Uploaded: {formattedDate}</span>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>{document.tags.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
