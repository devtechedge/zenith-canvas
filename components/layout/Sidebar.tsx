'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Canvas } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import { 
  Plus, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Search, 
  Settings, 
  Database,
  CloudLightning,
  CloudOff,
  RefreshCw,
  Layout,
  FileText,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface SidebarProps {
  onOpenCommandPalette: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ onOpenCommandPalette, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const params = useParams();
  const currentCanvasId = params?.canvasId as string;
  const { syncStatus, isOnline, createNewCanvas, deleteCanvasAndChildren } = useCanvasSync();
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Load all non-archived canvases
  const canvases = useLiveQuery(() => 
    db.canvases.where('isArchived').equals(0).toArray()
  ) || [];

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'canvas-root-1': true // Expand product launch by default
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateRootCanvas = async () => {
    const id = await createNewCanvas(null);
    window.location.href = `/canvas/${id}`;
  };

  const handleCreateSubCanvas = async (parentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [parentId]: true }));
    const id = await createNewCanvas(parentId);
    window.location.href = `/canvas/${id}`;
  };

  const handleDeleteCanvas = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteCandidateId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteCandidateId) {
      await deleteCanvasAndChildren(deleteCandidateId);
      if (currentCanvasId === deleteCandidateId) {
        window.location.href = '/';
      }
      setDeleteCandidateId(null);
    }
  };

  // Build recursive hierarchy tree
  const rootCanvases = canvases.filter(c => !c.parentId);

  // Simple HTML5 Drag and Drop for Canvas parenting hierarchy
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetParentId: string | null) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetParentId) {
      // Prevent cyclic parenting
      let tempParentId = targetParentId;
      let isCyclic = false;
      while (tempParentId) {
        if (tempParentId === draggedId) {
          isCyclic = true;
          break;
        }
        const parentNode = canvases.find(c => c.id === tempParentId);
        tempParentId = parentNode?.parentId || null;
      }

      if (!isCyclic) {
        await db.canvases.update(draggedId, { parentId: targetParentId, updatedAt: new Date() });
      }
    }
  };

  // Render a canvas node and its children recursively
  const renderCanvasNode = (canvas: Canvas, depth: number = 0) => {
    const children = canvases.filter(c => c.parentId === canvas.id);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedNodes[canvas.id];
    const isActive = currentCanvasId === canvas.id;

    return (
      <div 
        key={canvas.id} 
        className="w-full"
        draggable
        onDragStart={(e) => handleDragStart(e, canvas.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, canvas.id)}
      >
        <Link href={`/canvas/${canvas.id}`}>
          <div 
            className={`group flex items-center justify-between px-2 py-1.5 mx-2 my-0.5 rounded border-2 transition-all cursor-pointer ${
              isActive 
                ? 'bg-[#2D6A4F] text-white border-[#1A1A1A] neo-shadow-sm' 
                : 'hover:bg-white text-[#1A1A1A] border-transparent hover:border-[#1A1A1A]'
            }`}
            style={{ paddingLeft: `${Math.max(8, depth * 12 + 4)}px` }}
          >
            <div className="flex items-center space-x-1.5 min-w-0">
              <button 
                onClick={(e) => toggleExpand(canvas.id, e)}
                className={`p-0.5 rounded hover:bg-black/10 transition-colors ${!hasChildren ? 'opacity-25 cursor-default' : ''}`}
                disabled={!hasChildren}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              <span className="text-sm select-none">{canvas.icon || '📄'}</span>
              <span className="text-[8px] font-mono font-black border border-[#1A1A1A] px-1 bg-[#1A1A1A] text-[#FFB703] rounded-sm uppercase tracking-tighter select-none flex-shrink-0">LEVEL {depth + 1}</span>
              <span className="text-sm font-medium truncate select-none">{canvas.title || 'Untitled'}</span>
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => handleCreateSubCanvas(canvas.id, e)}
                title="Add inside"
                className="p-0.5 rounded hover:bg-black/15 text-inherit"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => handleDeleteCanvas(canvas.id, e)}
                title="Delete Canvas"
                className="p-0.5 rounded hover:bg-red-500 hover:text-white text-inherit"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Link>

        {/* Recursive Children */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {children.map(child => renderCanvasNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity cursor-pointer"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 h-screen bg-[#F4F7F6] border-r-2 border-[#1A1A1A] flex flex-col justify-between overflow-hidden transition-transform duration-300 md:translate-x-0 md:static md:flex
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Upper Brand Section */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-4 border-b-2 border-[#1A1A1A] bg-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FFB703] border-2 border-[#1A1A1A] neo-shadow-sm flex items-center justify-center font-bold text-sm">
                ZN
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight">ZENITH WORKSPACE</h1>
                <p className="text-[10px] font-mono text-gray-500">v1.5.0</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 border border-[#1A1A1A] bg-white rounded-none hover:bg-gray-100"
              title="Close Menu"
            >
              <X className="w-4 h-4 text-[#1A1A1A]" />
            </button>
          </div>

        {/* Search Palette Trigger */}
        <div className="p-3">
          <button 
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#1A1A1A] rounded neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition-all text-left text-xs text-gray-500 font-medium"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span>Search your pages...</span>
            </div>
            <kbd className="bg-[#F4F7F6] px-1.5 py-0.5 border border-[#1A1A1A] rounded font-mono text-[9px] text-[#1A1A1A]">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-2">
          <div className="flex items-center justify-between px-4 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <span>All Pages</span>
            <button 
              onClick={handleCreateRootCanvas}
              title="New Page"
              className="p-1 border border-[#1A1A1A] bg-[#FFB703] text-[#1A1A1A] neo-shadow-sm rounded hover:bg-amber-400"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div 
            className="mt-2 flex flex-col space-y-0.5 min-h-[200px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
          >
            {rootCanvases.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400 font-medium">
                No pages here yet.<br />
                <button 
                  onClick={handleCreateRootCanvas}
                  className="mt-2 text-xs text-[#2D6A4F] underline font-bold"
                >
                  Create one now
                </button>
              </div>
            ) : (
              rootCanvases.map(canvas => renderCanvasNode(canvas, 0))
            )}
          </div>
        </div>
      </div>

      {/* Footer Sync & Status Section */}
      <div className="p-3 bg-white border-t-2 border-[#1A1A1A] space-y-2">
        <div className="flex items-center justify-between bg-[#F4F7F6] border-2 border-[#1A1A1A] p-2 rounded">
          <div className="flex items-center space-x-1.5">
            {isOnline ? (
              <CloudLightning className="w-4 h-4 text-[#2D6A4F] animate-pulse" />
            ) : (
              <CloudOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              {isOnline ? 'Online & Syncing' : 'Offline (Saved)'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${
              syncStatus === 'saved' ? 'bg-green-500' :
              syncStatus === 'syncing' ? 'bg-amber-500 animate-ping' :
              syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className="text-[10px] font-mono uppercase font-bold text-gray-500">
              {syncStatus}
            </span>
          </div>
        </div>

        {/* Global Home Button */}
        <Link href="/">
          <div className="w-full flex items-center justify-center space-x-2 py-2 border-2 border-[#1A1A1A] bg-[#FFB703] neo-shadow-sm text-xs font-bold uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">
            <Layout className="w-3.5 h-3.5" />
            <span>Workspace Dashboard</span>
          </div>
        </Link>
      </div>

      <ConfirmDialog
        isOpen={deleteCandidateId !== null}
        onClose={() => setDeleteCandidateId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Canvas"
        message="Are you sure you want to delete this canvas and all its nested sub-canvases? This action is irreversible."
      />
    </aside>
    </>
  );
}
