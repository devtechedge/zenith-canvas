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
  Volume2
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
            </ElementWrapper>
          );
        })}
      </div>
    </div>
  );
}
