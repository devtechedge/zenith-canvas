'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Canvas } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Search, 
  CloudLightning,
  CloudOff,
  Layout,
  Star,
  Trash,
  Undo2,
  X,
  Pin,
  FolderOpen,
  Folder,
  SlidersHorizontal,
  FolderTree,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface SidebarProps {
  onOpenCommandPalette: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ onOpenCommandPalette, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const params = useParams();
  const router = useRouter();
  const currentCanvasId = params?.canvasId as string;
  const { syncStatus, isOnline, createNewCanvas, deleteCanvasAndChildren } = useCanvasSync();
  
  // State variables for our Batch 3 features
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('zenith-favorites') || '[]');
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [trashList, setTrashList] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('zenith-trashbin') || '[]');
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedExpanded = JSON.parse(localStorage.getItem('zenith-expanded-nodes') || '{}');
        if (Object.keys(storedExpanded).length === 0) {
          storedExpanded['canvas-root-1'] = true;
        }
        return storedExpanded;
      } catch (e) {
        return { 'canvas-root-1': true };
      }
    }
    return { 'canvas-root-1': true };
  });

  // Load all non-archived canvases
  const canvases = useLiveQuery(() => 
    db.canvases.where('isArchived').equals(0).toArray()
  ) || [];

  // No-op useEffect for safety or hydration sync
  useEffect(() => {
    // Keep in sync if needed, but states are already loaded via lazy init
  }, []);

  // Sync expanded node states back to localStorage
  const saveExpandedNodes = (newStates: Record<string, boolean>) => {
    setExpandedNodes(newStates);
    localStorage.setItem('zenith-expanded-nodes', JSON.stringify(newStates));
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextStates = { ...expandedNodes, [id]: !expandedNodes[id] };
    saveExpandedNodes(nextStates);
  };

  const handleExpandAll = () => {
    const nextStates: Record<string, boolean> = {};
    canvases.forEach(c => {
      nextStates[c.id] = true;
    });
    saveExpandedNodes(nextStates);
  };

  const handleCollapseAll = () => {
    saveExpandedNodes({});
  };

  const handleCreateRootCanvas = async () => {
    const id = await createNewCanvas(null);
    router.push(`/canvas/${id}`);
  };

  const handleCreateSubCanvas = async (parentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextStates = { ...expandedNodes, [parentId]: true };
    saveExpandedNodes(nextStates);
    const id = await createNewCanvas(parentId);
    router.push(`/canvas/${id}`);
  };

  const handleDeleteCanvas = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteCandidateId(id);
  };

  // Feature 25: Archive to local Trashbin before Dexie deletion
  const handleConfirmDelete = async () => {
    if (deleteCandidateId) {
      const targetCanvas = canvases.find(c => c.id === deleteCandidateId);
      if (targetCanvas) {
        const trashRecord = {
          id: targetCanvas.id,
          title: targetCanvas.title || 'Untitled Document',
          icon: targetCanvas.icon || '📄',
          parentId: targetCanvas.parentId,
          deletedAt: new Date().toISOString()
        };
        const currentTrash = [...trashList, trashRecord];
        setTrashList(currentTrash);
        localStorage.setItem('zenith-trashbin', JSON.stringify(currentTrash));
      }

      await deleteCanvasAndChildren(deleteCandidateId);
      
      // Remove from favorites if it was favorited
      const filteredFavs = favorites.filter(fid => fid !== deleteCandidateId);
      setFavorites(filteredFavs);
      localStorage.setItem('zenith-favorites', JSON.stringify(filteredFavs));

      if (currentCanvasId === deleteCandidateId) {
        router.push('/');
      }
      setDeleteCandidateId(null);
    }
  };

  // Feature 25: Restore Soft-Deleted Page
  const handleRestoreFromTrash = useCallback(async (item: any) => {
    try {
      const restoredCanvas: Canvas = {
        id: item.id,
        workspaceId: 'ws-enterprise-default',
        parentId: item.parentId || null,
        title: item.title,
        icon: item.icon,
        coverImage: 'https://picsum.photos/seed/' + item.id + '/1200/400',
        isArchived: false,
        updatedAt: new Date()
      };

      // Add to database
      await db.canvases.put(restoredCanvas);

      // Register transaction in sync queue
      await db.syncQueue.add({
        table: 'canvases',
        action: 'insert',
        recordId: item.id,
        data: JSON.stringify(restoredCanvas),
        timestamp: Date.now()
      });

      // Filter trash
      const updatedTrash = trashList.filter(t => t.id !== item.id);
      setTrashList(updatedTrash);
      localStorage.setItem('zenith-trashbin', JSON.stringify(updatedTrash));

      router.push(`/canvas/${item.id}`);
    } catch (err) {
      console.error('Failed to restore from trash:', err);
    }
  }, [trashList, router]);

  const handleClearTrash = () => {
    if (confirm('Are you sure you want to permanently empty the recently closed trash folder?')) {
      setTrashList([]);
      localStorage.setItem('zenith-trashbin', JSON.stringify([]));
    }
  };

  // Feature 24: Unfavorite toggler helper
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(fid => fid !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('zenith-favorites', JSON.stringify(updated));
  };

  // Feature 28: Drag and drop hierarchy modification with visual highlights
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    if (dragOverNodeId !== targetId) {
      setDragOverNodeId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverNodeId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetParentId: string | null) => {
    e.preventDefault();
    setDragOverNodeId(null);
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
        // Expand the target folder so the dropped node is visible
        if (targetParentId) {
          saveExpandedNodes({ ...expandedNodes, [targetParentId]: true });
        }
      }
    }
  };

  // Compute root level items
  const rootCanvases = canvases.filter(c => !c.parentId);

  // Feature 24: Filtered favorite pages list
  const favoritedCanvases = canvases.filter(c => favorites.includes(c.id));

  // Count sub-pages recursive helper
  const countSubPages = (canvasId: string): number => {
    const directChildren = canvases.filter(c => c.parentId === canvasId);
    return directChildren.length + directChildren.reduce((acc, child) => acc + countSubPages(child.id), 0);
  };

  // Render recursion for our Infinite Navigation Tree Sidebar
  const renderCanvasNode = (canvas: Canvas, depth: number = 0) => {
    const children = canvases.filter(c => c.parentId === canvas.id);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedNodes[canvas.id];
    const isActive = currentCanvasId === canvas.id;
    const isNodeFavorited = favorites.includes(canvas.id);
    const nestedCount = countSubPages(canvas.id);

    // Apply sidebar search filters
    const matchesSearch = canvas.title.toLowerCase().includes(sidebarSearch.toLowerCase());
    const hasMatchingChildren = children.some(child => 
      child.title.toLowerCase().includes(sidebarSearch.toLowerCase()) || 
      countSubPages(child.id) > 0
    );

    // Skip rendering if search doesn't match this node hierarchy
    if (sidebarSearch && !matchesSearch && !hasMatchingChildren) {
      return null;
    }

    const isHoveredTarget = dragOverNodeId === canvas.id;

    return (
      <div 
        key={canvas.id} 
        className="w-full relative group/node"
        draggable
        onDragStart={(e) => handleDragStart(e, canvas.id)}
        onDragOver={(e) => handleDragOver(e, canvas.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, canvas.id)}
      >
        <Link href={`/canvas/${canvas.id}`}>
          <div 
            className={`flex items-center justify-between px-2 py-1.5 mx-2 my-0.5 rounded border-2 transition-all cursor-pointer relative ${
              isActive 
                ? 'bg-[#2D6A4F] text-white border-[#1A1A1A] neo-shadow-sm font-bold' 
                : isHoveredTarget
                  ? 'bg-emerald-100 border-[#1A1A1A] text-[#1A1A1A] scale-[1.01] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]'
                  : 'hover:bg-white text-[#1A1A1A] border-transparent hover:border-[#1A1A1A]'
            }`}
            style={{ paddingLeft: `${Math.max(8, depth * 14 + 6)}px` }}
          >
            {/* Left Border visual guidelines lines for nested levels (Feature 22) */}
            {depth > 0 && (
              <div 
                className="absolute left-0 top-0 bottom-0 border-l-2 border-[#1A1A1A]/15 pointer-events-none" 
                style={{ left: `${depth * 14 - 2}px` }}
              />
            )}

            <div className="flex items-center space-x-1.5 min-w-0 z-10">
              <button 
                onClick={(e) => toggleExpand(canvas.id, e)}
                className={`p-0.5 rounded hover:bg-black/10 transition-colors ${!hasChildren ? 'opacity-20 cursor-default' : 'cursor-pointer'}`}
                disabled={!hasChildren}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              <span className="text-sm select-none flex-shrink-0">{canvas.icon || '📄'}</span>
              <span className="text-sm font-semibold truncate select-none">{canvas.title || 'Untitled'}</span>
              
              {/* Feature 22: Nest count subpages indicator */}
              {nestedCount > 0 && !isActive && (
                <span className="text-[9px] font-mono font-black px-1.5 py-0.25 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 text-gray-500 rounded-sm">
                  {nestedCount}
                </span>
              )}
            </div>

            {/* Quick interactive controls */}
            <div className="flex items-center space-x-0.5 opacity-0 group-hover/node:opacity-100 transition-opacity z-10">
              <button 
                onClick={(e) => handleToggleFavorite(canvas.id, e)}
                title={isNodeFavorited ? "Unpin Favorite" : "Pin Favorite"}
                className={`p-0.5 rounded hover:bg-black/10 ${isNodeFavorited ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-[#1A1A1A]'}`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
              </button>
              <button 
                onClick={(e) => handleCreateSubCanvas(canvas.id, e)}
                title="Create child note inside"
                className="p-0.5 rounded hover:bg-black/10 text-gray-500 hover:text-[#1A1A1A]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => handleDeleteCanvas(canvas.id, e)}
                title="Send page to Trash"
                className="p-0.5 rounded hover:bg-red-500 hover:text-white text-gray-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Link>

        {/* Recursive Children elements */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col relative">
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
          <div className="p-4 border-b-2 border-[#1A1A1A] bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FFB703] border-2 border-[#1A1A1A] neo-shadow-sm flex items-center justify-center font-bold text-sm">
                ZN
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight">ZENITH CANVAS</h1>
                <p className="text-[10px] font-mono text-gray-500">v1.6.0</p>
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

          {/* Feature 26: Global Search bar trigger */}
          <div className="p-3 border-b border-[#1A1A1A]/10">
            <button 
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#1A1A1A] rounded neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition-all text-left text-xs text-gray-500 font-medium"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>Quick Find (Ctrl+K)...</span>
              </div>
              <kbd className="bg-[#F4F7F6] px-1.5 py-0.5 border border-[#1A1A1A] rounded font-mono text-[9px] text-[#1A1A1A]">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Feature 24: Favorite Pages Quick Deck Pinboard Space */}
          {favoritedCanvases.length > 0 && (
            <div className="p-3 bg-amber-50/50 border-b-2 border-[#1A1A1A] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black tracking-wider uppercase text-amber-700">
                <span className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
                  <span>Favorite Pages Deck</span>
                </span>
                <span className="bg-[#FFB703] text-[#1A1A1A] border border-[#1A1A1A] px-1.5 py-0.25 text-[8px] font-bold">
                  PINBOARD
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {favoritedCanvases.map(fav => (
                  <Link key={fav.id} href={`/canvas/${fav.id}`}>
                    <div 
                      className={`flex items-center justify-between p-1.5 bg-white border border-[#1A1A1A] rounded-none text-[11px] font-bold cursor-pointer transition-all hover:bg-amber-100 hover:scale-[1.01] select-none ${
                        currentCanvasId === fav.id ? 'ring-2 ring-amber-500 bg-amber-100/50' : ''
                      }`}
                    >
                      <span className="truncate flex items-center space-x-1 min-w-0">
                        <span className="flex-shrink-0 text-xs">{fav.icon || '📄'}</span>
                        <span className="truncate">{fav.title || 'Untitled'}</span>
                      </span>
                      <button 
                        onClick={(e) => handleToggleFavorite(fav.id, e)}
                        className="text-amber-500 hover:text-red-500 p-0.5 ml-0.5 flex-shrink-0"
                        title="Remove from favorites"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Navigation/Sidebar Search Filter & Tree Actions */}
          <div className="px-3 pt-3 flex flex-col space-y-2">
            {/* Real-time search filter */}
            <div className="relative">
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Filter sidebar tree..."
                className="w-full pl-7 pr-6 py-1 bg-white border border-[#1A1A1A] text-xs font-semibold rounded-sm outline-none placeholder-gray-400 focus:border-[#FFB703]"
              />
              <Search className="absolute left-2.5 top-2 w-3 h-3 text-gray-400" />
              {sidebarSearch && (
                <button 
                  onClick={() => setSidebarSearch('')}
                  className="absolute right-2 top-2 p-0.5 hover:bg-gray-100 rounded text-gray-500"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Tree utility actions (Feature 22) */}
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-gray-500 bg-white border border-[#1A1A1A]/10 p-1">
              <span className="uppercase tracking-wider px-1">Navigation Deck</span>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={handleExpandAll}
                  className="px-1.5 py-0.5 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] hover:bg-[#F4F7F6] rounded-xs"
                  title="Expand All Folders"
                >
                  Expand
                </button>
                <button 
                  onClick={handleCollapseAll}
                  className="px-1.5 py-0.5 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] hover:bg-[#F4F7F6] rounded-xs"
                  title="Collapse All Folders"
                >
                  Collapse
                </button>
              </div>
            </div>
          </div>

          {/* All Pages Tree Layout */}
          <div className="flex-1 py-1">
            <div className="flex items-center justify-between px-4 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <span>Primary Nodes</span>
              <div className="flex items-center space-x-1.5">
                {/* Feature 25: Soft deleted trash action button */}
                <button 
                  onClick={() => setIsTrashOpen(true)}
                  title="Recently Closed Pages (Trash)"
                  className="p-1 border border-[#1A1A1A] bg-[#F4F7F6] text-[#1A1A1A] neo-shadow-sm rounded hover:bg-amber-100 relative"
                >
                  <Trash className="w-3 h-3" />
                  {trashList.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full font-black text-[7px] w-3.5 h-3.5 flex items-center justify-center border border-black animate-bounce">
                      {trashList.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={handleCreateRootCanvas}
                  title="Create New Root Node Page"
                  className="p-1 border border-[#1A1A1A] bg-[#FFB703] text-[#1A1A1A] neo-shadow-sm rounded hover:bg-amber-400"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div 
              className="mt-1 flex flex-col space-y-0.5 min-h-[150px] pb-6"
              onDragOver={(e) => handleDragOver(e, null)}
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
        <div className="p-3 bg-white border-t-2 border-[#1A1A1A] space-y-2 flex-shrink-0">
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
          title="Delete Canvas Node"
          message="Are you sure you want to delete this canvas node and its nested pages? This soft-deletes the page and saves a recovery copy in your Sidebar Trashbin."
        />

        {/* Feature 25: Recently Closed Page Trashbin Modal Drawer */}
        <AnimatePresence>
          {isTrashOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border-4 border-[#1A1A1A] w-full max-w-md p-5 rounded-none neo-shadow-lg"
              >
                <div className="flex justify-between items-center pb-3 border-b-2 border-[#1A1A1A]">
                  <div className="flex items-center space-x-2 text-red-600 font-black uppercase text-xs font-mono">
                    <Trash className="w-4 h-4 animate-bounce" />
                    <span>Recently Closed Page Trashbin</span>
                  </div>
                  <button 
                    onClick={() => setIsTrashOpen(false)}
                    className="px-2 py-0.5 text-xs font-bold border-2 border-[#1A1A1A] hover:bg-[#FFB703]"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  Mistakes happen! Browse deleted documents below and restore them back to your navigation tree instantly with full recovery.
                </p>

                <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
                  {trashList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 font-bold border-2 border-dashed border-[#1A1A1A]/10 bg-[#F4F7F6]">
                      Trash is completely empty. No recently closed pages.
                    </div>
                  ) : (
                    trashList.map((item, index) => (
                      <div 
                        key={`${item.id}-${index}`}
                        className="p-3 bg-white border-2 border-[#1A1A1A] hover:scale-[1.01] transition-transform flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-xl flex-shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-[#1A1A1A] truncate">{item.title}</h4>
                            <p className="text-[8px] font-mono text-gray-400 mt-0.5">
                              Closed: {new Date(item.deletedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestoreFromTrash(item)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#FFB703] border border-[#1A1A1A] hover:bg-amber-400 font-bold text-[9px] uppercase tracking-wider transition-colors"
                          title="Restore Page Instantly"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between items-center border-t-2 border-[#1A1A1A] pt-4 mt-4">
                  <button
                    onClick={handleClearTrash}
                    disabled={trashList.length === 0}
                    className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 disabled:opacity-40 disabled:hover:bg-rose-100 border border-[#1A1A1A] font-extrabold text-[9px] uppercase tracking-wider"
                  >
                    Empty Trash
                  </button>
                  <button 
                    onClick={() => setIsTrashOpen(false)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border-2 border-[#1A1A1A] font-extrabold text-[9px] uppercase tracking-wider neo-shadow-sm"
                  >
                    Close Panel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </aside>
    </>
  );
}
