'use client';

import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Canvas, type CanvasElement } from '@/lib/db/indexeddb';
import { Search, FileText, ChevronRight, X, ArrowDown, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  canvasId: string;
  title: string;
  icon: string;
  type: 'title' | 'element';
  matchSnippet?: string;
  elementType?: string;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read all canvases & elements
  const canvases = useLiveQuery(() => db.canvases.toArray()) || [];
  const elements = useLiveQuery(() => db.elements.toArray()) || [];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle outside click & escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Compute search results
  const results: SearchResult[] = [];

  if (query.trim()) {
    const cleanQuery = query.toLowerCase();

    // 1. Match titles
    const matchingCanvases = canvases.filter(c => 
      c.title.toLowerCase().includes(cleanQuery) && !c.isArchived
    );
    for (const canvas of matchingCanvases) {
      results.push({
        canvasId: canvas.id,
        title: canvas.title,
        icon: canvas.icon || '📄',
        type: 'title',
      });
    }

    // 2. Match elements contents
    const matchingElements = elements.filter(el => 
      el.content.toLowerCase().includes(cleanQuery)
    );

    for (const el of matchingElements) {
      const parentCanvas = canvases.find(c => c.id === el.canvasId);
      if (parentCanvas && !parentCanvas.isArchived) {
        // Build snippet
        const index = el.content.toLowerCase().indexOf(cleanQuery);
        const start = Math.max(0, index - 30);
        const end = Math.min(el.content.length, index + cleanQuery.length + 30);
        const prefix = start > 0 ? '...' : '';
        const suffix = end < el.content.length ? '...' : '';
        const matchSnippet = prefix + el.content.substring(start, end).replace(/\n/g, ' ') + suffix;

        // Avoid adding duplicate results if it's already matching title
        if (!results.some(r => r.canvasId === el.canvasId && r.type === 'title')) {
          results.push({
            canvasId: el.canvasId,
            title: parentCanvas.title,
            icon: parentCanvas.icon || '📄',
            type: 'element',
            elementType: el.type,
            matchSnippet,
          });
        }
      }
    }
  } else {
    // Show recent canvases if query is empty
    const sortedCanvases = [...canvases]
      .filter(c => !c.isArchived)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    for (const canvas of sortedCanvases) {
      results.push({
        canvasId: canvas.id,
        title: canvas.title,
        icon: canvas.icon || '📄',
        type: 'title',
      });
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].canvasId);
      }
    }
  };

  const handleSelect = (canvasId: string) => {
    onClose();
    router.push(`/canvas/${canvasId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-2xl bg-[#F4F7F6] border-4 border-[#1A1A1A] rounded-none neo-shadow-lg overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Area */}
        <div className="relative flex items-center border-b-4 border-[#1A1A1A] bg-white p-3">
          <Search className="w-5 h-5 text-[#1A1A1A] mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search Node titles & block contents..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none outline-none font-sans text-base font-bold text-[#1A1A1A] placeholder-gray-400"
          />
          <button 
            onClick={onClose}
            className="p-1 border-2 border-[#1A1A1A] hover:bg-[#FFB703] transition-colors rounded"
          >
            <X className="w-4 h-4 text-[#1A1A1A]" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {query.trim() ? 'Search Results' : 'Recently Updated Canvases'}
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 font-medium">
              No matching elements or Node titles found for <span className="font-bold">&quot;{query}&quot;</span>.
            </div>
          ) : (
            results.map((result, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${result.canvasId}-${result.type}-${idx}`}
                  onClick={() => handleSelect(result.canvasId)}
                  className={`flex items-start justify-between p-3 border-2 rounded transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white border-[#1A1A1A] neo-shadow-sm' 
                      : 'border-transparent hover:border-[#1A1A1A] hover:bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-8 h-8 bg-white border-2 border-[#1A1A1A] neo-shadow-sm flex items-center justify-center font-bold text-base flex-shrink-0">
                      {result.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#1A1A1A] truncate">
                        {result.title}
                      </div>
                      {result.type === 'element' && result.matchSnippet && (
                        <div className="mt-1 flex items-center space-x-1">
                          <span className="text-[10px] bg-emerald-100 text-[#2D6A4F] px-1 py-0.5 border border-[#1A1A1A] rounded font-mono font-bold capitalize">
                            {result.elementType?.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono text-gray-500 truncate italic">
                            {result.matchSnippet}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-[#2D6A4F] font-mono">
                      <span>OPEN</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="bg-white border-t-4 border-[#1A1A1A] p-3 flex items-center justify-between text-[11px] font-mono text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><ArrowDown className="w-3 h-3 mr-1 text-[#1A1A1A]" /><ArrowUp className="w-3 h-3 mr-1 text-[#1A1A1A]" /> Navigate</span>
            <span className="flex items-center"><span className="border border-[#1A1A1A] bg-[#F4F7F6] px-1 rounded mr-1">Enter</span> Open</span>
          </div>
          <div>
            <span>Zenith Search Core</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
