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
  Info
} from 'lucide-react';

interface CanvasEditorProps {
  canvasId: string;
}

export default function CanvasEditor({ canvasId }: CanvasEditorProps) {
  const { 
    createCanvasElement, 
    updateCanvasElement, 
    deleteCanvasElement,
    createCollectionTable
  } = useCanvasSync();

  // Load and sort elements of the current canvas
  const elements = useLiveQuery(async () => {
    const list = await db.elements.where('canvasId').equals(canvasId).toArray();
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [canvasId]) || [];

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
      const tableId = `table-${Math.random().toString(36).substring(2, 11)}`;
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

    try {
      // Simple eval in sandbox context
      const runner = new Function(code);
      runner();
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
            >
              {/* HEADING 1 ELEMENT */}
              {el.type === 'heading_1' && (
                <textarea
                  id={`textarea-${el.id}`}
                  value={el.content}
                  placeholder="Heading 1 (Use '/' for insert commands...)"
                  onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                  onKeyDown={(e) => handleElementKeyDown(e, el)}
                  onSelect={(e) => handleSelection(e, el)}
                  rows={1}
                  className="w-full bg-transparent resize-none border-none outline-none font-black text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight placeholder-gray-300 font-sans leading-tight py-1"
                />
              )}

              {/* HEADING 2 ELEMENT */}
              {el.type === 'heading_2' && (
                <textarea
                  id={`textarea-${el.id}`}
                  value={el.content}
                  placeholder="Heading 2 (Use '/' for commands)"
                  onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                  onKeyDown={(e) => handleElementKeyDown(e, el)}
                  onSelect={(e) => handleSelection(e, el)}
                  rows={1}
                  className="w-full bg-transparent resize-none border-none outline-none font-extrabold text-xl sm:text-2xl text-[#1A1A1A] tracking-tight placeholder-gray-300 font-sans leading-tight py-1"
                />
              )}

              {/* PARAGRAPH TEXT ELEMENT */}
              {el.type === 'text' && (
                <textarea
                  id={`textarea-${el.id}`}
                  value={el.content}
                  placeholder="Start writing plain text, or type '/' for interactive data grids & checklists..."
                  onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                  onKeyDown={(e) => handleElementKeyDown(e, el)}
                  onSelect={(e) => handleSelection(e, el)}
                  rows={1}
                  className="w-full bg-transparent resize-none border-none outline-none font-medium text-sm text-[#1A1A1A] placeholder-gray-300 font-sans leading-relaxed py-1 focus:bg-white/40 rounded px-1 transition-colors"
                />
              )}

              {/* CHECKLIST TODO ELEMENT */}
              {el.type === 'todo' && (
                <div className="flex items-start space-x-2.5 py-1">
                  <input
                    type="checkbox"
                    checked={!!propertiesObj.checked}
                    onChange={(e) => updateCanvasElement(el.id, { 
                      properties: JSON.stringify({ ...propertiesObj, checked: e.target.checked }) 
                    })}
                    className="w-4 h-4 rounded-none border-2 border-[#1A1A1A] text-[#2D6A4F] focus:ring-0 focus:ring-offset-0 cursor-pointer mt-1"
                  />
                  <textarea
                    id={`textarea-${el.id}`}
                    value={el.content}
                    placeholder="Checklist task (Press '/' for block insert...)"
                    onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                    onKeyDown={(e) => handleElementKeyDown(e, el)}
                    rows={1}
                    className={`w-full bg-transparent resize-none border-none outline-none font-bold text-sm text-[#1A1A1A] placeholder-gray-300 font-sans leading-relaxed ${
                      propertiesObj.checked ? 'line-through text-gray-400 font-medium' : ''
                    }`}
                  />
                </div>
              )}

              {/* CALLOUT ELEMENT */}
              {el.type === 'callout' && (
                <div className="flex items-start space-x-3 bg-white border-2 border-[#1A1A1A] neo-shadow-sm p-4 rounded-none">
                  <div className="w-8 h-8 rounded-none border border-[#1A1A1A] bg-[#FFB703] flex items-center justify-center flex-shrink-0 text-lg">
                    💡
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      id={`textarea-${el.id}`}
                      value={el.content}
                      placeholder="Callout info block text..."
                      onChange={(e) => updateCanvasElement(el.id, { content: e.target.value })}
                      onKeyDown={(e) => handleElementKeyDown(e, el)}
                      rows={2}
                      className="w-full bg-transparent resize-none border-none outline-none font-bold text-xs text-[#1A1A1A] placeholder-gray-300 font-sans leading-relaxed"
                    />
                  </div>
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
            </ElementWrapper>
          );
        })}
      </div>
    </div>
  );
}
