'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import Sidebar from '@/components/layout/Sidebar';
import CommandPalette from '@/components/layout/CommandPalette';
import CanvasEditor from '@/components/editor/CanvasEditor';
import { 
  ChevronLeft, 
  Trash2, 
  Smile, 
  Image as ImageIcon, 
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Cloud,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';

const EMOJIS = ['📄', '🚀', '🎯', '📊', '💡', '🔥', '🎨', '⚙️', '📅', '📝', '🔒', '🛠️', '📣', '🌍'];

export default function CanvasWorkspace() {
  const params = useParams();
  const router = useRouter();
  const canvasId = params?.canvasId as string;

  const { 
    updateCanvasTitle, 
    updateCanvasCover, 
    updateCanvasIcon, 
    deleteCanvasAndChildren,
    syncStatus,
    isOnline
  } = useCanvasSync();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverInput, setShowCoverInput] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');

  // 1. Fetch current canvas details
  const canvas = useLiveQuery(() => db.canvases.get(canvasId), [canvasId]);

  // Handle global key shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update cover input value when canvas cover changes
  useEffect(() => {
    if (canvas?.coverImage) {
      const cover = canvas.coverImage;
      setTimeout(() => {
        setCoverUrl(cover);
      }, 0);
    }
  }, [canvas?.coverImage]);

  const handleTitleChange = async (newTitle: string) => {
    if (canvasId) {
      await updateCanvasTitle(canvasId, newTitle);
    }
  };

  const handleSelectEmoji = async (emoji: string) => {
    if (canvasId) {
      await updateCanvasIcon(canvasId, emoji);
      setShowEmojiPicker(false);
    }
  };

  const handleSaveCover = async () => {
    if (canvasId) {
      await updateCanvasCover(canvasId, coverUrl || null);
      setShowCoverInput(false);
    }
  };

  const handleDeleteCurrent = async () => {
    if (confirm('Are you sure you want to delete this canvas node and all nested child cards?')) {
      await deleteCanvasAndChildren(canvasId);
      router.push('/');
    }
  };

  if (canvas === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F7F6]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#2D6A4F] animate-spin" />
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
            Resolving Zenith Node Ledger...
          </p>
        </div>
      </div>
    );
  }

  if (canvas === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F7F6] p-6">
        <div className="max-w-md w-full border-4 border-[#1A1A1A] bg-white neo-shadow p-6 text-center space-y-4">
          <h2 className="text-xl font-black text-red-500">404 CANVAS NOT FOUND</h2>
          <p className="text-xs font-medium text-gray-500">
            This Zenith Canvas node has either been garbage collected, archived, or deleted from the local ledger.
          </p>
          <Link href="/">
            <button className="w-full py-2 bg-[#FFB703] border-2 border-[#1A1A1A] text-xs font-bold uppercase neo-shadow-sm">
              Return to Hub
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans text-[#1A1A1A] bg-[#F4F7F6]">
      {/* Sidebar navigation */}
      <Sidebar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

      {/* Main editor page container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Control Header */}
        <header className="h-14 border-b-2 border-[#1A1A1A] bg-white px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <button className="p-1 border border-transparent hover:border-[#1A1A1A] hover:bg-gray-100 rounded text-gray-500 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Link>
            <span className="text-xs font-mono font-bold text-gray-400">
              Canvases / {canvas.title || 'Untitled Node'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Sync Indicators */}
            <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold bg-[#F4F7F6] border-2 border-[#1A1A1A] px-2.5 py-1 rounded-none neo-shadow-sm">
              <Cloud className={`w-3.5 h-3.5 ${isOnline ? 'text-[#2D6A4F]' : 'text-red-500'}`} />
              <span className="text-[#1A1A1A] uppercase">
                {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'saved' ? 'Ledger Synced' : syncStatus}
              </span>
            </div>

            {/* Document actions */}
            <button
              onClick={() => setShowCoverInput(!showCoverInput)}
              className="p-1.5 border-2 border-[#1A1A1A] bg-white rounded-none hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center space-x-1"
              title="Change cover"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cover</span>
            </button>

            <button
              onClick={handleDeleteCurrent}
              className="p-1.5 border-2 border-red-500 bg-white text-red-500 rounded-none hover:bg-red-500 hover:text-white text-xs font-bold flex items-center space-x-1 transition-colors"
              title="Delete Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </header>

        {/* Cover image area */}
        <div className="flex-1 overflow-y-auto relative">
          
          {/* Dynamic Cover Banner */}
          {canvas.coverImage && (
            <div className="h-44 sm:h-56 w-full relative border-b-2 border-[#1A1A1A] overflow-hidden bg-slate-200">
              <img 
                src={canvas.coverImage} 
                alt="Canvas Cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Cover Input Field */}
          {showCoverInput && (
            <div className="max-w-4xl mx-auto px-6 mt-4">
              <div className="bg-white border-2 border-[#1A1A1A] neo-shadow-sm p-3 rounded-none flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={coverUrl}
                  placeholder="Paste cover image link (Unsplash, Picsum, etc.)..."
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="flex-1 text-xs font-mono outline-none border-none text-[#1A1A1A]"
                />
                <button
                  onClick={handleSaveCover}
                  className="px-3 py-1 bg-[#2D6A4F] text-white border-2 border-[#1A1A1A] text-xs font-bold uppercase rounded-none"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Canvas Title, Icon Header Block */}
          <div className="max-w-4xl mx-auto px-6 pt-8 space-y-4">
            
            {/* Emoji Icon Badge */}
            <div className="relative inline-block">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-16 h-16 border-4 border-[#1A1A1A] bg-white hover:bg-gray-50 neo-shadow flex items-center justify-center font-bold text-3xl transition-all cursor-pointer"
              >
                {canvas.icon || '📄'}
              </button>

              {/* Popover Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute top-20 left-0 z-30 w-52 bg-white border-2 border-[#1A1A1A] neo-shadow-sm p-2 grid grid-cols-5 gap-1">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title Editor */}
            <input
              type="text"
              value={canvas.title}
              placeholder="Untitled Document"
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight placeholder-gray-300 font-sans"
            />
          </div>

          {/* Poly-morphic block list Canvas Editor */}
          <CanvasEditor canvasId={canvasId} />

        </div>
      </div>

      {/* Global Command palette Search overlay */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette 
            isOpen={isCommandPaletteOpen} 
            onClose={() => setIsCommandPaletteOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
