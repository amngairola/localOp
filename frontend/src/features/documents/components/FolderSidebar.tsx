'use client';

import React from 'react';
import { Folder } from '@/types';
import {
  Folder as FolderIcon,
  FolderPlus,
  MoreVertical,
  Edit2,
  Trash2,
  Files,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderSidebarProps {
  folders: Folder[];
  selectedFolderId?: string; // undefined = all, 'root' = unfiled, or folder.id
  totalDocumentCount: number;
  onSelectFolder: (folderId?: string) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
}

export function FolderSidebar({
  folders,
  selectedFolderId,
  totalDocumentCount,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
}: FolderSidebarProps) {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <aside className="w-full md:w-64 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-sm tracking-wide uppercase">
          Folders & Vault
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateFolder}
          className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
        >
          <FolderPlus className="w-3.5 h-3.5 mr-1" />
          New
        </Button>
      </div>

      <nav className="flex flex-col space-y-1">
        {/* All Documents */}
        <button
          onClick={() => onSelectFolder(undefined)}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFolderId === undefined
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate">
            <Files className="w-4 h-4 text-slate-500" />
            <span className="truncate">All Documents</span>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
            {totalDocumentCount}
          </span>
        </button>

        {/* Unfiled / Root */}
        <button
          onClick={() => onSelectFolder('root')}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFolderId === 'root'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate">
            <Inbox className="w-4 h-4 text-slate-500" />
            <span className="truncate">Unfiled (Root)</span>
          </div>
        </button>
      </nav>

      <div className="pt-2 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">
          Custom Folders
        </span>
        {folders.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-2 py-3">No folders yet</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              const isMenuOpen = activeMenuId === folder.id;

              return (
                <div
                  key={folder.id}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex items-center space-x-2.5 truncate flex-1 text-left"
                  >
                    <FolderIcon
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: folder.color || '#64748b' }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {folder.documentCount !== undefined && folder.documentCount > 0 && (
                      <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
                        {folder.documentCount}
                      </span>
                    )}

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : folder.id);
                        }}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-7 w-32 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-30"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onEditFolder(folder);
                            }}
                            className="w-full flex items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-2 text-slate-500" />
                            Rename
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDeleteFolder(folder);
                            }}
                            className="w-full flex items-center px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-500" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
