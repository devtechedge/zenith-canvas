'use client';

import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CanvasElement, type CollectionTable } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
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
  Plus
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
            </ElementWrapper>
          );
        })}
      </div>
    </div>
  );
}
