'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialData } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import Sidebar from '@/components/layout/Sidebar';
import CommandPalette from '@/components/layout/CommandPalette';
import { 
  Plus, 
  FileText, 
  Database, 
  Layers, 
  Clock, 
  ChevronRight, 
  Cloud, 
  Monitor, 
  Zap,
  Sparkles,
  HelpCircle,
  Menu
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export default function WorkspaceHubClient() {
  const { createNewCanvas } = useCanvasSync();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Trigger seeding on application load
  useEffect(() => {
    seedInitialData();
  }, []);

  // Monitor keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
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

  // Load metrics from IndexedDB
  const canvases = useLiveQuery(() => db.canvases.toArray()) || [];
  const elements = useLiveQuery(() => db.elements.toArray()) || [];
  const collections = useLiveQuery(() => db.collections.toArray()) || [];
  const syncQueueCount = useLiveQuery(() => db.syncQueue.count()) || 0;

  const rootCanvases = canvases.filter(c => !c.parentId && !c.isArchived);

  const handleLaunchCanvas = async () => {
    const id = await createNewCanvas(null);
    window.location.href = `/canvas/${id}`;
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-[#1A1A1A] bg-[#F4F7F6]">
      {/* Recursively Tree Sidebar */}
      <Sidebar 
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} 
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Dashboard */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-[#1A1A1A] pb-5">
          <div className="flex items-start justify-between w-full md:w-auto">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold bg-[#FFB703] text-[#1A1A1A] border-2 border-[#1A1A1A] px-2.5 py-0.5 uppercase rounded-none neo-shadow-sm animate-pulse">
                  Global Workspace active
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mt-1 text-[#1A1A1A]">
                Zenith Canvas Hub
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1">
                A fast, offline-saved, simple document editor that lets you write notes, create tables, and stay organized.
              </p>
            </div>

            {/* Mobile Menu Trigger Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden flex items-center justify-center p-2.5 border-2 border-[#1A1A1A] bg-[#FFB703] neo-shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-[#1A1A1A]" />
            </button>
          </div>

          <button
            onClick={handleLaunchCanvas}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#FFB703] border-2 border-[#1A1A1A] neo-shadow text-sm font-bold uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Page</span>
          </button>
        </div>

        {/* Bento Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Box 1: Canvases */}
          <div className="bg-white border-2 border-[#1A1A1A] neo-shadow p-5 rounded-none space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 border-2 border-[#1A1A1A] bg-[#FFB703] flex items-center justify-center rounded-none font-bold">
              <FileText className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-wider">Total Pages</div>
              <div className="text-2xl font-black text-[#1A1A1A] mt-0.5">{canvases.length} Pages</div>
            </div>
          </div>

          {/* Box 2: Databases */}
          <div className="bg-white border-2 border-[#1A1A1A] neo-shadow p-5 rounded-none space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 border-2 border-[#1A1A1A] bg-[#2D6A4F] flex items-center justify-center rounded-none font-bold">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-wider">Collections</div>
              <div className="text-2xl font-black text-[#1A1A1A] mt-0.5">{collections.length} Tables</div>
            </div>
          </div>

          {/* Box 3: Elements count */}
          <div className="bg-white border-2 border-[#1A1A1A] neo-shadow p-5 rounded-none space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 border-2 border-[#1A1A1A] bg-amber-100 flex items-center justify-center rounded-none font-bold">
              <Layers className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-wider">Total Blocks</div>
              <div className="text-2xl font-black text-[#1A1A1A] mt-0.5">{elements.length} Blocks</div>
            </div>
          </div>

          {/* Box 4: Queue State */}
          <div className="bg-white border-2 border-[#1A1A1A] neo-shadow p-5 rounded-none space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 border-2 border-[#1A1A1A] bg-emerald-100 flex items-center justify-center rounded-none font-bold">
              <Clock className="w-5 h-5 text-[#2D6A4F]" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-wider">Sync State</div>
              <div className="text-2xl font-black text-[#1A1A1A] mt-0.5">{syncQueueCount === 0 ? 'Fully Saved' : `${syncQueueCount} Saving`}</div>
            </div>
          </div>
        </div>

        {/* Root Node List Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold uppercase tracking-wider text-[#1A1A1A] flex items-center space-x-2">
            <span>Primary Workspace Pages</span>
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rootCanvases.length === 0 ? (
              <div className="col-span-full border-2 border-dashed border-[#1A1A1A] p-12 text-center bg-white rounded-none">
                <p className="text-sm font-bold text-gray-500">No active pages yet. Create a new page to get started!</p>
                <button
                  onClick={handleLaunchCanvas}
                  className="mt-4 px-4 py-2 bg-[#FFB703] border-2 border-[#1A1A1A] text-xs font-bold uppercase rounded-none neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                >
                  Create Page
                </button>
              </div>
            ) : (
              rootCanvases.map(canvas => (
                <Link href={`/canvas/${canvas.id}`} key={canvas.id}>
                  <div className="bg-white border-2 border-[#1A1A1A] neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all p-5 flex flex-col justify-between h-48 cursor-pointer relative overflow-hidden group">
                    {/* Background Seed representation card */}
                    <div className="absolute right-0 top-0 w-24 h-full bg-[#F4F7F6] border-l border-[#1A1A1A] translate-x-4 skew-x-12 opacity-30 group-hover:opacity-100 group-hover:translate-x-0 group-hover:skew-x-0 transition-all duration-300" />

                    <div className="relative z-10 space-y-2">
                      <div className="w-10 h-10 border-2 border-[#1A1A1A] bg-white rounded-none flex items-center justify-center font-bold text-xl neo-shadow-sm">
                        {canvas.icon || '📄'}
                      </div>
                      <h3 className="text-base font-black text-[#1A1A1A] line-clamp-1 group-hover:text-[#2D6A4F] transition-colors">
                        {canvas.title || 'Untitled Document'}
                      </h3>
                      <p className="text-xs font-mono text-gray-400">
                        Updated {new Date(canvas.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-xs font-extrabold text-[#2D6A4F] font-mono mt-4 pt-3 border-t border-gray-100">
                      <span>OPEN PAGE</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Feature Highlights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
          <div className="border-2 border-[#1A1A1A] bg-[#2D6A4F] text-white p-5 rounded-none neo-shadow space-y-3">
            <h3 className="text-sm font-black uppercase font-mono text-[#FFB703] flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>Offline-Saved Pages</span>
            </h3>
            <p className="text-xs font-medium leading-relaxed opacity-90">
              Zenith Canvas saves your work automatically to your browser. You can write, edit, and create with zero delays. When you go online, your edits are safely backed up to the cloud.
            </p>
          </div>

          <div className="border-2 border-[#1A1A1A] bg-white p-5 rounded-none neo-shadow space-y-3">
            <h3 className="text-sm font-black uppercase font-mono text-[#2D6A4F] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Smart Data Tables</span>
            </h3>
            <p className="text-xs font-medium text-gray-600 leading-relaxed">
              Create databases right inside your pages. Switch easily between table grids and boards. You can easily filter and search through your rows.
            </p>
          </div>
        </div>
      </main>

      {/* Global Command Search Overlay */}
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
