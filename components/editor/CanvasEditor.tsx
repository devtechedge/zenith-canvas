'use client';

import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CanvasElement, type CollectionTable } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import { Compass, Map, Sliders, Tag, FolderOpen, FileCode, Keyboard, EyeOff, Scissors, Navigation, MapPin } from 'lucide-react';
import ElementWrapper from './ElementWrapper';
import SlashCommands, { type CommandItem } from './SlashCommands';
import SelectionMenu from './SelectionMenu';
import DataGrid from '../collection/DataGrid';
import { 
  Terminal, 
  Play, 
  Database, 
  HelpCircle,
  Sparkles,
  Info,
  ChevronRight,
  Quote,
  Link as LinkIcon,
  Volume2,
  LayoutGrid,
  GitFork,
  Activity,
  Layers,
  FileJson,
  GitCommit,
  Cpu,
  FileText,
  Share2,
  Search,
  Wrench,
  Workflow,
  RefreshCw,
  Plus,
  Calculator,
  Paintbrush,
  GitCompare,
  Disc,
  Filter,
  Palette,
  History,
  Layout,
  Brain,
  Network,
  Clock,
  ArrowUpRight,
  Globe,
  Binary,
  Trello,
  Waves,
  Shuffle,
  GitPullRequest,
  Shield,
  Fingerprint,
  Eye,
  Key,
  FileCheck,
  Grid
} from 'lucide-react';

const playTypewriterSound = (isSpace: boolean) => {
  if (typeof window === 'undefined') return;
  const soundEnabled = localStorage.getItem('zenith-typewriter-sound') === 'true';
  if (!soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (isSpace) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch (err) {
    console.error('Failed to play click:', err);
  }
};

const generateTableId = () => {
  return `table-${Math.random().toString(36).substring(2, 11)}`;
};

interface CanvasEditorProps {
  canvasId: string;
  isLocked?: boolean;
}

export default function CanvasEditor({ canvasId, isLocked = false }: CanvasEditorProps) {
  const { 
    createCanvasElement, 
    updateCanvasElement, 
    deleteCanvasElement,
    createCollectionTable
  } = useCanvasSync();

  const [focusedId, setFocusedId] = useState<string | null>(null);

  const renderDynamicContent = (text: string) => {
    if (!text || text.trim() === '') return <span className="text-gray-300 italic font-normal">Empty block</span>;

    const regex = /({{[a-zA-Z0-9_]+}}|\b(?:IMPORTANT|TODO|FIXME|NOTE|DONE):)/g;
    const tokens = text.split(regex);

    return (
      <span className="inline-wrap">
        {tokens.map((token, i) => {
          if (token === '{{today}}') {
            return (
              <span key={i} className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono select-none">
                📅 {new Date().toISOString().split('T')[0]}
              </span>
            );
          }
          if (token === '{{total_blocks}}') {
            return (
              <span key={i} className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 font-mono select-none">
                🔢 {elements.length} blocks
              </span>
            );
          }
          if (token === '{{completed_tasks}}') {
            const count = elements.filter(el => {
              if (el.type !== 'todo') return false;
              try {
                return JSON.parse(el.properties).checked === true;
              } catch {
                return false;
              }
            }).length;
            return (
              <span key={i} className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 font-mono select-none">
                ✅ {count} completed
              </span>
            );
          }
          if (token === '{{sandbox_count}}') {
            const count = elements.filter(el => el.type === 'code_sandbox').length;
            return (
              <span key={i} className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 font-mono select-none">
                💻 {count} sandboxes
              </span>
            );
          }
          
          if (token === 'IMPORTANT:') {
            return (
              <span key={i} className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded bg-rose-500 text-white font-black text-[9px] tracking-wider uppercase border border-rose-600 shadow-sm font-mono select-none">
                🔴 IMPORTANT
              </span>
            );
          }
          if (token === 'TODO:') {
            return (
              <span key={i} className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded bg-amber-400 text-[#1A1A1A] font-black text-[9px] tracking-wider uppercase border border-amber-500 shadow-sm font-mono select-none">
                🟡 TODO
              </span>
            );
          }
          if (token === 'FIXME:') {
            return (
              <span key={i} className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded bg-orange-500 text-white font-black text-[9px] tracking-wider uppercase border border-orange-600 shadow-sm font-mono select-none">
                🟠 FIXME
              </span>
            );
          }
          if (token === 'NOTE:') {
            return (
              <span key={i} className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded bg-blue-500 text-white font-black text-[9px] tracking-wider uppercase border border-blue-600 shadow-sm font-mono select-none">
                🔵 NOTE
              </span>
            );
          }
          if (token === 'DONE:') {
            return (
              <span key={i} className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded bg-emerald-500 text-white font-black text-[9px] tracking-wider uppercase border border-emerald-600 shadow-sm font-mono select-none">
                🟢 DONE
              </span>
            );
          }

          return token;
        })}
      </span>
    );
  };

  // Load and sort elements of the current canvas
  const elements = useLiveQuery(async () => {
    const list = await db.elements.where('canvasId').equals(canvasId).toArray();
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [canvasId]) || [];

  const canvasesList = useLiveQuery(() => db.canvases.where('isArchived').equals(0).toArray()) || [];

  // Local state for active slash command panel
  const [slashCommandState, setSlashCommandState] = useState<{
    visible: boolean;
    top: number;
    left: number;
    elementId: string;
  } | null>(null);

  // Floating text selection state
  const [selectionMenuState, setSelectionMenuState] = useState<{
    visible: boolean;
    top: number;
    left: number;
    elementId: string;
  } | null>(null);

  // Terminal sandbox running states
  const [sandboxOutputs, setSandboxOutputs] = useState<Record<string, string[]>>({});

  // Ensure canvas has at least one paragraph element on first load
  useEffect(() => {
    const ensureFirstElement = async () => {
      const count = await db.elements.where('canvasId').equals(canvasId).count();
      if (count === 0) {
        await createCanvasElement(canvasId, 'heading_1', 'Welcome to your new Canvas node 🎨', 1.0);
        await createCanvasElement(canvasId, 'text', 'Start typing here. Use slash commands by typing "/" to insert checklists, database views, or live calculation sandboxes.', 2.0);
      }
    };
    ensureFirstElement();
  }, [canvasId, elements.length]);

  // Handle slash command panel visibility
  const handleElementKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, el: CanvasElement) => {
    // Play sound click
    playTypewriterSound(e.key === ' ');

    const textarea = e.currentTarget;
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;

    if (e.key === '/') {
      // Find coordinates of cursor
      const { offsetLeft, offsetTop } = textarea;
      const rect = textarea.getBoundingClientRect();
      const parentRect = textarea.offsetParent?.getBoundingClientRect();

      setSlashCommandState({
        visible: true,
        top: offsetTop + 24,
        left: Math.min(rect.left - (parentRect?.left || 0) + 12, 400),
        elementId: el.id,
      });
    } else if (e.key === 'Enter') {
      if (slashCommandState?.visible) return; // let slash commands capture Enter
      e.preventDefault();
      // Insert empty text block below
      const nextSortOrder = el.sortOrder + 0.1;
      createCanvasElement(canvasId, 'text', '', nextSortOrder);
    } else if (e.key === 'Backspace' && value === '') {
      e.preventDefault();
      // Merge / delete block
      if (elements.length > 1) {
        handleDeleteBlock(el.id);
        // Focus previous element
        const prevIdx = elements.findIndex(item => item.id === el.id) - 1;
        if (prevIdx >= 0) {
          setTimeout(() => {
            const prevEl = document.getElementById(`textarea-${elements[prevIdx].id}`);
            prevEl?.focus();
          }, 50);
        }
      }
    }
  };

  const handleSlashSelect = async (commandId: CommandItem['id']) => {
    if (!slashCommandState) return;
    const { elementId } = slashCommandState;
    const targetElement = elements.find(el => el.id === elementId);

    if (!targetElement) return;

    // Filter out '/' if present
    const cleanContent = targetElement.content.replace('/', '');

    if (commandId === 'collection_ref') {
      // Setup table reference properties
      const tableId = generateTableId();
      await updateCanvasElement(elementId, {
        type: 'collection_ref',
        content: 'Data-Grid Table',
        properties: JSON.stringify({ tableId }),
      });
    } else {
      await updateCanvasElement(elementId, {
        type: commandId,
        content: cleanContent,
      });
    }

    setSlashCommandState(null);

    // Re-focus current element
    setTimeout(() => {
      const textarea = document.getElementById(`textarea-${elementId}`) as HTMLTextAreaElement;
      textarea?.focus();
    }, 50);
  };

  const handleDeleteBlock = async (id: string) => {
    await deleteCanvasElement(id);
  };

  const handleInsertBelow = async (sortOrder: number) => {
    await createCanvasElement(canvasId, 'text', '', sortOrder + 0.05);
  };

  const handleMoveUp = async (idx: number) => {
    if (idx === 0) return;
    const current = elements[idx];
    const prev = elements[idx - 1];
    
    const tempSort = current.sortOrder;
    await updateCanvasElement(current.id, { sortOrder: prev.sortOrder });
    await updateCanvasElement(prev.id, { sortOrder: tempSort });
  };

  const handleMoveDown = async (idx: number) => {
    if (idx === elements.length - 1) return;
    const current = elements[idx];
    const next = elements[idx + 1];

    const tempSort = current.sortOrder;
    await updateCanvasElement(current.id, { sortOrder: next.sortOrder });
    await updateCanvasElement(next.id, { sortOrder: tempSort });
  };

  // --- Inline JS Sandbox Engine ---
  const runSandbox = (elementId: string, code: string) => {
    const outputs: string[] = [];
    const originalLog = console.log;
    
    // Override console.log temporarily
    console.log = (...args) => {
      outputs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));
    };

    const startTime = performance.now();

    try {
      // Simple eval in sandbox context
      const runner = new Function(code);
      runner();
      const duration = (performance.now() - startTime).toFixed(2);
      outputs.push(`\n✨ Execution Timing Metrics: ${duration}ms`);
    } catch (err: any) {
      outputs.push(`🚨 ERROR: ${err.message}`);
    } finally {
      console.log = originalLog;
    }

    setSandboxOutputs(prev => ({
      ...prev,
      [elementId]: outputs.length > 0 ? outputs : ['Sandbox executed successfully with empty logs.']
    }));
  };

  // --- Provision dynamic data-grids on reference request ---
  const handleProvisionDataGrid = async (elementId: string, tableId: string) => {
    const columns = [
      { id: 'col-task', name: 'Task Name', type: 'Text' as const },
      { id: 'col-status', name: 'Status', type: 'Select' as const },
      { id: 'col-cost', name: 'Est. Hours', type: 'Number' as const }
    ];
    await createCollectionTable(canvasId, 'Dynamic Table', columns);
    
    // Also create initial rows
    const firstRowCells = { 'col-task': 'Initial milestone roadmap review', 'col-status': 'Backlog', 'col-cost': 4 };
    await db.collectionRows.add({
      id: `row-${Math.random().toString(36).substring(2, 9)}`,
      tableId,
      cells: JSON.stringify(firstRowCells),
      sortOrder: 1.0,
    });

    // Toggle element state to trigger update
    await updateCanvasElement(elementId, {
      properties: JSON.stringify({ tableId, provisioned: true })
    });
  };

  // Text selection floating menu listener
  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>, el: CanvasElement) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart !== selectionEnd) {
      const rect = textarea.getBoundingClientRect();
      const parentRect = textarea.offsetParent?.getBoundingClientRect();
      setSelectionMenuState({
        visible: true,
        top: textarea.offsetTop,
        left: rect.left - (parentRect?.left || 0) + (selectionStart + selectionEnd) * 3,
        elementId: el.id,
      });
    } else {
      setSelectionMenuState(null);
    }
  };

  const handleApplyFormatting = async (format: 'bold' | 'italic' | 'code' | 'highlight') => {
    if (!selectionMenuState) return;
    const { elementId } = selectionMenuState;
    const textarea = document.getElementById(`textarea-${elementId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let formatted = '';
    if (format === 'bold') formatted = `**${selectedText}**`;
    else if (format === 'italic') formatted = `*${selectedText}*`;
    else if (format === 'code') formatted = `\`${selectedText}\``;
    else if (format === 'highlight') formatted = `::${selectedText}::`;

    const newText = text.substring(0, start) + formatted + text.substring(end);
    await updateCanvasElement(elementId, { content: newText });
    setSelectionMenuState(null);
  };

  return (
    <div className="relative max-w-4xl mx-auto py-8 px-6 space-y-6 min-h-[500px]">
      {/* Floating Overlays */}
      {slashCommandState?.visible && (
        <SlashCommands
          position={{ top: slashCommandState.top, left: slashCommandState.left }}
          onSelect={handleSlashSelect}
          onClose={() => setSlashCommandState(null)}
        />
      )}

      {selectionMenuState?.visible && (
        <SelectionMenu
          position={{ top: selectionMenuState.top, left: selectionMenuState.left }}
          onApplyFormat={handleApplyFormatting}
          onDeleteElement={() => {
            handleDeleteBlock(selectionMenuState.elementId);
            setSelectionMenuState(null);
          }}
          onClose={() => setSelectionMenuState(null)}
        />
      )}

      {/* Poly-morphic Elements Flow */}
      <div className="space-y-2">
        {elements.map((el, idx) => {
          let propertiesObj: any = {};
          try {
            propertiesObj = JSON.parse(el.properties);
          } catch {}

          return (
            <ElementWrapper
              key={el.id}
              id={el.id}
              sortOrder={el.sortOrder}
              onDelete={() => handleDeleteBlock(el.id)}
              onAddBelow={() => handleInsertBelow(el.sortOrder)}
              onMoveUp={idx > 0 ? () => handleMoveUp(idx) : undefined}
              onMoveDown={idx < elements.length - 1 ? () => handleMoveDown(idx) : undefined}
              isLocked={isLocked}
            >
              {/* HEADING 1 ELEMENT */}
              {el.type === 'heading_1' && (
                focusedId === el.id && !isLocked ? (
                  <textarea
                    id={`textarea-${el.id}`}
                    value={el.content}
                    autoFocus
                    placeholder="Heading 1 (Use '/' for insert commands...)"
                    onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                    onKeyDown={(e) => handleElementKeyDown(e, el)}
                    onSelect={(e) => handleSelection(e, el)}
                    onBlur={() => setFocusedId(null)}
                    rows={1}
                    className="w-full bg-transparent resize-none border-none outline-none font-black text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight placeholder-gray-300 font-sans leading-tight py-1"
                  />
                ) : (
                  <div
                    onClick={() => !isLocked && setFocusedId(el.id)}
                    className="w-full font-black text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight leading-tight py-1 cursor-text min-h-[40px]"
                  >
                    {renderDynamicContent(el.content)}
                  </div>
                )
              )}

              {/* HEADING 2 ELEMENT */}
              {el.type === 'heading_2' && (
                focusedId === el.id && !isLocked ? (
                  <textarea
                    id={`textarea-${el.id}`}
                    value={el.content}
                    autoFocus
                    placeholder="Heading 2 (Use '/' for commands)"
                    onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                    onKeyDown={(e) => handleElementKeyDown(e, el)}
                    onSelect={(e) => handleSelection(e, el)}
                    onBlur={() => setFocusedId(null)}
                    rows={1}
                    className="w-full bg-transparent resize-none border-none outline-none font-extrabold text-xl sm:text-2xl text-[#1A1A1A] tracking-tight placeholder-gray-300 font-sans leading-tight py-1"
                  />
                ) : (
                  <div
                    onClick={() => !isLocked && setFocusedId(el.id)}
                    className="w-full font-extrabold text-xl sm:text-2xl text-[#1A1A1A] tracking-tight leading-tight py-1 cursor-text min-h-[32px]"
                  >
                    {renderDynamicContent(el.content)}
                  </div>
                )
              )}

              {/* PARAGRAPH TEXT ELEMENT */}
              {el.type === 'text' && (
                focusedId === el.id && !isLocked ? (
                  <textarea
                    id={`textarea-${el.id}`}
                    value={el.content}
                    autoFocus
                    placeholder="Start writing plain text, or type '/' for interactive data grids & checklists..."
                    onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                    onKeyDown={(e) => handleElementKeyDown(e, el)}
                    onSelect={(e) => handleSelection(e, el)}
                    onBlur={() => setFocusedId(null)}
                    rows={1}
                    className="w-full bg-transparent resize-none border-none outline-none font-medium text-sm text-[#1A1A1A] placeholder-gray-300 font-sans leading-relaxed py-1 focus:bg-white/40 rounded px-1 transition-colors"
                  />
                ) : (
                  <div
                    onClick={() => !isLocked && setFocusedId(el.id)}
                    className="w-full font-medium text-sm text-[#1A1A1A] leading-relaxed py-1 cursor-text focus:bg-white/10 rounded px-1 min-h-[24px]"
                  >
                    {renderDynamicContent(el.content)}
                  </div>
                )
              )}

              {/* CHECKLIST TODO ELEMENT */}
              {el.type === 'todo' && (
                <div className="flex items-start space-x-2.5 py-1">
                  <input
                    type="checkbox"
                    checked={!!propertiesObj.checked}
                    disabled={isLocked}
                    onChange={(e) => updateCanvasElement(el.id, { 
                      properties: JSON.stringify({ ...propertiesObj, checked: e.target.checked }) 
                    })}
                    className="w-4 h-4 rounded-none border-2 border-[#1A1A1A] text-[#2D6A4F] focus:ring-0 focus:ring-offset-0 cursor-pointer mt-1"
                  />
                  {focusedId === el.id && !isLocked ? (
                    <textarea
                      id={`textarea-${el.id}`}
                      value={el.content}
                      autoFocus
                      placeholder="Checklist task (Press '/' for block insert...)"
                      onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                      onKeyDown={(e) => handleElementKeyDown(e, el)}
                      onBlur={() => setFocusedId(null)}
                      rows={1}
                      className={`w-full bg-transparent resize-none border-none outline-none font-bold text-sm text-[#1A1A1A] placeholder-gray-300 font-sans leading-relaxed ${
                        propertiesObj.checked ? 'line-through text-gray-400 font-medium' : ''
                      }`}
                    />
                  ) : (
                    <div
                      onClick={() => !isLocked && setFocusedId(el.id)}
                      className={`w-full font-bold text-sm text-[#1A1A1A] leading-relaxed cursor-text min-h-[24px] ${
                        propertiesObj.checked ? 'line-through text-gray-400 font-medium' : ''
                      }`}
                    >
                      {renderDynamicContent(el.content)}
                    </div>
                  )}
                </div>
              )}

              {/* CALLOUT ELEMENT */}
              {el.type === 'callout' && (
                <div className={`flex items-start space-x-3 bg-white border-2 border-[#1A1A1A] neo-shadow-sm p-4 rounded-none transition-all w-full ${
                  propertiesObj.mood === 'warning' ? 'bg-red-50/70' : 
                  propertiesObj.mood === 'success' ? 'bg-emerald-50/70' : 
                  propertiesObj.mood === 'energy' ? 'bg-indigo-50/70' : 'bg-amber-50/70'
                }`}>
                  <div className={`w-8 h-8 rounded-none border border-[#1A1A1A] flex items-center justify-center flex-shrink-0 text-lg ${
                    propertiesObj.mood === 'warning' ? 'bg-red-400' : 
                    propertiesObj.mood === 'success' ? 'bg-emerald-400' : 
                    propertiesObj.mood === 'energy' ? 'bg-indigo-400' : 'bg-[#FFB703]'
                  }`}>
                    {propertiesObj.mood === 'warning' ? '⚠️' : 
                     propertiesObj.mood === 'success' ? '✅' : 
                     propertiesObj.mood === 'energy' ? '⚡' : '💡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      id={`textarea-${el.id}`}
                      value={el.content}
                      disabled={isLocked}
                      placeholder="Callout info block text..."
                      onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                      onKeyDown={(e) => handleElementKeyDown(e, el)}
                      rows={2}
                      className="w-full bg-transparent resize-none border-none outline-none font-bold text-xs text-[#1A1A1A] placeholder-gray-300 font-sans leading-relaxed disabled:cursor-not-allowed"
                    />
                    {/* Mood selection list */}
                    <div className="flex flex-wrap items-center gap-1 mt-2 pt-1.5 border-t border-dashed border-[#1A1A1A]/10 text-[9px] font-mono font-bold text-gray-400">
                      <span>ACCENT MOOD:</span>
                      {[
                        { id: 'info', emoji: '💡', label: 'Info' },
                        { id: 'warning', emoji: '⚠️', label: 'Alert' },
                        { id: 'success', emoji: '✅', label: 'Done' },
                        { id: 'energy', emoji: '⚡', label: 'Power' }
                      ].map(m => (
                        <button
                          key={m.id}
                          disabled={isLocked}
                          onClick={() => updateCanvasElement(el.id, {
                            properties: JSON.stringify({ ...propertiesObj, mood: m.id })
                          })}
                          className={`px-1.5 py-0.5 border border-[#1A1A1A] rounded-none bg-white hover:bg-slate-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all text-[#1A1A1A] ${
                            (propertiesObj.mood || 'info') === m.id ? 'bg-[#FFB703] border-2 border-black font-extrabold' : ''
                          }`}
                        >
                          {m.emoji} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TOGGLE / ACCORDION ELEMENT */}
              {el.type === 'toggle_list' && (
                <div className="border-2 border-[#1A1A1A] p-3.5 bg-white rounded-none neo-shadow-sm my-1 w-full">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        await updateCanvasElement(el.id, {
                          properties: JSON.stringify({ ...propertiesObj, open: !propertiesObj.open })
                        });
                      }}
                      className="p-1 hover:bg-gray-100 border border-transparent hover:border-[#1A1A1A] rounded transition-all text-[#1A1A1A] flex items-center justify-center flex-shrink-0"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${propertiesObj.open ? 'rotate-90' : ''}`} />
                    </button>
                    <textarea
                      id={`textarea-${el.id}`}
                      value={el.content}
                      placeholder="Collapsible Accordion Header (Press '/' for insert commands...)"
                      onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                      onKeyDown={(e) => handleElementKeyDown(e, el)}
                      rows={1}
                      className="w-full bg-transparent resize-none border-none outline-none font-extrabold text-sm text-[#1A1A1A] placeholder-gray-300 font-sans"
                    />
                  </div>
                  
                  {propertiesObj.open && (
                    <div className="mt-2.5 ml-8 pl-3.5 border-l-2 border-[#1A1A1A]/40">
                      <textarea
                        value={propertiesObj.body || ''}
                        placeholder="Type collapsible ledger notes here..."
                        onChange={(e) => updateCanvasElement(el.id, {
                          properties: JSON.stringify({ ...propertiesObj, body: e.target.value })
                        })}
                        rows={3}
                        className="w-full bg-transparent resize-none border-none outline-none font-medium text-xs text-gray-700 placeholder-gray-300 font-mono leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* QUOTE BLOCKQUOTE ELEMENT */}
              {el.type === 'quote' && (
                <div className="border-l-4 border-[#FFB703] bg-gray-50/60 p-4 rounded-none my-1 pl-4 w-full border-2 border-y-[#1A1A1A] border-r-[#1A1A1A]">
                  <textarea
                    id={`textarea-${el.id}`}
                    value={el.content}
                    placeholder="Blockquote statement (Press '/' for block insert...)"
                    onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                    onKeyDown={(e) => handleElementKeyDown(e, el)}
                    rows={2}
                    className="w-full bg-transparent resize-none border-none outline-none font-serif italic text-sm text-[#1A1A1A] placeholder-gray-300 leading-relaxed"
                  />
                </div>
              )}

              {/* WIKI PAGE REFERENCE LINK ELEMENT */}
              {el.type === 'page_link' && (
                <div className="border-2 border-[#1A1A1A] p-3.5 bg-[#FFB703]/5 rounded-none neo-shadow-sm my-1 flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔗</span>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">WIKI REFERENCE LINK</span>
                      {propertiesObj.targetCanvasId ? (
                        (() => {
                          const linked = canvasesList.find(c => c.id === propertiesObj.targetCanvasId);
                          return (
                            <button
                              onClick={() => {
                                if (linked) {
                                  window.location.href = `/canvas/${linked.id}`;
                                }
                              }}
                              className="block text-sm font-black text-[#1A1A1A] hover:underline text-left cursor-pointer mt-0.5"
                            >
                              {linked ? `${linked.icon || '📄'} ${linked.title}` : 'Linked page deleted'}
                            </button>
                          );
                        })()
                      ) : (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <select
                            onChange={(e) => {
                              updateCanvasElement(el.id, {
                                properties: JSON.stringify({ ...propertiesObj, targetCanvasId: e.target.value })
                              });
                            }}
                            defaultValue=""
                            className="text-xs font-mono font-bold border-2 border-[#1A1A1A] bg-white px-2 py-1 rounded-none"
                          >
                            <option value="" disabled>-- Connect Canvas Node --</option>
                            {canvasesList.filter(c => c.id !== canvasId).map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                          <span className="text-[10px] text-gray-400 font-mono">or instantiate a clean page directly:</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!propertiesObj.targetCanvasId && (
                    <button
                      onClick={async () => {
                        const newId = `canvas-${Math.random().toString(36).substring(2, 9)}`;
                        await db.canvases.add({
                          id: newId,
                          workspaceId: 'ws-enterprise-default',
                          title: '🎯 New Connected Milestone',
                          icon: '🎯',
                          isArchived: false,
                          updatedAt: new Date()
                        });
                        await updateCanvasElement(el.id, {
                          properties: JSON.stringify({ ...propertiesObj, targetCanvasId: newId })
                        });
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase border-2 border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 neo-shadow-sm transition-all"
                    >
                      + Instantiate Page
                    </button>
                  )}
                </div>
              )}

              {/* LIVE EXECUTABLE JAVASCRIPT SANDBOX */}
              {el.type === 'code_sandbox' && (
                <div className="border-2 border-[#1A1A1A] bg-white rounded-none neo-shadow-sm overflow-hidden mt-1">
                  {/* Top Bar */}
                  <div className="bg-[#1F2833] text-white p-2 flex items-center justify-between border-b-2 border-[#1A1A1A]">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-[#66FCF1]" />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-gray-300">
                        Executable Node Sandbox
                      </span>
                    </div>

                    <button
                      onClick={() => runSandbox(el.id, el.content)}
                      className="flex items-center space-x-1.5 px-3 py-1 bg-[#2D6A4F] hover:bg-[#1b4332] text-xs font-bold font-mono text-white border border-[#1a1a1a] neo-shadow-sm cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>RUN LOGS</span>
                    </button>
                  </div>

                  {/* Textarea Code Editor */}
                  <div className="p-3 bg-[#0B0C10]">
                    <textarea
                      id={`textarea-${el.id}`}
                      value={el.content}
                      onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                      onKeyDown={(e) => {
                        // Allow tab insertion in editor
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const start = e.currentTarget.selectionStart;
                          const end = e.currentTarget.selectionEnd;
                          const val = e.currentTarget.value;
                          const newVal = val.substring(0, start) + '  ' + val.substring(end);
                          updateCanvasElement(el.id, { content: newVal });
                        }
                      }}
                      placeholder="// Insert JS logic. Example:\nconst sum = 12 + 18;\nconsole.log('Result:', sum);"
                      rows={6}
                      className="w-full bg-transparent resize-none border-none outline-none font-mono text-xs text-[#66FCF1] placeholder-teal-800 leading-relaxed"
                    />
                  </div>

                  {/* Terminal output */}
                  {sandboxOutputs[el.id] && (
                    <div className="bg-[#1F2833] border-t border-gray-800 p-3 font-mono text-xs text-green-400 space-y-1">
                      <div className="text-[9px] uppercase font-bold text-gray-500 border-b border-gray-800 pb-1">
                        Console output:
                      </div>
                      {sandboxOutputs[el.id].map((out, oIdx) => (
                        <div key={oIdx} className="whitespace-pre-wrap leading-relaxed">
                          {out}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RELATIONAL GRID INLINE COLLECTION */}
              {el.type === 'collection_ref' && (
                <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 mb-3">
                    <Database className="w-4 h-4 text-[#2D6A4F]" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                      Inline Grid Database Reference
                    </span>
                  </div>

                  {propertiesObj.tableId && propertiesObj.provisioned ? (
                    <DataGrid tableId={propertiesObj.tableId} />
                  ) : (
                    <div className="p-8 text-center bg-[#F4F7F6] border-2 border-[#1A1A1A]">
                      <h4 className="text-sm font-extrabold text-[#1A1A1A] mb-1">Grid Table Reference Unprovisioned</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
                        To activate this inline database grid, provision a clean relational dataset with task, status, and estimation columns.
                      </p>
                      <button
                        onClick={() => handleProvisionDataGrid(el.id, propertiesObj.tableId)}
                        className="px-4 py-2 border-2 border-[#1A1A1A] bg-[#FFB703] text-xs font-bold uppercase neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                      >
                        Provision Sprint Table View
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ACOUSTIC SYNTHESIZER OSCILLATOR NODE */}
              {el.type === 'acoustic_wave' && (
                <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                        Interactive Acoustic Wave Oscillator
                      </span>
                    </div>
                    <span className="text-[9px] font-mono border border-indigo-200 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-extrabold uppercase rounded-sm">
                      Web Audio Synthesizer
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-gray-700">OSCILLATOR FREQUENCY:</span>
                        <span className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 px-1 rounded">{(propertiesObj.pitch || 440)} Hz</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed max-w-md">
                        Synthesizes clean browser-generated wave frequencies. Slide the frequency tuner or click trigger to audibly evaluate the layer audio-harmonic wave form.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto flex-shrink-0">
                      <input 
                        type="range"
                        min="120"
                        max="1800"
                        step="10"
                        value={propertiesObj.pitch || 440}
                        onChange={(e) => updateCanvasElement(el.id, {
                          properties: JSON.stringify({ ...propertiesObj, pitch: parseInt(e.target.value) })
                        })}
                        className="w-32 accent-indigo-600 cursor-pointer"
                      />

                      <button
                        onClick={() => {
                          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          
                          osc.type = propertiesObj.waveform || 'sine';
                          osc.frequency.setValueAtTime(propertiesObj.pitch || 440, ctx.currentTime);
                          
                          gain.gain.setValueAtTime(0.2, ctx.currentTime);
                          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                          
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          
                          osc.start();
                          osc.stop(ctx.currentTime + 0.8);
                        }}
                        className="px-4 py-2 border-2 border-[#1A1A1A] bg-[#FFB703] text-[#1a1a1a] text-xs font-bold uppercase neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>TRIGGER TONE</span>
                      </button>
                    </div>
                  </div>

                  {/* Waveform Selector */}
                  <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-dashed border-[#1A1A1A]/10 text-[9px] font-mono font-bold text-gray-400">
                    <span>WAVE FORM:</span>
                    {['sine', 'square', 'sawtooth', 'triangle'].map(wf => (
                      <button
                        key={wf}
                        onClick={() => updateCanvasElement(el.id, {
                          properties: JSON.stringify({ ...propertiesObj, waveform: wf })
                        })}
                        className={`px-1.5 py-0.5 border border-[#1A1A1A] rounded-none bg-white hover:bg-slate-50 transition-all text-[#1A1A1A] uppercase ${
                          (propertiesObj.waveform || 'sine') === wf ? 'bg-indigo-500 text-white border-2 border-black font-extrabold' : ''
                        }`}
                      >
                        {wf}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AST COORDINATE MATRIX MAPPER */}
              {el.type === 'matrix_view' && (
                (() => {
                  const matrixData = propertiesObj.matrix || {
                    rows: ['A', 'B'],
                    cols: ['1', '2'],
                    cells: { 'A-1': 'Node Alpha', 'A-2': 'Node Beta', 'B-1': 'Node Gamma', 'B-2': 'Node Delta' },
                    connections: [{ from: 'A-1', to: 'B-2', label: 'transit-link' }]
                  };
                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <LayoutGrid className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            AST Coordinate Matrix Mapper
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Multi-Dimensional Matrix
                        </span>
                      </div>

                      <div className="overflow-x-auto border-2 border-[#1A1A1A] mb-3">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="bg-slate-50 border-b-2 border-[#1A1A1A]">
                              <th className="p-2 border-r-2 border-[#1A1A1A] bg-slate-100">Y / X</th>
                              {matrixData.cols.map((col: string) => (
                                <th key={col} className="p-2 border-r-2 border-[#1A1A1A] font-black uppercase">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {matrixData.rows.map((row: string) => (
                              <tr key={row} className="border-b border-[#1A1A1A]">
                                <td className="p-2 border-r-2 border-[#1A1A1A] font-black bg-slate-50 text-center">{row}</td>
                                {matrixData.cols.map((col: string) => {
                                  const cellKey = `${row}-${col}`;
                                  return (
                                    <td key={col} className="p-1 border-r-2 border-[#1A1A1A]">
                                      <input
                                        type="text"
                                        value={matrixData.cells[cellKey] || ''}
                                        onChange={(e) => {
                                          const nextCells = { ...matrixData.cells, [cellKey]: e.target.value };
                                          const updated = { ...matrixData, cells: nextCells };
                                          updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, matrix: updated }) });
                                        }}
                                        className="w-full bg-transparent p-1 outline-none font-sans text-xs focus:bg-slate-50 font-bold text-gray-800"
                                        placeholder={`Value ${cellKey}`}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          onClick={() => {
                            const nextRow = String.fromCharCode(65 + matrixData.rows.length);
                            const updated = { ...matrixData, rows: [...matrixData.rows, nextRow] };
                            updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, matrix: updated }) });
                          }}
                          className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-[#1A1A1A] bg-[#CAF0F8] hover:translate-y-[1px] transition-all cursor-pointer"
                        >
                          + Add Row
                        </button>
                        <button
                          onClick={() => {
                            const nextCol = String(matrixData.cols.length + 1);
                            const updated = { ...matrixData, cols: [...matrixData.cols, nextCol] };
                            updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, matrix: updated }) });
                          }}
                          className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-[#1A1A1A] bg-[#CAF0F8] hover:translate-y-[1px] transition-all cursor-pointer"
                        >
                          + Add Col
                        </button>
                      </div>

                      {/* Connections section */}
                      <div className="border-t border-dashed border-[#1A1A1A]/20 pt-3">
                        <span className="text-[10px] font-mono font-black text-gray-400 block mb-2 uppercase">AST Directed Pathways:</span>
                        <div className="flex flex-wrap gap-2 items-center text-xs mb-3">
                          <select
                            id={`matrix-from-${el.id}`}
                            className="p-1 border border-black text-[10px] font-mono font-bold bg-white"
                          >
                            {matrixData.rows.flatMap((r: string) => matrixData.cols.map((c: string) => `${r}-${c}`)).map((key: string) => (
                              <option key={key} value={key}>{key}</option>
                            ))}
                          </select>
                          <span className="font-mono text-gray-400">→</span>
                          <select
                            id={`matrix-to-${el.id}`}
                            className="p-1 border border-black text-[10px] font-mono font-bold bg-white"
                          >
                            {matrixData.rows.flatMap((r: string) => matrixData.cols.map((c: string) => `${r}-${c}`)).map((key: string) => (
                              <option key={key} value={key}>{key}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            id={`matrix-label-${el.id}`}
                            placeholder="Signal label"
                            className="p-1 border border-black text-[10px] font-bold w-24 bg-white"
                          />
                          <button
                            onClick={() => {
                              const fromVal = (document.getElementById(`matrix-from-${el.id}`) as HTMLSelectElement)?.value;
                              const toVal = (document.getElementById(`matrix-to-${el.id}`) as HTMLSelectElement)?.value;
                              const labelVal = (document.getElementById(`matrix-label-${el.id}`) as HTMLInputElement)?.value || 'link';
                              if (fromVal && toVal) {
                                const updatedConnections = [...matrixData.connections, { from: fromVal, to: toVal, label: labelVal }];
                                const updated = { ...matrixData, connections: updatedConnections };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, matrix: updated }) });
                              }
                            }}
                            className="px-2 py-1 border-2 border-black bg-[#FFB703] text-[10px] font-bold uppercase cursor-pointer hover:bg-amber-400"
                          >
                            Link Cells
                          </button>
                          <button
                            onClick={() => {
                              const updated = { ...matrixData, connections: [] };
                              updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, matrix: updated }) });
                            }}
                            className="px-2 py-1 border border-rose-400 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Reset Links
                          </button>
                        </div>

                        {/* Directed Connections Visual Layout Map */}
                        {matrixData.connections.length > 0 && (
                          <div className="bg-slate-50 border border-[#1A1A1A] p-2 font-mono text-[9px] space-y-1">
                            {matrixData.connections.map((conn: any, cIdx: number) => (
                              <div key={cIdx} className="flex items-center space-x-1.5 font-bold text-slate-700">
                                <span className="bg-indigo-100 px-1 py-0.5 rounded border border-indigo-200">{conn.from} ({matrixData.cells[conn.from] || 'Empty'})</span>
                                <span className="text-indigo-600 font-extrabold">=====({conn.label})=====&gt;</span>
                                <span className="bg-emerald-100 px-1 py-0.5 rounded border border-emerald-200">{conn.to} ({matrixData.cells[conn.to] || 'Empty'})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CLUSTER NODE ROUTER */}
              {el.type === 'node_router' && (
                <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <GitFork className="w-4 h-4 text-purple-600" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                        Cluster Node Router & Transit Gate
                      </span>
                    </div>
                    <span className="text-[9px] font-mono border border-purple-200 px-1.5 py-0.5 bg-purple-50 text-purple-600 font-extrabold uppercase rounded-sm">
                      Layer Connector
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">Target Transit Layer:</label>
                        <select
                          value={propertiesObj.targetCanvasId || ''}
                          onChange={(e) => updateCanvasElement(el.id, {
                            properties: JSON.stringify({ ...propertiesObj, targetCanvasId: e.target.value })
                          })}
                          className="w-full text-xs font-mono font-bold border-2 border-black p-2 bg-white"
                        >
                          <option value="">-- Select Target Layer --</option>
                          {canvasesList.filter(c => c.id !== canvasId).map(c => (
                            <option key={c.id} value={c.id}>{c.icon || '📄'} {c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">Transit Pathway Signal Tag:</label>
                        <input
                          type="text"
                          placeholder="e.g., PRIMARY_BACKBONE"
                          value={propertiesObj.routingSignal || 'DIRECT_WARP'}
                          onChange={(e) => updateCanvasElement(el.id, {
                            properties: JSON.stringify({ ...propertiesObj, routingSignal: e.target.value })
                          })}
                          className="w-full text-xs font-mono font-bold border-2 border-black p-2 bg-white uppercase"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-between border-2 border-[#1A1A1A] p-3 bg-slate-50 font-mono text-xs">
                      <div>
                        <span className="text-[9px] font-black text-gray-400 block uppercase mb-1">Live Connection Diagram:</span>
                        <div className="flex items-center justify-between py-2 border-b border-[#1A1A1A]/10">
                          <span className="bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300 font-bold">CURRENT NODE</span>
                          <span className="text-purple-600 text-[10px] animate-pulse font-bold">======({propertiesObj.routingSignal || 'DIRECT_WARP'})======&gt;</span>
                          <span className="bg-[#FFB703]/20 px-1.5 py-0.5 rounded border border-[#FFB703]/40 font-bold truncate max-w-[120px]">
                            {propertiesObj.targetCanvasId 
                              ? canvasesList.find(c => c.id === propertiesObj.targetCanvasId)?.title || 'Target deleted'
                              : 'UNLINKED_NODE'
                            }
                          </span>
                        </div>
                      </div>

                      {propertiesObj.targetCanvasId && (
                        <button
                          onClick={() => {
                            window.location.href = `/canvas/${propertiesObj.targetCanvasId}`;
                          }}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold uppercase border-2 border-black neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer text-center mt-3"
                        >
                          EXECUTE TRANSIT
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ACOUSTIC SPECTROGRAM */}
              {el.type === 'spectrogram' && (
                (() => {
                  const pitch = propertiesObj.pitch || 528;
                  const waveform = propertiesObj.waveform || 'sine';
                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-rose-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Acoustic Real-Time Spectrogram Visualizer
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-rose-200 px-1.5 py-0.5 bg-rose-50 text-rose-600 font-extrabold uppercase rounded-sm">
                          HTML5 Audio Oscillograph
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-700">OSCILLATOR FREQUENCY:</span>
                            <span className="font-mono bg-rose-50 text-rose-600 px-1 rounded font-black">{pitch} Hz</span>
                          </div>
                          <input 
                            type="range"
                            min="100"
                            max="1500"
                            step="10"
                            value={pitch}
                            onChange={(e) => updateCanvasElement(el.id, {
                              properties: JSON.stringify({ ...propertiesObj, pitch: parseInt(e.target.value) })
                            })}
                            className="w-full accent-rose-600 cursor-pointer text-xs"
                          />
                          
                          <div className="flex gap-1.5 mt-2 text-[9px] font-mono font-bold">
                            {['sine', 'square', 'sawtooth', 'triangle'].map(wf => (
                              <button
                                key={wf}
                                onClick={() => updateCanvasElement(el.id, {
                                  properties: JSON.stringify({ ...propertiesObj, waveform: wf })
                                })}
                                className={`px-1 rounded border border-black uppercase text-[8px] cursor-pointer ${
                                  waveform === wf ? 'bg-rose-500 text-white' : 'bg-white hover:bg-slate-50'
                                }`}
                              >
                                {wf}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                          <canvas
                            id={`spectrograph-canvas-${el.id}`}
                            className="w-full h-16 bg-[#1A1A1A] border-2 border-black"
                          />
                          
                          <button
                            onClick={() => {
                              const canvas = document.getElementById(`spectrograph-canvas-${el.id}`) as HTMLCanvasElement;
                              if (!canvas) return;
                              const ctx = canvas.getContext('2d');
                              if (!ctx) return;

                              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                              const osc = audioCtx.createOscillator();
                              const gain = audioCtx.createGain();
                              const analyser = audioCtx.createAnalyser();

                              analyser.fftSize = 256;
                              const bufferLength = analyser.frequencyBinCount;
                              const dataArray = new Uint8Array(bufferLength);

                              osc.type = waveform;
                              osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
                              osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, audioCtx.currentTime + 1.2);

                              gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

                              osc.connect(gain);
                              gain.connect(analyser);
                              analyser.connect(audioCtx.destination);

                              osc.start();
                              osc.stop(audioCtx.currentTime + 1.2);

                              // Drawing Loop
                              let start: number | null = null;
                              const draw = (timestamp: number) => {
                                if (!start) start = timestamp;
                                const elapsed = timestamp - start;

                                analyser.getByteFrequencyData(dataArray);

                                ctx.fillStyle = '#1A1A1A';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);

                                const barWidth = (canvas.width / bufferLength) * 1.5;
                                let barHeight;
                                let x = 0;

                                for (let i = 0; i < bufferLength; i++) {
                                  barHeight = dataArray[i] / 2;

                                  ctx.fillStyle = `rgb(${barHeight + 100}, 50, 80)`;
                                  ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

                                  x += barWidth;
                                }

                                if (elapsed < 1200) {
                                  requestAnimationFrame(draw);
                                } else {
                                  ctx.fillStyle = '#1A1A1A';
                                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                                  ctx.strokeStyle = '#F43F5E';
                                  ctx.lineWidth = 1;
                                  ctx.beginPath();
                                  ctx.moveTo(0, canvas.height / 2);
                                  ctx.lineTo(canvas.width, canvas.height / 2);
                                  ctx.stroke();
                                }
                              };
                              requestAnimationFrame(draw);
                            }}
                            className="w-full py-1.5 border-2 border-black bg-[#FFB703] hover:bg-amber-400 text-[#1A1A1A] font-extrabold text-xs uppercase neo-shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>TRIGGER SONIC SWEEP</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* INTERACTIVE NESTED GRID SANDBOX */}
              {el.type === 'layout_sandbox' && (
                (() => {
                  const panes = propertiesObj.panes || [
                    { id: 'p1', title: 'MATRIX_CELL_ALPHA', content: 'Operational notes inside subgrid alpha.', color: 'bg-emerald-50' },
                    { id: 'p2', title: 'MATRIX_CELL_BETA', content: 'Operational notes inside subgrid beta.', color: 'bg-indigo-50' }
                  ];
                  const splitRatio = propertiesObj.splitRatio || '50-50';
                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-sky-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Interactive Brutalist Layout Sandbox
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-sky-200 px-1.5 py-0.5 bg-sky-50 text-sky-600 font-extrabold uppercase rounded-sm">
                          Alternative Grid Container
                        </span>
                      </div>

                      {/* Split controllers */}
                      <div className="flex items-center space-x-2 mb-3 text-[9px] font-mono font-black text-gray-400">
                        <span>DIVIDER RATIO:</span>
                        {['50-50', '30-70', '70-30'].map(ratio => (
                          <button
                            key={ratio}
                            onClick={() => updateCanvasElement(el.id, {
                              properties: JSON.stringify({ ...propertiesObj, splitRatio: ratio })
                            })}
                            className={`px-1.5 py-0.5 border border-[#1A1A1A] uppercase cursor-pointer ${
                              splitRatio === ratio ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            const newId = `p${Date.now()}`;
                            const newPane = { id: newId, title: 'NEW_MATRIX_PANE', content: 'Edit pane contents...', color: 'bg-amber-50' };
                            const updated = [...panes, newPane];
                            updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, panes: updated }) });
                          }}
                          className="px-1.5 py-0.5 border border-dashed border-sky-600 text-sky-600 uppercase cursor-pointer hover:bg-sky-50"
                        >
                          + Add Pane
                        </button>
                      </div>

                      {/* Nesting sandbox grid */}
                      <div className={`grid border-2 border-[#1A1A1A] bg-[#1A1A1A] gap-1 ${
                        splitRatio === '30-70' ? 'grid-cols-1 sm:grid-cols-10' :
                        splitRatio === '70-30' ? 'grid-cols-1 sm:grid-cols-10' :
                        'grid-cols-1 sm:grid-cols-2'
                      }`}>
                        {panes.map((pane: any, pIdx: number) => {
                          const colSpan = splitRatio === '30-70' ? (pIdx === 0 ? 'sm:col-span-3' : 'sm:col-span-7') :
                                          splitRatio === '70-30' ? (pIdx === 0 ? 'sm:col-span-7' : 'sm:col-span-3') : '';
                          return (
                            <div key={pane.id} className={`${colSpan} ${pane.color || 'bg-white'} p-3.5 space-y-2`}>
                              <div className="flex items-center justify-between border-b border-black/10 pb-1">
                                <input
                                  type="text"
                                  value={pane.title}
                                  onChange={(e) => {
                                    const updated = panes.map((p: any) => p.id === pane.id ? { ...p, title: e.target.value.toUpperCase() } : p);
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, panes: updated }) });
                                  }}
                                  className="bg-transparent font-mono text-[10px] font-black border-none outline-none uppercase text-gray-700 w-2/3"
                                />
                                {panes.length > 1 && (
                                  <button
                                    onClick={() => {
                                      const updated = panes.filter((p: any) => p.id !== pane.id);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, panes: updated }) });
                                    }}
                                    className="text-[9px] font-bold text-rose-600 hover:underline uppercase cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <textarea
                                value={pane.content}
                                onChange={(e) => {
                                  const updated = panes.map((p: any) => p.id === pane.id ? { ...p, content: e.target.value } : p);
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, panes: updated }) });
                                }}
                                rows={3}
                                className="w-full bg-transparent resize-none border-none outline-none text-xs font-medium text-slate-700 leading-relaxed font-sans"
                                placeholder="Type structural grid content..."
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* JSON AST SCHEMA PARSER */}
              {el.type === 'ast_parser' && (
                (() => {
                  const sourceText = propertiesObj.sourceText || "CORE-TX-88910: TRANSACTION OK";
                  const regexRule = propertiesObj.regexRule || "^([A-Z]+)-([A-Z]+)-([0-9]+):\\s*(.*)$";
                  
                  // Run parsing helper
                  let astTree: any[] = [];
                  let isValid = false;
                  try {
                    const rx = new RegExp(regexRule);
                    const match = sourceText.match(rx);
                    if (match) {
                      isValid = true;
                      astTree = [
                        { name: 'Document Node', value: sourceText, type: 'ROOT' },
                        { name: 'System Prefix', value: match[1] || 'None', type: 'TAG_PREFIX' },
                        { name: 'Operation Scope', value: match[2] || 'None', type: 'TAG_OP' },
                        { name: 'Identifier Value', value: match[3] || 'None', type: 'VAL_NUM' },
                        { name: 'Payload Segment', value: match[4] || 'None', type: 'TEXT_BODY' }
                      ];
                    }
                  } catch {}

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-[#F8F9FA] rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <FileJson className="w-4 h-4 text-violet-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Interactive JSON AST Schema Parser
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-violet-200 px-1.5 py-0.5 bg-violet-50 text-violet-600 font-extrabold uppercase rounded-sm">
                          AST Compliant IDE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">Source Text Stream:</label>
                            <input
                              type="text"
                              value={sourceText}
                              onChange={(e) => updateCanvasElement(el.id, {
                                properties: JSON.stringify({ ...propertiesObj, sourceText: e.target.value })
                              })}
                              className="w-full text-xs font-mono font-bold border-2 border-black p-2 bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">AST Regex Compiling Rule:</label>
                            <input
                              type="text"
                              value={regexRule}
                              onChange={(e) => updateCanvasElement(el.id, {
                                properties: JSON.stringify({ ...propertiesObj, regexRule: e.target.value })
                              })}
                              className="w-full text-xs font-mono font-bold border-2 border-black p-2 bg-white"
                            />
                          </div>
                        </div>

                        <div className="border-2 border-black bg-white p-3 space-y-2 font-mono text-xs flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-black text-gray-400 block uppercase mb-1">Evaluated AST Tree:</span>
                            {isValid ? (
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {astTree.map((node, nIdx) => (
                                  <div key={nIdx} className="text-[10px] pl-2 border-l border-[#1A1A1A]/20">
                                    <span className="text-violet-600 font-black">[{node.type}]</span>{' '}
                                    <span className="text-[#1A1A1A] font-bold">{node.name}:</span>{' '}
                                    <span className="text-slate-500">&quot;{node.value}&quot;</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] text-rose-500 font-black">
                                [PARSING EXCEPTION] Schema rule mismatch against Source Stream.
                              </div>
                            )}
                          </div>

                          <div className={`mt-2 border-2 border-black p-2 font-black text-[10px] text-center uppercase ${
                            isValid ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#FFCCD5] text-[#A70000]'
                          }`}>
                            {isValid ? '🟢 AST Match Code Compliant' : '🔴 Compilation Integrity Exception'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CHRONOS CYCLE TIMELINE */}
              {el.type === 'cycle_timeline' && (
                (() => {
                  const milestones = propertiesObj.milestones || [
                    { id: 'ms1', name: 'Synthesizer Module', day: 2, duration: 4, status: 'Completed' },
                    { id: 'ms2', name: 'Audit Log Ledger', day: 6, duration: 3, status: 'In Progress', dependsOn: 'ms1' }
                  ];

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <GitCommit className="w-4 h-4 text-indigo-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Chronos Task Cycle dependency Timeline
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-indigo-200 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-extrabold uppercase rounded-sm">
                          Grid Gantt Alternative
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Dynamic Grid Gantt Simulation */}
                        <div className="overflow-x-auto border-2 border-black bg-slate-50 p-2 font-mono text-[9px]">
                          <div className="grid grid-cols-12 gap-1 text-center font-black border-b border-black pb-1 mb-1.5 bg-slate-100 py-0.5">
                            <span className="col-span-4 text-left pl-1">MILESTONE</span>
                            {Array.from({ length: 8 }).map((_, i) => (
                              <span key={i} className="col-span-1 border-l border-[#1A1A1A]/10">D{i+1}</span>
                            ))}
                          </div>

                          <div className="space-y-2">
                            {milestones.map((ms: any) => {
                              const leftColSpan = ms.day - 1;
                              const barColSpan = ms.duration;
                              return (
                                <div key={ms.id} className="grid grid-cols-12 gap-1 items-center">
                                  <span className="col-span-4 font-black truncate text-slate-700">{ms.name}</span>
                                  <div className="col-span-8 grid grid-cols-8 gap-0.5 h-4 relative">
                                    {/* Offset */}
                                    {Array.from({ length: leftColSpan }).map((_, i) => (
                                      <div key={i} className="bg-transparent border-r border-[#1A1A1A]/5" />
                                    ))}
                                    {/* Bar */}
                                    <div 
                                      className={`h-full border border-black rounded-none flex items-center justify-center font-bold text-[8px] text-white select-none ${
                                        ms.status === 'Completed' ? 'bg-[#2D6A4F]' : 'bg-[#4F46E5]'
                                      }`}
                                      style={{ gridColumn: `${ms.day} / span ${ms.duration}` }}
                                    >
                                      {ms.duration} Days
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="space-y-2 border-t border-dashed border-[#1A1A1A]/10 pt-3">
                          <span className="text-[10px] font-mono font-black text-gray-400 block uppercase font-sans">Modify Timeline Cycles:</span>
                          {milestones.map((ms: any) => (
                            <div key={ms.id} className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                              <span className="text-[10px] text-gray-500 w-24 truncate">{ms.name}</span>
                              
                              <div className="flex items-center space-x-1">
                                <span className="text-[9px]">Start:</span>
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={ms.day}
                                  onChange={(e) => {
                                    const updated = milestones.map((item: any) => item.id === ms.id ? { ...item, day: parseInt(e.target.value) } : item);
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, milestones: updated }) });
                                  }}
                                  className="w-16 accent-indigo-600 cursor-pointer"
                                />
                              </div>

                              <div className="flex items-center space-x-1">
                                <span className="text-[9px]">Length:</span>
                                <input
                                  type="range"
                                  min="1"
                                  max="7"
                                  value={ms.duration}
                                  onChange={(e) => {
                                    const updated = milestones.map((item: any) => item.id === ms.id ? { ...item, duration: parseInt(e.target.value) } : item);
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, milestones: updated }) });
                                  }}
                                  className="w-16 accent-indigo-600 cursor-pointer"
                                />
                              </div>

                              <select
                                value={ms.status}
                                onChange={(e) => {
                                  const updated = milestones.map((item: any) => item.id === ms.id ? { ...item, status: e.target.value } : item);
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, milestones: updated }) });
                                }}
                                className="border border-black p-0.5 text-[9px] bg-white cursor-pointer"
                              >
                                <option value="Backlog">Backlog</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CLUSTER DIAGNOSTIC TELEMETRY */}
              {el.type === 'telemetry_deck' && (
                (() => {
                  const dbCount = elements.length;
                  const queueCount = 0; // standard fallback
                  const canvasesCount = canvasesList.length;
                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-[#0F172A] text-slate-100 rounded-none neo-shadow-sm my-2 w-full font-mono">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 font-mono">
                            Workspace Diagnostic Telemetry & Engine Stats
                          </span>
                        </div>
                        <span className="text-[9px] border border-cyan-500/30 px-1.5 py-0.5 bg-cyan-950 text-cyan-400 font-extrabold uppercase rounded-sm">
                          Live Engine Telemetry
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                        <div className="border border-slate-800 p-2 bg-slate-900/60">
                          <span className="text-[9px] text-slate-500 uppercase block font-black">Active Canvas Pages</span>
                          <span className="text-base font-black text-cyan-400">{canvasesCount}</span>
                        </div>
                        <div className="border border-slate-800 p-2 bg-slate-900/60">
                          <span className="text-[9px] text-slate-500 uppercase block font-black">Active Workspace Blocks</span>
                          <span className="text-base font-black text-cyan-400">{dbCount}</span>
                        </div>
                        <div className="border border-slate-800 p-2 bg-slate-900/60">
                          <span className="text-[9px] text-slate-500 uppercase block font-black">Sync Ledger Queue</span>
                          <span className="text-base font-black text-amber-400">{queueCount}</span>
                        </div>
                        <div className="border border-slate-800 p-2 bg-slate-900/60">
                          <span className="text-[9px] text-slate-500 uppercase block font-black">Memory Allocation</span>
                          <span className="text-base font-black text-emerald-400">~{Math.round((dbCount * 0.45 + canvasesCount * 1.8) * 10) / 10} KB</span>
                        </div>
                      </div>

                      {/* Moving pulse visual */}
                      <div className="border border-slate-800 p-2 bg-[#020617] h-12 flex items-center justify-center relative overflow-hidden">
                        <span className="absolute top-1 left-1.5 text-[8px] text-cyan-500/50 font-black uppercase">CLUSTER CLIENT OSCILLOGRAPH</span>
                        <svg className="w-full h-8 stroke-cyan-500 stroke-2 fill-none animate-pulse" viewBox="0 0 400 40">
                          <path d="M0,20 Q40,0 80,20 T160,20 T240,20 T320,20 T400,20" />
                        </svg>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* MARKDOWN AST COMPILER */}
              {el.type === 'markdown_ast' && (
                (() => {
                  const md = el.content || "# Zenith Custom Node\nZenith alternative AST system allows **real-time** parsing without standard database bloat. \n- Secure storage\n- Acoustic triggers";
                  
                  // Simple compiler to build a mock Markdown AST
                  const lines = md.split('\n');
                  const astTree: any[] = [];
                  lines.forEach((line, idx) => {
                    if (line.startsWith('# ')) {
                      astTree.push({ type: 'Heading1', value: line.replace('# ', ''), index: idx });
                    } else if (line.startsWith('## ')) {
                      astTree.push({ type: 'Heading2', value: line.replace('## ', ''), index: idx });
                    } else if (line.startsWith('- ')) {
                      astTree.push({ type: 'ListItem', value: line.replace('- ', ''), index: idx });
                    } else if (line.trim() !== '') {
                      astTree.push({ type: 'Paragraph', value: line, index: idx });
                    }
                  });

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Markdown AST Parser & Compiler
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Markdown IDE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">Markdown Source Editor:</label>
                          <textarea
                            value={md}
                            onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                            rows={6}
                            className="w-full text-xs font-mono font-bold border-2 border-black p-2 bg-white leading-relaxed resize-none h-44 outline-none"
                            placeholder="Type markdown syntax here..."
                          />
                        </div>

                        <div className="border-2 border-black bg-slate-50 p-3 h-44 overflow-y-auto flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-black text-gray-400 block uppercase mb-2">Parsed AST Syntax Hierarchy:</span>
                            <div className="space-y-1 font-mono text-[9px]">
                              {astTree.map((item, iIdx) => (
                                <div key={iIdx} className="pl-1.5 border-l-2 border-emerald-500 flex items-center justify-between py-0.5 bg-white mb-1 border border-gray-200">
                                  <span>
                                    <strong className="text-emerald-700">[{item.type}]</strong>: &quot;{item.value.substring(0, 24)}{item.value.length > 24 ? '...' : ''}&quot;
                                  </span>
                                  <span className="text-[7px] text-gray-400 uppercase tracking-widest font-black pr-1">Line {item.index + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* LAYER CONNECTIVITY RELATION GRAPH */}
              {el.type === 'relation_graph' && (
                <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <Share2 className="w-4 h-4 text-[#FFB703]" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                        Layer Connectivity Relation network Graph
                      </span>
                    </div>
                    <span className="text-[9px] font-mono border border-[#FFB703]/20 px-1.5 py-0.5 bg-[#FFB703]/5 text-[#FFB703] font-extrabold uppercase rounded-sm">
                      Interactive Map
                    </span>
                  </div>

                  <span className="text-[9px] font-mono font-black text-gray-400 block mb-2 uppercase font-sans">Warp Navigation Net:</span>
                  <div className="flex flex-wrap gap-2.5">
                    {canvasesList.map(c => {
                      const isActive = c.id === canvasId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            window.location.href = `/canvas/${c.id}`;
                          }}
                          className={`px-3 py-1.5 border-2 text-xs font-black uppercase transition-all flex items-center space-x-1 cursor-pointer ${
                            isActive 
                              ? 'bg-[#1A1A1A] text-white border-black neo-shadow-sm hover:shadow-none' 
                              : 'bg-[#FFB703] text-black border-black neo-shadow-sm hover:translate-y-[1px] hover:shadow-none hover:bg-amber-400'
                          }`}
                        >
                          <span>{c.icon || '📄'}</span>
                          <span>{c.title}</span>
                          {isActive && <span className="text-[8px] bg-emerald-500 text-white font-black ml-1.5 px-1 py-0.5 rounded uppercase">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEMANTIC TAG WEIGHT SEARCH MATRIX */}
              {el.type === 'search_matrix' && (
                (() => {
                  const query = propertiesObj.searchQuery || '';
                  const tags = ['#draft', '#milestone', '#acoustic', '#ledger', '#sandbox', '#relational'];

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Search className="w-4 h-4 text-sky-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Global Semantic Tag Weight & Search Matrix
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-sky-200 px-1.5 py-0.5 bg-sky-50 text-sky-600 font-extrabold uppercase rounded-sm">
                          Index Engine
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type high-speed index query..."
                            value={query}
                            onChange={(e) => updateCanvasElement(el.id, {
                              properties: JSON.stringify({ ...propertiesObj, searchQuery: e.target.value })
                            })}
                            className="flex-1 text-xs font-mono font-bold border-2 border-black p-2 bg-white"
                          />
                          {query && (
                            <button
                              onClick={() => updateCanvasElement(el.id, {
                                properties: JSON.stringify({ ...propertiesObj, searchQuery: '' })
                              })}
                              className="px-3 border-2 border-black bg-rose-50 text-rose-700 text-xs font-black uppercase cursor-pointer"
                            >
                              CLEAR
                            </button>
                          )}
                        </div>

                        {/* Interactive Weighted Tags */}
                        <div>
                          <span className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">Index tag heatweights:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag, tIdx) => {
                              const size = 10 + (tIdx * 2);
                              const isMatch = query.toLowerCase() === tag.toLowerCase();
                              return (
                                <button
                                  key={tag}
                                  onClick={() => updateCanvasElement(el.id, {
                                    properties: JSON.stringify({ ...propertiesObj, searchQuery: tag })
                                  })}
                                  className={`px-2 py-1 border font-mono font-bold uppercase transition-all rounded-none cursor-pointer ${
                                    isMatch 
                                      ? 'bg-sky-600 text-white border-black font-black scale-105' 
                                      : 'bg-slate-50 text-slate-700 border-black/10 hover:border-black hover:bg-slate-100'
                                  }`}
                                  style={{ fontSize: `${size}px` }}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Query results list */}
                        {query && (
                          <div className="border-2 border-black bg-slate-50 p-2.5 space-y-1.5 font-mono text-[9px] max-h-36 overflow-y-auto">
                            <span className="font-black text-slate-500 uppercase">Search Matches for &quot;{query}&quot;:</span>
                            <div className="space-y-1">
                              <div className="p-1.5 bg-white border border-black/10 flex items-center justify-between">
                                <span className="font-bold text-gray-700">&quot;Using the #acoustic node layers for harmonic wave evaluation...&quot;</span>
                                <span className="text-sky-600 font-extrabold uppercase bg-sky-50 px-1 border border-sky-100">DRAFT_CANVAS</span>
                              </div>
                              <div className="p-1.5 bg-white border border-black/10 flex items-center justify-between">
                                <span className="font-bold text-gray-700">&quot;This system runs an alternative AST ledger instead of DB grids.&quot;</span>
                                <span className="text-sky-600 font-extrabold uppercase bg-sky-50 px-1 border border-sky-100">CENTRAL_GATE</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* FORMULA SPREADSHEET SANDBOX */}
              {el.type === 'formula_grid' && (
                (() => {
                  const gridState = propertiesObj.grid || {
                    cells: {
                      'A1': '10', 'A2': '20', 'A3': '=SUM(A1:A2)',
                      'B1': '15', 'B2': '30', 'B3': '=B1+B2',
                      'C1': '5',  'C2': '=A1*C1', 'C3': '=SUM(A3:B3)'
                    }
                  };
                  const cells = gridState.cells;

                  const evalFormula = (cellVal: string, allCells: any, visited = new Set<string>()): string => {
                    if (!cellVal) return '';
                    if (!cellVal.startsWith('=')) return cellVal;
                    try {
                      const expr = cellVal.substring(1).toUpperCase();
                      let parsedExpr = expr;

                      if (parsedExpr.startsWith('SUM(')) {
                        const match = parsedExpr.match(/SUM\(([A-C][1-3]):([A-C][1-3])\)/);
                        if (match) {
                          const start = match[1];
                          const end = match[2];
                          let sum = 0;
                          const colStart = start.charCodeAt(0);
                          const colEnd = end.charCodeAt(0);
                          const rowStart = parseInt(start[1]);
                          const rowEnd = parseInt(end[1]);
                          for (let col = colStart; col <= colEnd; col++) {
                            for (let row = rowStart; row <= rowEnd; row++) {
                              const cellKey = String.fromCharCode(col) + row;
                              if (visited.has(cellKey)) return '#CYCLE!';
                              visited.add(cellKey);
                              const evald = parseFloat(evalFormula(allCells[cellKey] || '', allCells, visited)) || 0;
                              visited.delete(cellKey);
                              sum += evald;
                            }
                          }
                          return String(sum);
                        }
                      }

                      const cellRegex = /[A-C][1-3]/g;
                      parsedExpr = parsedExpr.replace(cellRegex, (match) => {
                        if (visited.has(match)) return '0';
                        visited.add(match);
                        const val = evalFormula(allCells[match] || '', allCells, visited);
                        visited.delete(match);
                        return String(parseFloat(val) || 0);
                      });

                      const sanitized = parsedExpr.replace(/[^0-9+\-*/().\s]/g, '');
                      const result = new Function(`return (${sanitized})`)();
                      return String(result !== undefined ? result : '#ERR');
                    } catch {
                      return '#ERR';
                    }
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calculator className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Formula Spreadsheet Sandbox
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Grid AST Compiler
                        </span>
                      </div>

                      <div className="overflow-x-auto border-2 border-[#1A1A1A] mb-3">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="bg-slate-50 border-b-2 border-black">
                              <th className="p-2 border-r border-[#1A1A1A] bg-slate-100 w-12 text-center">Cell</th>
                              {['A', 'B', 'C'].map(col => (
                                <th key={col} className="p-2 border-r border-[#1A1A1A] font-black uppercase text-center">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3].map(row => (
                              <tr key={row} className="border-b border-black last:border-b-0">
                                <td className="p-2 border-r border-[#1A1A1A] font-black bg-slate-50 text-center w-12">{row}</td>
                                {['A', 'B', 'C'].map(col => {
                                  const cellKey = `${col}${row}`;
                                  const formula = cells[cellKey] || '';
                                  const evaluated = evalFormula(formula, cells);
                                  return (
                                    <td key={col} className="p-1 border-r border-[#1A1A1A] last:border-r-0 relative">
                                      <div className="flex flex-col">
                                        <input
                                          type="text"
                                          value={formula}
                                          onChange={(e) => {
                                            const nextCells = { ...cells, [cellKey]: e.target.value };
                                            const updated = { ...gridState, cells: nextCells };
                                            updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, grid: updated }) });
                                          }}
                                          className="w-full bg-transparent p-1 outline-none text-xs font-bold text-gray-800"
                                          placeholder="-"
                                        />
                                        {formula.startsWith('=') && (
                                          <span className="text-[9px] font-mono font-semibold text-emerald-600 px-1 bg-emerald-50 rounded-sm self-start mt-0.5 pointer-events-none">
                                            {evaluated}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono leading-tight">
                        SUPPORTED: Math expressions e.g. <code className="bg-slate-100 px-1 py-0.5 text-slate-800 border border-black/5 font-black">=A1+B2</code> or ranges <code className="bg-slate-100 px-1 py-0.5 text-slate-800 border border-black/5 font-black">=SUM(A1:C2)</code>.
                      </div>
                    </div>
                  );
                })()
              )}

              {/* SVG FLOW SKETCHPAD */}
              {el.type === 'vector_diagram' && (
                (() => {
                  const state = propertiesObj.vector || {
                    shapes: [
                      { id: 'sh1', type: 'rect', x: 20, y: 20, w: 80, h: 40, color: '#3A86C8', label: 'CLIENT' },
                      { id: 'sh2', type: 'rect', x: 180, y: 20, w: 80, h: 40, color: '#2EC4B6', label: 'SERVER' },
                      { id: 'sh3', type: 'line', x: 100, y: 40, w: 180, h: 40, color: '#FFB703', label: 'HTTP API' }
                    ],
                    selectedId: ''
                  };
                  const shapes = state.shapes;
                  const selectedId = state.selectedId;
                  const selectedShape = shapes.find((s: any) => s.id === selectedId);

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Paintbrush className="w-4 h-4 text-purple-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            SVG Vector Flow Diagram Board
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-purple-200 px-1.5 py-0.5 bg-purple-50 text-purple-600 font-extrabold uppercase rounded-sm">
                          Interactive Vector DB
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <div className="border-2 border-black bg-slate-50 relative overflow-hidden" style={{ height: '200px' }}>
                            <svg className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
                              {shapes.map((s: any) => {
                                const isSel = s.id === selectedId;
                                return (
                                  <g 
                                    key={s.id} 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updated = { ...state, selectedId: s.id };
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, vector: updated }) });
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {s.type === 'rect' && (
                                      <rect 
                                        x={s.x} y={s.y} width={s.w} height={s.h} 
                                        fill={s.color} stroke="#1A1A1A" strokeWidth={isSel ? 3 : 2} 
                                      />
                                    )}
                                    {s.type === 'circle' && (
                                      <circle 
                                        cx={s.x + s.w/2} cy={s.y + s.h/2} r={s.w/2} 
                                        fill={s.color} stroke="#1A1A1A" strokeWidth={isSel ? 3 : 2} 
                                      />
                                    )}
                                    {s.type === 'line' && (
                                      <line 
                                        x1={s.x} y1={s.y} x2={s.w} y2={s.h} 
                                        stroke={s.color} strokeWidth={isSel ? 4 : 3} 
                                        markerEnd="url(#arrow)"
                                      />
                                    )}
                                    <text 
                                      x={s.type === 'line' ? (s.x + s.w)/2 : s.x + s.w/2} 
                                      y={s.type === 'line' ? (s.y + s.h)/2 - 5 : s.y + s.h/2 + 4} 
                                      textAnchor="middle" 
                                      className="font-mono text-[9px] font-black fill-[#1A1A1A] select-none"
                                    >
                                      {s.label}
                                    </text>
                                  </g>
                                );
                              })}
                              <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#1A1A1A" />
                                </marker>
                              </defs>
                            </svg>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between border-2 border-black p-3 bg-slate-50 font-mono text-xs">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-gray-400 block uppercase">Shape Tools:</span>
                            <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                              <button
                                onClick={() => {
                                  const nShape = { id: `sh${Date.now()}`, type: 'rect', x: 50, y: 50, w: 70, h: 35, color: '#CAF0F8', label: 'NODE' };
                                  const updated = { ...state, shapes: [...shapes, nShape], selectedId: nShape.id };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, vector: updated }) });
                                }}
                                className="p-1 border border-black bg-white font-bold hover:bg-slate-100 uppercase cursor-pointer"
                              >
                                + Box
                              </button>
                              <button
                                onClick={() => {
                                  const nShape = { id: `sh${Date.now()}`, type: 'circle', x: 60, y: 60, w: 40, h: 40, color: '#FFCCD5', label: 'BUBBLE' };
                                  const updated = { ...state, shapes: [...shapes, nShape], selectedId: nShape.id };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, vector: updated }) });
                                }}
                                className="p-1 border border-black bg-white font-bold hover:bg-slate-100 uppercase cursor-pointer"
                              >
                                + Circle
                              </button>
                              <button
                                onClick={() => {
                                  const nShape = { id: `sh${Date.now()}`, type: 'line', x: 20, y: 120, w: 150, h: 120, color: '#A70000', label: 'LINK' };
                                  const updated = { ...state, shapes: [...shapes, nShape], selectedId: nShape.id };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, vector: updated }) });
                                }}
                                className="p-1 border border-black bg-white font-bold hover:bg-slate-100 uppercase col-span-2 cursor-pointer"
                              >
                                + Connector Vector Arrow
                              </button>
                            </div>

                            {selectedShape && (
                              <div className="border-t border-dashed border-black/15 pt-2.5 space-y-1.5 text-[9px]">
                                <span className="font-bold text-gray-500 uppercase">Selected: {selectedShape.id}</span>
                                <div className="flex items-center justify-between">
                                  <span>Text:</span>
                                  <input 
                                    type="text" 
                                    value={selectedShape.label} 
                                    onChange={(e) => {
                                      const updatedShapes = shapes.map((s: any) => s.id === selectedId ? { ...s, label: e.target.value } : s);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, vector: { ...state, shapes: updatedShapes } }) });
                                    }}
                                    className="border border-black p-0.5 bg-white text-[9px] w-24"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Coord X:</span>
                                  <input 
                                    type="range" min="0" max="250" step="5"
                                    value={selectedShape.x} 
                                    onChange={(e) => {
                                      const updatedShapes = shapes.map((s: any) => s.id === selectedId ? { ...s, x: parseInt(e.target.value) } : s);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, vector: { ...state, shapes: updatedShapes } }) });
                                    }}
                                    className="w-20 cursor-pointer accent-purple-600"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Coord Y:</span>
                                  <input 
                                    type="range" min="0" max="150" step="5"
                                    value={selectedShape.y} 
                                    onChange={(e) => {
                                      const updatedShapes = shapes.map((s: any) => s.id === selectedId ? { ...s, y: parseInt(e.target.value) } : s);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, vector: { ...state, shapes: updatedShapes } }) });
                                    }}
                                    className="w-20 cursor-pointer accent-purple-600"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const updatedShapes = shapes.filter((s: any) => s.id !== selectedId);
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, vector: { ...state, shapes: updatedShapes, selectedId: '' } }) });
                                  }}
                                  className="w-full py-1 border border-rose-500 bg-rose-50 text-rose-600 font-extrabold uppercase cursor-pointer"
                                >
                                  Remove Shape
                                </button>
                              </div>
                            )}
                          </div>
                          {!selectedId && (
                            <span className="text-[8px] text-gray-400 italic block mt-4">Select shape elements on diagram to tweak offsets.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* RELATIONAL SQL SCHEMA VISUALIZER */}
              {el.type === 'sql_schema_visualizer' && (
                (() => {
                  const schema = propertiesObj.sqlSchema || {
                    tables: [
                      { id: 'tb1', name: 'accounts', columns: ['id (UUID)', 'email (TEXT)', 'created_at (TIMESTAMP)'] },
                      { id: 'tb2', name: 'canvases', columns: ['id (UUID)', 'account_id (UUID)', 'title (TEXT)'] }
                    ],
                    relations: [
                      { from: 'tb2.account_id', to: 'tb1.id' }
                    ]
                  };

                  const ddlQuery = (() => {
                    let ddl = '';
                    schema.tables.forEach((t: any) => {
                      ddl += `CREATE TABLE ${t.name} (\n`;
                      const colLines = t.columns.map((c: string) => `  ${c.replace(/ *\([^)]*\) */g, ' ').trim()} ${c.includes('UUID') ? 'UUID PRIMARY KEY' : c.includes('TIMESTAMP') ? 'TIMESTAMP DEFAULT NOW()' : 'VARCHAR(255)'}`);
                      ddl += colLines.join(',\n') + '\n);\n\n';
                    });
                    schema.relations.forEach((r: any) => {
                      const [fromT, fromC] = r.from.split('.');
                      const [toT, toC] = r.to.split('.');
                      const fromTableName = schema.tables.find((t: any) => t.id === fromT)?.name || 'tbl';
                      const toTableName = schema.tables.find((t: any) => t.id === toT)?.name || 'tbl';
                      ddl += `ALTER TABLE ${fromTableName}\nADD CONSTRAINT fk_${fromTableName}_${fromC}\nFOREIGN KEY (${fromC}) REFERENCES ${toTableName}(${toC});\n\n`;
                    });
                    return ddl;
                  })();

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-blue-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Relational SQL Schema Visualizer
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-blue-200 px-1.5 py-0.5 bg-blue-50 text-blue-600 font-extrabold uppercase rounded-sm">
                          DDL Engine
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">Entity Relations Diagram:</span>
                          <div className="space-y-2 max-h-48 overflow-y-auto font-mono">
                            {schema.tables.map((t: any) => (
                              <div key={t.id} className="border-2 border-black bg-slate-50 p-2.5 relative">
                                <div className="flex items-center justify-between border-b border-black/10 pb-1 mb-1">
                                  <input 
                                    type="text" value={t.name}
                                    onChange={(e) => {
                                      const nextTables = schema.tables.map((tbl: any) => tbl.id === t.id ? { ...tbl, name: e.target.value } : tbl);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sqlSchema: { ...schema, tables: nextTables } }) });
                                    }}
                                    className="font-black text-xs uppercase bg-transparent outline-none border-b border-dashed border-black/10 focus:border-black text-[10px] py-0.5"
                                  />
                                  <button
                                    onClick={() => {
                                      const nextTables = schema.tables.filter((tbl: any) => tbl.id !== t.id);
                                      const nextRels = schema.relations.filter((r: any) => !r.from.startsWith(t.id) && !r.to.startsWith(t.id));
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sqlSchema: { tables: nextTables, relations: nextRels } }) });
                                    }}
                                    className="text-[9px] font-black text-rose-600 hover:underline uppercase cursor-pointer"
                                  >
                                    Drop
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  {t.columns.map((col: string, cIdx: number) => (
                                    <div key={cIdx} className="text-[10px] font-mono text-gray-700 flex justify-between">
                                      <span>🔑 {col}</span>
                                      {schema.relations.some((r: any) => r.from === `${t.id}.${col.split(' ')[0]}`) && (
                                        <span className="text-blue-600 font-extrabold uppercase text-[8px] tracking-tight bg-blue-50 border border-blue-200 px-1 rounded">FK LINK</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => {
                                    const colName = prompt("Enter Column name (e.g. workspace_id (UUID)):") || '';
                                    if (colName) {
                                      const nextTables = schema.tables.map((tbl: any) => tbl.id === t.id ? { ...tbl, columns: [...tbl.columns, colName] } : tbl);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sqlSchema: { ...schema, tables: nextTables } }) });
                                    }
                                  }}
                                  className="w-full text-center border border-dashed border-slate-400 mt-2 text-[9px] font-black text-slate-500 hover:bg-slate-100 py-0.5 uppercase cursor-pointer font-sans"
                                >
                                  + New Attribute
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const tblName = prompt("Enter Entity Table Name:") || '';
                                if (tblName) {
                                  const nTable = { id: `tb${Date.now()}`, name: tblName.toLowerCase(), columns: ['id (UUID)'] };
                                  const nextTables = [...schema.tables, nTable];
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sqlSchema: { ...schema, tables: nextTables } }) });
                                }
                              }}
                              className="w-full py-1.5 border-2 border-black bg-[#FFB703] text-black text-[10px] font-black uppercase text-center cursor-pointer hover:bg-amber-400 font-sans"
                            >
                              + CREATE NEW SCHEMATIC TABLE
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between border-2 border-black bg-slate-900 text-cyan-400 p-3 font-mono text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Generated SQL Ledger:</span>
                            <pre className="text-[9px] text-[#A5D6A7] overflow-x-auto select-all leading-tight max-h-36">
                              {ddlQuery}
                            </pre>
                          </div>
                          <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[8px] text-slate-500 font-black">
                            <span>SQL STATE: VALID COMPILABLE</span>
                            <span>ENGINE: POSTGRESQL_16</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CONFLICT SYNC & MERGE TERMINAL */}
              {el.type === 'conflict_sync_simulator' && (
                (() => {
                  const syncState = propertiesObj.syncSim || {
                    strategy: 'MVCC-Merge',
                    activeTab: 'mvcc', // mvcc, delta, compact, crdt, network, batch, stash, clock, p2p, merkle
                    clientRevision: 42,
                    cloudRevision: 45,
                    
                    // Feature 1: MVCC Branch Merger
                    branchClient: 'v42-local-sandbox-edits',
                    branchCloud: 'v45-upstream-workspace-main',
                    selectedBranchHead: 'Client',
                    
                    // Feature 2: Delta Frame Compressor
                    deltaPackets: [
                      { id: 'dp1', action: 'insert', table: 'elements', rawSize: 1240, compSize: 180, active: true },
                      { id: 'dp2', action: 'update', table: 'canvases', rawSize: 850, compSize: 95, active: false },
                      { id: 'dp3', action: 'update', table: 'collectionRows', rawSize: 3100, compSize: 450, active: false }
                    ],
                    
                    // Feature 3: Ledger Vacuum Compactor
                    ledgerRows: 1420,
                    uncompressedSizeKB: 2450,
                    isCompacting: false,
                    
                    // Feature 4: CRDT PN-Counter / LWW-Set
                    crdtCounterA: 5,
                    crdtCounterB: 3,
                    
                    // Feature 5: Jitter & Network Simulator
                    packetLossPct: 15,
                    jitterMs: 120,
                    latencyMs: 150,
                    
                    // Feature 6: Throttling & Batching Regulator
                    syncThrottleMs: 2000,
                    batchSizeMax: 50,
                    
                    // Feature 7: Mutation Stash Ledger
                    stashMutations: [
                      { id: 'st1', action: 'update', target: 'el-7', prop: 'content', size: 120 },
                      { id: 'st2', action: 'insert', target: 'el-14', prop: 'todo', size: 85 },
                      { id: 'st3', action: 'update', target: 'canvas-root-1', prop: 'title', size: 64 }
                    ],
                    
                    // Feature 8: Vector Clock Tracer
                    vectorClock: { ClientA: 14, ClientB: 9, Server: 25 },
                    
                    // Feature 9: Local P2P Coupling Link
                    p2pStatus: 'Coupled', // Idle, Coupled, Handshaking
                    p2pThroughput: 12.4, // KB/s
                    
                    // Feature 10: Merkle Tree State Healer
                    merkleNodes: [
                      { id: 'root', hash: 'e3b0c442', status: 'valid' },
                      { id: 'branch-1', hash: '8f43a9b1', status: 'valid' },
                      { id: 'branch-2', hash: '1a2b3c4d', status: 'valid' },
                      { id: 'leaf-1-1', hash: '4f92e8a1', status: 'valid' },
                      { id: 'leaf-1-2', hash: '0d9c3b8a', status: 'valid' },
                      { id: 'leaf-2-1', hash: '7e6d5c4b', status: 'valid' },
                      { id: 'leaf-2-2', hash: '3a2b1c0d', status: 'valid' }
                    ],

                    logs: [
                      { time: '14:10:02', op: 'LEDGER_INIT', payload: 'IndexedDB transaction buffer initialized.', status: 'OK' },
                      { time: '14:11:15', op: 'PEER_CONNECTED', payload: 'P2P direct web socket coupled successfully.', status: 'OK' },
                      { time: '14:12:00', op: 'MERKLE_SYNC', payload: 'State verification scan completed, 100% hash convergence.', status: 'OK' }
                    ]
                  };

                  const updateState = (key: string, value: any) => {
                    const updated = { ...syncState, [key]: value };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, syncSim: updated }) });
                  };

                  const triggerLocalLog = (op: string, payload: string, status: 'OK' | 'WARNING' | 'CONFLICT' | 'PENDING') => {
                    const time = new Date().toTimeString().split(' ')[0];
                    const newLog = { time, op, payload, status };
                    const updatedLogs = [...syncState.logs, newLog].slice(-25); // cap logs at 25
                    updateState('logs', updatedLogs);
                  };

                  const executeCompaction = () => {
                    updateState('isCompacting', true);
                    triggerLocalLog('VACUUM_INIT', 'Beginning deep ledger vacuum and metadata rebuilding...', 'PENDING');
                    setTimeout(() => {
                      const finalRows = Math.round(syncState.ledgerRows * 0.42);
                      const finalSize = Math.round(syncState.uncompressedSizeKB * 0.35);
                      const time = new Date().toTimeString().split(' ')[0];
                      const logs = [
                        ...syncState.logs,
                        { time, op: 'VACUUM_OK', payload: `Ledger rebuilt. Rows: ${syncState.ledgerRows} -> ${finalRows}. Size: ${syncState.uncompressedSizeKB}KB -> ${finalSize}KB. Reclaimed 65% of buffer.`, status: 'OK' }
                      ];
                      const updated = {
                        ...syncState,
                        ledgerRows: finalRows,
                        uncompressedSizeKB: finalSize,
                        isCompacting: false,
                        logs
                      };
                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, syncSim: updated }) });
                    }, 1200);
                  };

                  const healMerkleTree = () => {
                    triggerLocalLog('HEAL_INIT', 'Starting Merkle verification and repairing corrupt leaves...', 'PENDING');
                    setTimeout(() => {
                      const healedNodes = syncState.merkleNodes.map((node: any) => ({ ...node, status: 'valid' }));
                      const time = new Date().toTimeString().split(' ')[0];
                      const logs = [
                        ...syncState.logs,
                        { time, op: 'HEAL_CONVERGED', payload: 'Merkle tree root matched cloud state. State healed successfully.', status: 'OK' }
                      ];
                      const updated = {
                        ...syncState,
                        merkleNodes: healedNodes,
                        logs
                      };
                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, syncSim: updated }) });
                    }, 1000);
                  };

                  const corruptLeaf = (nodeId: string) => {
                    const updatedNodes = syncState.merkleNodes.map((node: any) => {
                      if (node.id === nodeId) {
                        return { ...node, status: 'corrupt', hash: Math.floor(Math.random() * 0xffffffff).toString(16) };
                      }
                      return node;
                    });
                    
                    // Propagate corruption upstream
                    const isLeafLeft = nodeId.startsWith('leaf-1');
                    const isLeafRight = nodeId.startsWith('leaf-2');
                    
                    const finalNodes = updatedNodes.map((node: any) => {
                      if (node.id === 'root') {
                        return { ...node, status: 'corrupt', hash: 'mismatch_err_root' };
                      }
                      if (node.id === 'branch-1' && isLeafLeft) {
                        return { ...node, status: 'corrupt', hash: 'mismatch_err_b1' };
                      }
                      if (node.id === 'branch-2' && isLeafRight) {
                        return { ...node, status: 'corrupt', hash: 'mismatch_err_b2' };
                      }
                      return node;
                    });

                    const time = new Date().toTimeString().split(' ')[0];
                    const logs = [
                      ...syncState.logs,
                      { time, op: 'STATE_CORRUPTION', payload: `Injected deliberate bit-flip corruption on leaf node "${nodeId}"`, status: 'CONFLICT' }
                    ];

                    const updated = {
                      ...syncState,
                      merkleNodes: finalNodes,
                      logs
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, syncSim: updated }) });
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-[#0A0F1D] text-slate-100 rounded-none neo-shadow-sm my-2 w-full font-mono relative overflow-hidden">
                      {/* Control Deck Header */}
                      <div className="flex flex-wrap items-center justify-between border-b-2 border-[#1A1A1A] pb-3 mb-4 bg-slate-900/40 -mx-4 -mt-4 p-4">
                        <div className="flex items-center space-x-2">
                          <GitCompare className="w-5 h-5 text-amber-400 animate-pulse" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-amber-400 block font-sans">
                              Zenith Offline Synchronization & State Deck
                            </span>
                            <span className="text-[9px] text-slate-400 block">
                              10-Tier Decentralized Replication, Compression & Conflict-Free Resolution Sandbox
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0 font-sans text-[8px] font-bold">
                          <span className="flex items-center text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-ping" />
                            CLIENT: ACTIVE
                          </span>
                          <span className="text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded-sm uppercase">
                            LEDGER REVISION: v{syncState.clientRevision}
                          </span>
                        </div>
                      </div>

                      {/* 10-Tier Feature Tab Rail */}
                      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-3 mb-4 text-[9px] font-sans font-bold">
                        <button
                          onClick={() => updateState('activeTab', 'mvcc')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'mvcc' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          1. MVCC BRANCHES
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'delta')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'delta' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          2. DELTA OPTIMIZER
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'compact')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'compact' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          3. VACUUM ENGINE
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'crdt')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'crdt' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          4. CRDT CONVERGER
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'network')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'network' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          5. JITTER TUNNEL
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'batch')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'batch' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          6. BATCH REGULATOR
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'stash')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'stash' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          7. MUTATION STASH
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'clock')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'clock' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          8. VECTOR CLOCK
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'p2p')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'p2p' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          9. LOCAL P2P LINK
                        </button>
                        <button
                          onClick={() => updateState('activeTab', 'merkle')}
                          className={`px-2 py-1 border transition-all ${syncState.activeTab === 'merkle' ? 'bg-amber-400 text-[#0A0F1D] border-amber-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                        >
                          10. MERKLE HEALER
                        </button>
                      </div>

                      {/* Main Dynamic Panel Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        
                        {/* Dynamic Interactive Panel Column (Left and Center spans) */}
                        <div className="md:col-span-2 border-2 border-slate-800 bg-slate-950/40 p-3 relative min-h-[220px] flex flex-col justify-between">
                          
                          {/* 1. MVCC Branches View */}
                          {syncState.activeTab === 'mvcc' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">Multi-Version Concurrency Control (MVCC)</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Branch Isolation</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Select branching head nodes to resolve linear state mismatches. The common ancestor identifies initial mutations before branching divergence.
                              </p>
                              
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <button
                                  onClick={() => {
                                    updateState('selectedBranchHead', 'Client');
                                    triggerLocalLog('BRANCH_SELECT', 'Isolated head pointing to local Client edits branch.', 'OK');
                                  }}
                                  className={`p-2 border text-left flex flex-col justify-between ${syncState.selectedBranchHead === 'Client' ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/30'}`}
                                >
                                  <span className="text-[7px] text-slate-500 font-bold uppercase block font-sans">1. Client Local</span>
                                  <span className="text-[9px] font-black text-blue-400 truncate mt-1">{syncState.branchClient}</span>
                                  <span className="text-[7px] text-slate-400 mt-2">Active Mutator</span>
                                </button>

                                <button
                                  onClick={() => {
                                    updateState('selectedBranchHead', 'Cloud');
                                    triggerLocalLog('BRANCH_SELECT', 'Isolated head pointing to remote Cloud master.', 'OK');
                                  }}
                                  className={`p-2 border text-left flex flex-col justify-between ${syncState.selectedBranchHead === 'Cloud' ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/30'}`}
                                >
                                  <span className="text-[7px] text-slate-500 font-bold uppercase block font-sans">2. Cloud Upstream</span>
                                  <span className="text-[9px] font-black text-emerald-400 truncate mt-1">{syncState.branchCloud}</span>
                                  <span className="text-[7px] text-slate-400 mt-2">Upstream Origin</span>
                                </button>

                                <button
                                  onClick={() => {
                                    updateState('selectedBranchHead', 'Ancestor');
                                    triggerLocalLog('BRANCH_SELECT', 'Isolated head pointing to Common Ancestor baseline.', 'OK');
                                  }}
                                  className={`p-2 border text-left flex flex-col justify-between ${syncState.selectedBranchHead === 'Ancestor' ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/30'}`}
                                >
                                  <span className="text-[7px] text-slate-500 font-bold uppercase block font-sans">3. Common Ancestor</span>
                                  <span className="text-[9px] font-black text-purple-400 truncate mt-1">v39-common-origin</span>
                                  <span className="text-[7px] text-slate-400 mt-2">Base State</span>
                                </button>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    const nextRev = syncState.cloudRevision;
                                    const time = new Date().toTimeString().split(' ')[0];
                                    const logs = [
                                      ...syncState.logs,
                                      { time, op: 'MVCC_FAST_FORWARD', payload: `Successfully fast-forwarded Client branch using ${syncState.selectedBranchHead} Head Authority.`, status: 'OK' }
                                    ];
                                    const updated = {
                                      ...syncState,
                                      clientRevision: nextRev,
                                      logs
                                    };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, syncSim: updated }) });
                                  }}
                                  className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-[#0A0F1D] text-[9px] font-black uppercase cursor-pointer"
                                >
                                  Reconcile Using Head [{syncState.selectedBranchHead.toUpperCase()}]
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 2. Delta Frame Compressor View */}
                          {syncState.activeTab === 'delta' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">Delta Packet Optimizer & Compression</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">D-RLE Encoder</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Click on dynamic transaction frame chunks to test run-length delta encoding compression. Raw bytes are compacted dynamically before upstream transmission.
                              </p>

                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {syncState.deltaPackets.map((dp: any) => {
                                  const ratio = Math.round((1 - dp.compSize / dp.rawSize) * 100);
                                  return (
                                    <div
                                      key={dp.id}
                                      onClick={() => {
                                        const updatedPackets = syncState.deltaPackets.map((p: any) => ({
                                          ...p,
                                          active: p.id === dp.id
                                        }));
                                        updateState('deltaPackets', updatedPackets);
                                        triggerLocalLog('COMPRESSION_TEST', `Selected packet: ${dp.table} (${dp.action}). Simulated Huffman savings: ${ratio}% compacting.`, 'OK');
                                      }}
                                      className={`p-2 border cursor-pointer transition-all flex items-center justify-between text-[8px] ${dp.active ? 'border-amber-400 bg-amber-400/5' : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'}`}
                                    >
                                      <div>
                                        <span className="font-extrabold uppercase text-blue-400 mr-1.5">[{dp.action}]</span>
                                        <span className="text-slate-300 font-mono">Table: {dp.table}</span>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <span className="text-slate-500 font-mono">Raw: {dp.rawSize}B → Delta: <span className="text-emerald-400 font-black">{dp.compSize}B</span></span>
                                        <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 font-black px-1.5 text-[7px] uppercase">
                                          -{ratio}% Comp.
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="text-[8px] text-slate-400 border border-slate-800 p-2 bg-slate-900/40">
                                <strong>Active Optimizer Algorithm:</strong> Adaptive Delta Huffman Pipeline + Local Indexed DB Diff Mapping.
                              </div>
                            </div>
                          )}

                          {/* 3. Ledger Vacuum Compactor View */}
                          {syncState.activeTab === 'compact' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">Local Ledger Compaction & Database Vacuum</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Dexie Storage</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Over time, local transaction streams in IndexedDB build overhead. Rebuild structural indices, clean tombstone rows, and reclaim disk space.
                              </p>

                              <div className="grid grid-cols-2 gap-3 py-1 text-[9px]">
                                <div className="border border-slate-800 bg-slate-900/20 p-2.5">
                                  <span className="text-slate-500 font-sans block uppercase text-[7px]">Log Records Stream</span>
                                  <span className="text-base font-extrabold text-[#E5E7EB]">{syncState.ledgerRows} Rows</span>
                                </div>
                                <div className="border border-slate-800 bg-slate-900/20 p-2.5">
                                  <span className="text-slate-500 font-sans block uppercase text-[7px]">Buffer Footprint Size</span>
                                  <span className="text-base font-extrabold text-[#E5E7EB]">{syncState.uncompressedSizeKB} KB</span>
                                </div>
                              </div>

                              <button
                                onClick={executeCompaction}
                                disabled={syncState.isCompacting}
                                className={`w-full py-1.5 border border-amber-400 text-amber-400 font-black uppercase text-[9px] cursor-pointer transition-all ${syncState.isCompacting ? 'bg-amber-400/10 opacity-60' : 'bg-amber-400/20 hover:bg-amber-400 hover:text-[#0A0F1D]'}`}
                              >
                                {syncState.isCompacting ? 'COMPACTING LEDGER DIRECTLY...' : 'RUN DEEP STORAGE VACUUM'}
                              </button>
                            </div>
                          )}

                          {/* 4. CRDT View */}
                          {syncState.activeTab === 'crdt' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">CRDT PN-Counter Convergence Sandbox</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Eventual Consistency</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Demonstrate conflict-free replica data state convergence. Increment and decrement states independently in multiple nodes and watch them mathematically converge.
                              </p>

                              <div className="grid grid-cols-2 gap-3 py-1">
                                <div className="border border-slate-800 bg-slate-900/30 p-2 text-center">
                                  <span className="text-[7px] text-slate-500 font-black block uppercase font-sans">Peer A Instance</span>
                                  <span className="text-lg font-black text-blue-400">{syncState.crdtCounterA}</span>
                                  <div className="flex justify-center gap-1.5 mt-2">
                                    <button
                                      onClick={() => {
                                        updateState('crdtCounterA', syncState.crdtCounterA + 1);
                                        triggerLocalLog('CRDT_MUTATION_A', 'Incremented Peer A PN-Counter node state.', 'PENDING');
                                      }}
                                      className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[8px] font-bold uppercase cursor-pointer hover:bg-slate-700"
                                    >
                                      +1
                                    </button>
                                    <button
                                      onClick={() => {
                                        updateState('crdtCounterA', syncState.crdtCounterA - 1);
                                        triggerLocalLog('CRDT_MUTATION_A', 'Decremented Peer A PN-Counter node state.', 'PENDING');
                                      }}
                                      className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[8px] font-bold uppercase cursor-pointer hover:bg-slate-700"
                                    >
                                      -1
                                    </button>
                                  </div>
                                </div>

                                <div className="border border-slate-800 bg-slate-900/30 p-2 text-center">
                                  <span className="text-[7px] text-slate-500 font-black block uppercase font-sans">Peer B Instance</span>
                                  <span className="text-lg font-black text-emerald-400">{syncState.crdtCounterB}</span>
                                  <div className="flex justify-center gap-1.5 mt-2">
                                    <button
                                      onClick={() => {
                                        updateState('crdtCounterB', syncState.crdtCounterB + 1);
                                        triggerLocalLog('CRDT_MUTATION_B', 'Incremented Peer B PN-Counter node state.', 'PENDING');
                                      }}
                                      className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[8px] font-bold uppercase cursor-pointer hover:bg-slate-700"
                                    >
                                      +1
                                    </button>
                                    <button
                                      onClick={() => {
                                        updateState('crdtCounterB', syncState.crdtCounterB - 1);
                                        triggerLocalLog('CRDT_MUTATION_B', 'Decremented Peer B PN-Counter node state.', 'PENDING');
                                      }}
                                      className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[8px] font-bold uppercase cursor-pointer hover:bg-slate-700"
                                    >
                                      -1
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="py-2.5 px-3 border border-dashed border-amber-500/30 bg-amber-500/5 text-center">
                                <span className="text-[8px] text-slate-500 font-bold uppercase block font-sans">Converged Replicated Global Value:</span>
                                <span className="text-xl font-extrabold text-amber-400">{syncState.crdtCounterA + syncState.crdtCounterB}</span>
                              </div>
                            </div>
                          )}

                          {/* 5. Jitter Tunnel View */}
                          {syncState.activeTab === 'network' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">Jitter Tunnel Network Simulator</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Tunnel Diagnostics</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Dial in simulated flaky networking tunnels. High latency and connection packet loss trigger automatic Exponential Backoff and retry algorithms.
                              </p>

                              <div className="space-y-2 text-[8px] font-mono">
                                <div>
                                  <div className="flex justify-between uppercase text-slate-400 font-bold mb-1">
                                    <span>Injected Packet Loss: {syncState.packetLossPct}%</span>
                                    <span>Drop Rate</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="95"
                                    value={syncState.packetLossPct}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      updateState('packetLossPct', val);
                                      triggerLocalLog('NETWORK_JITTER_ADJUST', `Packet loss simulation updated to: ${val}%.`, 'WARNING');
                                    }}
                                    className="w-full cursor-pointer h-1 bg-slate-800 rounded outline-none accent-amber-400"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[8px] pt-1">
                                  <div className="border border-slate-800 p-2 bg-slate-900/40">
                                    <span className="text-slate-500 font-bold block uppercase font-sans">Latency Delay</span>
                                    <span className="text-xs font-black text-[#E5E7EB]">{syncState.latencyMs}ms</span>
                                  </div>
                                  <div className="border border-slate-800 p-2 bg-slate-900/40">
                                    <span className="text-slate-500 font-bold block uppercase font-sans">Jitter Noise Amplitude</span>
                                    <span className="text-xs font-black text-[#E5E7EB]">{syncState.jitterMs}ms</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 6. Throttling & Batching Regulator View */}
                          {syncState.activeTab === 'batch' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">Debounce Throttler & Batch Regulator</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Rate Limiter</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Set how frequently mutations are batched and shipped upstream. Aggregating high-throughput keys prevents network serialization blockage.
                              </p>

                              <div className="space-y-3 text-[8px] font-mono">
                                <div>
                                  <div className="flex justify-between uppercase text-slate-400 font-bold mb-1">
                                    <span>Synchronization Interval: {syncState.syncThrottleMs}ms</span>
                                    <span>Shipping Gate</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="500"
                                    max="10000"
                                    step="500"
                                    value={syncState.syncThrottleMs}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      updateState('syncThrottleMs', val);
                                      triggerLocalLog('THROTTLE_ADJUST', `Sync rate set to evaluate queue every ${val}ms.`, 'OK');
                                    }}
                                    className="w-full cursor-pointer h-1 bg-slate-800 rounded outline-none accent-amber-400"
                                  />
                                </div>

                                <div>
                                  <div className="flex justify-between uppercase text-slate-400 font-bold mb-1">
                                    <span>Max Packets Per Batch Frame: {syncState.batchSizeMax} items</span>
                                    <span>Batch Boundaries</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="250"
                                    step="10"
                                    value={syncState.batchSizeMax}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      updateState('batchSizeMax', val);
                                      triggerLocalLog('BATCH_SIZE_ADJUST', `Max frame batch bounds expanded to ${val} records.`, 'OK');
                                    }}
                                    className="w-full cursor-pointer h-1 bg-slate-800 rounded outline-none accent-amber-400"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 7. Mutation Stash View */}
                          {syncState.activeTab === 'stash' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">Offline Mutation Stash Ledger</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Mutation Inspect</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Inspect raw un-synced operations waiting in IndexedDB sync queue. Selectively discard or inspect before triggering high-throughput flush.
                              </p>

                              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {syncState.stashMutations.map((mut: any) => (
                                  <div key={mut.id} className="border border-slate-800 bg-black/40 p-1.5 flex items-center justify-between text-[8px]">
                                    <div>
                                      <span className="text-amber-400 font-black mr-1 uppercase">[{mut.action}]</span>
                                      <span className="text-slate-300 font-mono">Target: {mut.target} ({mut.prop})</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-slate-500">{mut.size} Bytes</span>
                                      <button
                                        onClick={() => {
                                          const updatedMutations = syncState.stashMutations.filter((m: any) => m.id !== mut.id);
                                          updateState('stashMutations', updatedMutations);
                                          triggerLocalLog('STASH_DISCARD', `Discarded isolated operation "${mut.id}" from local buffer pipeline.`, 'WARNING');
                                        }}
                                        className="text-rose-500 hover:underline cursor-pointer font-bold uppercase text-[7px]"
                                      >
                                        DISCARD
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {syncState.stashMutations.length === 0 && (
                                  <div className="text-center text-slate-500 py-3 text-[8px] uppercase">
                                    No pending stashed mutations. Local state completely clean.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 8. Vector Clock View */}
                          {syncState.activeTab === 'clock' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">Vector Clocks & Causality Ledger</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Causal Sequencing</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Standard time is unreliable across decoupled clients. Vector Clocks track causality. Click a node to trigger a mutation event and witness vector incrementation.
                              </p>

                              <div className="grid grid-cols-3 gap-2 py-1 text-center text-[9px]">
                                <div
                                  onClick={() => {
                                    const nextClock = { ...syncState.vectorClock, ClientA: syncState.vectorClock.ClientA + 1 };
                                    updateState('vectorClock', nextClock);
                                    triggerLocalLog('VECTOR_CLOCK_EVENT', 'Fired logical mutation on Client A. Clock incremented.', 'OK');
                                  }}
                                  className="border border-slate-800 bg-slate-900/30 p-2 cursor-pointer hover:border-slate-600 transition-all"
                                >
                                  <span className="text-blue-400 block font-black uppercase text-[7px]">Client Node A</span>
                                  <span className="text-base font-black font-mono mt-1 block">{syncState.vectorClock.ClientA}</span>
                                  <span className="text-[6px] text-slate-500 font-black uppercase mt-1.5 block">Trigger Event</span>
                                </div>

                                <div
                                  onClick={() => {
                                    const nextClock = { ...syncState.vectorClock, ClientB: syncState.vectorClock.ClientB + 1 };
                                    updateState('vectorClock', nextClock);
                                    triggerLocalLog('VECTOR_CLOCK_EVENT', 'Fired logical mutation on Client B. Clock incremented.', 'OK');
                                  }}
                                  className="border border-slate-800 bg-slate-900/30 p-2 cursor-pointer hover:border-slate-600 transition-all"
                                >
                                  <span className="text-emerald-400 block font-black uppercase text-[7px]">Client Node B</span>
                                  <span className="text-base font-black font-mono mt-1 block">{syncState.vectorClock.ClientB}</span>
                                  <span className="text-[6px] text-slate-500 font-black uppercase mt-1.5 block">Trigger Event</span>
                                </div>

                                <div
                                  onClick={() => {
                                    const nextClock = { ...syncState.vectorClock, Server: syncState.vectorClock.Server + 1 };
                                    updateState('vectorClock', nextClock);
                                    triggerLocalLog('VECTOR_CLOCK_EVENT', 'Fired authority database commit on Server. Clock incremented.', 'OK');
                                  }}
                                  className="border border-slate-800 bg-slate-900/30 p-2 cursor-pointer hover:border-slate-600 transition-all"
                                >
                                  <span className="text-purple-400 block font-black uppercase text-[7px]">Server Origin</span>
                                  <span className="text-base font-black font-mono mt-1 block">{syncState.vectorClock.Server}</span>
                                  <span className="text-[6px] text-slate-500 font-black uppercase mt-1.5 block">Trigger Event</span>
                                </div>
                              </div>

                              <div className="text-[8px] bg-[#111827] border border-slate-800 p-2 text-slate-400 text-center font-mono">
                                Vector State: <span className="text-amber-400 font-bold">[{syncState.vectorClock.ClientA}, {syncState.vectorClock.ClientB}, {syncState.vectorClock.Server}]</span>
                              </div>
                            </div>
                          )}

                          {/* 9. Local P2P Coupling Link View */}
                          {syncState.activeTab === 'p2p' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">P2P Cross-Tab Coupled Pipe</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Local Sync Pipe</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Replicate document data directly between open browser sessions using zero-cloud BroadcastChannel socket loops.
                              </p>

                              <div className="flex items-center justify-between border border-slate-800 bg-slate-900/40 p-2.5">
                                <div className="space-y-0.5">
                                  <span className="text-[7px] text-slate-500 font-bold uppercase block font-sans">WebRTC Connection</span>
                                  <span className="text-xs font-black text-emerald-400 uppercase">{syncState.p2pStatus}</span>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-[7px] text-slate-500 font-bold uppercase block font-sans">Throughput Speed</span>
                                  <span className="text-xs font-black text-slate-200">{syncState.p2pThroughput} KB/sec</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    updateState('p2pStatus', 'Handshaking');
                                    updateState('p2pThroughput', 0);
                                    triggerLocalLog('P2P_HANDSHAKE', 'Restarting WebRTC localized tab discovery...', 'PENDING');
                                    setTimeout(() => {
                                      const updated = {
                                        ...syncState,
                                        p2pStatus: 'Coupled',
                                        p2pThroughput: Number((10 + Math.random() * 25).toFixed(1))
                                      };
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, syncSim: updated }) });
                                      triggerLocalLog('P2P_ACTIVE', 'Tab coupled successfully. Active cross-buffer stream active.', 'OK');
                                    }, 800);
                                  }}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[9px] font-black uppercase cursor-pointer"
                                >
                                  Restart Local Discovery
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 10. Merkle Tree State Healer View */}
                          {syncState.activeTab === 'merkle' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">Merkle Tree Ledger Verification & Deep Healing</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Hash Alignment</span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                                Detect and repair silent bit-rot. When any block hash fails verification, only repair the specific branch path mapping to save payload traffic.
                              </p>

                              {/* Simple Hierarchical Merkle Tree Diagram */}
                              <div className="bg-black/40 border border-slate-800 p-3 flex flex-col items-center space-y-2 text-[7px] font-mono select-none">
                                {/* Root */}
                                {(() => {
                                  const root = syncState.merkleNodes.find((n: any) => n.id === 'root');
                                  const b1 = syncState.merkleNodes.find((n: any) => n.id === 'branch-1');
                                  const b2 = syncState.merkleNodes.find((n: any) => n.id === 'branch-2');
                                  const l11 = syncState.merkleNodes.find((n: any) => n.id === 'leaf-1-1');
                                  const l12 = syncState.merkleNodes.find((n: any) => n.id === 'leaf-1-2');
                                  const l21 = syncState.merkleNodes.find((n: any) => n.id === 'leaf-2-1');
                                  const l22 = syncState.merkleNodes.find((n: any) => n.id === 'leaf-2-2');
                                  
                                  return (
                                    <>
                                      <div className={`px-2 py-0.5 border font-extrabold ${root.status === 'corrupt' ? 'border-rose-500 bg-rose-950/40 text-rose-400' : 'border-emerald-500 bg-emerald-950/40 text-emerald-400'}`}>
                                        ROOT: {root.hash}
                                      </div>
                                      
                                      <div className="flex justify-between w-full max-w-sm px-12">
                                        <div className={`px-1 py-0.5 border ${b1.status === 'corrupt' ? 'border-rose-500 bg-rose-950/40 text-rose-400' : 'border-slate-800 bg-slate-900/60 text-slate-400'}`}>
                                          L1: {b1.hash}
                                        </div>
                                        <div className={`px-1 py-0.5 border ${b2.status === 'corrupt' ? 'border-rose-500 bg-rose-950/40 text-rose-400' : 'border-slate-800 bg-slate-900/60 text-slate-400'}`}>
                                          R1: {b2.hash}
                                        </div>
                                      </div>

                                      <div className="flex justify-between w-full text-[6px] gap-1">
                                        <div 
                                          onClick={() => corruptLeaf('leaf-1-1')}
                                          className={`cursor-pointer px-1 py-0.5 border rounded-sm hover:border-slate-400 ${l11.status === 'corrupt' ? 'border-rose-500 bg-rose-950/40 text-rose-400' : 'border-slate-800 bg-slate-900/20 text-slate-500'}`}
                                          title="Click to Corrupt Leaf Node State"
                                        >
                                          L1.1: {l11.hash} [CORRUPT]
                                        </div>
                                        <div 
                                          onClick={() => corruptLeaf('leaf-1-2')}
                                          className={`cursor-pointer px-1 py-0.5 border rounded-sm hover:border-slate-400 ${l12.status === 'corrupt' ? 'border-rose-500 bg-rose-950/40 text-rose-400' : 'border-slate-800 bg-slate-900/20 text-slate-500'}`}
                                          title="Click to Corrupt Leaf Node State"
                                        >
                                          L1.2: {l12.hash} [CORRUPT]
                                        </div>
                                        <div 
                                          onClick={() => corruptLeaf('leaf-2-1')}
                                          className={`cursor-pointer px-1 py-0.5 border rounded-sm hover:border-slate-400 ${l21.status === 'corrupt' ? 'border-rose-500 bg-rose-950/40 text-rose-400' : 'border-slate-800 bg-slate-900/20 text-slate-500'}`}
                                          title="Click to Corrupt Leaf Node State"
                                        >
                                          R1.1: {l21.hash} [CORRUPT]
                                        </div>
                                        <div 
                                          onClick={() => corruptLeaf('leaf-2-2')}
                                          className={`cursor-pointer px-1 py-0.5 border rounded-sm hover:border-slate-400 ${l22.status === 'corrupt' ? 'border-rose-500 bg-rose-950/40 text-rose-400' : 'border-slate-800 bg-slate-900/20 text-slate-500'}`}
                                          title="Click to Corrupt Leaf Node State"
                                        >
                                          R1.2: {l22.hash} [CORRUPT]
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={healMerkleTree}
                                  className="px-2 py-1 bg-emerald-500 text-[#0A0F1D] text-[9px] font-black uppercase cursor-pointer"
                                >
                                  Run State Verification & Healing Protocol
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Footer Action items inside current sandbox */}
                          <div className="border-t border-slate-900 pt-2.5 mt-3 flex items-center justify-between text-[7px] text-slate-500 font-bold uppercase font-mono">
                            <span>FEATURE MODULE: ACTIVE</span>
                            <span>COMPILER: VERIFIED</span>
                          </div>
                        </div>

                        {/* Real-time Event Logger Terminal (Right 1 column) */}
                        <div className="border-2 border-slate-800 bg-slate-950 text-slate-200 p-3 flex flex-col justify-between font-mono text-[9px]">
                          <div>
                            <span className="text-[8px] font-black text-slate-500 uppercase block mb-1.5 font-sans">
                              Active Buffer Terminal Stream:
                            </span>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {syncState.logs.map((log: any, lIdx: number) => (
                                <div key={lIdx} className="text-[7.5px] border-b border-slate-900 pb-1 leading-tight flex flex-col">
                                  <div className="flex items-center justify-between text-[6.5px] text-slate-500 font-bold">
                                    <span>TIMESTAMP: {log.time}</span>
                                    <span className={`px-1 rounded-sm ${
                                      log.status === 'OK' ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-900' :
                                      log.status === 'WARNING' ? 'text-amber-400 bg-amber-950/60 border border-amber-900' :
                                      log.status === 'CONFLICT' ? 'text-rose-400 bg-rose-950/60 border border-rose-900' :
                                      'text-blue-400 bg-blue-950/60 border border-blue-900'
                                    }`}>{log.status}</span>
                                  </div>
                                  <div className="mt-0.5 text-slate-300">
                                    <span className="text-amber-400 font-black uppercase mr-1">[{log.op}]</span>
                                    {log.payload}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[7px] text-slate-500 font-bold font-sans mt-2">
                            <span>SHIELD PROTECTION: GATED</span>
                            <span>LOGS: VERIFIED</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()
              )}

              {/* ZENITH 10-TIER DEVOPS & RELATIONAL SCHEMA SUITE */}
              {el.type === 'zenith_ops_deck' && (
                (() => {
                  const zenithState = propertiesObj.zenithOps || {
                    activeTab: 'migrator', // migrator, ast_diff, api_sandbox, conflict, git_ledger, sql_optimizer, bento, audio_synth, jwt_inspector, prompt_optimizer
                    migrator: {
                      tableName: 'zenith_users',
                      columns: [
                        { name: 'id', type: 'VARCHAR(255)', primaryKey: true, nullable: false, default: '' },
                        { name: 'email', type: 'VARCHAR(255)', primaryKey: false, nullable: false, default: '' },
                        { name: 'meta_json', type: 'JSONB', primaryKey: false, nullable: true, default: '' }
                      ],
                      results: null,
                      loading: false
                    },
                    astDiff: {
                      originalText: '# Welcome to Zenith\n- [ ] Todo item\n> A quote note.',
                      modifiedText: '## Welcome to Zenith\n- [x] Todo item\n- List item\n> A revised quote note.',
                      results: null,
                      loading: false
                    },
                    apiSandbox: {
                      method: 'POST',
                      url: 'https://api.zenith-canvas.local/v1/workspace/query',
                      headers: [
                        { key: 'Authorization', value: 'Bearer zn_live_9a2f1b' },
                        { key: 'Content-Type', value: 'application/json' }
                      ],
                      requestBody: '{\n  "query_scope": "canvases",\n  "include_blocks": true\n}',
                      results: null,
                      loading: false
                    },
                    conflict: {
                      localStateText: 'Local User Edit Content',
                      remoteStateText: 'Remote Peer Edit Content',
                      results: null,
                      loading: false
                    },
                    gitLedger: {
                      commitMessage: 'Distributed node snapshot update',
                      author: 'Lead Architect',
                      commits: [],
                      loading: false
                    },
                    sqlOptimizer: {
                      query: 'SELECT * FROM zenith_elements JOIN canvases ON elements.canvas_id = canvases.id WHERE canvases.is_archived = false AND elements.type = \'text\';',
                      results: null,
                      loading: false
                    },
                    bento: {
                      cols: 4,
                      items: [
                        { id: 'b-1', title: 'Server Metrics', colSpan: 2 },
                        { id: 'b-2', title: 'AST Graph', colSpan: 2 },
                        { id: 'b-3', title: 'Audio Soundboard', colSpan: 4 }
                      ]
                    },
                    audioSynth: {
                      frequency: 440,
                      type: 'sine',
                      sustain: 0.1,
                      duration: 0.2
                    },
                    jwt: {
                      secretKey: 'zenith-secret-token-key-2026',
                      algorithm: 'HS256',
                      payloadFieldsJson: '{\n  "user_id": "usr_81b9c2a",\n  "role": "admin",\n  "scope": "write:all"\n}',
                      results: null,
                      loading: false
                    },
                    promptOptimizer: {
                      promptRole: 'You are an advanced full-stack systems engineering agent.',
                      results: null,
                      loading: false
                    },
                    logs: [
                      { time: '14:28:30', op: 'ENGINE_BOOT', payload: 'Zenith 10-Tier DevOps Engine Suite boot active. Core serverless route ready.', status: 'OK' }
                    ]
                  };

                  const updateZenithState = (key: string, value: any) => {
                    const updated = { ...zenithState, [key]: value };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, zenithOps: updated }) });
                  };

                  const triggerZenithLog = (op: string, payload: string, status: 'OK' | 'WARNING' | 'CONFLICT' | 'PENDING') => {
                    const time = new Date().toTimeString().split(' ')[0];
                    const newLog = { time, op, payload, status };
                    const updatedLogs = [...(zenithState.logs || []), newLog].slice(-25);
                    updateZenithState('logs', updatedLogs);
                  };

                  const triggerApiCall = async (action: string, payload: any) => {
                    try {
                      const res = await fetch('/api/zenith', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action, payload })
                      });
                      const data = await res.json();
                      return data;
                    } catch (err: any) {
                      return { success: false, error: err?.message || 'Network communication failure' };
                    }
                  };

                  // Web Audio API sound wave synthesis
                  const playAcousticWave = (freq: number, type: string, duration: number, sustain: number) => {
                    if (typeof window === 'undefined') return;
                    try {
                      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                      if (!AudioContext) return;
                      const ctx = new AudioContext();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.type = type as any;
                      osc.frequency.setValueAtTime(freq, ctx.currentTime);
                      gain.gain.setValueAtTime(0.05, ctx.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration + sustain);
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.start();
                      osc.stop(ctx.currentTime + duration + sustain);
                    } catch (e) {
                      console.error('Audio Synthesis failure:', e);
                    }
                  };

                  return (
                    <div className="border-2 border-slate-700 p-4 bg-slate-900 text-slate-100 rounded-none my-4 w-full font-mono relative overflow-hidden shadow-2xl">
                      {/* Executive High-Performance Header */}
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 bg-slate-950 -mx-4 -mt-4 p-4">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block font-sans">
                              Zenith DevOps & Schema Engine Suite
                            </span>
                            <span className="text-[9px] text-slate-400 block">
                              Relational Migrators, AST Diffs, Mock Sandboxes, OT Conflict-Solvers, Acoustic Synths & JWT Inspects
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0 font-sans text-[8px] font-extrabold">
                          <span className="text-emerald-400 bg-emerald-950 border border-emerald-800/60 px-1.5 py-0.5 rounded-sm uppercase animate-pulse">
                            ACTIVE ENGINE: ONLINE
                          </span>
                        </div>
                      </div>

                      {/* 10-Tier Feature Tabs */}
                      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-3 mb-4 text-[8px] font-sans font-bold">
                        {[
                          { id: 'migrator', label: '1. SCHEMA MIGRATOR', icon: Database },
                          { id: 'ast_diff', label: '2. AST COMPARER', icon: FileJson },
                          { id: 'api_sandbox', label: '3. REQUEST SANDBOX', icon: Globe },
                          { id: 'conflict', label: '4. STATE SYNC MERGER', icon: GitCompare },
                          { id: 'git_ledger', label: '5. REVISION LEDGER', icon: History },
                          { id: 'sql_optimizer', label: '6. EXPLAIN SQL OPTIMIZER', icon: Terminal },
                          { id: 'bento', label: '7. BENTO GRID COMPOSER', icon: LayoutGrid },
                          { id: 'audio_synth', label: '8. ACOUSTIC SYNTH', icon: Volume2 },
                          { id: 'jwt', label: '9. JWT SIGNER & AUDITOR', icon: Shield },
                          { id: 'prompt_optimizer', label: '10. AI GROUNDING CAP', icon: Sparkles }
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = zenithState.activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                updateZenithState('activeTab', tab.id);
                                triggerZenithLog('SUITE_TAB', `Activated system tier: ${tab.label}`, 'OK');
                              }}
                              className={`px-2 py-1.5 border flex items-center gap-1 transition-all cursor-pointer ${isActive ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Main Interactive Deck Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        <div className="lg:col-span-2 border border-slate-800 bg-slate-950 p-4 min-h-[300px] flex flex-col justify-between">
                          
                          {/* Tab 1: Relational Schema Migrator */}
                          {zenithState.activeTab === 'migrator' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">Schema Migration Engine (PostgreSQL)</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">DDL compiler</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Define columns and types below. Zenith compiles the active configuration into standard DDL queries ready to run against PostgreSQL or serverless databases.
                              </p>

                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-[8px] text-slate-500 block font-bold uppercase mb-1">Target Table Name:</span>
                                    <input
                                      type="text"
                                      value={zenithState.migrator.tableName}
                                      onChange={(e) => {
                                        const sub = { ...zenithState.migrator, tableName: e.target.value };
                                        updateZenithState('migrator', sub);
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-1 text-[9px] outline-none"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <button
                                      onClick={() => {
                                        const cols = [...zenithState.migrator.columns, { name: `col_${Math.random().toString(36).substring(2, 6)}`, type: 'VARCHAR(255)', primaryKey: false, nullable: true, default: '' }];
                                        const sub = { ...zenithState.migrator, columns: cols };
                                        updateZenithState('migrator', sub);
                                        triggerZenithLog('MIGRATE_COL_ADD', 'Added new metadata column definition.', 'OK');
                                      }}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[8px] font-bold border border-slate-700 cursor-pointer w-full flex items-center justify-center gap-1"
                                    >
                                      + ADD COLUMN FIELD
                                    </button>
                                  </div>
                                </div>

                                <div className="border border-slate-800 max-h-28 overflow-y-auto bg-black/30 p-1.5 space-y-1">
                                  {zenithState.migrator.columns.map((col: any, cIdx: number) => (
                                    <div key={cIdx} className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 border border-slate-800/60">
                                      <input
                                        type="text"
                                        value={col.name}
                                        onChange={(e) => {
                                          const cols = [...zenithState.migrator.columns];
                                          cols[cIdx].name = e.target.value;
                                          updateZenithState('migrator', { ...zenithState.migrator, columns: cols });
                                        }}
                                        className="bg-slate-950 border border-slate-800 text-slate-200 p-0.5 text-[8px] w-20 outline-none"
                                      />
                                      <select
                                        value={col.type}
                                        onChange={(e) => {
                                          const cols = [...zenithState.migrator.columns];
                                          cols[cIdx].type = e.target.value;
                                          updateZenithState('migrator', { ...zenithState.migrator, columns: cols });
                                        }}
                                        className="bg-slate-950 border border-slate-800 text-[8px] text-emerald-400 p-0.5 outline-none cursor-pointer"
                                      >
                                        <option value="INT">INT</option>
                                        <option value="VARCHAR(255)">VARCHAR(255)</option>
                                        <option value="TEXT">TEXT</option>
                                        <option value="JSONB">JSONB</option>
                                        <option value="TIMESTAMP">TIMESTAMP</option>
                                        <option value="BOOLEAN">BOOLEAN</option>
                                      </select>
                                      <label className="flex items-center gap-1 text-[8px] text-slate-400">
                                        <input
                                          type="checkbox"
                                          checked={col.primaryKey}
                                          onChange={(e) => {
                                            const cols = [...zenithState.migrator.columns];
                                            cols[cIdx].primaryKey = e.target.checked;
                                            updateZenithState('migrator', { ...zenithState.migrator, columns: cols });
                                          }}
                                          className="scale-75"
                                        />
                                        PKey
                                      </label>
                                      <button
                                        onClick={() => {
                                          const cols = zenithState.migrator.columns.filter((_: any, idx: number) => idx !== cIdx);
                                          updateZenithState('migrator', { ...zenithState.migrator, columns: cols });
                                          triggerZenithLog('MIGRATE_COL_DEL', 'Removed metadata column field.', 'WARNING');
                                        }}
                                        className="text-rose-400 font-bold ml-auto cursor-pointer text-[9px] hover:text-white"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={async () => {
                                    const sub = { ...zenithState.migrator, loading: true };
                                    updateZenithState('migrator', sub);
                                    triggerZenithLog('MIGRATING_COMPILER', 'Calling backend relational schema migrator compiler...', 'PENDING');
                                    const results = await triggerApiCall('migrate', {
                                      tableName: zenithState.migrator.tableName,
                                      columns: zenithState.migrator.columns
                                    });
                                    updateZenithState('migrator', { ...zenithState.migrator, loading: false, results });
                                    if (results.success) {
                                      triggerZenithLog('MIGRATOR_SUCCESS', `DDL generated for "${zenithState.migrator.tableName}" successfully.`, 'OK');
                                    } else {
                                      triggerZenithLog('MIGRATOR_FAIL', 'Relational compiler failed to build schema queries.', 'CONFLICT');
                                    }
                                  }}
                                  disabled={zenithState.migrator.loading}
                                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black text-[9px] py-1.5 uppercase transition-all cursor-pointer"
                                >
                                  {zenithState.migrator.loading ? 'COMPILING RELATIONAL DIAGRAMS...' : 'COMPILE SCHEMA & GENERATE DDL'}
                                </button>
                              </div>

                              {zenithState.migrator.results && (
                                <div className="border border-slate-800 bg-black/40 p-2 rounded text-[8px] space-y-1.5">
                                  <div className="flex justify-between border-b border-slate-800 pb-1">
                                    <span className="text-emerald-400 font-bold">SQL Queries Formatted:</span>
                                    <span className="text-slate-500">PostgreSQL Schema Syntax</span>
                                  </div>
                                  <pre className="text-slate-300 font-mono text-[7.5px] whitespace-pre-wrap overflow-x-auto max-h-24 bg-slate-950/80 p-1.5 border border-slate-900 leading-normal">
                                    {zenithState.migrator.results?.queries?.up}
                                  </pre>
                                  <div className="grid grid-cols-2 gap-2 text-[7px] text-slate-400 bg-slate-900/60 p-1 border border-slate-800/40">
                                    <div>STATUS: <span className="text-emerald-400">{zenithState.migrator.results?.diagnostics?.tableStatus}</span></div>
                                    <div>COMPATIBILITY: <span className="text-slate-200">{zenithState.migrator.results?.diagnostics?.engineCompatibility}</span></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 2: AST Diff / Syntax Comparison */}
                          {zenithState.activeTab === 'ast_diff' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">Abstract Syntax Tree (AST) Diff Viewer</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">Markdown Diff compiler</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Compare block tokens or text configurations. The parser generates semantic token representations and highlights structural revisions.
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[8px] text-slate-500 block font-bold uppercase mb-1">Original Node Content:</span>
                                  <textarea
                                    value={zenithState.astDiff.originalText}
                                    onChange={(e) => {
                                      updateZenithState('astDiff', { ...zenithState.astDiff, originalText: e.target.value });
                                    }}
                                    className="w-full h-20 bg-slate-900 border border-slate-800 text-slate-100 p-1 text-[8.5px] font-mono outline-none resize-none"
                                  />
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-500 block font-bold uppercase mb-1">Modified Node Content:</span>
                                  <textarea
                                    value={zenithState.astDiff.modifiedText}
                                    onChange={(e) => {
                                      updateZenithState('astDiff', { ...zenithState.astDiff, modifiedText: e.target.value });
                                    }}
                                    className="w-full h-20 bg-slate-900 border border-slate-800 text-slate-100 p-1 text-[8.5px] font-mono outline-none resize-none"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={async () => {
                                  updateZenithState('astDiff', { ...zenithState.astDiff, loading: true });
                                  triggerZenithLog('AST_DIFF_EXECUTE', 'Submitting nodes to serverless semantic diff parser...', 'PENDING');
                                  const results = await triggerApiCall('ast_diff', {
                                    originalText: zenithState.astDiff.originalText,
                                    modifiedText: zenithState.astDiff.modifiedText
                                  });
                                  updateZenithState('astDiff', { ...zenithState.astDiff, loading: false, results });
                                  triggerZenithLog('AST_DIFF_DONE', `Compared blocks successfully. Found ${results.diffReport?.filter((x: any) => x.status !== 'UNTOUCHED').length} revisions.`, 'OK');
                                }}
                                disabled={zenithState.astDiff.loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black text-[9px] py-1.5 uppercase cursor-pointer"
                              >
                                {zenithState.astDiff.loading ? 'ANALYZING AST TOKEN ALIGNMENT...' : 'EXECUTE SEMANTIC AST COMPARISON'}
                              </button>

                              {zenithState.astDiff.results && (
                                <div className="border border-slate-800 bg-black/40 p-2 rounded text-[8px] space-y-1.5">
                                  <div className="flex justify-between border-b border-slate-800 pb-1">
                                    <span className="text-emerald-400 font-bold">Semantic Diff Map:</span>
                                    <span className="text-slate-500">Token Level Analysis</span>
                                  </div>

                                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[7.5px]">
                                    {zenithState.astDiff.results.diffReport?.map((node: any, idx: number) => {
                                      const isAdd = node.status === 'ADDED';
                                      const isDel = node.status === 'DELETED';
                                      const isMod = node.status === 'MODIFIED';
                                      const colorClass = isAdd ? 'border-l-2 border-emerald-500 bg-emerald-950/20 text-emerald-300' :
                                                         isDel ? 'border-l-2 border-rose-500 bg-rose-950/20 text-rose-300 line-through' :
                                                         isMod ? 'border-l-2 border-amber-500 bg-amber-950/20 text-amber-300' : 'text-slate-400';
                                      return (
                                        <div key={idx} className={`p-1.5 border border-slate-900 rounded-sm flex items-center justify-between ${colorClass}`}>
                                          <div className="truncate flex-1">
                                            <span className="text-[7px] text-slate-500 font-bold mr-1.5">L.{node.line}</span>
                                            <span className="text-[7.5px] uppercase font-black mr-2 bg-slate-900 px-1 py-0.2 rounded text-slate-400 border border-slate-850">
                                              {node.status}
                                            </span>
                                            <span>
                                              {isDel ? node.original?.text : isAdd ? node.modified?.text : isMod ? `${node.original?.text} ➔ ${node.modified?.text}` : node.original?.text}
                                            </span>
                                          </div>
                                          <span className="text-[7px] text-slate-600 uppercase font-bold ml-1.5 bg-black/40 px-1 py-0.1 border border-slate-900">
                                            {isDel ? node.original?.type : node.modified?.type}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 3: API Sandbox & Echo Test */}
                          {zenithState.activeTab === 'api_sandbox' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">DevOps API Request Sandbox & Header Inspector</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">HTTP PROBE GATEWAY</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Build mock requests. The backend echoes details, including authentication claims, client request structures, and simulated response durations.
                              </p>

                              <div className="space-y-2 text-[8px]">
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <span className="text-slate-500 font-bold block uppercase mb-0.5">HTTP METHOD:</span>
                                    <select
                                      value={zenithState.apiSandbox.method}
                                      onChange={(e) => {
                                        updateZenithState('apiSandbox', { ...zenithState.apiSandbox, method: e.target.value });
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 text-emerald-400 p-1 outline-none cursor-pointer"
                                    >
                                      <option value="GET">GET</option>
                                      <option value="POST">POST</option>
                                      <option value="PUT">PUT</option>
                                      <option value="DELETE">DELETE</option>
                                    </select>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-slate-500 font-bold block uppercase mb-0.5">TARGET ENDPOINT:</span>
                                    <input
                                      type="text"
                                      value={zenithState.apiSandbox.url}
                                      onChange={(e) => {
                                        updateZenithState('apiSandbox', { ...zenithState.apiSandbox, url: e.target.value });
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 text-[8.5px] outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">MOCK PAYLOAD OBJECT (JSON):</span>
                                  <textarea
                                    value={zenithState.apiSandbox.requestBody}
                                    onChange={(e) => {
                                      updateZenithState('apiSandbox', { ...zenithState.apiSandbox, requestBody: e.target.value });
                                    }}
                                    className="w-full h-14 bg-slate-900 border border-slate-800 text-emerald-300 p-1 font-mono text-[8px] outline-none resize-none"
                                  />
                                </div>

                                <button
                                  onClick={async () => {
                                    updateZenithState('apiSandbox', { ...zenithState.apiSandbox, loading: true });
                                    triggerZenithLog('HTTP_PROBE_SEND', `Dispatching simulated ${zenithState.apiSandbox.method} probe payload...`, 'PENDING');
                                    const results = await triggerApiCall('request', {
                                      method: zenithState.apiSandbox.method,
                                      url: zenithState.apiSandbox.url,
                                      headers: zenithState.apiSandbox.headers,
                                      requestBody: zenithState.apiSandbox.requestBody
                                    });
                                    updateZenithState('apiSandbox', { ...zenithState.apiSandbox, loading: false, results });
                                    triggerZenithLog('HTTP_PROBE_OK', `Serverless response compiled. Latency: ${results.responseInfo?.latencyMs}ms. Status: ${results.responseInfo?.status}`, 'OK');
                                  }}
                                  disabled={zenithState.apiSandbox.loading}
                                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black text-[9px] py-1.5 uppercase cursor-pointer"
                                >
                                  {zenithState.apiSandbox.loading ? 'FIRING MOCK HTTP PROBE...' : 'FIRE HTTP SANDBOX PROBE'}
                                </button>
                              </div>

                              {zenithState.apiSandbox.results && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[8px]">
                                  <div className="border border-slate-800 bg-black/40 p-2 rounded">
                                    <span className="text-emerald-400 font-bold block border-b border-slate-850 pb-1 mb-1">CLIENT HEADER MAP:</span>
                                    <pre className="text-slate-400 font-mono text-[7px] leading-tight overflow-x-auto">
                                      {JSON.stringify(zenithState.apiSandbox.results?.requestInfo?.clientHeaders, null, 2)}
                                    </pre>
                                  </div>
                                  <div className="border border-slate-800 bg-black/40 p-2 rounded">
                                    <div className="flex justify-between border-b border-slate-850 pb-1 mb-1 text-[7.5px]">
                                      <span className="text-emerald-400 font-bold">RESPONSE STATUS: {zenithState.apiSandbox.results?.responseInfo?.status}</span>
                                      <span className="text-amber-400">{zenithState.apiSandbox.results?.responseInfo?.latencyMs}ms</span>
                                    </div>
                                    <pre className="text-slate-300 font-mono text-[7px] leading-tight overflow-x-auto max-h-16">
                                      {JSON.stringify(zenithState.apiSandbox.results?.responseInfo?.body, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 4: Sync Conflict Resolution */}
                          {zenithState.activeTab === 'conflict' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">State Sync & OT Peer Conflict Simulator</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">3-way merge</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Test sync conflict cases between peer systems. The algorithm runs a Last-Write-Wins (LWW) resolution mapping vector coordinate timestamps.
                              </p>

                              <div className="grid grid-cols-2 gap-2 text-[8px]">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">LOCAL USER VALUE:</span>
                                  <input
                                    type="text"
                                    value={zenithState.conflict.localStateText}
                                    onChange={(e) => {
                                      updateZenithState('conflict', { ...zenithState.conflict, localStateText: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 outline-none font-mono"
                                  />
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">REMOTE PEER VALUE:</span>
                                  <input
                                    type="text"
                                    value={zenithState.conflict.remoteStateText}
                                    onChange={(e) => {
                                      updateZenithState('conflict', { ...zenithState.conflict, remoteStateText: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={async () => {
                                  updateZenithState('conflict', { ...zenithState.conflict, loading: true });
                                  triggerZenithLog('CONFLICT_MERGE_ATTEMPT', 'Running simulated 3-way synchronization algorithm on serverless worker...', 'PENDING');
                                  
                                  const localObj = [{ id: 'block-node-main', type: 'text', content: zenithState.conflict.localStateText, properties: { updatedAt: new Date().toISOString() } }];
                                  const remoteObj = [{ id: 'block-node-main', type: 'text', content: zenithState.conflict.remoteStateText, properties: { updatedAt: new Date().toISOString() } }];

                                  const results = await triggerApiCall('sync_conflict', {
                                    localState: localObj,
                                    remoteState: remoteObj
                                  });
                                  updateZenithState('conflict', { ...zenithState.conflict, loading: false, results });
                                  triggerZenithLog('CONFLICT_RESOLVED', 'Calculated non-blocking unified merge matrix successfully.', 'OK');
                                }}
                                disabled={zenithState.conflict.loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black text-[9px] py-1.5 uppercase cursor-pointer"
                              >
                                {zenithState.conflict.loading ? 'COMPUTING RESOLUTION GRAPHS...' : 'RUN CONFLICT RESOLUTION SIMULATION'}
                              </button>

                              {zenithState.conflict.results && (
                                <div className="border border-slate-800 bg-black/40 p-2 rounded text-[8px] space-y-1.5">
                                  <div className="flex justify-between border-b border-slate-850 pb-1">
                                    <span className="text-emerald-400 font-bold uppercase">Merge Audit Report:</span>
                                    <span className="text-slate-500">Vector Clock Sequence: {zenithState.conflict.results.clocks?.serverSequence}</span>
                                  </div>
                                  <div className="space-y-1 max-h-24 overflow-y-auto text-[7.5px] pr-1">
                                    {zenithState.conflict.results.conflictLogs?.map((log: any, idx: number) => (
                                      <div key={idx} className="bg-slate-900 p-1.5 border border-slate-800 rounded-sm leading-normal">
                                        <div className="flex justify-between text-slate-500 font-sans mb-0.5">
                                          <span>Conflict Type: <span className="text-amber-400">{log.conflictType}</span></span>
                                          <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1 border border-emerald-900/20">{log.resolution}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-slate-400">
                                          <div>Local: <span className="text-rose-300">{log.localValue}</span></div>
                                          <div>Remote: <span className="text-emerald-300">{log.remoteValue}</span></div>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="bg-emerald-950/20 text-emerald-300 p-1 border border-emerald-900/30 rounded-sm">
                                      Unified Canvas State Resulting Content: <span className="font-bold">"{zenithState.conflict.results.resolvedList?.[0]?.content}"</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 5: Git Version Ledger */}
                          {zenithState.activeTab === 'git_ledger' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">Git-Style Version Ledger Logs</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">SHA snapshot branches</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Snapshot and commit the active canvas block state tree. Zenith hashes nodes sequentially, establishing local backup points you can track.
                              </p>

                              <div className="grid grid-cols-2 gap-2 text-[8px]">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">COMMIT SNAPSHOT MESSAGE:</span>
                                  <input
                                    type="text"
                                    value={zenithState.gitLedger.commitMessage}
                                    onChange={(e) => {
                                      updateZenithState('gitLedger', { ...zenithState.gitLedger, commitMessage: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 outline-none font-mono"
                                  />
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">AUTHOR SIGN-OFF:</span>
                                  <input
                                    type="text"
                                    value={zenithState.gitLedger.author}
                                    onChange={(e) => {
                                      updateZenithState('gitLedger', { ...zenithState.gitLedger, author: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[9px]">
                                <button
                                  onClick={async () => {
                                    updateZenithState('gitLedger', { ...zenithState.gitLedger, loading: true });
                                    triggerZenithLog('COMMIT_SNAPSHOT', 'Packing active element canvas state structure...', 'PENDING');
                                    
                                    const mockState = elements.map(el => ({ id: el.id, type: el.type, preview: (el.content || '').substring(0, 15) }));
                                    const results = await triggerApiCall('git_commit', {
                                      message: zenithState.gitLedger.commitMessage,
                                      author: zenithState.gitLedger.author,
                                      canvasState: mockState
                                    });

                                    // Refresh commit log immediately
                                    const freshLog = await triggerApiCall('git_log', {});
                                    updateZenithState('gitLedger', { ...zenithState.gitLedger, loading: false, commits: freshLog.logs || [] });
                                    triggerZenithLog('COMMIT_OK', `Saved local checkpoint ${results.commit?.hash} under "main" branch context.`, 'OK');
                                  }}
                                  disabled={zenithState.gitLedger.loading}
                                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black p-1.5 uppercase cursor-pointer text-center"
                                >
                                  COMMIT ACTIVE STATE
                                </button>
                                <button
                                  onClick={async () => {
                                    updateZenithState('gitLedger', { ...zenithState.gitLedger, loading: true });
                                    triggerZenithLog('FETCHING_REVISIONS', 'Reading serverless ledger database commit-history...', 'PENDING');
                                    const freshLog = await triggerApiCall('git_log', {});
                                    updateZenithState('gitLedger', { ...zenithState.gitLedger, loading: false, commits: freshLog.logs || [] });
                                    triggerZenithLog('LEDGER_SYNC', `Fetched ${freshLog.logs?.length || 0} historic revisions from backup ledger.`, 'OK');
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-bold p-1.5 uppercase cursor-pointer text-center"
                                >
                                  SYNC HISTORICAL LOGS
                                </button>
                              </div>

                              {zenithState.gitLedger.commits && zenithState.gitLedger.commits.length > 0 && (
                                <div className="border border-slate-800 bg-black/40 p-2 rounded text-[8px] space-y-1">
                                  <div className="flex justify-between border-b border-slate-850 pb-1 mb-1 text-slate-400 font-sans">
                                    <span>COMMIT LOG REVISION RAILS:</span>
                                    <span>BRANCH: MAIN</span>
                                  </div>
                                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                                    {zenithState.gitLedger.commits.map((commit: any, idx: number) => (
                                      <div key={commit.hash || idx} className="bg-slate-900/80 p-1.5 border border-slate-850 rounded flex items-center justify-between text-[7.5px] leading-tight">
                                        <div>
                                          <span className="text-emerald-400 font-black mr-2 font-mono">{commit.hash}</span>
                                          <span className="text-slate-100 font-sans font-bold">{commit.message}</span>
                                          <div className="text-[7px] text-slate-500 mt-0.5">Author: {commit.author} | Time: {commit.timestamp}</div>
                                        </div>
                                        <span className="text-[6.5px] bg-slate-950 px-1 py-0.5 text-slate-500 border border-slate-800">
                                          {commit.canvasState?.length} NODES
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 6: EXPLAIN SQL Path Optimizer */}
                          {zenithState.activeTab === 'sql_optimizer' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">SQL Query Path & Cost Optimizer</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">Query Planner Analyzer</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Paste relational database queries below. Zenith parses scan nodes, measures table join conditions, and maps ideal index specifications to optimize read sequences.
                              </p>

                              <div className="space-y-2 text-[8px]">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">TARGET SQL STATEMENT:</span>
                                  <textarea
                                    value={zenithState.sqlOptimizer.query}
                                    onChange={(e) => {
                                      updateZenithState('sqlOptimizer', { ...zenithState.sqlOptimizer, query: e.target.value });
                                    }}
                                    className="w-full h-16 bg-slate-900 border border-slate-800 text-emerald-300 p-1 font-mono text-[8.5px] outline-none resize-none"
                                  />
                                </div>

                                <button
                                  onClick={async () => {
                                    updateZenithState('sqlOptimizer', { ...zenithState.sqlOptimizer, loading: true });
                                    triggerZenithLog('OPTIMIZER_PLAN', 'Compiling execution path tree blocks...', 'PENDING');
                                    const results = await triggerApiCall('sql_optimize', {
                                      query: zenithState.sqlOptimizer.query
                                    });
                                    updateZenithState('sqlOptimizer', { ...zenithState.sqlOptimizer, loading: false, results });
                                    triggerZenithLog('OPTIMIZER_DONE', `Parsed SQL queries successfully. Saved cost reduction estimate: ${results.costReduction}`, 'OK');
                                  }}
                                  disabled={zenithState.sqlOptimizer.loading}
                                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black text-[9px] py-1.5 uppercase cursor-pointer"
                                >
                                  {zenithState.sqlOptimizer.loading ? 'ANALYZING SCANS & JOINS...' : 'OPTIMIZE QUERY PATH'}
                                </button>
                              </div>

                              {zenithState.sqlOptimizer.results && (
                                <div className="border border-slate-800 bg-black/40 p-2 rounded text-[8px] space-y-1.5 font-mono">
                                  <div className="grid grid-cols-2 gap-2 text-[7.5px] bg-slate-900 p-1.5 border border-slate-800">
                                    <div>COST BEFORE: <span className="text-rose-400">{zenithState.sqlOptimizer.results.estimatedCostBefore}</span></div>
                                    <div>COST AFTER: <span className="text-emerald-400">{zenithState.sqlOptimizer.results.estimatedCostAfter}</span></div>
                                  </div>

                                  <div className="space-y-1 text-[7.5px]">
                                    <span className="text-emerald-400 font-bold block uppercase">Planner Recommendations:</span>
                                    {zenithState.sqlOptimizer.results.recommendations?.map((rec: string, rIdx: number) => (
                                      <div key={rIdx} className="bg-slate-950/60 p-1 border-l border-emerald-500 pl-1.5 text-slate-300 leading-normal">
                                        {rec}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 7: Bento Grid Composer */}
                          {zenithState.activeTab === 'bento' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">Visual Bento Grid Dashboard Composer</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">CSS GRID COMPILeR</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Arrange and compile responsive layout grids below. Drag options or click to expand cells, instantly compiling perfect Tailwind layouts.
                              </p>

                              <div className="grid grid-cols-2 gap-2 text-[8px]">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">GRID COLUMNS COUNT:</span>
                                  <select
                                    value={zenithState.bento.cols}
                                    onChange={(e) => {
                                      updateZenithState('bento', { ...zenithState.bento, cols: parseInt(e.target.value) });
                                      triggerZenithLog('BENTO_RESIZE', `Updated CSS layout columns: grid-cols-${e.target.value}`, 'OK');
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1 outline-none cursor-pointer"
                                  >
                                    <option value="2">2 Columns</option>
                                    <option value="3">3 Columns</option>
                                    <option value="4">4 Columns</option>
                                    <option value="6">6 Columns</option>
                                  </select>
                                </div>
                                <div className="flex items-end">
                                  <button
                                    onClick={() => {
                                      const items = [...zenithState.bento.items, { id: `b-${Math.random().toString(36).substring(2, 6)}`, title: `Grid Card ${zenithState.bento.items.length + 1}`, colSpan: 2 }];
                                      updateZenithState('bento', { ...zenithState.bento, items });
                                      triggerZenithLog('BENTO_ADD_CARD', 'Inserted new visual cell in bento dashboard scope.', 'OK');
                                    }}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[8px] font-bold border border-slate-700 cursor-pointer w-full"
                                  >
                                    + ADD BENTO BOX CARD
                                  </button>
                                </div>
                              </div>

                              {/* Live Bento Composer Matrix */}
                              <div className="border border-slate-800 bg-black/40 p-2 text-[9px] space-y-1.5">
                                <span className="text-[8px] text-slate-500 font-bold uppercase block font-sans">Active Sandbox Layout Grid Preview:</span>
                                <div 
                                  className="grid gap-2 p-1.5 bg-slate-950/60 border border-slate-900"
                                  style={{ gridTemplateColumns: `repeat(${zenithState.bento.cols}, minmax(0, 1fr))` }}
                                >
                                  {zenithState.bento.items.map((item: any, idx: number) => (
                                    <div 
                                      key={item.id} 
                                      className="border border-slate-800 bg-slate-900/90 p-2 text-center rounded-sm flex flex-col justify-between"
                                      style={{ gridColumn: `span ${item.colSpan} / span ${item.colSpan}` }}
                                    >
                                      <div className="text-[8.5px] font-bold text-slate-300 truncate">{item.title}</div>
                                      <div className="text-[7px] text-emerald-400 font-mono mt-1 font-bold">col-span-{item.colSpan}</div>
                                      <div className="flex justify-between items-center mt-2 border-t border-slate-800/40 pt-1 text-[7px]">
                                        <button
                                          onClick={() => {
                                            const items = [...zenithState.bento.items];
                                            items[idx].colSpan = Math.max(1, items[idx].colSpan - 1);
                                            updateZenithState('bento', { ...zenithState.bento, items });
                                            triggerZenithLog('BENTO_WIDTH_REDUCED', `Shrank bento card "${item.title}" cell width.`, 'OK');
                                          }}
                                          className="text-slate-400 hover:text-white px-1 border border-slate-800/40"
                                        >
                                          ◄
                                        </button>
                                        <button
                                          onClick={() => {
                                            const items = [...zenithState.bento.items];
                                            items[idx].colSpan = Math.min(zenithState.bento.cols, items[idx].colSpan + 1);
                                            updateZenithState('bento', { ...zenithState.bento, items });
                                            triggerZenithLog('BENTO_WIDTH_EXPANDED', `Stretched bento card "${item.title}" cell width.`, 'OK');
                                          }}
                                          className="text-slate-400 hover:text-white px-1 border border-slate-800/40"
                                        >
                                          ►
                                        </button>
                                        <button
                                          onClick={() => {
                                            const items = zenithState.bento.items.filter((_: any, bIdx: number) => bIdx !== idx);
                                            updateZenithState('bento', { ...zenithState.bento, items });
                                            triggerZenithLog('BENTO_CARD_REMOVED', `Evicted bento cell "${item.title}" from dash.`, 'WARNING');
                                          }}
                                          className="text-rose-400 hover:text-white font-bold ml-1"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tab 8: Acoustic Synth Waves Soundboard */}
                          {zenithState.activeTab === 'audio_synth' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">Acoustic Waveform Frequency Soundboard</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">Web Audio API Synth</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Synthesize pitch and acoustics directly inside your browser. Tweak oscillators to design responsive sonic feedback indicators for save, error, and deletion events.
                              </p>

                              <div className="grid grid-cols-2 gap-2 text-[8px] bg-slate-900/20 p-2.5 border border-slate-850">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">Oscillator Shape:</span>
                                  <select
                                    value={zenithState.audioSynth.type}
                                    onChange={(e) => {
                                      updateZenithState('audioSynth', { ...zenithState.audioSynth, type: e.target.value });
                                      triggerZenithLog('SYNTH_WAVEFORM', `Selected oscillator wave format: ${e.target.value}`, 'OK');
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1 outline-none cursor-pointer"
                                  >
                                    <option value="sine">Sine Wave (Pure Ambient)</option>
                                    <option value="triangle">Triangle Wave (Classic 8-Bit)</option>
                                    <option value="sawtooth">Sawtooth Wave (Aggressive Lead)</option>
                                    <option value="square">Square Wave (Hollow Arcade)</option>
                                  </select>
                                </div>

                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">Pitch Frequency (Hz): {zenithState.audioSynth.frequency} Hz</span>
                                  <input
                                    type="range"
                                    min="100"
                                    max="1800"
                                    step="10"
                                    value={zenithState.audioSynth.frequency}
                                    onChange={(e) => {
                                      updateZenithState('audioSynth', { ...zenithState.audioSynth, frequency: parseInt(e.target.value) });
                                    }}
                                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-400 mt-2"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => {
                                    playAcousticWave(
                                      zenithState.audioSynth.frequency,
                                      zenithState.audioSynth.type,
                                      zenithState.audioSynth.duration,
                                      zenithState.audioSynth.sustain
                                    );
                                    triggerZenithLog('SONIC_PLAYBACK', `Played signature synth: ${zenithState.audioSynth.frequency}Hz [${zenithState.audioSynth.type}]`, 'OK');
                                  }}
                                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] py-1.5 uppercase cursor-pointer"
                                >
                                  TEST SONIC SIGNATURE
                                </button>
                                <button
                                  onClick={() => {
                                    playAcousticWave(600, 'triangle', 0.1, 0.05);
                                    triggerZenithLog('SONIC_PRESET_SAVE', 'Synthesized system save validation tone (600Hz Triangle).', 'OK');
                                  }}
                                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-bold py-1.5 uppercase cursor-pointer"
                                >
                                  PRESET: SAVE VALIDATION
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Tab 9: JWT Signer & Security Auditor */}
                          {zenithState.activeTab === 'jwt' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">JWT Authenticator Signer & Payload Auditor</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">Secure Token verification</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Cryptographically sign user states into encrypted tokens. Verify claims block parameters and inspect headers to simulate real OAuth sign-offs.
                              </p>

                              <div className="grid grid-cols-2 gap-2 text-[8px]">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">SIGNATURE SECRET:</span>
                                  <input
                                    type="text"
                                    value={zenithState.jwt.secretKey}
                                    onChange={(e) => {
                                      updateZenithState('jwt', { ...zenithState.jwt, secretKey: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1.5 outline-none font-mono"
                                  />
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">ALGORITHM:</span>
                                  <select
                                    value={zenithState.jwt.algorithm}
                                    onChange={(e) => {
                                      updateZenithState('jwt', { ...zenithState.jwt, algorithm: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-emerald-400 p-1 outline-none cursor-pointer"
                                  >
                                    <option value="HS256">HMAC SHA-256 (Symmetric)</option>
                                    <option value="RS256">RSA SHA-256 (Asymmetric mock)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-2 text-[8px]">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">PAYLOAD CLAIMS (JSON):</span>
                                  <textarea
                                    value={zenithState.jwt.payloadFieldsJson}
                                    onChange={(e) => {
                                      updateZenithState('jwt', { ...zenithState.jwt, payloadFieldsJson: e.target.value });
                                    }}
                                    className="w-full h-14 bg-slate-900 border border-slate-800 text-emerald-300 p-1 font-mono text-[8px] outline-none resize-none"
                                  />
                                </div>

                                <button
                                  onClick={async () => {
                                    updateZenithState('jwt', { ...zenithState.jwt, loading: true });
                                    triggerZenithLog('JWT_SIGNING', 'Hashing security header configurations...', 'PENDING');
                                    let fields = {};
                                    try {
                                      fields = JSON.parse(zenithState.jwt.payloadFieldsJson);
                                    } catch (e) {
                                      triggerZenithLog('JWT_PARSE_ERROR', 'Payload JSON format is invalid.', 'WARNING');
                                    }
                                    const results = await triggerApiCall('jwt_sign', {
                                      payloadFields: fields,
                                      secretKey: zenithState.jwt.secretKey,
                                      algorithm: zenithState.jwt.algorithm
                                    });
                                    updateZenithState('jwt', { ...zenithState.jwt, loading: false, results });
                                    triggerZenithLog('JWT_SUCCESS', 'Signed token cryptographically. HMAC claims generated.', 'OK');
                                  }}
                                  disabled={zenithState.jwt.loading}
                                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black text-[9px] py-1.5 uppercase cursor-pointer"
                                >
                                  {zenithState.jwt.loading ? 'CRYPTOGRAPHICALLY HARNESSING KEY...' : 'SIGN WORKSPACE CLAIMS & EMIT JWT'}
                                </button>
                              </div>

                              {zenithState.jwt.results && (
                                <div className="border border-slate-800 bg-black/40 p-2 rounded text-[8px] space-y-1">
                                  <span className="text-emerald-400 font-bold block border-b border-slate-850 pb-1 mb-1">JWT SECURE TOKEN STRING:</span>
                                  <div className="bg-slate-950 p-1.5 text-rose-300 text-[7px] font-mono whitespace-normal break-all select-all leading-normal border border-slate-900">
                                    {zenithState.jwt.results?.token}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 10: AI Ingestion Grounding context */}
                          {zenithState.activeTab === 'prompt_optimizer' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase">AI Grounding & Token Context Optimizer</span>
                                <span className="text-[8px] bg-emerald-950 px-1.5 py-0.5 text-emerald-300 rounded border border-emerald-900/40">AI Token Ingestion</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Format and bundle active canvas nodes into a streamlined token context block. Zenith measures character weight, structures schemas, and compiles prompts.
                              </p>

                              <div className="space-y-2 text-[8px]">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase mb-1">SYSTEM ROLE INSTRUCTIONS:</span>
                                  <textarea
                                    value={zenithState.promptOptimizer.promptRole}
                                    onChange={(e) => {
                                      updateZenithState('promptOptimizer', { ...zenithState.promptOptimizer, promptRole: e.target.value });
                                    }}
                                    className="w-full h-14 bg-slate-900 border border-slate-800 text-slate-200 p-1.5 outline-none font-mono text-[8.5px] resize-none"
                                  />
                                </div>

                                <button
                                  onClick={() => {
                                    triggerZenithLog('AI_GROUNDING_COMPRESS', 'Extracting and parsing structural element node parameters...', 'PENDING');
                                    
                                    // Compile local character counts
                                    const totalChars = elements.reduce((acc, current) => acc + (current.content || '').length, 0);
                                    const estimatedTokens = Math.ceil(totalChars / 4) + 120; // char to token rough formula + system weight
                                    
                                    const formattedPrompt = `// SYSTEM BLUEPRINT\nROLE: ${zenithState.promptOptimizer.promptRole}\n\n// CONTEXT BOUNDARIES\nACTIVE_CANVAS_ID: ${canvasId}\nBLOCK_NODES_COUNT: ${elements.length}\n\n// INGESTED BLOCKS\n${elements.map((el, i) => `NODE #${i+1} [${el.type}]: ${el.content}`).join('\n')}`;

                                    updateZenithState('promptOptimizer', {
                                      ...zenithState.promptOptimizer,
                                      results: {
                                        estimatedTokens,
                                        totalChars,
                                        formattedPrompt
                                      }
                                    });

                                    triggerZenithLog('AI_GROUNDING_READY', `Grounding payload constructed successfully. Context: ${estimatedTokens} tokens.`, 'OK');
                                  }}
                                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] py-1.5 uppercase cursor-pointer"
                                >
                                  ANALYZE CANVAS CONTEXT & MAP PROMPT
                                </button>
                              </div>

                              {zenithState.promptOptimizer.results && (
                                <div className="border border-slate-800 bg-black/40 p-2 rounded text-[8px] space-y-1.5">
                                  <div className="grid grid-cols-2 gap-2 text-[7px] text-slate-400 font-sans border-b border-slate-850 pb-1">
                                    <div>ESTIMATED CONTEXT TOKENS: <span className="text-emerald-400 font-bold">{zenithState.promptOptimizer.results.estimatedTokens}</span></div>
                                    <div>TOTAL RAW CHARACTERS: <span className="text-slate-200">{zenithState.promptOptimizer.results.totalChars} chars</span></div>
                                  </div>
                                  <pre className="text-slate-300 font-mono text-[7px] whitespace-pre-wrap overflow-y-auto max-h-24 bg-slate-950/80 p-1.5 border border-slate-900 leading-tight">
                                    {zenithState.promptOptimizer.results.formattedPrompt}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                        </div>

                        {/* Logs Side Terminal */}
                        <div className="border border-slate-800 bg-slate-950 p-3 flex flex-col justify-between text-[9px]">
                          <div>
                            <div className="border-b border-slate-800 pb-1.5 mb-2.5 flex items-center justify-between font-sans">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">DEVOPS LEDGER AUDITS</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-ping" />
                            </div>

                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {(zenithState.logs || []).map((log: any, lIdx: number) => (
                                <div key={lIdx} className="text-[8px] py-1 border-b border-slate-900 leading-tight">
                                  <div className="flex justify-between text-slate-500">
                                    <span>[{log.time}]</span>
                                    <span className={`font-black uppercase ${
                                      log.status === 'OK' ? 'text-emerald-400' :
                                      log.status === 'WARNING' ? 'text-amber-400' :
                                      log.status === 'CONFLICT' ? 'text-rose-400' : 'text-blue-400'
                                    }`}>{log.op}</span>
                                  </div>
                                  <p className="text-slate-300 mt-0.5">{log.payload}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-2 flex justify-between text-[8px] text-slate-500 uppercase mt-2 font-sans font-black">
                            <span>COCKPIT CONSOLE V1.2</span>
                            <span>ACTIVE LOG FEED: {(zenithState.logs || []).length}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()
              )}

              {/* AERONAV 10-TIER WORKSPACE NAVIGATION DECK */}
              {el.type === 'productivity_nav_deck' && (
                (() => {
                  const navDeckState = propertiesObj.navDeck || {
                    activeTab: 'nav_tree', // nav_tree, full_search, split_dash, shortcuts, minimap, bookmarks, breadcrumbs, portal, focus_lens, clip_board
                    selectedTreeIndex: 0,
                    searchQuery: '',
                    selectedSplitCanvasId: '',
                    selectedShortcutId: '',
                    selectedElementIdForPortal: '',
                    selectedCanvasIdForPortal: '',
                    focusDimPct: 0,
                    activeFocusType: 'all',
                    clippedNotes: [
                      { id: 'cn-1', text: 'Important checklist items verified', timestamp: '14:20' }
                    ],
                    bookmarksList: [],
                    keyboardShortcuts: [
                      { id: 'sc-1', key: 'Alt + T', action: 'Create Task Node', desc: 'Adds new todo task under current scope' },
                      { id: 'sc-2', key: 'Alt + C', action: 'Create Sandbox Node', desc: 'Spawns code editor instance' },
                      { id: 'sc-3', key: 'Alt + G', action: 'Merge Branches', desc: 'Syncs current branch metadata' },
                      { id: 'sc-4', key: 'Alt + K', action: 'Search Database', desc: 'Launches indexing parser engine' },
                      { id: 'sc-5', key: 'Alt + Z', action: 'Clear Sandbox', desc: 'Flushes temporary buffer cache' }
                    ],
                    logs: [
                      { time: '14:19:15', op: 'DECK_BOOT', payload: 'AeroNav carbon-fiber navigation terminal operational.', status: 'OK' }
                    ]
                  };

                  const updateState = (key: string, value: any) => {
                    const updated = { ...navDeckState, [key]: value };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, navDeck: updated }) });
                  };

                  const triggerLocalLog = (op: string, payload: string, status: 'OK' | 'WARNING' | 'CONFLICT' | 'PENDING') => {
                    const time = new Date().toTimeString().split(' ')[0];
                    const newLog = { time, op, payload, status };
                    const updatedLogs = [...(navDeckState.logs || []), newLog].slice(-25);
                    updateState('logs', updatedLogs);
                  };

                  const filteredSearchElements = elements.filter(item => {
                    if (!navDeckState.searchQuery) return true;
                    return (item.content || '').toLowerCase().includes(navDeckState.searchQuery.toLowerCase()) || 
                           (item.type || '').toLowerCase().includes(navDeckState.searchQuery.toLowerCase());
                  });

                  // Feature 8: Portal move transaction
                  const runPortalMigration = async () => {
                    if (!navDeckState.selectedElementIdForPortal || !navDeckState.selectedCanvasIdForPortal) {
                      triggerLocalLog('PORTAL_ERROR', 'Missing source element or target canvas parameters.', 'WARNING');
                      return;
                    }
                    const targetEl = elements.find(item => item.id === navDeckState.selectedElementIdForPortal);
                    if (!targetEl) {
                      triggerLocalLog('PORTAL_ERROR', 'Source element not found in current canvas context.', 'WARNING');
                      return;
                    }

                    try {
                      // Clone element to the destination canvas in Dexie
                      const cloneId = `el-${Math.random().toString(36).substring(2, 11)}`;
                      const newElement = {
                        id: cloneId,
                        canvasId: navDeckState.selectedCanvasIdForPortal,
                        type: targetEl.type,
                        content: targetEl.content + ' (Migrated via AeroNav Tunnel)',
                        properties: targetEl.properties,
                        sortOrder: targetEl.sortOrder + 1,
                        updatedAt: new Date()
                      };
                      await db.elements.add(newElement);
                      triggerLocalLog('PORTAL_TUNNEL_OK', `Cloned block "${targetEl.type}" to target canvas successfully. ID: ${cloneId}`, 'OK');
                    } catch (err: any) {
                      triggerLocalLog('PORTAL_FAIL', `Database transaction failed: ${err?.message || err}`, 'CONFLICT');
                    }
                  };

                  return (
                    <div className="border-2 border-[#1E293B] p-4 bg-[#0F172A] text-slate-100 rounded-none neo-shadow-sm my-3 w-full font-mono relative overflow-hidden">
                      {/* Premium Visual Header */}
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 bg-slate-900/60 -mx-4 -mt-4 p-4">
                        <div className="flex items-center space-x-2">
                          <Compass className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block font-sans">
                              AeroNav 10-Tier Workspace Cockpit
                            </span>
                            <span className="text-[9px] text-slate-400 block">
                              Keyboard Trees, Real-Time Index Search, Multi-Canvas Dashboards, Portal Gateways & Focus Rails
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0 font-sans text-[8px] font-extrabold">
                          <span className="text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-1.5 py-0.5 rounded-sm uppercase">
                            NAVIGATION UNIT: v1.0.4
                          </span>
                        </div>
                      </div>

                      {/* 10-Tier Navigation Core Tab Selection */}
                      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-3 mb-4 text-[8px] font-sans font-bold">
                        {[
                          { id: 'nav_tree', label: '1. KEYBOARD TREE', icon: Keyboard },
                          { id: 'full_search', label: '2. SEARCH INDEX', icon: Search },
                          { id: 'split_dash', label: '3. SPLIT DASHBOARD', icon: Layout },
                          { id: 'shortcuts', label: '4. COMMANDER', icon: FileCode },
                          { id: 'minimap', label: '5. COORDINATE MINIMAP', icon: Map },
                          { id: 'bookmarks', label: '6. TAG CLOUD & BOOKMARKS', icon: Tag },
                          { id: 'breadcrumbs', label: '7. BREADCRUMBS', icon: MapPin },
                          { id: 'portal', label: '8. PORTAL GATEWAY', icon: Shuffle },
                          { id: 'focus_lens', label: '9. FOCUS LENS', icon: EyeOff },
                          { id: 'clip_board', label: '10. CLIPPING BANK', icon: Scissors }
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = navDeckState.activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                updateState('activeTab', tab.id);
                                triggerLocalLog('TAB_SWITCH', `Activated index tier: ${tab.label}`, 'OK');
                              }}
                              className={`px-2 py-1.5 border flex items-center gap-1 transition-all cursor-pointer ${isActive ? 'bg-indigo-500 text-slate-950 border-indigo-400 font-extrabold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Main Workspace Frame */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2 border border-slate-800 bg-slate-950/60 p-3 min-h-[260px] flex flex-col justify-between">
                          
                          {/* 1. Keyboard Tree */}
                          {navDeckState.activeTab === 'nav_tree' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Interactive Keyboard Navigation Tree</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">DFS Traversal</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Select and traverse nodes on the current canvas. Keyboard hotkeys are simulated dynamically via the manual trigger console below.
                              </p>

                              <div className="border border-slate-800 bg-black/40 p-2 text-[9px] space-y-1 max-h-36 overflow-y-auto">
                                {elements.length === 0 ? (
                                  <span className="text-slate-500 italic block py-2">No nodes present on the active canvas.</span>
                                ) : (
                                  elements.map((item, idx) => {
                                    const isSelected = navDeckState.selectedTreeIndex === idx;
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => {
                                          updateState('selectedTreeIndex', idx);
                                          triggerLocalLog('TREE_SELECT', `Focused tree node index: ${idx} (${item.type})`, 'OK');
                                        }}
                                        className={`p-1 flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'bg-indigo-500/15 border-l-2 border-indigo-400 text-white font-extrabold' : 'hover:bg-slate-900 text-slate-400 border-l border-transparent'}`}
                                      >
                                        <div className="flex items-center space-x-2 truncate">
                                          <span className="text-[8px] text-slate-600 font-bold">[{idx + 1}]</span>
                                          <span className="text-[9px] text-indigo-400 uppercase font-black">[{item.type}]</span>
                                          <span className="truncate text-slate-300">{item.content || '(empty block content)'}</span>
                                        </div>
                                        <span className="text-[7px] text-slate-500 font-mono">ID: {item.id}</span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Simulation Controller */}
                              <div className="flex flex-wrap gap-1.5 items-center bg-slate-900/40 p-2 border border-slate-800">
                                <span className="text-[8px] text-slate-500 font-bold uppercase block mr-1">Simulate Keys:</span>
                                <button
                                  onClick={() => {
                                    const nextIdx = Math.max(0, navDeckState.selectedTreeIndex - 1);
                                    updateState('selectedTreeIndex', nextIdx);
                                    triggerLocalLog('KEY_TRAVERSE_UP', `Simulated [↑] Up key. Index: ${nextIdx}`, 'OK');
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[8px] font-bold border border-slate-700 cursor-pointer"
                                >
                                  [↑] PREV
                                </button>
                                <button
                                  onClick={() => {
                                    const nextIdx = Math.min(elements.length - 1, navDeckState.selectedTreeIndex + 1);
                                    updateState('selectedTreeIndex', nextIdx);
                                    triggerLocalLog('KEY_TRAVERSE_DOWN', `Simulated [↓] Down key. Index: ${nextIdx}`, 'OK');
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[8px] font-bold border border-slate-700 cursor-pointer"
                                >
                                  [↓] NEXT
                                </button>
                                <button
                                  onClick={() => {
                                    const selectedNode = elements[navDeckState.selectedTreeIndex];
                                    if (selectedNode) {
                                      triggerLocalLog('KEY_ENTER_SELECT', `Triggered [Enter] Action on node ${selectedNode.id}. Scroll target activated.`, 'OK');
                                      const elDom = document.getElementById(`textarea-${selectedNode.id}`);
                                      if (elDom) {
                                        elDom.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        elDom.focus();
                                      }
                                    }
                                  }}
                                  className="px-1.5 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[8px] font-bold border border-indigo-500/40 cursor-pointer"
                                >
                                  [Enter] FOCUS NODE
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 2. Search Index */}
                          {navDeckState.activeTab === 'full_search' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Full-Text In-Memory Node Indexer</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">B-Tree Parser</span>
                              </div>
                              
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={navDeckState.searchQuery}
                                  onChange={(e) => {
                                    updateState('searchQuery', e.target.value);
                                    triggerLocalLog('INDEX_SEARCH', `Parsed raw query: "${e.target.value}"`, 'OK');
                                  }}
                                  placeholder="Type keywords or node types to index..."
                                  className="flex-1 bg-slate-900 border border-slate-800 text-white p-1.5 text-[9px] outline-none"
                                />
                                {navDeckState.searchQuery && (
                                  <button
                                    onClick={() => {
                                      updateState('searchQuery', '');
                                      triggerLocalLog('SEARCH_CLEAR', 'Cleared query buffers.', 'OK');
                                    }}
                                    className="px-2 bg-slate-800 text-[8px] text-slate-300 border border-slate-700 cursor-pointer font-bold"
                                  >
                                    RESET
                                  </button>
                                )}
                              </div>

                              <div className="border border-slate-800 bg-black/40 p-2 text-[9px] space-y-1.5 max-h-32 overflow-y-auto">
                                {filteredSearchElements.length === 0 ? (
                                  <div className="text-slate-500 italic py-2 text-center">No nodes matched the specified query.</div>
                                ) : (
                                  filteredSearchElements.map((item, idx) => (
                                    <div
                                      key={item.id}
                                      onClick={() => {
                                        triggerLocalLog('MATCH_PAN', `Navigated viewport coordinate center to matching node: ${item.id}`, 'OK');
                                        const elDom = document.getElementById(`textarea-${item.id}`);
                                        if (elDom) {
                                          elDom.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          elDom.focus();
                                        }
                                      }}
                                      className="p-1.5 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="text-[8px] bg-indigo-950 text-indigo-300 border border-indigo-900/40 px-1.5 py-0.5 rounded mr-1.5 uppercase font-bold text-[7px]">
                                          {item.type}
                                        </span>
                                        <span className="text-slate-200">
                                          {item.content || <span className="italic text-slate-600">(empty block)</span>}
                                        </span>
                                      </div>
                                      <span className="text-[7px] text-slate-500 font-mono">#{idx + 1}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {/* 3. Split Dashboard */}
                          {navDeckState.activeTab === 'split_dash' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Multi-Canvas Split-Dashboard Simulator</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Pane Splitter</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Select a peer canvas from the active project workspace to load its node list side-by-side. Useful for comparing structure drafts.
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <span className="text-[8px] text-slate-500 font-bold block uppercase mb-1">Select Split Peer Canvas:</span>
                                  <select
                                    value={navDeckState.selectedSplitCanvasId}
                                    onChange={(e) => {
                                      updateState('selectedSplitCanvasId', e.target.value);
                                      triggerLocalLog('SPLIT_SELECT', `Coupled peer workspace ID: ${e.target.value}`, 'OK');
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 text-indigo-400 text-[10px] font-black p-1.5 outline-none rounded cursor-pointer"
                                  >
                                    <option value="">-- Choose Peer Canvas --</option>
                                    {canvasesList.filter(c => c.id !== canvasId).map(c => (
                                      <option key={c.id} value={c.id}>{c.icon || '📄'} {c.title}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="border border-slate-800 bg-slate-900/10 p-2 rounded text-[8px] space-y-1 flex flex-col justify-between">
                                  <div>
                                    <span className="text-slate-500 font-bold uppercase block text-[7px] mb-1">Coupled Node Status:</span>
                                    {navDeckState.selectedSplitCanvasId ? (
                                      <span className="text-emerald-400 font-bold">READY TO STREAM SPLIT VIEW</span>
                                    ) : (
                                      <span className="text-amber-400">WAITING FOR PEER SELECTION</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {navDeckState.selectedSplitCanvasId && (
                                <div className="border border-slate-800 bg-slate-900/50 p-2 rounded text-[8px] space-y-1.5 max-h-24 overflow-y-auto">
                                  <span className="text-[7px] text-indigo-400 font-black uppercase tracking-wider block">Peer Live Node Elements (Simulated Read):</span>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between py-0.5 border-b border-slate-800 text-slate-300">
                                      <span>[HEADING_1] Workspace Executive Briefing</span>
                                      <span className="text-slate-600">v14</span>
                                    </div>
                                    <div className="flex items-center justify-between py-0.5 border-b border-slate-800 text-slate-300">
                                      <span>[TEXT] Primary design guidelines defined for next-gen models</span>
                                      <span className="text-slate-600">v19</span>
                                    </div>
                                    <div className="flex items-center justify-between py-0.5 text-slate-300">
                                      <span>[TODO] Finalize metadata layout definitions</span>
                                      <span className="text-emerald-400 font-bold">DONE</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4. Commander Shortcuts */}
                          {navDeckState.activeTab === 'shortcuts' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Shortcut Commander Shortcut Binder</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Key Binder</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Set of active productivity hotkeys. Click a trigger button to simulate the execution of a keybinding transaction immediately.
                              </p>

                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {navDeckState.keyboardShortcuts.map((sc: any) => (
                                  <div
                                    key={sc.id}
                                    className="p-1.5 border border-slate-800 bg-slate-900/40 flex items-center justify-between text-[9px] hover:border-slate-700 transition-all"
                                  >
                                    <div>
                                      <span className="bg-indigo-950 text-indigo-400 px-1.5 py-0.5 border border-indigo-900 rounded font-bold text-[8px] mr-2">
                                        {sc.key}
                                      </span>
                                      <span className="font-extrabold text-slate-200">{sc.action}</span>
                                      <span className="text-slate-500 ml-2 block sm:inline text-[8px]">{sc.desc}</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        triggerLocalLog('SHORTCUT_EXECUTE', `Simulated command trigger: ${sc.action} via binder.`, 'OK');
                                        if (sc.id === 'sc-1') {
                                          createCanvasElement(canvasId, 'todo', 'New Task spawned via AeroNav trigger', 9.9);
                                        } else if (sc.id === 'sc-2') {
                                          createCanvasElement(canvasId, 'code_sandbox', '// Spawned from AeroNav Shortcut', 9.9);
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-[8px] uppercase cursor-pointer"
                                    >
                                      FIRE
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 5. Coordinate Minimap */}
                          {navDeckState.activeTab === 'minimap' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Interactive Coordinate Minimap Locator</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">2D Mesh Spatial Map</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Spatial representation of element coordinates on the viewport canvas. Colored blocks correlate to node density.
                              </p>

                              <div className="border border-slate-800 bg-black/50 p-2 h-28 relative rounded flex flex-col justify-between">
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
                                
                                <div className="relative flex flex-wrap gap-1.5">
                                  {elements.map((item, idx) => {
                                    const colorsMap: any = {
                                      heading_1: 'bg-red-500',
                                      heading_2: 'bg-orange-500',
                                      todo: 'bg-emerald-500',
                                      code_sandbox: 'bg-purple-500',
                                      productivity_nav_deck: 'bg-indigo-500'
                                    };
                                    const bgColor = colorsMap[item.type] || 'bg-slate-600';
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => {
                                          triggerLocalLog('MINIMAP_NAV', `Centering spatial lens on node [${item.type}] #${idx+1}`, 'OK');
                                          const elDom = document.getElementById(`textarea-${item.id}`);
                                          if (elDom) {
                                            elDom.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          }
                                        }}
                                        className={`w-6 h-4 ${bgColor} border border-slate-950/60 flex items-center justify-center text-[6px] font-black cursor-pointer hover:scale-110 transition-transform`}
                                        title={`${item.type}: ${item.content}`}
                                      >
                                        #{idx+1}
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="text-[7px] text-slate-500 flex justify-between relative z-10">
                                  <span>COORDINATE MESH RANGE: 0,0 → 1000,1000</span>
                                  <span>DENSITY: {elements.length} BLOCKS ACTIVE</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 6. Tag Cloud & Bookmarks */}
                          {navDeckState.activeTab === 'bookmarks' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">AeroNav Workspace Bookmark & Tag Cloud</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Taxonomy Engine</span>
                              </div>
                              
                              <span className="text-[8px] text-slate-500 font-bold block uppercase font-sans">1. Simulated Workspace Tag Cloud (Click to Filter Logs):</span>
                              <div className="flex flex-wrap gap-1.5 py-1">
                                {[
                                  { tag: '#milestone-1', count: 12, color: 'text-indigo-400 border-indigo-900 bg-indigo-950/40' },
                                  { tag: '#draft', count: 5, color: 'text-slate-400 border-slate-800 bg-slate-900/40' },
                                  { tag: '#critical', count: 8, color: 'text-rose-400 border-rose-900 bg-rose-950/40' },
                                  { tag: '#meeting-notes', count: 14, color: 'text-amber-400 border-amber-900 bg-amber-950/40' },
                                  { tag: '#code-sprint', count: 9, color: 'text-emerald-400 border-emerald-900 bg-emerald-950/40' }
                                ].map((t) => (
                                  <button
                                    key={t.tag}
                                    onClick={() => triggerLocalLog('TAG_FILTER', `Filtered workspace query buffer using taxonomy: "${t.tag}"`, 'OK')}
                                    className={`px-2 py-1 text-[8px] font-black border uppercase cursor-pointer rounded-sm hover:scale-105 transition-transform ${t.color}`}
                                  >
                                    {t.tag} ({t.count})
                                  </button>
                                ))}
                              </div>

                              <span className="text-[8px] text-slate-500 font-bold block uppercase font-sans pt-1">2. Fast Bookmarks Register:</span>
                              <div className="flex gap-1.5">
                                <select
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    const updated = [...(navDeckState.bookmarksList || []), e.target.value];
                                    updateState('bookmarksList', updated);
                                    triggerLocalLog('BOOKMARK_ADD', `Bookmarked element node ID: ${e.target.value}`, 'OK');
                                  }}
                                  className="flex-1 bg-slate-900 border border-slate-800 text-[9px] text-indigo-300 p-1 outline-none cursor-pointer"
                                >
                                  <option value="">-- Add Current Node Bookmark --</option>
                                  {elements.map((item, idx) => (
                                    <option key={item.id} value={item.id}>#{idx+1} [{item.type}] - {item.content.substring(0, 30)}...</option>
                                  ))}
                                </select>
                              </div>

                              {(navDeckState.bookmarksList || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto bg-black/25 p-1.5 border border-slate-800">
                                  {(navDeckState.bookmarksList || []).map((bId: string, bIdx: number) => (
                                    <div key={bId} className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[8px] text-slate-300">
                                      <span>Bookmark: {bId.substring(0, 8)}</span>
                                      <button
                                        onClick={() => {
                                          const filtered = (navDeckState.bookmarksList || []).filter((_: any, idx: number) => idx !== bIdx);
                                          updateState('bookmarksList', filtered);
                                          triggerLocalLog('BOOKMARK_DELETE', `Removed bookmark: ${bId}`, 'WARNING');
                                        }}
                                        className="text-rose-400 font-black cursor-pointer ml-1 hover:text-white"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 7. Breadcrumbs Lineage */}
                          {navDeckState.activeTab === 'breadcrumbs' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Structural Breadcrumb Lineage Resolver</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Node Hierarchy</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Traces physical parent-child directory lineage in database schema. Click breadcrumb keys to update simulated traversal state.
                              </p>

                              <div className="flex flex-wrap items-center bg-slate-900/60 p-2.5 border border-slate-800 text-[9px] gap-1 rounded">
                                <span className="text-slate-500 font-bold uppercase block mr-1 font-sans">Active Lineage:</span>
                                <button
                                  onClick={() => triggerLocalLog('BREADCRUMB_TRAVERSE', 'Jumped to Workspace scope.', 'OK')}
                                  className="text-indigo-400 hover:underline cursor-pointer font-extrabold"
                                >
                                  WORKSPACE ROOT
                                </button>
                                <span className="text-slate-600 font-extrabold">/</span>
                                <button
                                  onClick={() => triggerLocalLog('BREADCRUMB_TRAVERSE', 'Jumped to Active Canvas scope.', 'OK')}
                                  className="text-indigo-400 hover:underline cursor-pointer font-extrabold"
                                >
                                  📄 active-canvas-{canvasId.substring(0, 8)}
                                </button>
                                <span className="text-slate-600 font-extrabold">/</span>
                                <span className="text-slate-200 bg-slate-800 px-1.5 rounded text-[8px]">
                                  🚀 aero-nav-cockpit-{el.id.substring(0, 8)}
                                </span>
                              </div>

                              <div className="text-[8px] text-slate-500 border border-slate-800/40 p-2 bg-slate-900/25">
                                <strong>Lineage Depth Index:</strong> Depth: 3, Database Tree Convergence: Checked.
                              </div>
                            </div>
                          )}

                          {/* 8. Portal Gateway */}
                          {navDeckState.activeTab === 'portal' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Cross-Canvas Portal Transfer Gateway</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Dexie Bridge</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Transfer a node element physically to another canvas workspace. This performs a clone operation on the specified target database table.
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <span className="text-[8px] text-slate-500 font-bold block uppercase mb-1">Source Node:</span>
                                  <select
                                    value={navDeckState.selectedElementIdForPortal}
                                    onChange={(e) => updateState('selectedElementIdForPortal', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-[9px] p-1.5 outline-none cursor-pointer"
                                  >
                                    <option value="">-- Choose Element --</option>
                                    {elements.map((item, idx) => (
                                      <option key={item.id} value={item.id}>#{idx+1} [{item.type}] - {item.content.substring(0, 25)}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <span className="text-[8px] text-slate-500 font-bold block uppercase mb-1">Destination Workspace:</span>
                                  <select
                                    value={navDeckState.selectedCanvasIdForPortal}
                                    onChange={(e) => updateState('selectedCanvasIdForPortal', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-[9px] p-1.5 outline-none cursor-pointer"
                                  >
                                    <option value="">-- Choose Target Canvas --</option>
                                    {canvasesList.filter(c => c.id !== canvasId).map(c => (
                                      <option key={c.id} value={c.id}>{c.icon || '📄'} {c.title}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <button
                                onClick={runPortalMigration}
                                className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-950 font-black uppercase text-[9px] tracking-wider cursor-pointer transition-all"
                              >
                                INITIATE PORTAL TUNNEL TRANSMISSION
                              </button>
                            </div>
                          )}

                          {/* 9. Focus Lens */}
                          {navDeckState.activeTab === 'focus_lens' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Ambient Focus Mode Focal Lens Controller</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">UI Dimmer</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Selectively dim everything in the workspace editor except the selected type of node. Ideal for focused sprint cycles.
                              </p>

                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-[8px] text-slate-500 font-bold block uppercase mb-1">Highlight Focus Scope:</span>
                                    <select
                                      value={navDeckState.activeFocusType}
                                      onChange={(e) => {
                                        updateState('activeFocusType', e.target.value);
                                        triggerLocalLog('FOCUS_TYPE_ADJUST', `Focus scope targeted to: ${e.target.value.toUpperCase()}`, 'OK');
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-[9px] p-1.5 outline-none cursor-pointer"
                                    >
                                      <option value="all">Unfocused (Highlight All)</option>
                                      <option value="todo">Tasks & TODOs Only</option>
                                      <option value="code_sandbox">Code Sandboxes Only</option>
                                      <option value="heading">Headers Only</option>
                                    </select>
                                  </div>

                                  <div className="border border-slate-800 bg-slate-900/10 p-2 text-[8px] space-y-1">
                                    <span className="text-slate-500 font-bold uppercase block text-[7px]">Focus Calibration:</span>
                                    {navDeckState.activeFocusType !== 'all' ? (
                                      <span className="text-indigo-400 font-black animate-pulse">DISTRACTION-FREE HIGHLIGHT ON</span>
                                    ) : (
                                      <span className="text-slate-500 font-bold">AMBIENT LIGHTING MODE</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 10. Quick Clipping Bank */}
                          {navDeckState.activeTab === 'clip_board' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Workspace Quick-Notes Clipping Bank</span>
                                <span className="text-[8px] bg-slate-800 px-1 py-0.5 text-slate-400 rounded">Scrapbook Clipboard</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-sans">
                                Draft summaries or combine text elements from the active canvas into a single cohesive persistent clipping memo.
                              </p>

                              <div className="flex gap-2">
                                <select
                                  id="element-clipping-select"
                                  className="flex-1 bg-slate-900 border border-slate-800 text-[9px] text-slate-300 p-1.5 outline-none cursor-pointer"
                                >
                                  <option value="">-- Select Element To Clip Content --</option>
                                  {elements.map((item, idx) => (
                                    <option key={item.id} value={item.id}>#{idx+1} [{item.type}] - {item.content.substring(0, 35)}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    const selectEl = document.getElementById('element-clipping-select') as HTMLSelectElement;
                                    const val = selectEl?.value;
                                    if (!val) {
                                      triggerLocalLog('CLIP_ERROR', 'No element selected for clipping.', 'WARNING');
                                      return;
                                    }
                                    const item = elements.find(el => el.id === val);
                                    if (item) {
                                      const text = item.content || '(Empty content)';
                                      const updated = [...(navDeckState.clippedNotes || []), {
                                        id: `cn-${Math.random().toString(36).substring(2, 7)}`,
                                        text: text.substring(0, 80),
                                        timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5)
                                      }];
                                      navDeckState.clippedNotes = updated;
                                      updateState('clippedNotes', updated);
                                      triggerLocalLog('CLIPPED_ITEM', `Successfully clipped content from element #${val.substring(0, 6)}`, 'OK');
                                    }
                                  }}
                                  className="px-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-[8px] uppercase cursor-pointer"
                                >
                                  CLIP
                                </button>
                              </div>

                              <div className="border border-slate-800 bg-black/40 p-2 text-[9px] space-y-1 max-h-24 overflow-y-auto">
                                {(!navDeckState.clippedNotes || navDeckState.clippedNotes.length === 0) ? (
                                  <div className="text-slate-500 italic py-1">No clippings captured in the scrapbook bank.</div>
                                ) : (
                                  navDeckState.clippedNotes.map((note: any, nIdx: number) => (
                                    <div key={note.id} className="flex justify-between items-center bg-slate-900/60 p-1 rounded text-[8px] border border-slate-800">
                                      <span>
                                        <span className="text-indigo-400 font-bold mr-1.5">[{note.timestamp}]</span>
                                        <span className="text-slate-200">{note.text}</span>
                                      </span>
                                      <button
                                        onClick={() => {
                                          const filtered = navDeckState.clippedNotes.filter((_: any, idx: number) => idx !== nIdx);
                                          updateState('clippedNotes', filtered);
                                          triggerLocalLog('CLIP_REMOVED', 'Removed scrap item.', 'WARNING');
                                        }}
                                        className="text-rose-400 font-black hover:text-white cursor-pointer ml-1.5"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Logs Side Terminal */}
                        <div className="border border-slate-800 bg-slate-950/60 p-3 flex flex-col justify-between text-[9px]">
                          <div>
                            <div className="border-b border-slate-800 pb-1.5 mb-2.5 flex items-center justify-between font-sans">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">COCKPIT LEDGER LOGS</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1 animate-ping" />
                            </div>

                            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                              {(navDeckState.logs || []).map((log: any, lIdx: number) => (
                                <div key={lIdx} className="text-[8px] py-1 border-b border-slate-900/50 leading-tight">
                                  <div className="flex justify-between text-slate-500">
                                    <span>[{log.time}]</span>
                                    <span className={`font-black uppercase ${
                                      log.status === 'OK' ? 'text-indigo-400' :
                                      log.status === 'WARNING' ? 'text-amber-400' :
                                      log.status === 'CONFLICT' ? 'text-rose-400' : 'text-blue-400'
                                    }`}>{log.op}</span>
                                  </div>
                                  <p className="text-slate-300 mt-0.5">{log.payload}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-2 flex justify-between text-[8px] text-slate-500 uppercase mt-2 font-sans">
                            <span>COCKPIT CONSOLE</span>
                            <span>ACTIVE LOGS: {(navDeckState.logs || []).length}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()
              )}

              {/* AUDIO WAVEFORM SLICER */}
              {el.type === 'audio_sampler' && (
                (() => {
                  const samplerState = propertiesObj.sampler || {
                    slices: [
                      { id: 'sl1', name: 'Low Synth Kick', freq: 100, length: 0.2 },
                      { id: 'sl2', name: 'Mid Sine Beep', freq: 440, length: 0.15 },
                      { id: 'sl3', name: 'High Harmony Ring', freq: 880, length: 0.3 }
                    ]
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Disc className="w-4 h-4 text-rose-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Audio Waveform Slicer & Synthesizer
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-rose-200 px-1.5 py-0.5 bg-rose-50 text-rose-600 font-extrabold uppercase rounded-sm">
                          HTML5 Audio Node
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-2">
                          <span className="text-[9px] font-mono font-black text-gray-400 block uppercase">Sound wave slice mapping:</span>
                          <div className="border-2 border-black bg-rose-950/10 p-3 h-20 flex items-center justify-around relative overflow-hidden rounded-none">
                            <svg className="absolute inset-0 w-full h-full stroke-rose-300 fill-none opacity-40" viewBox="0 0 300 80">
                              <path d="M0,40 Q15,10 30,40 T60,40 T90,40 T120,40 T150,40 T180,40 T210,40 T240,40 T270,40 T300,40" strokeWidth="2" />
                            </svg>
                            {samplerState.slices.map((slice: any) => (
                              <button
                                key={slice.id}
                                onClick={() => {
                                  if (typeof window === 'undefined') return;
                                  try {
                                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                                    if (!AudioContextClass) return;
                                    const ctx = new AudioContextClass();
                                    const osc = ctx.createOscillator();
                                    const gain = ctx.createGain();
                                    osc.connect(gain);
                                    gain.connect(ctx.destination);
                                    
                                    osc.frequency.setValueAtTime(slice.freq, ctx.currentTime);
                                    gain.gain.setValueAtTime(0.15, ctx.currentTime);
                                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + slice.length);
                                    
                                    osc.start();
                                    osc.stop(ctx.currentTime + slice.length);
                                  } catch {}
                                }}
                                className="z-10 px-2.5 py-1.5 border border-black bg-rose-500 text-white font-mono text-[9px] font-black uppercase tracking-tight neo-shadow-sm hover:translate-y-[1px] hover:shadow-none cursor-pointer text-center"
                              >
                                {slice.name} <br/> ({slice.freq}Hz)
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-2 border-black p-3 bg-slate-50 font-mono text-xs flex flex-col justify-between">
                          <div className="space-y-1.5 text-[9px]">
                            <span className="font-black text-slate-500 uppercase">Interactive Config:</span>
                            {samplerState.slices.map((slice: any) => (
                              <div key={slice.id} className="flex justify-between items-center text-[8px]">
                                <span className="font-bold text-gray-600">{slice.name}</span>
                                <input
                                  type="range" min="100" max="1200" step="50"
                                  value={slice.freq}
                                  onChange={(e) => {
                                    const updatedSlices = samplerState.slices.map((sl: any) => sl.id === slice.id ? { ...sl, freq: parseInt(e.target.value) } : sl);
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sampler: { slices: updatedSlices } }) });
                                  }}
                                  className="w-16 accent-rose-500 cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* DISTRIBUTED AST QUERY BUILDER */}
              {el.type === 'ast_query_builder' && (
                (() => {
                  const state = propertiesObj.queryBuilder || {
                    filters: [
                      { field: 'type', op: '==', value: 'todo' }
                    ]
                  };
                  const filters = state.filters;

                  const results = elements.filter(item => {
                    return filters.every((f: any) => {
                      if (f.field === 'type') {
                        return f.op === '==' ? item.type === f.value : item.type !== f.value;
                      }
                      if (f.field === 'content') {
                        return item.content.toLowerCase().includes(f.value.toLowerCase());
                      }
                      return true;
                    });
                  });

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-4 h-4 text-sky-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Distributed AST Query Builder & Selector
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-sky-200 px-1.5 py-0.5 bg-sky-50 text-sky-600 font-extrabold uppercase rounded-sm">
                          Query Compiler
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono font-black text-gray-400 block uppercase font-sans">Filter Schema Clauses:</span>
                          <div className="space-y-2">
                            {filters.map((f: any, fIdx: number) => (
                              <div key={fIdx} className="flex gap-1.5 items-center text-[10px] font-mono font-bold bg-slate-50 p-1.5 border border-black/10">
                                <select
                                  value={f.field}
                                  onChange={(e) => {
                                    const nextFilters = filters.map((item: any, idx: number) => idx === fIdx ? { ...item, field: e.target.value } : item);
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, queryBuilder: { filters: nextFilters } }) });
                                  }}
                                  className="border border-black bg-white p-0.5 text-[10px]"
                                >
                                  <option value="type">Block Type</option>
                                  <option value="content">Text Content</option>
                                </select>
                                <span className="text-gray-400">is</span>
                                <input 
                                  type="text" value={f.value}
                                  onChange={(e) => {
                                    const nextFilters = filters.map((item: any, idx: number) => idx === fIdx ? { ...item, value: e.target.value } : item);
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, queryBuilder: { filters: nextFilters } }) });
                                  }}
                                  className="border border-black bg-white p-0.5 text-[10px] flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const nextFilters = filters.filter((_: any, idx: number) => idx !== fIdx);
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, queryBuilder: { filters: nextFilters } }) });
                                  }}
                                  className="text-rose-600 font-black px-1.5 cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const nextFilters = [...filters, { field: 'content', op: '==', value: 'sprint' }];
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, queryBuilder: { filters: nextFilters } }) });
                              }}
                              className="px-2 py-1 text-[9px] font-black uppercase border border-dashed border-sky-500 text-sky-600 hover:bg-sky-50 cursor-pointer font-sans"
                            >
                              + Add query constraint
                            </button>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-50 p-3 h-44 overflow-y-auto">
                          <span className="text-[9px] font-black text-gray-400 block uppercase mb-2 font-sans">Query AST matches ({results.length}):</span>
                          <div className="space-y-1 text-[9px] font-mono">
                            {results.map((item, idx) => (
                              <div key={idx} className="p-1 bg-white border border-black/15 flex justify-between items-center">
                                <span className="font-extrabold text-slate-800">[{item.type}]</span>
                                <span className="text-slate-500 truncate max-w-[120px]">{item.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* AESTHETIC THEME CUSTOMIZER */}
              {el.type === 'theme_engine_sandbox' && (
                (() => {
                  const theme = propertiesObj.theme || {
                    accentColor: '#FFB703',
                    borderWeight: 'border-2',
                    shadowSize: 'neo-shadow-sm',
                    rounding: 'rounded-none'
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Palette className="w-4 h-4 text-amber-500" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Aesthetic UI Theme Designer Sandbox
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-amber-200 px-1.5 py-0.5 bg-amber-50 text-amber-600 font-extrabold uppercase rounded-sm">
                          Theme Sandbox
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono font-black text-gray-400 block uppercase font-sans">Visual settings layout:</span>
                          <div className="space-y-2 text-[10px] font-mono font-bold">
                            <div className="flex items-center justify-between">
                              <span>Brand Accent:</span>
                              <div className="flex gap-1.5">
                                {['#FFB703', '#4F46E5', '#F43F5E', '#10B981', '#1A1A1A'].map(color => (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      const updated = { ...theme, accentColor: color };
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, theme: updated }) });
                                    }}
                                    className="w-4 h-4 rounded-full border border-black cursor-pointer"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Brutalist Shadows:</span>
                              <select
                                value={theme.shadowSize}
                                onChange={(e) => {
                                  const updated = { ...theme, shadowSize: e.target.value };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, theme: updated }) });
                                }}
                                className="border border-black bg-white text-[9px] p-0.5 cursor-pointer text-xs"
                              >
                                <option value="none">No Shadow</option>
                                <option value="neo-shadow-sm">Small Offsets</option>
                                <option value="neo-shadow">Solid Heavy</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-50 p-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-gray-400 block uppercase mb-1 font-sans">Live preview block:</span>
                            <div 
                              className={`p-3 bg-white border-2 border-black transition-all ${theme.shadowSize}`}
                              style={{ borderLeftColor: theme.accentColor, borderLeftWidth: '6px' }}
                            >
                              <h4 className="font-sans font-bold text-xs text-slate-800">Preview Heading</h4>
                              <p className="text-[10px] font-mono text-gray-500 mt-1">Brutalist block aesthetics loaded.</p>
                            </div>
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono text-right mt-2">Pairings: Space Grotesk / JetBrains</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* GIT-LIKE REVISION LEDGER */}
              {el.type === 'revision_ledger' && (
                (() => {
                  const ledger = propertiesObj.ledger || {
                    revisions: [
                      { hash: 'a12bc8f', time: '13:10', msg: 'Init product release canvas', author: 'techedge' },
                      { hash: 'b98dcf1', time: '13:15', msg: 'Seeded core database table references', author: 'techedge' }
                    ]
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <History className="w-4 h-4 text-purple-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Git-Like Local Revision Ledger
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-purple-200 px-1.5 py-0.5 bg-purple-50 text-purple-600 font-extrabold uppercase rounded-sm">
                          Revision Control
                        </span>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[9px] font-mono font-black text-gray-400 block uppercase font-sans">Workspace Version timeline:</span>
                        <div className="space-y-1.5 font-mono text-[9px] max-h-36 overflow-y-auto">
                          {ledger.revisions.map((rev: any) => (
                            <div key={rev.hash} className="border border-black bg-slate-50 p-2 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded border border-indigo-200 text-[8px] font-extrabold uppercase font-mono">{rev.hash}</span>
                                <span className="font-bold text-slate-800">&quot;{rev.msg}&quot;</span>
                              </div>
                              <div className="text-[8px] text-gray-400 flex items-center gap-1">
                                <span>by @{rev.author}</span>
                                <span>• {rev.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const msg = prompt("Enter version commit message:") || '';
                              if (msg) {
                                const hash = Math.random().toString(16).substring(2, 9);
                                const time = new Date().toTimeString().split(' ')[0].substring(0, 5);
                                const nRev = { hash, time, msg, author: 'techedge' };
                                const updated = { ...ledger, revisions: [...ledger.revisions, nRev] };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, ledger: updated }) });
                              }
                            }}
                            className="px-2 py-1 border-2 border-black bg-[#FFB703] text-[10px] font-black uppercase hover:bg-amber-400 cursor-pointer font-sans"
                          >
                            + COMMIT NEW LOCAL REVISION SNAPSHOT
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* BENTO GRID DASHBOARD ARRANGER */}
              {el.type === 'bento_composer' && (
                (() => {
                  const bento = propertiesObj.bento || {
                    widgets: [
                      { id: 'w1', title: 'METRIC_MONITOR', xSpan: 'sm:col-span-8', color: 'bg-[#E0F2FE]' },
                      { id: 'w2', title: 'SYSTEM_STATUS', xSpan: 'sm:col-span-4', color: 'bg-[#DCFCE7]' },
                      { id: 'w3', title: 'AST_CLOCK', xSpan: 'sm:col-span-4', color: 'bg-[#FEE2E2]' },
                      { id: 'w4', title: 'SYNC_RESOURCES', xSpan: 'sm:col-span-8', color: 'bg-[#FEF9C3]' }
                    ]
                  };
                  const widgets = bento.widgets;

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Layout className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 font-sans">
                            Bento Grid Responsive layout Composer
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm font-sans">
                          Layout Matrix
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          {widgets.map((widget: any) => (
                            <div key={widget.id} className={`${widget.xSpan} ${widget.color} border-2 border-black p-3 flex flex-col justify-between min-h-[60px]`}>
                              <div className="flex items-center justify-between border-b border-black/10 pb-1">
                                <span className="font-mono text-[9px] font-black text-slate-700">{widget.title}</span>
                                <div className="flex gap-1 text-[8px] font-bold">
                                  <button
                                    onClick={() => {
                                      const nextSpan = widget.xSpan === 'sm:col-span-4' ? 'sm:col-span-8' : 'sm:col-span-4';
                                      const nextWidgets = widgets.map((w: any) => w.id === widget.id ? { ...w, xSpan: nextSpan } : w);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, bento: { widgets: nextWidgets } }) });
                                    }}
                                    className="px-1 border border-black bg-white cursor-pointer"
                                  >
                                    Resize
                                  </button>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono text-slate-500 mt-2 block">WIDTH: {widget.xSpan === 'sm:col-span-4' ? '33%' : '66%'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CONTEXTUAL AI PROMPT GROUNDING */}
              {el.type === 'ai_grounding_workspace' && (
                (() => {
                  const state = propertiesObj.promptGrounding || {
                    selectedBlockIds: []
                  };
                  const selectedIds = state.selectedBlockIds;

                  const selectedBlocks = elements.filter(item => selectedIds.includes(item.id));
                  const compilePrompt = () => {
                    let prompt = `You are a helpful AI coding assistant grounded with Zenith Canvas workspace data:\n\n`;
                    selectedBlocks.forEach(b => {
                      prompt += `[BLOCK TYPE: ${b.type.toUpperCase()}]\n${b.content}\n\n`;
                    });
                    prompt += `Query: Summarize or compile the above elements.`;
                    return prompt;
                  };

                  const totalGroundedTokens = selectedBlocks.reduce((acc, curr) => acc + curr.content.split(' ').length, 0) * 1.3;

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-[#FAF5FF] rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Contextual AI Prompt Grounding & Token Math
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-purple-200 px-1.5 py-0.5 bg-purple-50 text-purple-600 font-extrabold uppercase rounded-sm">
                          Grounding Sandbox
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono font-black text-gray-400 block uppercase">Select Block Context elements:</span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {elements.filter(b => b.id !== el.id).map(b => {
                              const isChecked = selectedIds.includes(b.id);
                              return (
                                <label key={b.id} className="flex items-center space-x-2 p-1.5 bg-white border border-black/10 text-[9px] font-mono cursor-pointer hover:bg-slate-50">
                                  <input 
                                    type="checkbox" checked={isChecked}
                                    onChange={(e) => {
                                      const nextIds = e.target.checked 
                                        ? [...selectedIds, b.id] 
                                        : selectedIds.filter((id: string) => id !== b.id);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, promptGrounding: { selectedBlockIds: nextIds } }) });
                                    }}
                                    className="accent-purple-600 cursor-pointer"
                                  />
                                  <span className="font-black text-purple-700">[{b.type.toUpperCase()}]</span>
                                  <span className="truncate text-slate-600 max-w-[120px]">{b.content || 'Empty block'}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-purple-300 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Grounded Context Prompt:</span>
                            <div className="h-28 overflow-y-auto font-mono text-slate-200 border border-slate-800 p-1 bg-black/40">
                              {compilePrompt()}
                            </div>
                          </div>
                          <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[8px] text-slate-500 font-black mt-2">
                            <span>TOKEN MATH: ~{Math.round(totalGroundedTokens)} TOKENS</span>
                            <span>MODEL: GEMINI-3.5-FLASH</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* UML CLASS DIAGRAM STUDIO */}
              {el.type === 'uml_studio' && (
                (() => {
                  const state = propertiesObj.uml || {
                    classes: [
                      { id: 'c1', name: 'User', fields: ['id: string', 'email: string'], methods: ['save()', 'getProfile()'] },
                      { id: 'c2', name: 'Order', fields: ['id: string', 'userId: string', 'total: number'], methods: ['checkout()'] }
                    ],
                    relations: [
                      { from: 'c2', to: 'c1', type: 'association', label: 'belongs to' }
                    ],
                    selectedClassId: 'c1'
                  };
                  const classes = state.classes;
                  const relations = state.relations;
                  const selectedId = state.selectedClassId || (classes[0]?.id || '');
                  const activeClass = classes.find((c: any) => c.id === selectedId);

                  const generateTSCode = () => {
                    let code = "";
                    classes.forEach((c: any) => {
                      code += `export class ${c.name} {\n`;
                      c.fields.forEach((f: string) => {
                        code += `  public ${f};\n`;
                      });
                      code += `\n`;
                      c.methods.forEach((m: string) => {
                        code += `  public ${m} {\n    // TODO: implement\n  }\n`;
                      });
                      code += `}\n\n`;
                    });
                    return code;
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Network className="w-4 h-4 text-indigo-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            UML Class Diagram Studio
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-indigo-200 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-extrabold uppercase rounded-sm">
                          Brutalist Object Mapper
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                            {classes.map((cls: any) => (
                              <div 
                                key={cls.id} 
                                onClick={() => {
                                  const updated = { ...state, selectedClassId: cls.id };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, uml: updated }) });
                                }}
                                className={`border-2 p-2.5 cursor-pointer relative ${
                                  selectedId === cls.id ? 'border-indigo-600 bg-indigo-50/40' : 'border-black bg-slate-50'
                                }`}
                              >
                                <div className="font-mono text-xs font-black uppercase text-indigo-700 flex justify-between items-center mb-1">
                                  <span>class {cls.name}</span>
                                  {selectedId === cls.id && <span className="text-[8px] bg-indigo-200 px-1 py-0.5 rounded border border-indigo-300">ACTIVE</span>}
                                </div>
                                <div className="space-y-0.5 font-mono text-[9px] text-slate-500 border-t border-dashed border-black/10 pt-1">
                                  <div className="font-bold text-gray-400 uppercase text-[8px]">Fields:</div>
                                  {cls.fields.map((f: string, idx: number) => <div key={idx}>+ {f}</div>)}
                                </div>
                                <div className="space-y-0.5 font-mono text-[9px] text-slate-500 border-t border-dashed border-black/10 pt-1 mt-1">
                                  <div className="font-bold text-gray-400 uppercase text-[8px]">Methods:</div>
                                  {cls.methods.map((m: string, idx: number) => <div key={idx}>+ {m}</div>)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-1.5 text-[9px] font-bold">
                            <button
                              onClick={() => {
                                const cName = prompt("Enter Class Name:") || "";
                                if (cName) {
                                  const nCls = { id: `c-${Date.now()}`, name: cName, fields: ['id: string'], methods: ['save()'] };
                                  const updated = { ...state, classes: [...classes, nCls], selectedClassId: nCls.id };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, uml: updated }) });
                                }
                              }}
                              className="px-2 py-1 border border-black bg-white hover:bg-slate-50 uppercase cursor-pointer"
                            >
                              + New Class
                            </button>
                            <button
                              onClick={() => {
                                const from = prompt(`Enter relationship 'from' class name (e.g. Order):`) || "";
                                const to = prompt(`Enter relationship 'to' class name (e.g. User):`) || "";
                                if (from && to) {
                                  const cFrom = classes.find((c: any) => c.name.toLowerCase() === from.toLowerCase());
                                  const cTo = classes.find((c: any) => c.name.toLowerCase() === to.toLowerCase());
                                  if (cFrom && cTo) {
                                    const nRel = { from: cFrom.id, to: cTo.id, type: 'association', label: 'depends on' };
                                    const updated = { ...state, relations: [...relations, nRel] };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, uml: updated }) });
                                  } else {
                                    alert("One of the class names was not found.");
                                  }
                                }
                              }}
                              className="px-2 py-1 border border-black bg-white hover:bg-slate-50 uppercase cursor-pointer"
                            >
                              + Draw Relation
                            </button>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-indigo-300 p-3 font-mono text-[9px] flex flex-col justify-between">
                          {activeClass ? (
                            <div className="space-y-2">
                              <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Class Inspector: {activeClass.name}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    const field = prompt("Enter Field (name: type):") || "";
                                    if (field) {
                                      const updatedClasses = classes.map((c: any) => c.id === selectedId ? { ...c, fields: [...c.fields, field] } : c);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, uml: { ...state, classes: updatedClasses } }) });
                                    }
                                  }}
                                  className="p-1 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white cursor-pointer uppercase text-[8px]"
                                >
                                  + Field
                                </button>
                                <button
                                  onClick={() => {
                                    const method = prompt("Enter Method (e.g. update()):") || "";
                                    if (method) {
                                      const updatedClasses = classes.map((c: any) => c.id === selectedId ? { ...c, methods: [...c.methods, method] } : c);
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, uml: { ...state, classes: updatedClasses } }) });
                                    }
                                  }}
                                  className="p-1 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white cursor-pointer uppercase text-[8px]"
                                >
                                  + Method
                                </button>
                                <button
                                  onClick={() => {
                                    const updatedClasses = classes.filter((c: any) => c.id !== selectedId);
                                    const updated = { ...state, classes: updatedClasses, selectedClassId: "" };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, uml: updated }) });
                                  }}
                                  className="p-1 border border-rose-900 bg-rose-950/40 text-rose-300 hover:bg-rose-950 cursor-pointer uppercase text-[8px]"
                                >
                                  Delete
                                </button>
                              </div>

                              <div className="border border-slate-800 p-1 bg-black/40 text-slate-300 max-h-24 overflow-y-auto leading-tight mt-2 select-all">
                                <pre className="text-[8px] text-[#A5D6A7]">
                                  {`export interface I${activeClass.name} {\n` + 
                                    activeClass.fields.map((f: string) => `  ${f};`).join('\n') + '\n}'
                                  }
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Select a class node to inspect and compile specifications.</span>
                          )}

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-2">
                            <span>LANGUAGE: TS_ES6</span>
                            <span>RELATIONS: {relations.length} LINKS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CRON JOB SCHEDULER CONFIGURATOR */}
              {el.type === 'cron_scheduler' && (
                (() => {
                  const state = propertiesObj.cron || {
                    expression: '*/5 * * * *',
                    logs: [
                      '[13:40:01] CRON TRIGGERED - task "db_backup" completed in 42ms',
                      '[13:35:01] CRON TRIGGERED - task "db_backup" completed in 51ms'
                    ]
                  };

                  const getNextExecutions = (expr: string) => {
                    const parts = expr.split(' ');
                    if (parts.length < 5) return ['Invalid cron expression'];
                    const dates = [];
                    const now = new Date();
                    let minStep = 5;
                    if (parts[0] && parts[0].includes('*/')) {
                      minStep = parseInt(parts[0].replace('*/', '')) || 5;
                    }
                    for (let i = 1; i <= 5; i++) {
                      const d = new Date(now.getTime() + i * minStep * 60000);
                      dates.push(d.toLocaleTimeString());
                    }
                    return dates;
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-[#FAFDFB] rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Cron Job Scheduler Configurator
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Time Forecast Engine
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">Expression Setting:</label>
                            <input 
                              type="text"
                              value={state.expression}
                              onChange={(e) => {
                                const updated = { ...state, expression: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cron: updated }) });
                              }}
                              className="w-full text-xs font-mono font-bold border-2 border-black p-2 bg-white"
                              placeholder="e.g. */15 * * * *"
                            />
                          </div>

                          <div className="flex flex-wrap gap-1 text-[8px] font-black uppercase font-sans">
                            <button
                              onClick={() => {
                                const updated = { ...state, expression: '*/5 * * * *' };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cron: updated }) });
                              }}
                              className="px-1.5 py-1 border border-black bg-white hover:bg-slate-50 cursor-pointer"
                            >
                              5 Minutes
                            </button>
                            <button
                              onClick={() => {
                                const updated = { ...state, expression: '0 * * * *' };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cron: updated }) });
                              }}
                              className="px-1.5 py-1 border border-black bg-white hover:bg-slate-50 cursor-pointer"
                            >
                              Hourly
                            </button>
                            <button
                              onClick={() => {
                                const updated = { ...state, expression: '0 0 * * *' };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cron: updated }) });
                              }}
                              className="px-1.5 py-1 border border-black bg-white hover:bg-slate-50 cursor-pointer"
                            >
                              Daily
                            </button>
                          </div>

                          <div className="border border-black bg-slate-50 p-2 text-[9px] font-mono">
                            <span className="text-gray-400 font-bold block uppercase mb-1">Predictive Execution Timeline:</span>
                            <div className="space-y-0.5">
                              {getNextExecutions(state.expression).map((time, idx) => (
                                <div key={idx} className="flex justify-between border-b border-black/5 pb-0.5">
                                  <span className="text-slate-600">Trigger Sequence {idx+1}:</span>
                                  <span className="text-emerald-600 font-extrabold">{time}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-emerald-400 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Event Logs Console:</span>
                            <div className="h-24 overflow-y-auto font-mono text-slate-200 border border-slate-800 p-1 bg-black/40 space-y-1">
                              {state.logs.map((log: string, lIdx: number) => (
                                <div key={lIdx} className="text-[8px] tracking-tight text-emerald-300 truncate font-mono">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const stamp = new Date().toLocaleTimeString();
                              const nLog = `[${stamp}] CRON TRIGGERED - task "db_backup" completed in ${Math.round(20 + Math.random() * 50)}ms`;
                              const updated = { ...state, logs: [nLog, ...state.logs.slice(0, 9)] };
                              updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cron: updated }) });
                            }}
                            className="w-full text-center border-2 border-black bg-emerald-500 text-[#1A1A1A] font-black uppercase text-[9px] py-1 hover:bg-emerald-400 mt-2 cursor-pointer font-sans"
                          >
                            TRIGGER SCHEDULE NOW
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* DATABASE MIGRATION CLI SIMULATOR */}
              {el.type === 'db_migrator' && (
                (() => {
                  const state = propertiesObj.migrator || {
                    migrations: [
                      { id: 'm1', name: 'create_users_table', status: 'APPLIED', ddl: 'CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL\n);' },
                      { id: 'm2', name: 'add_user_roles', status: 'PENDING', ddl: 'ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT \'user\';' }
                    ]
                  };
                  const migrations = state.migrations;

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <ArrowUpRight className="w-4 h-4 text-orange-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Database Migration CLI Simulator
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-orange-200 px-1.5 py-0.5 bg-orange-50 text-orange-600 font-extrabold uppercase rounded-sm">
                          Schema Rollback Ledger
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono font-black text-gray-400 block uppercase">Migration Delta History:</span>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {migrations.map((m: any) => (
                              <div key={m.id} className="border border-black bg-slate-50 p-2 flex items-center justify-between text-[10px] font-mono">
                                <div>
                                  <div className="font-extrabold text-slate-800">{m.name}.sql</div>
                                  <pre className="text-[7px] text-slate-400 truncate max-w-[150px] leading-tight font-mono mt-0.5">{m.ddl}</pre>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${
                                  m.status === 'APPLIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                                }`}>
                                  {m.status}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => {
                              const mName = prompt("Enter Migration Name:") || "";
                              if (mName) {
                                const ddl = `ALTER TABLE users ADD COLUMN ${mName.toLowerCase()} VARCHAR(255);`;
                                const nMig = { id: `m-${Date.now()}`, name: mName.toLowerCase(), status: 'PENDING', ddl };
                                const updated = { ...state, migrations: [...migrations, nMig] };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, migrator: updated }) });
                              }
                            }}
                            className="px-2 py-1 text-[9px] font-black border border-black bg-white hover:bg-slate-50 uppercase cursor-pointer"
                          >
                            + Draft migration sql
                          </button>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-amber-400 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">CLI Console:</span>
                            <div className="h-24 overflow-y-auto font-mono text-slate-200 border border-slate-800 p-1 bg-black/40 space-y-0.5">
                              <div>$ zenith-db migrate status</div>
                              <div className="text-slate-400">Database schema: Postgres 16.2</div>
                              <div className="text-slate-400">Applied count: {migrations.filter((m: any) => m.status === 'APPLIED').length}/{migrations.length}</div>
                              <div className="text-[#A5D6A7] animate-pulse">[READY] Idle waiting for transaction instruction...</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 font-sans mt-3">
                            <button
                              onClick={() => {
                                const nextMigs = migrations.map((m: any) => ({ ...m, status: 'APPLIED' }));
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, migrator: { migrations: nextMigs } }) });
                              }}
                              className="py-1 text-center border border-black bg-orange-500 text-white font-extrabold uppercase text-[8px] hover:bg-orange-400 cursor-pointer"
                            >
                              MIGRATE UP (ALL)
                            </button>
                            <button
                              onClick={() => {
                                const nextMigs = migrations.map((m: any, idx: number) => idx === 0 ? m : { ...m, status: 'PENDING' });
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, migrator: { migrations: nextMigs } }) });
                              }}
                              className="py-1 text-center border border-slate-700 bg-slate-800 text-slate-300 font-extrabold uppercase text-[8px] hover:bg-slate-700 cursor-pointer"
                            >
                              ROLLBACK LAST
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* API REQUEST & PAYLOAD BUILDER */}
              {el.type === 'api_request_builder' && (
                (() => {
                  const state = propertiesObj.api || {
                    method: 'POST',
                    url: 'https://api.zenithcanvas.io/v1/sync',
                    headers: [
                      { key: 'Content-Type', value: 'application/json' },
                      { key: 'Authorization', value: 'Bearer z_88192a' }
                    ],
                    body: '{\n  "checksum": "ZN-A28B10FF",\n  "status": "synchronized"\n}',
                    response: null
                  };

                  const codeSnippet = `${state.method === 'GET' ? `fetch('${state.url}')` : `fetch('${state.url}', {\n  method: '${state.method}',\n  headers: {\n${state.headers.map((h: any) => `    '${h.key}': '${h.value}'`).join(',\n')}\n  },\n  body: JSON.stringify(${state.body.replace(/\n/g, '\n  ')})\n})`}\n.then(res => res.json())\n.then(console.log);`;

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-[#FBFBFC] rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-sky-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            API Request & Payload Builder
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-sky-200 px-1.5 py-0.5 bg-sky-50 text-sky-600 font-extrabold uppercase rounded-sm">
                          HTTP Tunnel Agent
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            <select
                              value={state.method}
                              onChange={(e) => {
                                const updated = { ...state, method: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, api: updated }) });
                              }}
                              className="border-2 border-black font-mono text-xs font-bold px-1 py-1.5 bg-white cursor-pointer"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                              <option value="PUT">PUT</option>
                            </select>
                            <input 
                              type="text"
                              value={state.url}
                              onChange={(e) => {
                                const updated = { ...state, url: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, api: updated }) });
                              }}
                              className="border-2 border-black font-mono text-xs p-1.5 flex-1"
                            />
                          </div>

                          <div>
                            <span className="text-[8px] font-bold text-gray-400 block uppercase font-mono mb-1">Payload Body (JSON):</span>
                            <textarea
                              value={state.body}
                              onChange={(e) => {
                                const updated = { ...state, body: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, api: updated }) });
                              }}
                              rows={4}
                              className="w-full border border-black p-2 bg-white font-mono text-[9px] resize-none"
                            />
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-[#E5E7EB] p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Response JSON Payload:</span>
                            <div className="h-28 overflow-y-auto font-mono text-cyan-300 border border-slate-800 p-1 bg-black/40">
                              {state.response ? (
                                <pre className="leading-tight text-[8px]">{state.response}</pre>
                              ) : (
                                <span className="text-slate-500 italic font-normal">Click Send to compile and simulate HTTP transaction tunnel.</span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2.5 mt-2.5 font-sans">
                            <button
                              onClick={() => {
                                const mockResponse = {
                                  status: 200,
                                  ok: true,
                                  headers: { "x-transaction-id": `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}` },
                                  data: {
                                    id: "node_usr_9921",
                                    synchronized: true,
                                    records: 4,
                                    latencyMs: Math.round(15 + Math.random() * 30),
                                    timestamp: new Date().toISOString()
                                  }
                                };
                                const updated = { ...state, response: JSON.stringify(mockResponse, null, 2) };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, api: updated }) });
                              }}
                              className="px-3 py-1.5 border border-black bg-emerald-500 text-[#1A1A1A] font-black uppercase text-[8px] hover:bg-emerald-400 cursor-pointer"
                            >
                              SEND TUNNEL API CALL
                            </button>
                            <button
                              onClick={() => {
                                alert(codeSnippet);
                              }}
                              className="px-2 py-1.5 border border-slate-700 bg-slate-800 text-slate-300 font-extrabold uppercase text-[8px] hover:bg-slate-700 cursor-pointer"
                            >
                              BUILD SNIPPET
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* REGEX VISUAL TESTER & DEBUGGER */}
              {el.type === 'regex_tester' && (
                (() => {
                  const state = propertiesObj.regex || {
                    pattern: '^([a-zA-Z0-9._%-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,6})$',
                    flags: 'g',
                    testString: 'welcome@zenithcanvas.io, support@google.com, invalid-email'
                  };

                  let matches: any[] = [];
                  let hasError = false;
                  try {
                    const rx = new RegExp(state.pattern, state.flags);
                    const allMatches = state.testString.matchAll(rx);
                    matches = Array.from(allMatches).map((m: any) => ({
                      full: m[0],
                      groups: m.slice(1),
                      index: m.index
                    }));
                  } catch {
                    hasError = true;
                  }

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Binary className="w-4 h-4 text-violet-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            RegEx Visual Tester & Debugger
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-violet-200 px-1.5 py-0.5 bg-violet-50 text-violet-600 font-extrabold uppercase rounded-sm">
                          Pattern Engine
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">RegEx Pattern String:</label>
                            <div className="flex border-2 border-black">
                              <span className="bg-slate-100 px-2 flex items-center border-r border-black font-mono font-bold text-gray-400">/</span>
                              <input 
                                type="text"
                                value={state.pattern}
                                onChange={(e) => {
                                  const updated = { ...state, pattern: e.target.value };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, regex: updated }) });
                                }}
                                className="p-2 font-mono text-xs font-bold bg-white flex-1 outline-none"
                              />
                              <span className="bg-slate-100 px-2 flex items-center border-l border-black font-mono font-bold text-gray-400">/</span>
                              <input 
                                type="text"
                                value={state.flags}
                                onChange={(e) => {
                                  const updated = { ...state, flags: e.target.value };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, regex: updated }) });
                                }}
                                className="p-2 font-mono text-xs font-bold bg-white w-8 text-center outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-mono font-black text-gray-400 block uppercase mb-1">Sample Test String:</label>
                            <textarea
                              value={state.testString}
                              onChange={(e) => {
                                const updated = { ...state, testString: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, regex: updated }) });
                              }}
                              rows={3}
                              className="w-full border-2 border-black p-2 bg-white font-mono text-[10px] resize-none outline-none"
                            />
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-50 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Capture Group Array:</span>
                            {hasError ? (
                              <div className="text-rose-600 font-extrabold border border-rose-200 bg-rose-50 p-2">[ERROR] Compiling regular expression pattern failed. Check flags.</div>
                            ) : matches.length > 0 ? (
                              <div className="space-y-1 max-h-36 overflow-y-auto">
                                {matches.map((m, mIdx) => (
                                  <div key={mIdx} className="border border-black bg-white p-2 text-[9px]">
                                    <div className="flex justify-between font-black border-b border-black/5 pb-1">
                                      <span className="text-indigo-600">Match {mIdx + 1}: &quot;{m.full}&quot;</span>
                                      <span className="text-gray-400 text-[8px]">Index {m.index}</span>
                                    </div>
                                    <div className="mt-1 space-y-0.5 text-slate-500 pl-1 border-l border-slate-200">
                                      {m.groups.map((g: string, gIdx: number) => (
                                        <div key={gIdx}>Group {gIdx + 1}: &quot;{g}&quot;</div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-400 italic">No matches mapped against the test string.</div>
                            )}
                          </div>

                          <div className="border-t border-black/10 pt-2 flex items-center justify-between text-[8px] text-slate-500 font-black mt-2 font-mono">
                            <span>STATE: {hasError ? 'ERROR' : matches.length > 0 ? 'MATCH FOUND' : 'NO MATCH'}</span>
                            <span>TOTAL: {matches.length} MATCHES</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* KANBAN SPRINT LANE ORCHESTRATOR */}
              {el.type === 'kanban_orchestrator' && (
                (() => {
                  const state = propertiesObj.kanban || {
                    columns: ['Backlog', 'In Progress', 'QA / Review', 'Done'],
                    tasks: [
                      { id: 't1', title: 'Implement Dexie local syncing', column: 'In Progress', weight: 5 },
                      { id: 't2', title: 'Acoustic waveform node support', column: 'Done', weight: 3 },
                      { id: 't3', title: 'UML diagram studio export', column: 'Backlog', weight: 8 }
                    ]
                  };
                  const columns = state.columns;
                  const tasks = state.tasks;

                  const getColumnWeight = (col: string) => {
                    return tasks.filter((t: any) => t.column === col).reduce((acc: number, curr: any) => acc + (parseInt(curr.weight) || 0), 0);
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Trello className="w-4 h-4 text-[#FFB703]" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Kanban Sprint Lane Orchestrator
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-amber-200 px-1.5 py-0.5 bg-amber-50 text-amber-600 font-extrabold uppercase rounded-sm">
                          Agile Core Matrix
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {columns.map((col: string) => {
                          const colTasks = tasks.filter((t: any) => t.column === col);
                          const totalW = getColumnWeight(col);
                          return (
                            <div key={col} className="border-2 border-black bg-slate-50 p-2 min-h-44 flex flex-col justify-between">
                              <div>
                                <div className="border-b border-black pb-1.5 mb-2 flex justify-between items-center text-[10px] font-mono font-black uppercase text-slate-800">
                                  <span>{col}</span>
                                  <span className="bg-slate-200 px-1 rounded border border-slate-300 text-[8px]">{colTasks.length}</span>
                                </div>
                                <div className="space-y-1.5">
                                  {colTasks.map((t: any) => (
                                    <div key={t.id} className="bg-white border border-black p-1.5 shadow-none text-[9px] font-mono space-y-1">
                                      <div className="font-extrabold text-gray-700 leading-tight">{t.title}</div>
                                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-black/10">
                                        <span className="text-slate-400 font-bold">Est: {t.weight}h</span>
                                        <div className="flex gap-1">
                                          <button 
                                            onClick={() => {
                                              const currentIdx = columns.indexOf(col);
                                              if (currentIdx > 0) {
                                                const nextCol = columns[currentIdx - 1];
                                                const updatedTasks = tasks.map((tk: any) => tk.id === t.id ? { ...tk, column: nextCol } : tk);
                                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, kanban: { ...state, tasks: updatedTasks } }) });
                                              }
                                            }}
                                            className="px-0.5 border border-black hover:bg-slate-100 text-[7px] cursor-pointer"
                                          >
                                            &lt;
                                          </button>
                                          <button 
                                            onClick={() => {
                                              const currentIdx = columns.indexOf(col);
                                              if (currentIdx < columns.length - 1) {
                                                const nextCol = columns[currentIdx + 1];
                                                const updatedTasks = tasks.map((tk: any) => tk.id === t.id ? { ...tk, column: nextCol } : tk);
                                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, kanban: { ...state, tasks: updatedTasks } }) });
                                              }
                                            }}
                                            className="px-0.5 border border-black hover:bg-slate-100 text-[7px] cursor-pointer"
                                          >
                                            &gt;
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <span className="text-[8px] font-mono text-slate-400 border-t border-dashed border-black/10 pt-1.5 mt-2 block">
                                SUM WEIGHT: {totalW}h
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const title = prompt("Enter Sprint Task Title:") || "";
                            const weight = parseInt(prompt("Enter estimation hours:") || "3") || 3;
                            if (title) {
                              const nTask = { id: `t-${Date.now()}`, title, column: 'Backlog', weight };
                              const updated = { ...state, tasks: [...tasks, nTask] };
                              updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, kanban: updated }) });
                            }
                          }}
                          className="px-2.5 py-1 border-2 border-black bg-[#FFB703] text-black font-black uppercase text-[10px] hover:bg-amber-400 cursor-pointer"
                        >
                          + CREATE SPRINT TASK CARD
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* BILINEAR CHART & MATH MESH */}
              {el.type === 'math_mesh' && (
                (() => {
                  const state = propertiesObj.mathMesh || {
                    amplitude: 8,
                    frequency: 2,
                    meshType: 'sine_wave'
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Waves className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Bilinear Chart & Math Mesh
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Bilinear Trigonometric Generator
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-3 font-mono text-[10px] font-bold">
                          <div>
                            <span className="text-[8px] font-black text-gray-400 block uppercase mb-1">Wave Amplitude:</span>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="range" min="1" max="25" step="1"
                                value={state.amplitude} 
                                onChange={(e) => {
                                  const updated = { ...state, amplitude: parseInt(e.target.value) };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, mathMesh: updated }) });
                                }}
                                className="flex-1 accent-emerald-600 cursor-pointer"
                              />
                              <span className="text-[10px] font-black">{state.amplitude}px</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[8px] font-black text-gray-400 block uppercase mb-1">Mesh Frequency:</span>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="range" min="1" max="10" step="1"
                                value={state.frequency} 
                                onChange={(e) => {
                                  const updated = { ...state, frequency: parseInt(e.target.value) };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, mathMesh: updated }) });
                                }}
                                className="flex-1 accent-emerald-600 cursor-pointer"
                              />
                              <span className="text-[10px] font-black">{state.frequency}λ</span>
                            </div>
                          </div>

                          <div className="border-t border-dashed border-black/10 pt-2 text-[8px] text-gray-400">
                            TRIGONOMETRY: <br/>
                            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-bold border border-black/5 select-all">
                              {`Z = ${state.amplitude} * sin(X * ${state.frequency})`}
                            </code>
                          </div>
                        </div>

                        <div className="sm:col-span-2 relative">
                          <div className="border-2 border-black bg-slate-900 rounded-none h-36 relative overflow-hidden flex items-center justify-center">
                            <svg className="w-full h-full stroke-emerald-500 fill-none opacity-80" viewBox="0 0 300 120">
                              <g stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1">
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <line key={`v-${i}`} x1={i * 25} y1={0} x2={i * 25} y2={120} />
                                ))}
                                {Array.from({ length: 6 }).map((_, i) => (
                                  <line key={`h-${i}`} x1={0} y1={i * 20} x2={300} y2={i * 20} />
                                ))}
                              </g>
                              
                              <path 
                                d={(() => {
                                  let d = 'M 0 60';
                                  for (let x = 0; x <= 300; x += 3) {
                                    const y = 60 + state.amplitude * Math.sin((x / 300) * state.frequency * Math.PI * 2);
                                    d += ` L ${x} ${y}`;
                                  }
                                  return d;
                                })()}
                                strokeWidth="2.5"
                                stroke="#10B981"
                              />
                            </svg>
                            <span className="absolute bottom-2 right-2 text-[7px] font-mono text-emerald-500 bg-slate-950 px-1 border border-emerald-800/50">
                              ENGINE: MATRIX_TRIGONOMETRIC_COORD
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* JSON/YAML/CSV FORMAT CONVERTER */}
              {el.type === 'format_converter' && (
                (() => {
                  const state = propertiesObj.converter || {
                    inputData: '{\n  "project": "Zenith Canvas",\n  "version": 1.4,\n  "meta": {\n    "tags": ["brutalist", "productivity"]\n  }\n}',
                    targetFormat: 'yaml'
                  };

                  let output = "";
                  let errStr = "";
                  try {
                    const parsed = JSON.parse(state.inputData);
                    if (state.targetFormat === 'yaml') {
                      const toYAML = (obj: any, indent = 0): string => {
                        let str = '';
                        const spaces = ' '.repeat(indent);
                        for (const key in obj) {
                          if (typeof obj[key] === 'object' && obj[key] !== null) {
                            if (Array.isArray(obj[key])) {
                              str += `${spaces}${key}:\n`;
                              obj[key].forEach((item: any) => {
                                if (typeof item === 'object') {
                                  str += `${spaces}  - \n${toYAML(item, indent + 4)}`;
                                } else {
                                  str += `${spaces}  - ${item}\n`;
                                }
                              });
                            } else {
                              str += `${spaces}${key}:\n${toYAML(obj[key], indent + 2)}`;
                            }
                          } else {
                            str += `${spaces}${key}: ${obj[key]}\n`;
                          }
                        }
                        return str;
                      };
                      output = toYAML(parsed);
                    } else if (state.targetFormat === 'csv') {
                      const keys = Object.keys(parsed);
                      output = keys.join(',') + '\n' + keys.map(k => typeof parsed[k] === 'object' ? JSON.stringify(parsed[k]).replace(/"/g, '""') : parsed[k]).join(',');
                    } else {
                      output = JSON.stringify(parsed, null, 2);
                    }
                  } catch (e: any) {
                    errStr = e.message;
                  }

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Shuffle className="w-4 h-4 text-violet-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            JSON/YAML/CSV Format Converter
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-violet-200 px-1.5 py-0.5 bg-violet-50 text-violet-600 font-extrabold uppercase rounded-sm">
                          Codec Parser
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-[8px] font-bold text-gray-400 block uppercase font-mono">Source Payload (JSON Only):</span>
                          <textarea
                            value={state.inputData}
                            onChange={(e) => {
                              const updated = { ...state, inputData: e.target.value };
                              updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, converter: updated }) });
                            }}
                            rows={5}
                            className="w-full border-2 border-black p-2 bg-white font-mono text-[9px] resize-none outline-none"
                          />
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-cyan-400 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-2">
                              <span className="text-[8px] font-bold text-slate-500 uppercase">Compiled Specification output:</span>
                              <div className="flex gap-1">
                                {['yaml', 'csv', 'json'].map(format => (
                                  <button
                                    key={format}
                                    onClick={() => {
                                      const updated = { ...state, targetFormat: format };
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, converter: updated }) });
                                    }}
                                    className={`px-1 rounded border uppercase text-[7px] font-bold cursor-pointer ${
                                      state.targetFormat === format ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}
                                  >
                                    {format}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div className="h-28 overflow-y-auto font-mono text-[#A5D6A7] border border-slate-800 p-1 bg-black/40">
                              {errStr ? (
                                <span className="text-rose-400 font-extrabold">[JSON_PARSING_EXCEPTION] {errStr}</span>
                              ) : (
                                <pre className="leading-tight text-[8px] select-all">{output}</pre>
                              )}
                            </div>
                          </div>

                          <span className="text-[7px] text-slate-500 text-right font-black border-t border-slate-800 pt-1.5 mt-2 block">
                            CONVERSION MODE: UTF8_DUMP
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* AST SOURCE CODE DIFF VISUALIZER */}
              {el.type === 'ast_diff_viewer' && (
                (() => {
                  const state = propertiesObj.diffViewer || {
                    original: 'const server = "active";\nconst port = 3000;\nconsole.log(server);',
                    modified: 'const server = "active";\nconst port = 3000;\nconst isSecure = true;\nconsole.log(server);'
                  };

                  const origLines = state.original.split('\n');
                  const modLines = state.modified.split('\n');

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <GitPullRequest className="w-4 h-4 text-rose-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            AST Source Code Diff Visualizer
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-rose-200 px-1.5 py-0.5 bg-rose-50 text-rose-600 font-extrabold uppercase rounded-sm">
                          Delta Change Compiler
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div>
                            <span className="text-[8px] font-bold text-gray-400 block uppercase font-mono mb-1">Original Draft Segment:</span>
                            <textarea
                              value={state.original}
                              onChange={(e) => {
                                const updated = { ...state, original: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, diffViewer: updated }) });
                              }}
                              rows={3}
                              className="w-full border border-black p-1 bg-slate-50 font-mono text-[9px] resize-none outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-gray-400 block uppercase font-mono mb-1">Modified Draft Segment:</span>
                            <textarea
                              value={state.modified}
                              onChange={(e) => {
                                const updated = { ...state, modified: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, diffViewer: updated }) });
                              }}
                              rows={3}
                              className="w-full border border-black p-1 bg-slate-50 font-mono text-[9px] resize-none outline-none"
                            />
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-white p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Compiled Code Diff:</span>
                            <div className="h-32 overflow-y-auto font-mono text-[8px] leading-tight space-y-0.5 border border-slate-800 p-1 bg-black/40">
                              {modLines.map((line: string, idx: number) => {
                                const isAdded = !origLines.includes(line);
                                return (
                                  <div 
                                    key={idx} 
                                    className={`py-0.5 px-1 font-mono truncate ${
                                      isAdded ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500' : 'text-slate-400'
                                    }`}
                                  >
                                    {isAdded ? `+ ` : `  `} {line}
                                  </div>
                                );
                              })}
                              {origLines.map((line: string, idx: number) => {
                                if (!modLines.includes(line)) {
                                  return (
                                    <div key={`del-${idx}`} className="py-0.5 px-1 bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 truncate font-mono">
                                      -  {line}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-2">
                            <span>DIFF ENGINE: HYBRID_LINE_DIFF</span>
                            <span>STATUS: DIFFERENCES IDENTIFIED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* STATE MACHINE & DFA DESIGNER */}
              {el.type === 'state_machine_designer' && (
                (() => {
                  const state = propertiesObj.fsm || {
                    states: ['IDLE', 'FETCHING', 'SUCCESS', 'ERROR'],
                    transitions: [
                      { event: 'FETCH', from: 'IDLE', to: 'FETCHING' },
                      { event: 'SUCCESS_ACK', from: 'FETCHING', to: 'SUCCESS' },
                      { event: 'ERROR_ACK', from: 'FETCHING', to: 'ERROR' },
                      { event: 'RESET', from: 'ERROR', to: 'IDLE' }
                    ],
                    currentState: 'IDLE'
                  };
                  const fsmStates = state.states;
                  const transitions = state.transitions;
                  const current = state.currentState;

                  const availableTransitions = transitions.filter((t: any) => t.from === current);

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Workflow className="w-4 h-4 text-indigo-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            State Machine & DFA Designer
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-indigo-200 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-extrabold uppercase rounded-sm">
                          Deterministic Finite Automata
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <div>
                            <span className="text-[8px] font-bold text-gray-400 block uppercase mb-1">State Nodes Mapping:</span>
                            <div className="flex flex-wrap gap-1">
                              {fsmStates.map((node: string) => (
                                <span 
                                  key={node}
                                  className={`px-2 py-1 rounded-none border-2 font-black tracking-tight ${
                                    current === node ? 'bg-indigo-600 text-white border-black' : 'bg-slate-50 text-slate-700 border-black/10'
                                  }`}
                                >
                                  {node}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="border border-black bg-slate-50 p-2 text-[9px]">
                            <span className="text-slate-500 font-bold block uppercase mb-1">Dynamic State Transition Actions:</span>
                            {availableTransitions.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {availableTransitions.map((t: any, tIdx: number) => (
                                  <button
                                    key={tIdx}
                                    onClick={() => {
                                      const updated = { ...state, currentState: t.to };
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, fsm: updated }) });
                                    }}
                                    className="px-2 py-1 border border-black bg-white hover:bg-slate-100 font-black uppercase cursor-pointer"
                                  >
                                    🚀 {t.event} (→ {t.to})
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Terminal state reached with no outbound transitions.</span>
                                <button
                                  onClick={() => {
                                    const updated = { ...state, currentState: 'IDLE' };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, fsm: updated }) });
                                  }}
                                  className="px-1.5 py-0.5 border border-black bg-white font-bold uppercase text-[8px] cursor-pointer"
                                >
                                  Hard Reset
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-indigo-300 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">JSON Transition Matrix:</span>
                            <div className="h-28 overflow-y-auto border border-slate-800 p-1 bg-black/40">
                              <pre className="text-slate-400 leading-tight text-[8px] select-all">
                                {JSON.stringify(transitions, null, 2)}
                              </pre>
                            </div>
                          </div>

                          <div className="flex gap-1.5 mt-2.5 font-sans">
                            <button
                              onClick={() => {
                                const stateName = prompt("Enter new State Name (e.g. TIMEOUT):") || "";
                                if (stateName) {
                                  const updatedStates = [...fsmStates, stateName.toUpperCase()];
                                  const updated = { ...state, states: updatedStates };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, fsm: updated }) });
                                }
                              }}
                              className="px-2 py-1 border border-slate-700 bg-slate-800 text-slate-300 font-extrabold uppercase text-[8px] hover:bg-slate-700 cursor-pointer"
                            >
                              + ADD STATE
                            </button>
                            <button
                              onClick={() => {
                                const from = prompt("Enter from state (e.g. IDLE):") || "";
                                const to = prompt("Enter to state (e.g. FETCHING):") || "";
                                const event = prompt("Enter event action tag (e.g. START):") || "";
                                if (from && to && event) {
                                  const nextTr = { event: event.toUpperCase(), from: from.toUpperCase(), to: to.toUpperCase() };
                                  const updated = { ...state, transitions: [...transitions, nextTr] };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, fsm: updated }) });
                                }
                              }}
                              className="px-2 py-1 border-2 border-black bg-[#FFB703] text-black font-extrabold uppercase text-[8px] hover:bg-amber-400 cursor-pointer"
                            >
                              + ADD TRANSITION
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* TCP PACKET ANALYZER SIMULATOR */}
              {el.type === 'packet_analyzer' && (
                (() => {
                  const state = propertiesObj.packetAnalyzer || {
                    handshakeState: 'CLOSED',
                    sourcePort: 52410,
                    destPort: 443,
                    packets: [
                      { time: '13:50:00', src: 'CLIENT', dest: 'SERVER', seq: 100, ack: 0, flags: 'SYN', desc: 'Client requests initial connection sync' }
                    ]
                  };

                  const packets = state.packets;
                  const hState = state.handshakeState;

                  const nextHandshakeStep = () => {
                    const stamp = new Date().toLocaleTimeString();
                    let nextState = hState;
                    let newPacket: any = null;

                    if (hState === 'CLOSED') {
                      nextState = 'SYN_SENT';
                      newPacket = {
                        time: stamp,
                        src: 'CLIENT',
                        dest: 'SERVER',
                        seq: 101,
                        ack: 0,
                        flags: 'SYN',
                        desc: 'Active open initiated; connection synchronization requested'
                      };
                    } else if (hState === 'SYN_SENT') {
                      nextState = 'SYN_RECEIVED';
                      newPacket = {
                        time: stamp,
                        src: 'SERVER',
                        dest: 'CLIENT',
                        seq: 800,
                        ack: 102,
                        flags: 'SYN-ACK',
                        desc: 'Server acknowledges client sync, sends back its own sync sequence'
                      };
                    } else if (hState === 'SYN_RECEIVED') {
                      nextState = 'ESTABLISHED';
                      newPacket = {
                        time: stamp,
                        src: 'CLIENT',
                        dest: 'SERVER',
                        seq: 102,
                        ack: 801,
                        flags: 'ACK',
                        desc: 'Three-way handshake completed; high-performance data pipe established'
                      };
                    } else {
                      // reset
                      nextState = 'CLOSED';
                      newPacket = {
                        time: stamp,
                        src: 'SYSTEM',
                        dest: 'SYSTEM',
                        seq: 0,
                        ack: 0,
                        flags: 'RST',
                        desc: 'Handshake teardown; socket connection recycled'
                      };
                    }

                    const updated = {
                      ...state,
                      handshakeState: nextState,
                      packets: [...packets, newPacket].slice(-8)
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, packetAnalyzer: updated }) });
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-[#D90429]" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            TCP Packet Analyzer & Handshake Simulator
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-rose-200 px-1.5 py-0.5 bg-rose-50 text-[#D90429] font-extrabold uppercase rounded-sm">
                          TCP/IP Socket Spec
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-3">
                          <div className="flex gap-2 font-mono text-[9px]">
                            <div className="flex-1">
                              <span className="text-gray-400 font-bold block uppercase mb-1">Source Port:</span>
                              <input 
                                type="number" 
                                value={state.sourcePort}
                                onChange={(e) => {
                                  const updated = { ...state, sourcePort: parseInt(e.target.value) || 52410 };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, packetAnalyzer: updated }) });
                                }}
                                className="w-full border-2 border-black p-1 bg-slate-50 outline-none"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-gray-400 font-bold block uppercase mb-1">Destination Port:</span>
                              <input 
                                type="number" 
                                value={state.destPort}
                                onChange={(e) => {
                                  const updated = { ...state, destPort: parseInt(e.target.value) || 443 };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, packetAnalyzer: updated }) });
                                }}
                                className="w-full border-2 border-black p-1 bg-slate-50 outline-none"
                              />
                            </div>
                          </div>

                          <div className="border-2 border-black p-2 bg-slate-50 space-y-1 max-h-40 overflow-y-auto">
                            <span className="text-[8px] font-mono font-black text-gray-400 uppercase block">Transaction Frame Logs:</span>
                            {packets.map((pkt: any, idx: number) => (
                              <div key={idx} className="border-b border-black/5 pb-1 last:border-0 font-mono text-[8px] flex items-start gap-1">
                                <span className="text-[#D90429] font-bold">[{pkt.time}]</span>
                                <div className="flex-1">
                                  <span className="font-extrabold text-slate-800">
                                    {pkt.src}:{state.sourcePort} → {pkt.dest}:{state.destPort} [{pkt.flags}]
                                  </span>
                                  <div className="text-slate-500">{pkt.desc} (Seq: {pkt.seq}, Ack: {pkt.ack})</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-slate-100 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Socket State Machine:</span>
                            <div className="text-center py-2.5 bg-black/40 border border-slate-800">
                              <span className={`text-[11px] font-black uppercase px-2 py-1 rounded-sm border ${
                                hState === 'ESTABLISHED' ? 'bg-emerald-950 text-emerald-400 border-emerald-500' :
                                hState === 'CLOSED' ? 'bg-slate-950 text-slate-400 border-slate-700' :
                                'bg-amber-950 text-amber-400 border-amber-500 animate-pulse'
                              }`}>
                                {hState}
                              </span>
                            </div>
                            <div className="text-[8px] text-slate-400 space-y-0.5">
                              <div>FLAGS ACTIVE: SYN, ACK</div>
                              <div>BUFFER METRIC: 64KB WINDOW</div>
                            </div>
                          </div>

                          <button
                            onClick={nextHandshakeStep}
                            className="w-full text-center border-2 border-black bg-[#D90429] text-white font-black uppercase text-[8px] py-1.5 hover:bg-rose-600 mt-2 cursor-pointer font-sans"
                          >
                            {hState === 'ESTABLISHED' ? 'DISCONNECT SOCKET (RST)' : 'STEP HANDSHAKE'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* SQL EXPLAIN COST OPTIMIZER */}
              {el.type === 'sql_optimizer' && (
                (() => {
                  const state = propertiesObj.sqlOptimizer || {
                    query: 'SELECT * FROM orders JOIN users ON orders.user_id = users.id WHERE orders.amount > 100;',
                    joinStrategy: 'HASH JOIN',
                    scanMethod: 'SEQ SCAN',
                    indexRecommended: true,
                    indexApplied: false
                  };

                  const computeCost = () => {
                    let cost = 184.2;
                    if (state.joinStrategy === 'NESTED LOOP') cost += 120.0;
                    if (state.joinStrategy === 'MERGE JOIN') cost -= 40.0;
                    if (state.scanMethod === 'INDEX SCAN' || state.indexApplied) cost -= 135.0;
                    return Math.max(8.5, parseFloat(cost.toFixed(1)));
                  };

                  const currentCost = computeCost();

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-[#FDFEFA] rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-amber-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            SQL Explain Cost Optimizer
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-amber-200 px-1.5 py-0.5 bg-amber-50 text-amber-600 font-extrabold uppercase rounded-sm">
                          Query Execution Sandbox
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-[8px] font-bold text-gray-400 block uppercase font-mono mb-1">SQL Raw Command:</span>
                            <textarea
                              value={state.query}
                              onChange={(e) => {
                                const updated = { ...state, query: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sqlOptimizer: updated }) });
                              }}
                              rows={3}
                              className="w-full border-2 border-black p-2 bg-white font-mono text-[9px] resize-none outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Join Strategy:</span>
                              <select
                                value={state.joinStrategy}
                                onChange={(e) => {
                                  const updated = { ...state, joinStrategy: e.target.value };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sqlOptimizer: updated }) });
                                }}
                                className="w-full border border-black p-1 bg-white cursor-pointer"
                              >
                                <option value="HASH JOIN">HASH JOIN</option>
                                <option value="NESTED LOOP">NESTED LOOP</option>
                                <option value="MERGE JOIN">MERGE JOIN</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Table Access:</span>
                              <select
                                value={state.scanMethod}
                                onChange={(e) => {
                                  const updated = { ...state, scanMethod: e.target.value };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sqlOptimizer: updated }) });
                                }}
                                className="w-full border border-black p-1 bg-white cursor-pointer"
                              >
                                <option value="SEQ SCAN">SEQ SCAN (SLOW)</option>
                                <option value="INDEX SCAN">INDEX SCAN (FAST)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-[#FCE8B2] p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Query Execution Optimizer Plan:</span>
                            <div className="border border-slate-800 p-2 bg-black/40 space-y-1.5 leading-tight text-[8px]">
                              <div className="text-amber-400">-{state.joinStrategy} (Cost={currentCost})</div>
                              <div className="text-slate-400 pl-3">{"->"} Hash Cond: (orders.user_id = users.id)</div>
                              <div className="pl-6 text-slate-300">
                                {"->"} {state.scanMethod === 'INDEX SCAN' || state.indexApplied ? 'Index Scan using idx_orders_user_id' : 'Seq Scan on orders (unindexed)'}
                              </div>
                            </div>

                            <div className="flex justify-between items-center bg-black/20 p-1.5 border border-slate-800">
                              <span className="text-slate-400 font-bold">TOTAL EXPLAIN PLAN COST:</span>
                              <span className={`text-[11px] font-black ${currentCost < 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {currentCost} scores
                              </span>
                            </div>
                          </div>

                          <div className="pt-2">
                            {state.indexRecommended && !state.indexApplied ? (
                              <button
                                onClick={() => {
                                  const updated = { ...state, indexApplied: true, scanMethod: 'INDEX SCAN' };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, sqlOptimizer: updated }) });
                                }}
                                className="w-full text-center border border-black bg-amber-500 text-black font-black uppercase text-[8px] py-1 hover:bg-amber-400 cursor-pointer"
                              >
                                ⚡ APPLY INDEX SUGGESTION (idx_orders_user_id)
                              </button>
                            ) : (
                              <div className="text-emerald-400 text-center font-bold text-[8px]">
                                ✓ INDEX OPTIMIZED & ACTIVE (idx_orders_user_id)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* COLOR CONTRAST PALETTE AUDITOR */}
              {el.type === 'color_auditor' && (
                (() => {
                  const state = propertiesObj.colorAuditor || {
                    foreground: '#1A1A1A',
                    background: '#F0F3FF'
                  };

                  const parseHex = (hex: string) => {
                    const clean = hex.replace('#', '');
                    const r = parseInt(clean.substring(0, 2), 16) || 0;
                    const g = parseInt(clean.substring(2, 4), 16) || 0;
                    const b = parseInt(clean.substring(4, 6), 16) || 0;
                    return { r, g, b };
                  };

                  const getLuminance = (hex: string) => {
                    const { r, g, b } = parseHex(hex);
                    const a = [r, g, b].map(v => {
                      v /= 255;
                      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                    });
                    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                  };

                  const getContrastRatio = (f: string, b: string) => {
                    const l1 = getLuminance(f);
                    const l2 = getLuminance(b);
                    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
                  };

                  const contrast = parseFloat(getContrastRatio(state.foreground, state.background).toFixed(2));
                  const passAA_Normal = contrast >= 4.5;
                  const passAAA_Normal = contrast >= 7.0;
                  const passAA_Large = contrast >= 3.0;

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-violet-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Color Contrast Palette Auditor
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-violet-200 px-1.5 py-0.5 bg-violet-50 text-violet-600 font-extrabold uppercase rounded-sm">
                          WCAG Accessibility Checker
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Foreground Color:</span>
                              <div className="flex border border-black">
                                <input 
                                  type="color" 
                                  value={state.foreground}
                                  onChange={(e) => {
                                    const updated = { ...state, foreground: e.target.value };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, colorAuditor: updated }) });
                                  }}
                                  className="w-8 h-8 p-0 cursor-pointer border-r border-black"
                                />
                                <input 
                                  type="text" 
                                  value={state.foreground}
                                  onChange={(e) => {
                                    const updated = { ...state, foreground: e.target.value };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, colorAuditor: updated }) });
                                  }}
                                  className="p-1 font-bold bg-white text-xs text-center outline-none flex-1"
                                />
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Background Color:</span>
                              <div className="flex border border-black">
                                <input 
                                  type="color" 
                                  value={state.background}
                                  onChange={(e) => {
                                    const updated = { ...state, background: e.target.value };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, colorAuditor: updated }) });
                                  }}
                                  className="w-8 h-8 p-0 cursor-pointer border-r border-black"
                                />
                                <input 
                                  type="text" 
                                  value={state.background}
                                  onChange={(e) => {
                                    const updated = { ...state, background: e.target.value };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, colorAuditor: updated }) });
                                  }}
                                  className="p-1 font-bold bg-white text-xs text-center outline-none flex-1"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 font-sans font-bold">
                            <span className="text-[8px] text-gray-400 uppercase flex items-center">Presets:</span>
                            <button
                              onClick={() => {
                                const updated = { foreground: '#FFB703', background: '#023047' };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, colorAuditor: updated }) });
                              }}
                              className="px-1.5 py-0.5 border border-black bg-slate-100 hover:bg-slate-200 uppercase text-[8px] cursor-pointer"
                            >
                              Brutalist Navy
                            </button>
                            <button
                              onClick={() => {
                                const updated = { foreground: '#00F5D4', background: '#111111' };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, colorAuditor: updated }) });
                              }}
                              className="px-1.5 py-0.5 border border-black bg-slate-100 hover:bg-slate-200 uppercase text-[8px] cursor-pointer"
                            >
                              Cyberpunk Mint
                            </button>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-50 p-3 flex flex-col justify-between font-mono text-[9px]">
                          <div className="space-y-2">
                            <div 
                              style={{ color: state.foreground, backgroundColor: state.background }} 
                              className="border-2 border-black p-3 text-center h-16 flex flex-col justify-center font-bold"
                            >
                              <span>Contrast Preview Card</span>
                              <span className="text-[8px] opacity-75">Small reference segment.</span>
                            </div>

                            <div className="flex items-center justify-between border-b border-black/5 pb-1 font-bold">
                              <span>Contrast Ratio:</span>
                              <span className="text-[12px] font-black text-indigo-600">{contrast} : 1</span>
                            </div>

                            <div className="grid grid-cols-3 gap-1 text-[8px] text-center font-bold font-sans">
                              <div className={`p-1 border ${passAA_Normal ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                AA Normal {passAA_Normal ? 'PASS' : 'FAIL'}
                              </div>
                              <div className={`p-1 border ${passAAA_Normal ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                AAA Normal {passAAA_Normal ? 'PASS' : 'FAIL'}
                              </div>
                              <div className={`p-1 border ${passAA_Large ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                AA Large {passAA_Large ? 'PASS' : 'FAIL'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* JWT TOKEN CLAIMS DECODER */}
              {el.type === 'jwt_inspector' && (
                (() => {
                  const state = propertiesObj.jwt || {
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                    secret: 'zenith-secret'
                  };

                  const splitToken = (t: string) => {
                    const parts = t.split('.');
                    let header = '{"alg": "HS256", "typ": "JWT"}';
                    let payload = '{"sub": "1234567890", "name": "John Doe", "role": "admin"}';
                    try {
                      if (parts[0]) header = atob(parts[0]);
                      if (parts[1]) payload = atob(parts[1]);
                    } catch {}
                    return { header, payload, sig: parts[2] || 'SflKxwRJS...' };
                  };

                  const parsed = splitToken(state.token);

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            JWT Token Claims Decoder
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          JSON Cryptographer
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Raw JWT Token:</span>
                            <textarea
                              value={state.token}
                              onChange={(e) => {
                                const updated = { ...state, token: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, jwt: updated }) });
                              }}
                              rows={3}
                              className="w-full border-2 border-black p-2 bg-white text-[8px] leading-tight resize-none outline-none break-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[8px]">
                            <div className="border border-rose-200 bg-rose-50/50 p-2 text-rose-800 rounded">
                              <span className="font-extrabold block mb-0.5">HEADER (ALGORITHM):</span>
                              <pre className="font-mono leading-tight">{parsed.header}</pre>
                            </div>
                            <div className="border border-[#3A0CA3]/20 bg-[#3A0CA3]/5 p-2 text-indigo-800 rounded">
                              <span className="font-extrabold block mb-0.5">PAYLOAD (CLAIMS):</span>
                              <pre className="font-mono leading-tight">{parsed.payload}</pre>
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-emerald-400 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">JWT verification status:</span>
                            <div className="border border-slate-800 p-1.5 bg-black/40 text-slate-300 leading-tight space-y-1">
                              <div className="flex justify-between border-b border-slate-800 pb-1 text-[8px]">
                                <span>SIGNATURE VALIDITY:</span>
                                <span className="text-emerald-400 font-bold">VERIFIED</span>
                              </div>
                              <div className="text-[8px] text-slate-400">
                                Claims sub is parsed to: <span className="text-cyan-300">{JSON.parse(parsed.payload).sub || 'unknown'}</span>
                              </div>
                              <div className="text-[8px] text-slate-400">
                                Active Role privilege: <span className="text-amber-300">{JSON.parse(parsed.payload).role || 'user'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3 font-sans">
                            <button
                              onClick={() => {
                                const sub = prompt("Enter Claims Subject ID (sub):") || "1234567890";
                                const role = prompt("Enter Role privilege (role):") || "admin";
                                const headStr = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
                                const payStr = btoa(JSON.stringify({ sub, role, iat: 1516239022 }));
                                const simToken = `${headStr}.${payStr}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
                                const updated = { ...state, token: simToken };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, jwt: updated }) });
                              }}
                              className="px-3 py-1 text-center border-2 border-black bg-emerald-500 text-[#1A1A1A] font-black uppercase text-[8px] hover:bg-emerald-400 cursor-pointer flex-1"
                            >
                              RE-SIGN WITH NEW PAYLOAD
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* GIT BRANCH & REBASE SIMULATOR */}
              {el.type === 'git_simulator' && (
                (() => {
                  const state = propertiesObj.git || {
                    currentBranch: 'main',
                    commits: [
                      { id: 'c1', branch: 'main', msg: 'initial commit', hash: 'a1b2c3d' },
                      { id: 'c2', branch: 'main', msg: 'draft specs', hash: 'f4e5d6c' },
                      { id: 'c3', branch: 'feature', msg: 'implement database engine', hash: '88a1b22' }
                    ]
                  };

                  const commits = state.commits;
                  const curB = state.currentBranch;

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <GitCommit className="w-4 h-4 text-indigo-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Git Branch & Rebase Simulator
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-indigo-200 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-extrabold uppercase rounded-sm">
                          Version Ledger Node Graph
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <div>
                            <span className="text-[8px] font-bold text-gray-400 block uppercase mb-1">Interactive Commit Chain:</span>
                            <div className="border border-black p-2.5 bg-slate-50 min-h-36 space-y-2 relative max-h-44 overflow-y-auto">
                              {commits.map((c: any, idx: number) => (
                                <div key={c.id} className="flex items-center space-x-2 relative z-10 pl-4 border-l-2 border-indigo-500">
                                  <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white" />
                                  <span className="text-[8px] bg-slate-200 border border-slate-300 px-1 font-black text-gray-600 rounded">
                                    {c.hash}
                                  </span>
                                  <div className="text-[9px]">
                                    <span className={`font-black text-[8px] uppercase border px-1 mr-1 ${
                                      c.branch === 'main' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-[#FFB703]/10 border-[#FFB703]/20 text-[#FFB703]'
                                    }`}>
                                      {c.branch}
                                    </span>
                                    <span className="text-slate-600">{c.msg}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-1.5 text-[8px] font-bold">
                            <button
                              onClick={() => {
                                const msg = prompt("Enter Commit Message:") || "minor edits";
                                const hash = Math.random().toString(36).substring(2, 9);
                                const nC = { id: `c-${Date.now()}`, branch: curB, msg, hash };
                                const updated = { ...state, commits: [...commits, nC] };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, git: updated }) });
                              }}
                              className="px-2 py-1 border border-black bg-white hover:bg-slate-50 uppercase cursor-pointer"
                            >
                              + git commit
                            </button>
                            <button
                              onClick={() => {
                                const b = curB === 'main' ? 'feature' : 'main';
                                const updated = { ...state, currentBranch: b };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, git: updated }) });
                              }}
                              className="px-2 py-1 border border-black bg-slate-100 hover:bg-slate-200 uppercase cursor-pointer"
                            >
                              git checkout {curB === 'main' ? 'feature' : 'main'}
                            </button>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-indigo-300 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Git Core Branch Specs:</span>
                            <div className="border border-slate-800 p-2 bg-black/40 text-slate-300 leading-tight space-y-1 text-[8px]">
                              <div>ACTIVE HEAD BRANCH: <span className="text-[#FFB703] font-bold">{curB.toUpperCase()}</span></div>
                              <div>TOTAL LEDGER COMMITS: {commits.length} SHA</div>
                              <div>CONFLICT RISK: LOW</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 font-sans mt-3">
                            <button
                              onClick={() => {
                                const mainCommits = commits.filter((c: any) => c.branch === 'main');
                                const featCommits = commits.filter((c: any) => c.branch === 'feature').map((c: any) => ({ ...c, branch: 'main' }));
                                const updated = { ...state, commits: [...mainCommits, ...featCommits], currentBranch: 'main' };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, git: updated }) });
                              }}
                              className="py-1 text-center border-2 border-black bg-[#FFB703] text-[#1A1A1A] font-extrabold uppercase text-[8px] hover:bg-amber-400 cursor-pointer"
                            >
                              GIT REBASE ON MAIN
                            </button>
                            <button
                              onClick={() => {
                                const updated = {
                                  currentBranch: 'main',
                                  commits: [
                                    { id: 'c1', branch: 'main', msg: 'initial commit', hash: 'a1b2c3d' },
                                    { id: 'c2', branch: 'main', msg: 'draft specs', hash: 'f4e5d6c' }
                                  ]
                                };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, git: updated }) });
                              }}
                              className="py-1 text-center border border-slate-700 bg-slate-800 text-slate-300 font-extrabold uppercase text-[8px] hover:bg-slate-700 cursor-pointer"
                            >
                              HARD RECYCLE GRAPH
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CRYPTO HASH & CIPHER LAB */}
              {el.type === 'crypto_lab' && (
                (() => {
                  const state = propertiesObj.cryptoLab || {
                    plaintext: 'Zenith Brutalist Workspace',
                    cipherType: 'ROT13',
                    rounds: 2,
                    salt: 'canvas-salt'
                  };

                  const executeCipher = () => {
                    const text = state.plaintext || '';
                    if (state.cipherType === 'ROT13') {
                      return text.replace(/[a-zA-Z]/g, (c: string) => 
                        String.fromCharCode(c.charCodeAt(0) + (c.toUpperCase() <= 'M' ? 13 : -13))
                      );
                    } else if (state.cipherType === 'BASE64') {
                      try {
                        return btoa(text);
                      } catch {
                        return 'Unencodable input characters';
                      }
                    } else {
                      // HEX conversion
                      return text.split('').map((c: string) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
                    }
                  };

                  const output = executeCipher();

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Fingerprint className="w-4 h-4 text-sky-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Crypto Hash & Cipher Lab
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-sky-200 px-1.5 py-0.5 bg-sky-50 text-sky-600 font-extrabold uppercase rounded-sm">
                          Client Encrypter
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Plaintext Segment:</span>
                            <input 
                              type="text" 
                              value={state.plaintext}
                              onChange={(e) => {
                                const updated = { ...state, plaintext: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cryptoLab: updated }) });
                              }}
                              className="w-full border-2 border-black p-2 bg-slate-50 text-xs font-bold outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[9px]">
                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Cipher Algorithm:</span>
                              <select
                                value={state.cipherType}
                                onChange={(e) => {
                                  const updated = { ...state, cipherType: e.target.value };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cryptoLab: updated }) });
                                }}
                                className="w-full border border-black p-1 bg-white cursor-pointer"
                              >
                                <option value="ROT13">ROT13 ROTATION</option>
                                <option value="BASE64">BASE64 ENCODE</option>
                                <option value="HEX">RAW HEX STREAM</option>
                              </select>
                            </div>
                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Salt Variable:</span>
                              <input 
                                type="text" 
                                value={state.salt}
                                onChange={(e) => {
                                  const updated = { ...state, salt: e.target.value };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cryptoLab: updated }) });
                                }}
                                className="w-full border border-black p-1 bg-white outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-sky-400 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Encrypted Cipher Stream:</span>
                            <div className="border border-slate-800 p-2 bg-black/40 text-sky-300 leading-tight text-[10px] break-all select-all font-mono min-h-16 flex items-center justify-center text-center">
                              {output}
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-2 font-mono">
                            <span>SPEED: ~3 MICROSECONDS</span>
                            <span>COMPLIANCE: FIPS 140-2</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* JSON SCHEMA DRAFT VALIDATOR */}
              {el.type === 'schema_validator' && (
                (() => {
                  const state = propertiesObj.schemaValidator || {
                    schema: '{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "number", "minimum": 18 }\n  },\n  "required": ["name", "age"]\n}',
                    payload: '{\n  "name": "Alex",\n  "age": 20\n}'
                  };

                  const validate = () => {
                    let scObj: any = null;
                    let plObj: any = null;
                    try {
                      scObj = JSON.parse(state.schema);
                      plObj = JSON.parse(state.payload);
                    } catch {
                      return [{ status: 'FAIL', text: 'Syntax parsing error in schema or payload JSON strings.' }];
                    }

                    const checks = [];
                    if (scObj.type === 'object') {
                      checks.push({ status: 'PASS', text: `Root layer is verified as a JSON Object.` });
                    } else {
                      checks.push({ status: 'FAIL', text: `Root layer must specify object layout.` });
                    }

                    if (scObj.required) {
                      scObj.required.forEach((reqKey: string) => {
                        if (plObj[reqKey] !== undefined) {
                          checks.push({ status: 'PASS', text: `Required key parameter "${reqKey}" is present.` });
                        } else {
                          checks.push({ status: 'FAIL', text: `Required parameter "${reqKey}" is missing from schema footprint.` });
                        }
                      });
                    }

                    if (scObj.properties) {
                      Object.keys(scObj.properties).forEach((key: string) => {
                        const val = plObj[key];
                        const propRule = scObj.properties[key];
                        if (val !== undefined) {
                          if (propRule.type === 'string' && typeof val === 'string') {
                            checks.push({ status: 'PASS', text: `Key "${key}" matches defined datatype: string.` });
                          } else if (propRule.type === 'number' && typeof val === 'number') {
                            checks.push({ status: 'PASS', text: `Key "${key}" matches defined datatype: number.` });
                            if (propRule.minimum !== undefined) {
                              if (val >= propRule.minimum) {
                                checks.push({ status: 'PASS', text: `Numeric boundary: value ${val} holds minimum requirement of ${propRule.minimum}.` });
                              } else {
                                checks.push({ status: 'FAIL', text: `Numeric boundary error: ${val} is less than target bounds parameter ${propRule.minimum}.` });
                              }
                            }
                          } else {
                            checks.push({ status: 'FAIL', text: `Key "${key}" mismatch. Expected datatype of "${propRule.type}", received "${typeof val}".` });
                          }
                        }
                      });
                    }

                    return checks;
                  };

                  const validations = validate();

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            JSON Schema Draft Validator
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          JSON Spec Engine
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[8px]">
                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Target JSON Schema:</span>
                            <textarea
                              value={state.schema}
                              onChange={(e) => {
                                const updated = { ...state, schema: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaValidator: updated }) });
                              }}
                              rows={4}
                              className="w-full border-2 border-black p-2 bg-slate-50 resize-none outline-none leading-tight"
                            />
                          </div>
                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Active Payload:</span>
                            <textarea
                              value={state.payload}
                              onChange={(e) => {
                                const updated = { ...state, payload: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaValidator: updated }) });
                              }}
                              rows={3}
                              className="w-full border-2 border-black p-2 bg-slate-50 resize-none outline-none leading-tight"
                            />
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-50 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1.5">Compliance Matrix Ledger:</span>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {validations.map((val, vIdx) => (
                                <div key={vIdx} className="border border-black bg-white p-2 text-[8px] leading-tight flex items-start gap-1.5">
                                  <span className={`px-1 rounded text-[7px] font-black ${
                                    val.status === 'PASS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                  }`}>
                                    {val.status}
                                  </span>
                                  <span className="text-slate-600">{val.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-black/10 pt-2 flex items-center justify-between text-[8px] text-slate-500 font-black mt-2 font-mono">
                            <span>TOTAL CHECKS: {validations.length}</span>
                            <span>COMPLIANCE: {validations.some(v => v.status === 'FAIL') ? 'NON-COMPLIANT' : 'FULLY COMPLIANT'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CSS GRID & FLEXBOX CANVAS */}
              {el.type === 'css_sandbox' && (
                (() => {
                  const state = propertiesObj.cssSandbox || {
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 4,
                    childCount: 3
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Grid className="w-4 h-4 text-orange-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            CSS Grid & Flexbox Canvas
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-orange-200 px-1.5 py-0.5 bg-orange-50 text-orange-600 font-extrabold uppercase rounded-sm">
                          Box Model Canvas
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Display Model:</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const updated = { ...state, display: 'flex' };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cssSandbox: updated }) });
                                }}
                                className={`px-2 py-1 flex-1 border font-bold uppercase ${state.display === 'flex' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'}`}
                              >
                                FLEX
                              </button>
                              <button
                                onClick={() => {
                                  const updated = { ...state, display: 'grid' };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cssSandbox: updated }) });
                                }}
                                className={`px-2 py-1 flex-1 border font-bold uppercase ${state.display === 'grid' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'}`}
                              >
                                GRID
                              </button>
                            </div>
                          </div>

                          {state.display === 'flex' && (
                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Flex Direction:</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    const updated = { ...state, flexDirection: 'row' };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cssSandbox: updated }) });
                                  }}
                                  className={`px-1.5 py-0.5 flex-1 border font-bold uppercase text-[8px] ${state.flexDirection === 'row' ? 'bg-orange-500 text-white border-black' : 'bg-white text-black border-black'}`}
                                >
                                  ROW
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = { ...state, flexDirection: 'column' };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cssSandbox: updated }) });
                                  }}
                                  className={`px-1.5 py-0.5 flex-1 border font-bold uppercase text-[8px] ${state.flexDirection === 'column' ? 'bg-orange-500 text-white border-black' : 'bg-white text-black border-black'}`}
                                >
                                  COLUMN
                                </button>
                              </div>
                            </div>
                          )}

                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Justify / Alignment:</span>
                            <select
                              value={state.justifyContent}
                              onChange={(e) => {
                                const updated = { ...state, justifyContent: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cssSandbox: updated }) });
                              }}
                              className="w-full border border-black p-1 bg-white cursor-pointer"
                            >
                              <option value="start">flex-start</option>
                              <option value="center">center</option>
                              <option value="end">flex-end</option>
                              <option value="between">space-between</option>
                            </select>
                          </div>

                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Gap Dimension: {state.gap}px</span>
                            <input 
                              type="range" 
                              min="2" 
                              max="16" 
                              step="2"
                              value={state.gap}
                              onChange={(e) => {
                                const updated = { ...state, gap: parseInt(e.target.value) };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cssSandbox: updated }) });
                              }}
                              className="w-full cursor-pointer h-1 bg-slate-200 rounded"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2 border-2 border-black bg-slate-50 p-3 min-h-44 flex flex-col justify-between">
                          <div 
                            style={{
                              display: state.display,
                              flexDirection: state.display === 'flex' ? state.flexDirection : undefined,
                              gridTemplateColumns: state.display === 'grid' ? 'repeat(auto-fit, minmax(60px, 1fr))' : undefined,
                              justifyContent: state.justifyContent === 'start' ? 'flex-start' : state.justifyContent === 'end' ? 'flex-end' : state.justifyContent === 'between' ? 'space-between' : 'center',
                              gap: `${state.gap}px`
                            }}
                            className="border border-dashed border-black/40 p-2.5 bg-white flex-1 flex"
                          >
                            {Array.from({ length: state.childCount }).map((_, idx) => (
                              <div key={idx} className="border-2 border-black bg-orange-100 text-orange-800 font-bold font-mono text-[10px] w-12 h-12 flex flex-col items-center justify-center rounded shadow-none">
                                <span>#{idx + 1}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-black/10 pt-2 font-mono text-[8px] flex justify-between items-center text-slate-500 mt-2">
                            <span>STYLE SPEC: display: {state.display}; gap: {state.gap}px;</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  const updated = { ...state, childCount: Math.max(1, state.childCount - 1) };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cssSandbox: updated }) });
                                }}
                                className="px-1.5 border border-black bg-white cursor-pointer hover:bg-slate-50 font-black"
                              >
                                -
                              </button>
                              <button
                                onClick={() => {
                                  const updated = { ...state, childCount: Math.min(6, state.childCount + 1) };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cssSandbox: updated }) });
                                }}
                                className="px-1.5 border border-black bg-white cursor-pointer hover:bg-slate-50 font-black"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* MARKDOWN AST LEXICAL COMPILER */}
              {el.type === 'markdown_tokenizer' && (
                (() => {
                  const state = propertiesObj.markdownTokenizer || {
                    markdown: '# Document Title\nThis is a beautiful core concept of brutalist programming.\n- Interactive State\n- Client-side execution'
                  };

                  const compileTokens = (md: string) => {
                    const lines = md.split('\n');
                    return lines.map((line, idx) => {
                      if (line.startsWith('# ')) {
                        return { type: 'HEADING_1', text: line.replace('# ', ''), raw: line, index: idx };
                      } else if (line.startsWith('## ')) {
                        return { type: 'HEADING_2', text: line.replace('## ', ''), raw: line, index: idx };
                      } else if (line.startsWith('- ') || line.startsWith('* ')) {
                        return { type: 'LIST_ITEM', text: line.substring(2), raw: line, index: idx };
                      } else if (line.trim() === '') {
                        return { type: 'BLANK', text: '', raw: line, index: idx };
                      } else {
                        return { type: 'PARAGRAPH', text: line, raw: line, index: idx };
                      }
                    });
                  };

                  const tokens = compileTokens(state.markdown);

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-[#3A0CA3]" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Markdown AST Lexical Compiler & Tokenizer
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-indigo-200 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-extrabold uppercase rounded-sm">
                          AST Tokenizer
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Raw Markdown Source:</span>
                            <textarea
                              value={state.markdown}
                              onChange={(e) => {
                                const updated = { ...state, markdown: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, markdownTokenizer: updated }) });
                              }}
                              rows={5}
                              className="w-full border-2 border-black p-2 bg-slate-50 resize-none outline-none leading-tight"
                            />
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-indigo-300 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">AST Node Tree Graph:</span>
                            <div className="h-32 overflow-y-auto space-y-1 font-mono border border-slate-800 p-1.5 bg-black/40">
                              {tokens.map((tok, tIdx) => (
                                <div key={tIdx} className="text-[8px] border-b border-slate-800 pb-1 last:border-0 flex justify-between items-center">
                                  <div className="truncate">
                                    <span className={`px-1 rounded text-[7px] font-black mr-1 border ${
                                      tok.type === 'HEADING_1' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                                      tok.type === 'LIST_ITEM' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                                      'bg-slate-950 text-slate-400 border-slate-800'
                                    }`}>
                                      {tok.type}
                                    </span>
                                    <span className="text-slate-300">{tok.text || '...'}</span>
                                  </div>
                                  <span className="text-slate-500 text-[7px]">Line {tok.index}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-2 font-mono">
                            <span>LEXER: TOK_STREAM</span>
                            <span>TOTAL: {tokens.length} NODES</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* SYSTEM ARCHITECTURE TOPOLOGY MAP */}
              {el.type === 'sys_topology' && (
                (() => {
                  const state = propertiesObj.topology || {
                    loadBalancer: true,
                    serverCluster: [
                      { id: 'srv1', active: true, load: 35 },
                      { id: 'srv2', active: true, load: 45 }
                    ],
                    databaseActive: true,
                    cacheActive: true,
                    throughputSlider: 70
                  };

                  const getClusterLoad = () => {
                    const activeServers = state.serverCluster.filter((s: any) => s.active);
                    if (activeServers.length === 0) return 0;
                    return Math.round((state.throughputSlider * 1.5) / activeServers.length);
                  };

                  const getSystemStatus = () => {
                    const activeServers = state.serverCluster.filter((s: any) => s.active);
                    if (!state.databaseActive) return { text: 'CRITICAL FAILURE', color: 'bg-rose-950 text-rose-400 border-rose-500' };
                    if (activeServers.length === 0) return { text: 'OUTAGE', color: 'bg-rose-950 text-rose-400 border-rose-500' };
                    if (getClusterLoad() > 85) return { text: 'OVERLOAD WARNING', color: 'bg-amber-950 text-amber-400 border-amber-500' };
                    return { text: 'NORMAL', color: 'bg-emerald-950 text-emerald-400 border-emerald-500' };
                  };

                  const currentStatus = getSystemStatus();

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            System Architecture Cluster Topology
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Dynamic Infrastructure Planner
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-3 font-mono text-[9px]">
                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Throughput Rate Load: {state.throughputSlider} requests/sec</span>
                            <input 
                              type="range" 
                              min="10" 
                              max="150" 
                              value={state.throughputSlider}
                              onChange={(e) => {
                                const updated = { ...state, throughputSlider: parseInt(e.target.value) };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, topology: updated }) });
                              }}
                              className="w-full cursor-pointer h-1 bg-slate-200 rounded"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center text-[8px] font-bold">
                            <div className="border border-black bg-slate-50 p-2 space-y-1.5">
                              <span className="text-gray-400 uppercase font-bold block">App Server Clusters:</span>
                              {state.serverCluster.map((srv: any, idx: number) => (
                                <div key={srv.id} className="flex justify-between items-center border border-black/10 bg-white p-1">
                                  <span>Cluster {idx + 1}</span>
                                  <button
                                    onClick={() => {
                                      const nextSrv = state.serverCluster.map((s: any) => s.id === srv.id ? { ...s, active: !s.active } : s);
                                      const updated = { ...state, serverCluster: nextSrv };
                                      updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, topology: updated }) });
                                    }}
                                    className={`px-1 border font-bold text-[7px] cursor-pointer ${srv.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                                  >
                                    {srv.active ? 'ONLINE' : 'OFFLINE'}
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="border border-black bg-slate-50 p-2 space-y-2">
                              <span className="text-gray-400 uppercase font-bold block">Peripheral Layer:</span>
                              <div className="flex justify-between items-center border border-black/10 bg-white p-1">
                                <span>Redis cache</span>
                                <button
                                  onClick={() => {
                                    const updated = { ...state, cacheActive: !state.cacheActive };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, topology: updated }) });
                                  }}
                                  className={`px-1 border font-bold text-[7px] cursor-pointer ${state.cacheActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                                >
                                  {state.cacheActive ? 'ONLINE' : 'OFFLINE'}
                                </button>
                              </div>
                              <div className="flex justify-between items-center border border-black/10 bg-white p-1">
                                <span>Postgres db</span>
                                <button
                                  onClick={() => {
                                    const updated = { ...state, databaseActive: !state.databaseActive };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, topology: updated }) });
                                  }}
                                  className={`px-1 border font-bold text-[7px] cursor-pointer ${state.databaseActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                                >
                                  {state.databaseActive ? 'ONLINE' : 'OFFLINE'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-slate-100 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Infrastructure Health:</span>
                            <div className="text-center py-2.5 bg-black/40 border border-slate-800">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${currentStatus.color}`}>
                                {currentStatus.text}
                              </span>
                            </div>
                            <div className="text-[8px] text-slate-400 space-y-0.5">
                              <div>COMPUTED CLUSTER LOAD: {getClusterLoad()}%</div>
                              <div>CACHE STATUS: {state.cacheActive ? 'HIT RATE 85%' : 'BYPASSING CACHE'}</div>
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-2 font-mono">
                            <span>AVAILABILITY: 99.99%</span>
                            <span>PING: 15ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* MULTI-VARIABLE FORMULA COMPILER */}
              {el.type === 'formula_compiler' && (
                (() => {
                  const state = propertiesObj.formulaCompiler || {
                    expression: 'X * 2 + Y * Y',
                    X: 5,
                    Y: 3
                  };

                  const evaluateFormula = (expr: string, xVal: number, yVal: number) => {
                    try {
                      const processed = expr
                        .replace(/\bX\b/g, xVal.toString())
                        .replace(/\bY\b/g, yVal.toString())
                        .replace(/\s+/g, '');

                      if (/[^-+*/\d().^]/.test(processed)) {
                        return { result: null, error: 'Illegal characters in expression.' };
                      }

                      let index = 0;
                      const peek = () => processed[index] || '';
                      const consume = () => processed[index++];

                      const parseNumber = (): number => {
                        let str = '';
                        if (peek() === '-') {
                          str += consume();
                        }
                        while (/[0-9.]/.test(peek())) {
                          str += consume();
                        }
                        if (!str) throw new Error('Expected number');
                        return parseFloat(str);
                      };

                      const parseFactor = (): number => {
                        if (peek() === '(') {
                          consume(); // '('
                          const val = parseExpression();
                          if (peek() === ')') consume(); // ')'
                          return val;
                        }
                        return parseNumber();
                      };

                      const parseExponent = (): number => {
                        let val = parseFactor();
                        while (peek() === '^') {
                          consume(); // '^'
                          const exp = parseFactor();
                          val = Math.pow(val, exp);
                        }
                        return val;
                      };

                      const parseTerm = (): number => {
                        let val = parseExponent();
                        while (peek() === '*' || peek() === '/') {
                          const op = consume();
                          const next = parseExponent();
                          if (op === '*') val *= next;
                          else {
                            if (next === 0) throw new Error('Division by zero');
                            val /= next;
                          }
                        }
                        return val;
                      };

                      const parseExpression = (): number => {
                        let val = parseTerm();
                        while (peek() === '+' || peek() === '-') {
                          const op = consume();
                          const next = parseTerm();
                          if (op === '+') val += next;
                          else val -= next;
                        }
                        return val;
                      };

                      const result = parseExpression();
                      if (index < processed.length) throw new Error('Extra characters');
                      return { result, error: null };
                    } catch (err: any) {
                      return { result: null, error: err.message || 'Evaluation Syntax Error' };
                    }
                  };

                  const currentEval = evaluateFormula(state.expression, state.X, state.Y);

                  const points = Array.from({ length: 11 }).map((_, idx) => {
                    const xTest = idx;
                    const evalTest = evaluateFormula(state.expression, xTest, state.Y);
                    return { x: xTest, y: evalTest.result !== null ? evalTest.result : 0 };
                  });

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calculator className="w-4 h-4 text-rose-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Multi-Variable Formula Compiler
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-rose-200 px-1.5 py-0.5 bg-rose-50 text-rose-600 font-extrabold uppercase rounded-sm">
                          Formula Core
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <div>
                            <span className="text-gray-400 font-bold block uppercase mb-1">Mathematical Formula (supports X & Y):</span>
                            <input
                              type="text"
                              value={state.expression}
                              onChange={(e) => {
                                const updated = { ...state, expression: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, formulaCompiler: updated }) });
                              }}
                              className="w-full border-2 border-black p-2 bg-slate-50 text-xs font-bold outline-none font-mono"
                              placeholder="e.g. X * 2 + Y * Y"
                            />
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Variable X Slider Value: {state.X}</span>
                              <input 
                                type="range" 
                                min="0" 
                                max="20" 
                                value={state.X}
                                onChange={(e) => {
                                  const updated = { ...state, X: parseInt(e.target.value) };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, formulaCompiler: updated }) });
                                }}
                                className="w-full cursor-pointer h-1 bg-slate-200 rounded"
                              />
                            </div>
                            <div>
                              <span className="text-gray-400 font-bold block uppercase mb-1">Variable Y Slider Value: {state.Y}</span>
                              <input 
                                type="range" 
                                min="0" 
                                max="20" 
                                value={state.Y}
                                onChange={(e) => {
                                  const updated = { ...state, Y: parseInt(e.target.value) };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, formulaCompiler: updated }) });
                                }}
                                className="w-full cursor-pointer h-1 bg-slate-200 rounded"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-950 text-slate-100 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Compiler Calculation Result:</span>
                            {currentEval.error ? (
                              <div className="text-rose-400 bg-rose-950/40 border border-rose-900 p-2 text-center font-bold">
                                {currentEval.error}
                              </div>
                            ) : (
                              <div className="text-emerald-400 bg-emerald-950/40 border border-emerald-900 p-2 text-center text-xs font-black">
                                EVAL: {currentEval.result}
                              </div>
                            )}

                            <span className="text-[8px] font-bold text-slate-500 uppercase block mt-2">X-Curve Evaluation Matrix (X: 0 to 10):</span>
                            <div className="flex items-end justify-between gap-1 h-14 bg-black/50 border border-slate-800 p-1">
                              {points.map((p, pIdx) => {
                                const maxVal = Math.max(...points.map(pt => pt.y), 1);
                                const heightPercent = Math.min(100, Math.max(10, (p.y / maxVal) * 100));
                                return (
                                  <div 
                                    key={pIdx} 
                                    style={{ height: `${heightPercent}%` }} 
                                    className="bg-rose-500 hover:bg-rose-400 transition-all flex-1"
                                    title={`X=${p.x}, Y=${p.y}`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          <div className="border-t border-slate-900 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-2 font-mono">
                            <span>PRECISION: DECIMAL64</span>
                            <span>STATUS: STABLE</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CROSS-NODE RELATIONAL LINKER */}
              {el.type === 'cross_node_linker' && (
                (() => {
                  const state = propertiesObj.crossNodeLinker || {
                    links: [
                      { id: 'l1', source: 'Auth Service', target: 'Audit Logs', event: 'user_login', throughput: 140 },
                      { id: 'l2', source: 'Checkout API', target: 'Payment Gateway', event: 'txn_initiated', throughput: 85 }
                    ],
                    newSource: '',
                    newTarget: '',
                    newEvent: '',
                    newThroughput: 50
                  };

                  const addLink = () => {
                    if (!state.newSource || !state.newTarget) return;
                    const newLink = {
                      id: 'l_' + Date.now(),
                      source: state.newSource,
                      target: state.newTarget,
                      event: state.newEvent || 'event_trigger',
                      throughput: state.newThroughput || 10
                    };
                    const updated = {
                      ...state,
                      links: [...state.links, newLink],
                      newSource: '',
                      newTarget: '',
                      newEvent: '',
                      newThroughput: 50
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, crossNodeLinker: updated }) });
                  };

                  const removeLink = (id: string) => {
                    const updated = {
                      ...state,
                      links: state.links.filter((l: any) => l.id !== id)
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, crossNodeLinker: updated }) });
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Share2 className="w-4 h-4 text-violet-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Cross-Node Relational Linker
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-violet-200 px-1.5 py-0.5 bg-violet-50 text-violet-600 font-extrabold uppercase rounded-sm">
                          Relational Map
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2 font-mono text-[9px] border-r-0 sm:border-r border-black/10 pr-0 sm:pr-3">
                          <span className="text-gray-400 font-black block uppercase mb-1">Configure New Node Link:</span>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={state.newSource}
                              onChange={(e) => {
                                const updated = { ...state, newSource: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, crossNodeLinker: updated }) });
                              }}
                              placeholder="Source Node (e.g. Auth Service)"
                              className="w-full border border-black p-1 bg-slate-50 outline-none text-[9px]"
                            />
                            <input
                              type="text"
                              value={state.newTarget}
                              onChange={(e) => {
                                const updated = { ...state, newTarget: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, crossNodeLinker: updated }) });
                              }}
                              placeholder="Target Node (e.g. Database)"
                              className="w-full border border-black p-1 bg-slate-50 outline-none text-[9px]"
                            />
                            <input
                              type="text"
                              value={state.newEvent}
                              onChange={(e) => {
                                const updated = { ...state, newEvent: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, crossNodeLinker: updated }) });
                              }}
                              placeholder="Trigger Event (e.g. user_logged_in)"
                              className="w-full border border-black p-1 bg-slate-50 outline-none text-[9px]"
                            />
                            <div>
                              <span className="text-gray-400 text-[8px] font-bold block uppercase mb-0.5">Throughput: {state.newThroughput} req/s</span>
                              <input 
                                type="range" 
                                min="10" 
                                max="500" 
                                value={state.newThroughput}
                                onChange={(e) => {
                                  const updated = { ...state, newThroughput: parseInt(e.target.value) };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, crossNodeLinker: updated }) });
                                }}
                                className="w-full cursor-pointer h-1 bg-slate-200 rounded"
                              />
                            </div>
                            <button
                              onClick={addLink}
                              className="w-full bg-violet-600 text-white border border-black font-bold py-1 cursor-pointer text-[9px] hover:bg-violet-700 uppercase"
                            >
                              Add Relation Link
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                          <span className="text-[8px] font-bold text-slate-400 font-mono uppercase block">Active Data Flow Graph Pipes:</span>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {state.links.map((link: any) => (
                              <div key={link.id} className="border border-black bg-slate-50 p-2 font-mono text-[8px] leading-tight flex items-center justify-between">
                                <div className="flex-1 truncate">
                                  <span className="text-violet-600 font-bold">{link.source}</span>
                                  <span className="text-slate-400 px-1">{"-->"}</span>
                                  <span className="text-indigo-600 font-bold">{link.target}</span>
                                  <div className="text-slate-500 text-[7px] mt-0.5 font-bold uppercase">
                                    EVENT: {link.event} | RATE: {link.throughput} reqs/sec
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeLink(link.id)}
                                  className="border border-rose-300 text-rose-500 bg-white px-1 py-0.5 hover:bg-rose-50 font-black cursor-pointer text-[8px]"
                                >
                                  DELETE
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* MULTI-COLUMN FILTER MATRIX */}
              {el.type === 'filter_matrix' && (
                (() => {
                  const state = propertiesObj.filterMatrix || {
                    rules: [
                      { id: 'r1', col: 'amount', op: 'gt', val: '100' }
                    ],
                    dataset: [
                      { name: 'Subscription Premium', amount: 150, status: 'ACTIVE', category: 'SaaS' },
                      { name: 'Hardware Repair', amount: 80, status: 'PENDING', category: 'Hardware' },
                      { name: 'Marketing Ads', amount: 450, status: 'ACTIVE', category: 'Growth' },
                      { name: 'Database Hosting', amount: 200, status: 'ACTIVE', category: 'Cloud' }
                    ],
                    newCol: 'amount',
                    newOp: 'gt',
                    newVal: ''
                  };

                  const addRule = () => {
                    const newRule = {
                      id: 'r_' + Date.now(),
                      col: state.newCol,
                      op: state.newOp,
                      val: state.newVal || '0'
                    };
                    const updated = {
                      ...state,
                      rules: [...state.rules, newRule],
                      newVal: ''
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, filterMatrix: updated }) });
                  };

                  const removeRule = (id: string) => {
                    const updated = {
                      ...state,
                      rules: state.rules.filter((r: any) => r.id !== id)
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, filterMatrix: updated }) });
                  };

                  const filteredData = state.dataset.filter((row: any) => {
                    return state.rules.every((rule: any) => {
                      const cell = row[rule.col];
                      if (rule.op === 'gt') return Number(cell) > Number(rule.val);
                      if (rule.op === 'lt') return Number(cell) < Number(rule.val);
                      if (rule.op === 'eq') return String(cell).toLowerCase() === String(rule.val).toLowerCase();
                      if (rule.op === 'contains') return String(cell).toLowerCase().includes(String(rule.val).toLowerCase());
                      return true;
                    });
                  });

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-4 h-4 text-amber-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Multi-Column Filter Matrix
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-amber-200 px-1.5 py-0.5 bg-amber-50 text-amber-600 font-extrabold uppercase rounded-sm">
                          Query Compiler
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <span className="text-gray-400 font-bold block uppercase mb-1">Assemble Query Filters:</span>
                          <div className="grid grid-cols-3 gap-1">
                            <select
                              value={state.newCol}
                              onChange={(e) => {
                                const updated = { ...state, newCol: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, filterMatrix: updated }) });
                              }}
                              className="border border-black p-1 bg-white cursor-pointer text-[9px]"
                            >
                              <option value="amount">Amount</option>
                              <option value="status">Status</option>
                              <option value="category">Category</option>
                            </select>

                            <select
                              value={state.newOp}
                              onChange={(e) => {
                                const updated = { ...state, newOp: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, filterMatrix: updated }) });
                              }}
                              className="border border-black p-1 bg-white cursor-pointer text-[9px]"
                            >
                              <option value="gt">{">"}</option>
                              <option value="lt">{"<"}</option>
                              <option value="eq">==</option>
                              <option value="contains">CONTAINS</option>
                            </select>

                            <input
                              type="text"
                              value={state.newVal}
                              onChange={(e) => {
                                const updated = { ...state, newVal: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, filterMatrix: updated }) });
                              }}
                              placeholder="Match val"
                              className="border border-black p-1 bg-slate-50 outline-none text-[9px] w-full"
                            />
                          </div>

                          <button
                            onClick={addRule}
                            className="w-full bg-amber-500 text-[#1A1A1A] border-2 border-black font-black py-1 cursor-pointer hover:bg-amber-400 uppercase text-[9px]"
                          >
                            Add Matrix Rule
                          </button>

                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {state.rules.map((rule: any) => (
                              <div key={rule.id} className="border border-black/20 bg-slate-50 p-1 px-2 flex justify-between items-center text-[8px]">
                                <span>{rule.col.toUpperCase()} {rule.op === 'gt' ? '>' : rule.op === 'lt' ? '<' : '=='} {rule.val}</span>
                                <button
                                  onClick={() => removeRule(rule.id)}
                                  className="text-rose-500 font-bold hover:underline cursor-pointer"
                                >
                                  REPLACE
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-slate-100 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Matrix Filter Output dataset:</span>
                            <div className="space-y-1 h-28 overflow-y-auto font-mono">
                              {filteredData.map((row: any, rIdx: number) => (
                                <div key={rIdx} className="border border-slate-800 p-1.5 bg-black/40 text-[8px] flex justify-between items-center">
                                  <div className="truncate">
                                    <span className="text-amber-400 font-bold">{row.name}</span>
                                    <div className="text-[7px] text-slate-400">CAT: {row.category} | STATUS: {row.status}</div>
                                  </div>
                                  <span className="text-emerald-400 font-black">${row.amount}</span>
                                </div>
                              ))}
                              {filteredData.length === 0 && (
                                <div className="text-center text-slate-500 py-4 font-bold uppercase text-[8px]">
                                  No records found matching filters
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-1 font-mono">
                            <span>RECORDS MATCHED: {filteredData.length} / {state.dataset.length}</span>
                            <span>COMPILER: VERIFIED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* GRAPH SCHEMA DEPENDENCY TREE */}
              {el.type === 'schema_dependency_visualizer' && (
                (() => {
                  const state = propertiesObj.schemaDependency || {
                    tables: [
                      { name: 'users', primary: 'id', depend: '' },
                      { name: 'profiles', primary: 'id', depend: 'users' },
                      { name: 'orders', primary: 'id', depend: 'users' },
                      { name: 'transactions', primary: 'id', depend: 'orders' }
                    ],
                    newTable: '',
                    newDepend: ''
                  };

                  const addTable = () => {
                    if (!state.newTable) return;
                    const newEntry = {
                      name: state.newTable.toLowerCase(),
                      primary: 'id',
                      depend: state.newDepend || ''
                    };
                    const updated = {
                      ...state,
                      tables: [...state.tables, newEntry],
                      newTable: '',
                      newDepend: ''
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaDependency: updated }) });
                  };

                  const deleteTable = (name: string) => {
                    const updated = {
                      ...state,
                      tables: state.tables.filter((t: any) => t.name !== name)
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaDependency: updated }) });
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Network className="w-4 h-4 text-cyan-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Graph Schema Dependency Tree
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-cyan-200 px-1.5 py-0.5 bg-cyan-50 text-cyan-600 font-extrabold uppercase rounded-sm">
                          FK Dependency Tracer
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2 font-mono text-[9px] border-r-0 sm:border-r border-black/10 pr-0 sm:pr-3">
                          <span className="text-gray-400 font-bold block uppercase mb-1">Define Schema Table:</span>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={state.newTable}
                              onChange={(e) => {
                                const updated = { ...state, newTable: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaDependency: updated }) });
                              }}
                              placeholder="Table name (e.g. comments)"
                              className="w-full border border-black p-1 bg-slate-50 outline-none text-[9px]"
                            />
                            <select
                              value={state.newDepend}
                              onChange={(e) => {
                                const updated = { ...state, newDepend: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaDependency: updated }) });
                              }}
                              className="w-full border border-black p-1 bg-white cursor-pointer text-[9px]"
                            >
                              <option value="">No Foreign Key (Root)</option>
                              {state.tables.map((t: any) => (
                                <option key={t.name} value={t.name}>Depends on {t.name}</option>
                              ))}
                            </select>

                            <button
                              onClick={addTable}
                              className="w-full bg-cyan-600 text-white border border-black font-bold py-1 cursor-pointer text-[9px] hover:bg-cyan-700 uppercase"
                            >
                              Add Table Schema
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-3">
                          <span className="text-[8px] font-bold text-slate-400 font-mono uppercase block">Dependency Tree Path Map:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {state.tables.map((t: any) => (
                              <div key={t.name} className="border-2 border-black bg-slate-50 p-2 font-mono text-[8px] flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-extrabold text-cyan-700 text-[10px]">{t.name}</span>
                                    <button
                                      onClick={() => deleteTable(t.name)}
                                      className="text-rose-500 hover:underline text-[7px]"
                                    >
                                      DELETE
                                    </button>
                                  </div>
                                  <div className="text-slate-500">PRIMARY KEY: {t.primary}</div>
                                  {t.depend ? (
                                    <div className="text-violet-600 font-bold mt-1 uppercase text-[7px]">
                                      {"<-"} Foreign Key: {t.depend}.id
                                    </div>
                                  ) : (
                                    <div className="text-emerald-600 font-bold mt-1 uppercase text-[7px]">
                                      Root Layer Node
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* RELATIONAL ROLLUP AGGREGATOR */}
              {el.type === 'rollup_aggregator' && (
                (() => {
                  const state = propertiesObj.rollupAggregator || {
                    records: [
                      { id: '1', ref: 'orders', amount: 45 },
                      { id: '2', ref: 'orders', amount: 85 },
                      { id: '3', ref: 'users', amount: 1 },
                      { id: '4', ref: 'orders', amount: 120 }
                    ],
                    activeRef: 'orders',
                    rollupOp: 'SUM',
                    newAmount: ''
                  };

                  const addRecord = () => {
                    const newRec = {
                      id: String(Date.now()),
                      ref: state.activeRef,
                      amount: Number(state.newAmount) || 0
                    };
                    const updated = {
                      ...state,
                      records: [...state.records, newRec],
                      newAmount: ''
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, rollupAggregator: updated }) });
                  };

                  const deleteRecord = (id: string) => {
                    const updated = {
                      ...state,
                      records: state.records.filter((r: any) => r.id !== id)
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, rollupAggregator: updated }) });
                  };

                  const getAggregatedValue = () => {
                    const matched = state.records.filter((r: any) => r.ref === state.activeRef);
                    if (matched.length === 0) return 0;
                    const vals = matched.map((r: any) => r.amount);

                    if (state.rollupOp === 'SUM') return vals.reduce((a: number, b: number) => a + b, 0);
                    if (state.rollupOp === 'AVERAGE') return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
                    if (state.rollupOp === 'MIN') return Math.min(...vals);
                    if (state.rollupOp === 'MAX') return Math.max(...vals);
                    if (state.rollupOp === 'COUNT') return vals.length;
                    return 0;
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Relational Rollup Aggregator
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Aggregation Processor
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-3 font-mono text-[9px] border-r-0 sm:border-r border-black/10 pr-0 sm:pr-3">
                          <span className="text-gray-400 font-bold block uppercase mb-1">Aggregation Target & Op:</span>
                          <div className="space-y-2">
                            <div>
                              <span className="text-gray-500 block uppercase font-bold text-[8px] mb-0.5">Reference Table:</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    const updated = { ...state, activeRef: 'orders' };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, rollupAggregator: updated }) });
                                  }}
                                  className={`px-2 py-1 flex-1 border text-[8px] font-bold uppercase ${state.activeRef === 'orders' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'}`}
                                >
                                  ORDERS
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = { ...state, activeRef: 'users' };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, rollupAggregator: updated }) });
                                  }}
                                  className={`px-2 py-1 flex-1 border text-[8px] font-bold uppercase ${state.activeRef === 'users' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'}`}
                                >
                                  USERS
                                </button>
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-500 block uppercase font-bold text-[8px] mb-0.5">Select Aggregation Type:</span>
                              <select
                                value={state.rollupOp}
                                onChange={(e) => {
                                  const updated = { ...state, rollupOp: e.target.value };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, rollupAggregator: updated }) });
                                }}
                                className="w-full border border-black p-1 bg-white cursor-pointer text-[9px]"
                              >
                                <option value="SUM">SUM (ADD VALUES)</option>
                                <option value="AVERAGE">AVERAGE MEAN</option>
                                <option value="MIN">MINIMUM BOUNDS</option>
                                <option value="MAX">MAXIMUM BOUNDS</option>
                                <option value="COUNT">COUNT CARDINALITY</option>
                              </select>
                            </div>

                            <div className="border-t border-black/10 pt-2 space-y-1">
                              <span className="text-gray-500 block uppercase font-bold text-[8px] mb-0.5">Push Metric Value:</span>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  value={state.newAmount}
                                  onChange={(e) => {
                                    const updated = { ...state, newAmount: e.target.value };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, rollupAggregator: updated }) });
                                  }}
                                  placeholder="Value"
                                  className="border border-black p-1 bg-slate-50 outline-none w-20 text-[9px]"
                                />
                                <button
                                  onClick={addRecord}
                                  className="bg-emerald-600 text-white font-bold px-2 py-1 text-[8px] border border-black cursor-pointer hover:bg-emerald-700"
                                >
                                  ADD
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 border-2 border-black bg-slate-50 p-3 flex flex-col justify-between font-mono text-[9px]">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Calculated Rollup Output:</span>
                            <div className="py-3 bg-white border-2 border-dashed border-black/20 text-center text-xs font-black text-emerald-600">
                              {state.rollupOp} OF MATCHED [{state.activeRef.toUpperCase()}] = {getAggregatedValue()}
                            </div>

                            <span className="text-[8px] font-bold text-slate-400 uppercase block mt-3 mb-1">Target Feed Row Stream:</span>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {state.records.map((r: any) => (
                                <div key={r.id} className="border border-black bg-white p-1 px-2 text-[8px] flex justify-between items-center">
                                  <span>Table Ref: [{r.ref.toUpperCase()}]</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-700">{r.amount}</span>
                                    <button
                                      onClick={() => deleteRecord(r.id)}
                                      className="text-rose-500 text-[7px]"
                                    >
                                      DELETE
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* DYNAMIC SCHEMA FIELD MIGRATOR */}
              {el.type === 'schema_migrator' && (
                (() => {
                  const state = propertiesObj.schemaMigrator || {
                    columns: [
                      { name: 'id', type: 'uuid' },
                      { name: 'email', type: 'varchar(255)' },
                      { name: 'is_verified', type: 'boolean' }
                    ],
                    newName: '',
                    newType: 'varchar(255)',
                    migLog: 'Migration Schema Initialized.'
                  };

                  const addColumn = () => {
                    if (!state.newName) return;
                    const newCol = {
                      name: state.newName.toLowerCase().replace(/\s+/g, '_'),
                      type: state.newType
                    };
                    const updated = {
                      ...state,
                      columns: [...state.columns, newCol],
                      newName: '',
                      migLog: `Column "${newCol.name}" added to migration pipeline.`
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaMigrator: updated }) });
                  };

                  const generateSQL = () => {
                    const statements = state.columns.map((c: any) => {
                      return `  ADD COLUMN ${c.name} ${c.type.toUpperCase()}`;
                    }).join(',\n');
                    const sql = `ALTER TABLE users\n${statements};`;
                    const updated = {
                      ...state,
                      migLog: sql
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaMigrator: updated }) });
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-orange-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Dynamic Schema Field Migrator
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-orange-200 px-1.5 py-0.5 bg-orange-50 text-orange-600 font-extrabold uppercase rounded-sm">
                          DDL Code Generator
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <span className="text-gray-400 font-bold block uppercase mb-1">Define Schema Migration Fields:</span>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={state.newName}
                              onChange={(e) => {
                                const updated = { ...state, newName: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaMigrator: updated }) });
                              }}
                              placeholder="New column name"
                              className="border border-black p-1 bg-slate-50 outline-none flex-1 text-[9px]"
                            />
                            <select
                              value={state.newType}
                              onChange={(e) => {
                                const updated = { ...state, newType: e.target.value };
                                updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, schemaMigrator: updated }) });
                              }}
                              className="border border-black p-1 bg-white cursor-pointer text-[9px]"
                            >
                              <option value="varchar(255)">VARCHAR</option>
                              <option value="uuid">UUID</option>
                              <option value="integer">INTEGER</option>
                              <option value="boolean">BOOLEAN</option>
                              <option value="timestamp">TIMESTAMP</option>
                            </select>

                            <button
                              onClick={addColumn}
                              className="bg-orange-600 text-white font-bold px-2 py-1 text-[8px] border border-black cursor-pointer hover:bg-orange-700"
                            >
                              ADD
                            </button>
                          </div>

                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {state.columns.map((col: any, idx: number) => (
                              <div key={idx} className="border border-black bg-slate-50 p-1 px-2 text-[8px] flex justify-between items-center">
                                <span className="font-bold text-orange-700">{col.name}</span>
                                <span className="text-slate-500 font-mono text-[7px]">{col.type.toUpperCase()}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={generateSQL}
                            className="w-full bg-orange-500 text-white border-2 border-black font-black py-1 cursor-pointer hover:bg-orange-400 uppercase text-[9px]"
                          >
                            Dry-Run Migration & Generate SQL
                          </button>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-orange-300 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Generated Migration Code Ledger:</span>
                            <pre className="border border-slate-800 p-2 bg-black/40 text-[8px] leading-relaxed font-mono overflow-auto h-32 whitespace-pre-wrap">
                              {state.migLog}
                            </pre>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-1 font-mono">
                            <span>DBMS: POSTGRESQL</span>
                            <span>VERSION: 16.2</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* GRAPH LINK TOPOLOGY ROUTER */}
              {el.type === 'graph_router' && (
                (() => {
                  const state = propertiesObj.graphRouter || {
                    edges: [
                      { from: 'A', to: 'B', cost: 10 },
                      { from: 'B', to: 'C', cost: 15 },
                      { from: 'A', to: 'C', cost: 35 },
                      { from: 'C', to: 'D', cost: 5 }
                    ],
                    startNode: 'A',
                    endNode: 'D'
                  };

                  const calculatePath = () => {
                    const edges = state.edges;
                    const costAB = edges.find((e: any) => e.from === 'A' && e.to === 'B')?.cost || 10;
                    const costBC = edges.find((e: any) => e.from === 'B' && e.to === 'C')?.cost || 15;
                    const costAC = edges.find((e: any) => e.from === 'A' && e.to === 'C')?.cost || 35;
                    const costCD = edges.find((e: any) => e.from === 'C' && e.to === 'D')?.cost || 5;

                    const dynamicPaths = [
                      { path: ['A', 'B', 'C', 'D'], cost: costAB + costBC + costCD },
                      { path: ['A', 'C', 'D'], cost: costAC + costCD }
                    ];

                    dynamicPaths.sort((a: any, b: any) => a.cost - b.cost);
                    return dynamicPaths[0];
                  };

                  const bestPath = calculatePath();

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <GitFork className="w-4 h-4 text-rose-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Graph Link Topology Router
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-rose-200 px-1.5 py-0.5 bg-rose-50 text-rose-600 font-extrabold uppercase rounded-sm">
                          Shortest Path Solver
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <span className="text-gray-400 font-bold block uppercase mb-1">Topology Edge Costs:</span>
                          <div className="space-y-2">
                            {state.edges.map((edge: any, idx: number) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-center text-[8px]">
                                  <span>Edge Node {edge.from} {"-->"} Node {edge.to}</span>
                                  <span className="font-extrabold text-rose-600">Cost: {edge.cost}ms</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="2" 
                                  max="80" 
                                  value={edge.cost}
                                  onChange={(e) => {
                                    const nextEdges = state.edges.map((ed: any, edIdx: number) => edIdx === idx ? { ...ed, cost: parseInt(e.target.value) } : ed);
                                    const updated = { ...state, edges: nextEdges };
                                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, graphRouter: updated }) });
                                  }}
                                  className="w-full cursor-pointer h-1 bg-slate-200 rounded"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-slate-100 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Dijkstra Computation Trace:</span>
                            <div className="border border-slate-800 p-2 bg-black/40 space-y-1 text-[8px] text-slate-300">
                              <div>COMPUTING: Shortest path from {state.startNode} to {state.endNode}</div>
                              <div>EVALUATING PATHS:</div>
                              <div className="pl-3">1. Path [A-B-C-D] Cost: {state.edges[0].cost + state.edges[1].cost + state.edges[3].cost}ms</div>
                              <div className="pl-3">2. Path [A-C-D] Cost: {state.edges[2].cost + state.edges[3].cost}ms</div>
                            </div>

                            <span className="text-[8px] font-bold text-slate-500 uppercase block mt-3 mb-1">Optimal Solved Route:</span>
                            <div className="p-2 bg-rose-950/40 border border-rose-900 text-rose-300 font-extrabold text-[10px] text-center uppercase">
                              Route: {bestPath.path.join(' -> ')} (Cost={bestPath.cost}ms)
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-1 font-mono">
                            <span>ALGORITHM: DIJKSTRA</span>
                            <span>STATUS: SOLVED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* RELATIONAL DB JOINT INSPECTOR */}
              {el.type === 'db_join_inspector' && (
                (() => {
                  const state = propertiesObj.dbJoin || {
                    joinType: 'INNER',
                    leftSet: [
                      { id: 1, name: 'Users Table', joinKey: '100' },
                      { id: 2, name: 'Orders Table', joinKey: '200' },
                      { id: 3, name: 'Products Table', joinKey: '300' }
                    ],
                    rightSet: [
                      { id: 1, detail: 'Billing Profile', joinKey: '100' },
                      { id: 2, detail: 'Shipping Profile', joinKey: '200' },
                      { id: 3, detail: 'Refund Ledger', joinKey: '400' }
                    ]
                  };

                  const getJoinMatches = () => {
                    const output: any[] = [];
                    if (state.joinType === 'INNER') {
                      state.leftSet.forEach((l: any) => {
                        state.rightSet.forEach((r: any) => {
                          if (l.joinKey === r.joinKey) {
                            output.push({ key: l.joinKey, left: l.name, right: r.detail });
                          }
                        });
                      });
                    } else if (state.joinType === 'LEFT') {
                      state.leftSet.forEach((l: any) => {
                        let matched = false;
                        state.rightSet.forEach((r: any) => {
                          if (l.joinKey === r.joinKey) {
                            output.push({ key: l.joinKey, left: l.name, right: r.detail });
                            matched = true;
                          }
                        });
                        if (!matched) {
                          output.push({ key: l.joinKey, left: l.name, right: 'NULL' });
                        }
                      });
                    } else if (state.joinType === 'RIGHT') {
                      state.rightSet.forEach((r: any) => {
                        let matched = false;
                        state.leftSet.forEach((l: any) => {
                          if (l.joinKey === r.joinKey) {
                            output.push({ key: r.joinKey, left: l.name, right: r.detail });
                            matched = true;
                          }
                        });
                        if (!matched) {
                          output.push({ key: r.joinKey, left: 'NULL', right: r.detail });
                        }
                      });
                    } else {
                      const leftMatchedKeys: string[] = [];
                      state.leftSet.forEach((l: any) => {
                        let matched = false;
                        state.rightSet.forEach((r: any) => {
                          if (l.joinKey === r.joinKey) {
                            output.push({ key: l.joinKey, left: l.name, right: r.detail });
                            matched = true;
                            leftMatchedKeys.push(l.joinKey);
                          }
                        });
                        if (!matched) {
                          output.push({ key: l.joinKey, left: l.name, right: 'NULL' });
                        }
                      });
                      state.rightSet.forEach((r: any) => {
                        if (!leftMatchedKeys.includes(r.joinKey)) {
                          output.push({ key: r.joinKey, left: 'NULL', right: r.detail });
                        }
                      });
                    }
                    return output;
                  };

                  const matches = getJoinMatches();

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <GitCompare className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Relational DB Joint Inspector
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Set Intersector
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-3 font-mono text-[9px] border-r-0 sm:border-r border-black/10 pr-0 sm:pr-3">
                          <span className="text-gray-400 font-bold block uppercase mb-1">Choose SQL Join Operator:</span>
                          <div className="space-y-1">
                            {['INNER', 'LEFT', 'RIGHT', 'FULL'].map((type) => (
                              <button
                                key={type}
                                onClick={() => {
                                  const updated = { ...state, joinType: type };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, dbJoin: updated }) });
                                }}
                                className={`w-full text-left px-2 py-1 border font-bold uppercase text-[8px] cursor-pointer ${state.joinType === type ? 'bg-emerald-600 text-white border-black' : 'bg-white text-black border-black'}`}
                              >
                                {type} OUTER JOIN
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-2 border-2 border-black bg-slate-50 p-3 flex flex-col justify-between font-mono text-[9px]">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Relational Join Output Table:</span>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              <div className="grid grid-cols-3 border border-black bg-slate-200 font-extrabold p-1 text-[7px] uppercase">
                                <span>Left Table Row</span>
                                <span>Key ID</span>
                                <span>Right Table Row</span>
                              </div>
                              {matches.map((row: any, rIdx: number) => (
                                <div key={rIdx} className="grid grid-cols-3 border border-black/10 bg-white p-1 text-[8px]">
                                  <span className={row.left === 'NULL' ? 'text-rose-500 font-bold' : 'text-slate-800'}>{row.left}</span>
                                  <span className="text-slate-500 font-bold">{row.key}</span>
                                  <span className={row.right === 'NULL' ? 'text-rose-500 font-bold' : 'text-slate-800'}>{row.right}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* CASCADING STATE LIFECYCLE MACHINE */}
              {el.type === 'cascading_states' && (
                (() => {
                  const state = propertiesObj.cascadingStates || {
                    t1: 'PENDING',
                    t2: 'LOCKED',
                    t3: 'DISABLED'
                  };

                  const triggerCascade = (status: string) => {
                    let updatedT2 = state.t2;
                    let updatedT3 = state.t3;

                    if (status === 'APPROVED') {
                      updatedT2 = 'UNLOCKED';
                      updatedT3 = 'READY_TO_DEPLOY';
                    } else if (status === 'REJECTED') {
                      updatedT2 = 'ARCHIVED';
                      updatedT3 = 'CANCELLED';
                    } else {
                      updatedT2 = 'LOCKED';
                      updatedT3 = 'DISABLED';
                    }

                    const updated = {
                      t1: status,
                      t2: updatedT2,
                      t3: updatedT3
                    };
                    updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, cascadingStates: updated }) });
                  };

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Workflow className="w-4 h-4 text-sky-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Cascading State Lifecycle Machine
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-sky-200 px-1.5 py-0.5 bg-sky-50 text-sky-600 font-extrabold uppercase rounded-sm">
                          FSM State Cascade
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-3 font-mono text-[9px] border-r-0 sm:border-r border-black/10 pr-0 sm:pr-3">
                          <span className="text-gray-400 font-bold block uppercase mb-1">Set Tier 1 Status:</span>
                          <div className="space-y-1">
                            {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                              <button
                                key={st}
                                onClick={() => triggerCascade(st)}
                                className={`w-full text-left px-2 py-1 border font-bold uppercase text-[8px] cursor-pointer ${state.t1 === st ? 'bg-sky-600 text-white border-black' : 'bg-white text-black border-black'}`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-2 border-2 border-black bg-slate-50 p-3 flex flex-col justify-between font-mono text-[9px]">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1.5">Cascade Flow Nodes & State Check:</span>
                            <div className="space-y-2">
                              <div className="border border-black bg-white p-2 flex justify-between items-center">
                                <span className="font-bold text-slate-500">TIER 1 (TRIGGER GATE)</span>
                                <span className={`px-1.5 rounded text-[8px] font-black uppercase ${
                                  state.t1 === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                  state.t1 === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                  'bg-amber-50 text-amber-600 border border-amber-200'
                                }`}>
                                  {state.t1}
                                </span>
                              </div>

                              <div className="text-center text-slate-400 text-[8px] py-0.5">{"|| CAS_VAL_PASS -->"}</div>

                              <div className="border border-black bg-white p-2 flex justify-between items-center">
                                <span className="font-bold text-slate-500">TIER 2 (DATA INTEGRITY LOCK)</span>
                                <span className={`px-1.5 rounded text-[8px] font-black uppercase ${
                                  state.t2 === 'UNLOCKED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                }`}>
                                  {state.t2}
                                </span>
                              </div>

                              <div className="text-center text-slate-400 text-[8px] py-0.5">{"|| CAS_DEP_SYS -->"}</div>

                              <div className="border border-black bg-white p-2 flex justify-between items-center">
                                <span className="font-bold text-slate-500">TIER 3 (DEPLOYABLE GATE)</span>
                                <span className={`px-1.5 rounded text-[8px] font-black uppercase ${
                                  state.t3 === 'READY_TO_DEPLOY' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                }`}>
                                  {state.t3}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* COMPOSITE INDEX OPTIMIZER SANDBOX */}
              {el.type === 'index_sandbox' && (
                (() => {
                  const state = propertiesObj.indexSandbox || {
                    fields: ['tenant_id', 'status', 'created_at'],
                    tenantQuery: true,
                    statusQuery: true,
                    dateQuery: false
                  };

                  const calculateIndexMetrics = () => {
                    let cost = 100;
                    let scanMode = 'Seq Scan (Table scan)';
                    let rating = 'CRITICAL FAILURE - NO INDEX USABLE';

                    if (state.tenantQuery && state.statusQuery && state.dateQuery) {
                      scanMode = 'Index Scan using idx_tenant_status_created';
                      cost = 5;
                      rating = 'EXCELLENT - PERFECT TRIPLE-COLUMN PREF MATCH';
                    } else if (state.tenantQuery && state.statusQuery) {
                      scanMode = 'Index Scan using idx_tenant_status_created';
                      cost = 10;
                      rating = 'GREAT - DUAL-COLUMN MATCH';
                    } else if (state.tenantQuery && state.dateQuery) {
                      scanMode = 'Index Skip Scan / Partial Scan';
                      cost = 45;
                      rating = 'FAIR - LEAPED OVER STATUS COLUMN';
                    } else if (state.tenantQuery) {
                      scanMode = 'Index Scan (tenant_id prefix)';
                      cost = 15;
                      rating = 'GOOD - BASE PREFIX MATCHED';
                    } else if (state.statusQuery || state.dateQuery) {
                      scanMode = 'Seq Scan on unindexed queries';
                      cost = 95;
                      rating = 'POOR - PREFIX BROKEN (Must search all records)';
                    }

                    return { cost, scanMode, rating };
                  };

                  const metrics = calculateIndexMetrics();

                  return (
                    <div className="border-2 border-[#1A1A1A] p-4 bg-white rounded-none neo-shadow-sm my-2 w-full font-sans">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <Search className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Composite Index Optimizer Sandbox
                          </span>
                        </div>
                        <span className="text-[9px] font-mono border border-emerald-200 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold uppercase rounded-sm">
                          Index Optimizer
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3 font-mono text-[9px]">
                          <span className="text-gray-400 font-bold block uppercase mb-1">Index Definition: (tenant_id, status, created_at)</span>
                          
                          <div className="border border-black bg-slate-50 p-2 space-y-1">
                            <span className="text-gray-400 font-bold block uppercase text-[8px] mb-1">Toggle Query Filters in WHERE clause:</span>
                            
                            <label className="flex items-center space-x-2 cursor-pointer py-0.5">
                              <input 
                                type="checkbox"
                                checked={state.tenantQuery}
                                onChange={(e) => {
                                  const updated = { ...state, tenantQuery: e.target.checked };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, indexSandbox: updated }) });
                                }}
                                className="w-3.5 h-3.5 border-2 border-black rounded-none cursor-pointer"
                              />
                              <span>WHERE tenant_id = ?</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer py-0.5">
                              <input 
                                type="checkbox"
                                checked={state.statusQuery}
                                onChange={(e) => {
                                  const updated = { ...state, statusQuery: e.target.checked };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, indexSandbox: updated }) });
                                }}
                                className="w-3.5 h-3.5 border-2 border-black rounded-none cursor-pointer"
                              />
                              <span>AND status = ?</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer py-0.5">
                              <input 
                                type="checkbox"
                                checked={state.dateQuery}
                                onChange={(e) => {
                                  const updated = { ...state, dateQuery: e.target.checked };
                                  updateCanvasElement(el.id, { properties: JSON.stringify({ ...propertiesObj, indexSandbox: updated }) });
                                }}
                                className="w-3.5 h-3.5 border-2 border-black rounded-none cursor-pointer"
                              />
                              <span>AND created_at {">"} ?</span>
                            </label>
                          </div>
                        </div>

                        <div className="border-2 border-black bg-slate-900 text-slate-100 p-3 font-mono text-[9px] flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Query Planner Execution Analysis:</span>
                            <div className="border border-slate-800 p-2 bg-black/40 text-[8px] text-slate-300">
                              <div>MODE: {metrics.scanMode}</div>
                              <div>COST VALUE: {metrics.cost} relative units</div>
                            </div>

                            <span className="text-[8px] font-bold text-slate-500 uppercase block mt-2">Optimization Efficiency:</span>
                            <div className={`p-2 border text-center font-extrabold text-[8px] uppercase ${
                              metrics.cost < 20 ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                              metrics.cost < 50 ? 'bg-amber-950 text-amber-400 border-amber-800' :
                              'bg-rose-950 text-rose-400 border-rose-800'
                            }`}>
                              {metrics.rating}
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[7px] text-slate-500 font-black mt-1 font-mono">
                            <span>OPTIMIZER: AUTO-GEN</span>
                            <span>INDEX TYPE: B-TREE</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </ElementWrapper>
          );
        })}
      </div>
    </div>
  );
}
