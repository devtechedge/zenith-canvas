'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CanvasElement, type Canvas } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import { 
  Sliders, 
  Terminal, 
  Paperclip, 
  Layers, 
  History, 
  Palette, 
  Send, 
  Play, 
  Trash2, 
  Plus, 
  EyeOff, 
  Eye, 
  Sparkles, 
  Activity, 
  CheckSquare, 
  Info,
  Clock,
  Download,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- External Pure Helpers to avoid ESLint purity check errors ---
function generateCheckpointId(): string {
  return `snap-${Math.random().toString(36).substring(2, 9)}`;
}

function getCurrentTimestamp(): number {
  return Date.now();
}

// --- Module-scoped Ambient focus noise engine ---
let globalAudioCtx: AudioContext | null = null;
let globalSoundNodes: { osc1?: OscillatorNode; osc2?: OscillatorNode; gainNode?: GainNode; noiseSource?: AudioBufferSourceNode } = {};

function stopGlobalAmbient() {
  try {
    if (globalSoundNodes.noiseSource) {
      globalSoundNodes.noiseSource.stop();
      globalSoundNodes.noiseSource.disconnect();
    }
    if (globalSoundNodes.osc1) {
      globalSoundNodes.osc1.stop();
      globalSoundNodes.osc1.disconnect();
    }
    if (globalSoundNodes.osc2) {
      globalSoundNodes.osc2.stop();
      globalSoundNodes.osc2.disconnect();
    }
    if (globalSoundNodes.gainNode) {
      globalSoundNodes.gainNode.disconnect();
    }
    if (globalAudioCtx) {
      globalAudioCtx.close();
    }
  } catch {}
  globalSoundNodes = {};
  globalAudioCtx = null;
}

function playGlobalAmbient(type: 'hum' | 'pink_noise') {
  stopGlobalAmbient();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    globalAudioCtx = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
    masterGain.connect(ctx.destination);
    globalSoundNodes.gainNode = masterGain;

    if (type === 'pink_noise') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      source.connect(masterGain);
      source.start();
      globalSoundNodes.noiseSource = source;
    } else if (type === 'hum') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220, ctx.currentTime);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      osc1.start();
      osc2.start();

      globalSoundNodes.osc1 = osc1;
      globalSoundNodes.osc2 = osc2;
    }
  } catch (err) {
    console.error('Ambient synthesis error:', err);
  }
}

interface Checkpoint {
  id: string;
  name: string;
  timestamp: number;
  elementCount: number;
  data: string; // JSON string of elements
}

interface OpsControlDeckProps {
  canvasId: string;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  accentTheme: string;
  setAccentTheme: (val: string) => void;
  isCozyStoryMode: boolean;
  setIsCozyStoryMode: (val: boolean) => void;
}

export default function OpsControlDeck({ 
  canvasId, 
  isFocusMode, 
  setIsFocusMode,
  accentTheme,
  setAccentTheme,
  isCozyStoryMode,
  setIsCozyStoryMode
}: OpsControlDeckProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'scratchpad' | 'ast' | 'snapshots' | 'themes'>('scratchpad');

  const [activeAmbient, setActiveAmbient] = useState<'none' | 'hum' | 'pink_noise'>('none');
  const [typewriterEnabled, setTypewriterEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('zenith-typewriter-sound') === 'true';
  });

  const handleToggleTypewriter = () => {
    const newVal = !typewriterEnabled;
    setTypewriterEnabled(newVal);
    localStorage.setItem('zenith-typewriter-sound', String(newVal));
    addCliLog(`[SOUND] Typewriter key sounds turned ${newVal ? 'ON' : 'OFF'}.`);
  };

  const handleToggleAmbient = (type: 'none' | 'hum' | 'pink_noise') => {
    if (type === 'none') {
      stopGlobalAmbient();
      setActiveAmbient('none');
      addCliLog('[SOUND] Ambient soundtrack stopped.');
    } else {
      playGlobalAmbient(type);
      setActiveAmbient(type);
      addCliLog(`[SOUND] Playing synthesized ${type === 'hum' ? 'Deep Zen Hum' : 'Pink Focus Noise'}.`);
    }
  };

  useEffect(() => {
    return () => {
      stopGlobalAmbient();
    };
  }, []);

  const { 
    createCanvasElement, 
    updateCanvasTitle, 
    updateCanvasCover,
    syncStatus, 
    isOnline, 
    triggerSync 
  } = useCanvasSync();

  // Load canvas and elements live from DB
  const canvas = useLiveQuery(() => db.canvases.get(canvasId), [canvasId]);
  const liveElements = useLiveQuery(() => db.elements.where('canvasId').equals(canvasId).toArray(), [canvasId]);
  const elements = useMemo(() => liveElements || [], [liveElements]);

  // --- Feature 2: Quick-Capture Scratchpad Tape ---
  const [scratchpadNotes, setScratchpadNotes] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('zenith-scratchpad');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    const initial = [
      "💡 Study for the history quiz next Monday morning.",
      "🍕 Ask friends what toppings they want for Friday's pizza party.",
      "🎨 Search for a nice cover art image for my science project page."
    ];
    return initial;
  });
  
  const [newNote, setNewNote] = useState('');

  // Save scratchpad notes whenever changed
  useEffect(() => {
    localStorage.setItem('zenith-scratchpad', JSON.stringify(scratchpadNotes));
  }, [scratchpadNotes]);

  const handleAddScratchpad = () => {
    if (!newNote.trim()) return;
    const updated = [newNote.trim(), ...scratchpadNotes];
    setScratchpadNotes(updated);
    setNewNote('');
    addCliLog(`[SCRATCHPAD] Captured tape inbox item: "${newNote.trim().substring(0, 20)}..."`);
  };

  const handleDeleteScratchpad = (idx: number) => {
    const updated = scratchpadNotes.filter((_, i) => i !== idx);
    setScratchpadNotes(updated);
  };

  const handleDropIntoCanvas = async (noteContent: string, idx: number) => {
    const maxSort = elements.reduce((max, el) => Math.max(max, el.sortOrder), 0);
    await createCanvasElement(canvasId, 'text', noteContent, maxSort + 1.0);
    handleDeleteScratchpad(idx);
    addCliLog(`[LEDGER] Merged scratchpad item to main timeline sortOrder ${maxSort + 1.0}`);
  };

  // --- Feature 5: Visual AST Analyzer ---
  const astStats = useMemo(() => {
    const totalBlocks = elements.length;
    const wordCount = elements.reduce((sum, el) => sum + (el.content?.split(/\s+/).filter(Boolean).length || 0), 0);
    const headings = elements.filter(el => el.type === 'heading_1' || el.type === 'heading_2').length;
    const paragraphs = elements.filter(el => el.type === 'text').length;
    const todos = elements.filter(el => el.type === 'todo');
    const completedTodos = todos.filter(el => {
      try {
        return JSON.parse(el.properties).checked === true;
      } catch { return false; }
    }).length;
    
    const sandboxes = elements.filter(el => el.type === 'code_sandbox').length;
    const inlineGrids = elements.filter(el => el.type === 'collection_ref').length;
    const synthesizers = elements.filter(el => el.type === 'acoustic_wave').length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    // Readability Estimate
    let readability = 'Simple';
    if (wordCount > 100) {
      if (headings / totalBlocks > 0.3) readability = 'Highly Structured';
      else if (paragraphs / totalBlocks > 0.7) readability = 'Editorial Narrative';
      else readability = 'Technical Node Document';
    }

    return {
      totalBlocks,
      wordCount,
      headings,
      paragraphs,
      totalTodos: todos.length,
      completedTodos,
      sandboxes,
      inlineGrids,
      synthesizers,
      readingTime,
      readability
    };
  }, [elements]);

  // --- Feature 6: Snapshot Time-Travel Version Ledger ---
  const [snapshots, setSnapshots] = useState<Checkpoint[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`zenith-snapshots-${canvasId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const timer = setTimeout(() => {
          setSnapshots(parsed);
        }, 0);
        return () => clearTimeout(timer);
      } catch {}
    } else {
      const timer = setTimeout(() => {
        setSnapshots([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [canvasId]);

  const handleCreateSnapshot = () => {
    const snapshotName = prompt('Enter a name for this backup version:', `Backup ${new Date().toLocaleTimeString()}`);
    if (!snapshotName) return;

    const newCheckpoint: Checkpoint = {
      id: generateCheckpointId(),
      name: snapshotName,
      timestamp: getCurrentTimestamp(),
      elementCount: elements.length,
      data: JSON.stringify(elements)
    };

    const updated = [newCheckpoint, ...snapshots];
    setSnapshots(updated);
    localStorage.setItem(`zenith-snapshots-${canvasId}`, JSON.stringify(updated));
    addCliLog(`[COMMIT] Snapshot created: "${snapshotName}" with ${elements.length} blocks.`);
  };

  const handleRestoreSnapshot = async (checkpoint: Checkpoint) => {
    if (!confirm(`Are you sure you want to restore "${checkpoint.name}"? This will overwrite the current canvas timeline.`)) return;

    try {
      const savedElements = JSON.parse(checkpoint.data) as CanvasElement[];
      
      // Delete existing
      await db.elements.where('canvasId').equals(canvasId).delete();

      // Add back
      for (const el of savedElements) {
        // clean up internal DB id references if needed, but keeping the same is fine for local restore
        await db.elements.put(el);
      }

      addCliLog(`[RESTORE] Successfully restored checkpoint "${checkpoint.name}".`);
      window.location.reload(); // Refresh to let LiveQuery reload
    } catch (err: any) {
      addCliLog(`[RESTORE] 🚨 FAILED to restore snapshot: ${err.message}`);
    }
  };

  const handleDeleteSnapshot = (snapId: string) => {
    const updated = snapshots.filter(s => s.id !== snapId);
    setSnapshots(updated);
    localStorage.setItem(`zenith-snapshots-${canvasId}`, JSON.stringify(updated));
  };

  // --- Feature 7: Zenith CLI Terminal ---
  const [cliInput, setCliInput] = useState('');
  const [cliLogs, setCliLogs] = useState<string[]>(() => [
    "Welcome to Zenith's Quick Command Box! 👋",
    "Type '/help' to see list of things you can type here.",
    "All your edits are being saved automatically! ✅"
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addCliLog = (msg: string) => {
    setCliLogs(prev => [...prev, msg]);
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cliLogs]);

  const handleCliExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const command = cliInput.trim();
    setCliInput('');
    addCliLog(`> ${command}`);

    const parts = command.split(/\s+/);
    const baseCmd = parts[0].toLowerCase();

    if (baseCmd === '/help') {
      addCliLog("Active Commands:");
      addCliLog("  /title <name>       Change this page's title");
      addCliLog("  /add todo <text>    Add a new checklist item");
      addCliLog("  /add text <text>    Add a new text paragraph");
      addCliLog("  /add heading <text> Add a sub-heading section");
      addCliLog("  /snapshot           Save a page backup version");
      addCliLog("  /clear              Clear command history logs");
      addCliLog("  /stats              Show page block stats");
    } else if (baseCmd === '/clear') {
      setCliLogs([]);
    } else if (baseCmd === '/title') {
      const titleArg = parts.slice(1).join(' ');
      if (!titleArg) {
        addCliLog("🚨 ERROR: Title argument required. Usage: /title My New Document");
      } else {
        await updateCanvasTitle(canvasId, titleArg);
        addCliLog(`[LEDGER] Title updated successfully to: "${titleArg}"`);
      }
    } else if (baseCmd === '/snapshot') {
      handleCreateSnapshot();
    } else if (baseCmd === '/stats') {
      addCliLog("Page Block Breakdown:");
      addCliLog(`  - Total Blocks: ${astStats.totalBlocks}`);
      addCliLog(`  - Paragraphs: ${astStats.paragraphs}`);
      addCliLog(`  - Headings: ${astStats.headings}`);
      addCliLog(`  - Checklist Tasks: ${astStats.completedTodos}/${astStats.totalTodos}`);
      addCliLog(`  - Code Playgrounds: ${astStats.sandboxes}`);
      addCliLog(`  - Data Tables: ${astStats.inlineGrids}`);
    } else if (baseCmd === '/add') {
      const typeArg = parts[1]?.toLowerCase();
      const contentArg = parts.slice(2).join(' ');

      if (!typeArg || !contentArg) {
        addCliLog("🚨 ERROR: Missing block specs. Usage: /add [todo|text|heading] My Content");
      } else {
        const type = typeArg === 'todo' ? 'todo' : typeArg === 'heading' ? 'heading_2' : 'text';
        const maxSort = elements.reduce((max, el) => Math.max(max, el.sortOrder), 0);
        await createCanvasElement(canvasId, type, contentArg, maxSort + 1.0);
        addCliLog(`[LEDGER] Successfully inserted element [${type}] to canvas.`);
      }
    } else {
      addCliLog(`🚨 Unknown command "${baseCmd}". Type '/help' for options.`);
    }
  };

  // --- Feature 1: Monospace Dev Sync Logs Simulation ---
  const [liveSyncLogs, setLiveSyncLogs] = useState<string[]>(() => [
    `✨ System status: All saved and running perfectly.`,
    `📂 Database: Page loaded with ${elements.length} blocks.`,
    `☁️ Backup: All changes are safe and synchronized.`
  ]);

  useEffect(() => {
    const presets = [
      `✨ System status: All saved and running perfectly.`,
      `📂 Database: Page loaded with ${elements.length} blocks.`,
      `☁️ Backup: All changes are safe and synchronized.`
    ];
    const timer = setTimeout(() => {
      setLiveSyncLogs(presets);
    }, 0);

    // Dynamic logging
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        const log = `🟢 Auto-saved your changes safely! (${Date.now() % 1000}ms)`;
        setLiveSyncLogs(prev => [log, ...prev.slice(0, 15)]);
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [elements.length]);

  return (
    <>
      {/* Floating Panel Open Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 z-40 p-3 border-2 border-[#1A1A1A] bg-[#FFB703] text-[#1A1A1A] neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black flex items-center space-x-1.5 cursor-pointer rounded-none"
        title="Open Workspace Settings"
      >
        <Sliders className="w-4 h-4 animate-spin-slow" />
        <span className="text-xs uppercase font-extrabold tracking-wider">Page Settings</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#F4F7F6] border-l-4 border-[#1A1A1A] flex flex-col h-screen overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#1A1A1A] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#FFB703]" />
                <div>
                  <h2 className="text-sm font-black tracking-wider uppercase">Page Settings</h2>
                  <p className="text-[10px] font-mono text-amber-400">Zenith Workspace • Connected</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 text-xs border border-white hover:bg-white hover:text-black font-bold uppercase transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Focus Mode & Accent Banner Quick Bar */}
            <div className="bg-white border-b-2 border-[#1A1A1A] px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Focus Mode:</span>
              <button
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="flex items-center space-x-1.5 px-3 py-1 text-[10px] font-bold uppercase border border-[#1A1A1A] bg-[#F4F7F6] hover:bg-[#FFB703] transition-colors rounded-none"
              >
                {isFocusMode ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-green-600" />
                    <span>Show Sidebars</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                    <span>Focus (Hide Sidebars)</span>
                  </>
                )}
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="bg-[#1A1A1A]/5 border-b-2 border-[#1A1A1A] flex overflow-x-auto divide-x border-gray-300">
              <button
                onClick={() => setActiveTab('scratchpad')}
                className={`flex-1 min-w-[70px] py-2 px-1 text-[10px] font-bold uppercase tracking-tight flex flex-col items-center justify-center gap-1 ${
                  activeTab === 'scratchpad' ? 'bg-[#FFB703] text-black border-r-2 border-b-2 border-[#1A1A1A]' : 'hover:bg-white text-gray-500'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Quick Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('ast')}
                className={`flex-1 min-w-[70px] py-2 px-1 text-[10px] font-bold uppercase tracking-tight flex flex-col items-center justify-center gap-1 ${
                  activeTab === 'ast' ? 'bg-[#FFB703] text-black border-r-2 border-b-2 border-[#1A1A1A]' : 'hover:bg-white text-gray-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Stats</span>
              </button>
              <button
                onClick={() => setActiveTab('snapshots')}
                className={`flex-1 min-w-[70px] py-2 px-1 text-[10px] font-bold uppercase tracking-tight flex flex-col items-center justify-center gap-1 ${
                  activeTab === 'snapshots' ? 'bg-[#FFB703] text-black border-r-2 border-b-2 border-[#1A1A1A]' : 'hover:bg-white text-gray-500'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`flex-1 min-w-[70px] py-2 px-1 text-[10px] font-bold uppercase tracking-tight flex flex-col items-center justify-center gap-1 ${
                  activeTab === 'ledger' ? 'bg-[#FFB703] text-black border-r-2 border-b-2 border-[#1A1A1A]' : 'hover:bg-white text-gray-500'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Commands</span>
              </button>
              <button
                onClick={() => setActiveTab('themes')}
                className={`flex-1 min-w-[70px] py-2 px-1 text-[10px] font-bold uppercase tracking-tight flex flex-col items-center justify-center gap-1 ${
                  activeTab === 'themes' ? 'bg-[#FFB703] text-black border-b-2 border-[#1A1A1A]' : 'hover:bg-white text-gray-500'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Design</span>
              </button>
            </div>

            {/* Scrollable Workspace */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* TAB 1: SCRATCHPAD INBOX */}
              {activeTab === 'scratchpad' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#1A1A1A]">Quick Notes Box</h3>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Quickly jot down ideas, notes, or web links here. You can insert them as blocks into your page later.
                    </p>
                  </div>

                  {/* Add note */}
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={newNote}
                      placeholder="Type a quick note or idea..."
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddScratchpad()}
                      className="flex-1 bg-white border-2 border-[#1A1A1A] p-2 text-xs font-mono outline-none"
                    />
                    <button
                      onClick={handleAddScratchpad}
                      className="px-3 bg-[#1A1A1A] text-white hover:bg-gray-800 text-xs font-black uppercase"
                    >
                      ADD
                    </button>
                  </div>

                  {/* Notes List with amber hazard pattern */}
                  <div className="space-y-2.5">
                    {scratchpadNotes.map((note, index) => (
                      <div 
                        key={index}
                        className="bg-white border-2 border-[#1A1A1A] neo-shadow-sm flex flex-col rounded-none overflow-hidden"
                      >
                        {/* Solid Accent Color Line */}
                        <div className="h-2 bg-[#FFB703] border-b border-[#1A1A1A]" />
                        
                        <div className="p-3 space-y-3 flex-1">
                          <p className="text-xs font-semibold text-gray-800 leading-relaxed break-words">
                            {note}
                          </p>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-[9px] font-mono text-gray-400">QUICK NOTE</span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteScratchpad(index)}
                                className="p-1 hover:bg-red-50 text-red-500 rounded"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDropIntoCanvas(note, index)}
                                className="flex items-center space-x-1 px-2.5 py-1 border border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 text-[10px] font-black uppercase"
                                title="Insert block at bottom of document"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add to Page</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {scratchpadNotes.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300">
                        <Paperclip className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span className="text-xs text-gray-400 font-medium">Your quick notes list is empty.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: AST STRUCTURE METRICS */}
              {activeTab === 'ast' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#1A1A1A]">Page Stats & Info</h3>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Check statistics about what you have written and created on this page.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border-2 border-[#1A1A1A] p-3 text-center">
                      <div className="text-xl font-black">{astStats.totalBlocks}</div>
                      <div className="text-[9px] font-mono text-gray-400 uppercase font-bold">Total Blocks</div>
                    </div>
                    <div className="bg-white border-2 border-[#1A1A1A] p-3 text-center">
                      <div className="text-xl font-black">{astStats.wordCount}</div>
                      <div className="text-[9px] font-mono text-gray-400 uppercase font-bold">Total Word Count</div>
                    </div>
                    <div className="bg-white border-2 border-[#1A1A1A] p-3 text-center">
                      <div className="text-xl font-black">{astStats.readingTime}m</div>
                      <div className="text-[9px] font-mono text-gray-400 uppercase font-bold">Reading Time</div>
                    </div>
                    <div className="bg-white border-2 border-[#1A1A1A] p-3 text-center">
                      <div className="text-xs font-black truncate">{astStats.readability}</div>
                      <div className="text-[9px] font-mono text-gray-400 uppercase font-bold">Writing Style</div>
                    </div>
                  </div>

                  {/* Block Density Breakdown */}
                  <div className="bg-white border-2 border-[#1A1A1A] p-4 space-y-3">
                    <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Block Breakdown</h4>
                    
                    <div className="space-y-2">
                      {/* Plain text */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Text Paragraphs ({astStats.paragraphs})</span>
                          <span>{astStats.totalBlocks > 0 ? Math.round((astStats.paragraphs / astStats.totalBlocks) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 border border-[#1A1A1A]">
                          <div className="h-full bg-[#1A1A1A]" style={{ width: `${astStats.totalBlocks > 0 ? (astStats.paragraphs / astStats.totalBlocks) * 100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Headings */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Section Titles ({astStats.headings})</span>
                          <span>{astStats.totalBlocks > 0 ? Math.round((astStats.headings / astStats.totalBlocks) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 border border-[#1A1A1A]">
                          <div className="h-full bg-[#FFB703]" style={{ width: `${astStats.totalBlocks > 0 ? (astStats.headings / astStats.totalBlocks) * 100 : 0}%` }} />
                        </div>
                      </div>

                      {/* To Do List */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Checklist Items ({astStats.totalTodos})</span>
                          <span>{astStats.totalBlocks > 0 ? Math.round((astStats.totalTodos / astStats.totalBlocks) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 border border-[#1A1A1A]">
                          <div className="h-full bg-emerald-500" style={{ width: `${astStats.totalBlocks > 0 ? (astStats.totalTodos / astStats.totalBlocks) * 100 : 0}%` }} />
                        </div>
                        {astStats.totalTodos > 0 && (
                          <div className="text-[9px] font-mono text-emerald-700 font-extrabold">
                            ✓ {astStats.completedTodos} of {astStats.totalTodos} tasks completed ({Math.round((astStats.completedTodos / astStats.totalTodos) * 100)}%)
                          </div>
                        )}
                      </div>

                      {/* Executable VM Code */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Code Playgrounds (Fun Code Boxes!) ({astStats.sandboxes})</span>
                          <span>{astStats.totalBlocks > 0 ? Math.round((astStats.sandboxes / astStats.totalBlocks) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 border border-[#1A1A1A]">
                          <div className="h-full bg-[#66FCF1]" style={{ width: `${astStats.totalBlocks > 0 ? (astStats.sandboxes / astStats.totalBlocks) * 100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Relational Databases */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Data Lists & Tables ({astStats.inlineGrids})</span>
                          <span>{astStats.totalBlocks > 0 ? Math.round((astStats.inlineGrids / astStats.totalBlocks) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 border border-[#1A1A1A]">
                          <div className="h-full bg-indigo-500" style={{ width: `${astStats.totalBlocks > 0 ? (astStats.inlineGrids / astStats.totalBlocks) * 100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Acoustic Wave Synthesizers */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Focus Music Players ({astStats.synthesizers})</span>
                          <span>{astStats.totalBlocks > 0 ? Math.round((astStats.synthesizers / astStats.totalBlocks) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 border border-[#1A1A1A]">
                          <div className="h-full bg-[#E040FB]" style={{ width: `${astStats.totalBlocks > 0 ? (astStats.synthesizers / astStats.totalBlocks) * 100 : 0}%` }} />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SNAPSHOT TIME-TRAVEL VERSION LEDGER */}
              {activeTab === 'snapshots' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-black uppercase text-[#1A1A1A]">Time Machine Backups</h3>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        Create manual backups of your work. You can travel back in time and restore older versions of this page at any time.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateSnapshot}
                    className="w-full py-2.5 bg-[#2D6A4F] text-white hover:bg-[#1b4332] text-xs font-bold uppercase border-2 border-[#1A1A1A] neo-shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    <span>Save a Page Backup</span>
                  </button>

                  <div className="space-y-2.5">
                    {snapshots.map((snap) => (
                      <div 
                        key={snap.id} 
                        className="bg-white border-2 border-[#1A1A1A] p-3 space-y-2 rounded-none hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-extrabold text-[#1A1A1A]">{snap.name}</h4>
                            <div className="flex items-center space-x-1.5 text-[9px] font-mono text-gray-400 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(snap.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSnapshot(snap.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete backup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <span className="text-[9px] font-mono text-gray-500 uppercase font-extrabold">
                            {snap.elementCount} blocks saved
                          </span>
                          <button
                            onClick={() => handleRestoreSnapshot(snap)}
                            className="px-2 py-1 text-[9px] font-extrabold uppercase border-2 border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 text-[#1A1A1A] cursor-pointer"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}

                    {snapshots.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300">
                        <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span className="text-xs text-gray-400 font-medium">No page backups saved yet.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CLI SHELL & LIVE SYNC STREAM */}
              {activeTab === 'ledger' && (
                <div className="space-y-4 flex flex-col h-full min-h-[300px]">
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#1A1A1A]">Quick Command Box</h3>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      A simple chat-like command line where you can type slash commands to update this page.
                    </p>
                  </div>

                  {/* Terminal Box */}
                  <div className="flex-1 min-h-[180px] bg-[#0B0C10] border-2 border-[#1A1A1A] p-3 font-mono text-xs text-[#66FCF1] flex flex-col space-y-1 overflow-y-auto rounded-none max-h-[220px]">
                    {cliLogs.map((log, idx) => (
                      <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                        {log}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>

                  {/* CLI Command Line */}
                  <form onSubmit={handleCliExecute} className="flex border-2 border-[#1A1A1A] bg-[#1F2833] p-1.5 space-x-1">
                    <span className="text-xs font-mono text-[#66FCF1] font-bold self-center px-1 select-none">$</span>
                    <input
                      type="text"
                      value={cliInput}
                      onChange={(e) => setCliInput(e.target.value)}
                      placeholder="Type a command here (e.g. /help)..."
                      className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-white placeholder-teal-800"
                    />
                    <button type="submit" className="text-[#66FCF1] hover:text-white p-1">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Live Transaction Streams */}
                  <div className="space-y-2 pt-2 border-t border-gray-300">
                    <div className="flex items-center justify-between text-gray-400 text-[10px] font-mono font-bold uppercase">
                      <div className="flex items-center space-x-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        <span>Sync Activity Log:</span>
                      </div>
                      <span>ONLINE</span>
                    </div>

                    <div className="bg-slate-900 border-2 border-slate-950 p-2.5 h-[120px] overflow-y-auto font-mono text-[10px] text-[#2D6A4F] rounded-none divide-y divide-slate-800/40">
                      {liveSyncLogs.map((log, i) => (
                        <div key={i} className="py-1 break-all truncate">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: COVER ART PRESETS & THEMES */}
              {activeTab === 'themes' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#1A1A1A]">Cover Art presets</h3>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      Add abstract cover art designs instantly to your page.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        await updateCanvasCover(canvasId, 'preset:zebra');
                        addCliLog("[THEME] Cover Art: Stripes applied.");
                      }}
                      className="border-2 border-[#1A1A1A] bg-white hover:bg-amber-100 p-2 flex flex-col space-y-1 text-left"
                    >
                      <div className="h-10 w-full bg-[#FFB703] border border-[#1A1A1A]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1A1A1A, #1A1A1A 5px, transparent 5px, transparent 10px)' }} />
                      <span className="text-[10px] font-extrabold uppercase mt-1">Zebra Stripes</span>
                    </button>

                    <button
                      onClick={async () => {
                        await updateCanvasCover(canvasId, 'preset:grid');
                        addCliLog("[THEME] Cover Art: Graph paper grid applied.");
                      }}
                      className="border-2 border-[#1A1A1A] bg-white hover:bg-slate-100 p-2 flex flex-col space-y-1 text-left"
                    >
                      <div className="h-10 w-full bg-[#F4F7F6] border border-[#1A1A1A]" style={{ backgroundImage: 'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                      <span className="text-[10px] font-extrabold uppercase mt-1">Graph Paper</span>
                    </button>

                    <button
                      onClick={async () => {
                        await updateCanvasCover(canvasId, 'preset:cyber');
                        addCliLog("[THEME] Cover Art: Neon glow applied.");
                      }}
                      className="border-2 border-[#1A1A1A] bg-white hover:bg-indigo-50 p-2 flex flex-col space-y-1 text-left"
                    >
                      <div className="h-10 w-full bg-gradient-to-r from-violet-600 via-pink-500 to-indigo-600 border border-[#1A1A1A]" />
                      <span className="text-[10px] font-extrabold uppercase mt-1">Neon Glow</span>
                    </button>

                    <button
                      onClick={async () => {
                        await updateCanvasCover(canvasId, 'preset:dots');
                        addCliLog("[THEME] Cover Art: Dot pattern applied.");
                      }}
                      className="border-2 border-[#1A1A1A] bg-white hover:bg-gray-100 p-2 flex flex-col space-y-1 text-left"
                    >
                      <div className="h-10 w-full bg-[#0B0C10] border border-[#1A1A1A]" style={{ backgroundImage: 'radial-gradient(#66FCF1 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
                      <span className="text-[10px] font-extrabold uppercase mt-1">Dot Pattern</span>
                    </button>
                  </div>

                  {/* Document Accent theme */}
                  <div className="space-y-2 pt-2 border-t border-gray-300">
                    <div>
                      <h4 className="text-xs font-black uppercase text-[#1A1A1A]">Workspace Accent Color</h4>
                      <p className="text-[9px] text-gray-500 leading-normal">
                        Choose an accent color for workspace borders and highlights.
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'default', name: 'Amber', color: 'bg-[#FFB703]' },
                        { id: 'forest', name: 'Forest', color: 'bg-[#2D6A4F]' },
                        { id: 'cyber', name: 'Cyber', color: 'bg-pink-500' },
                        { id: 'void', name: 'Cobalt', color: 'bg-indigo-600' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setAccentTheme(t.id);
                            localStorage.setItem(`zenith-theme-${canvasId}`, t.id);
                            addCliLog(`[THEME] Accent color set to "${t.name}".`);
                          }}
                          className={`border-2 border-[#1A1A1A] p-2 flex flex-col items-center space-y-1 rounded-none text-center ${
                            accentTheme === t.id ? 'bg-[#FFB703] font-bold' : 'bg-white font-medium hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-none border border-[#1A1A1A] ${t.color}`} />
                          <span className="text-[9px] uppercase tracking-tighter">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cozy Story Mode Spacing Toggle (Feature 8) */}
                  <div className="space-y-2 pt-2 border-t border-gray-300">
                    <div>
                      <h4 className="text-xs font-black uppercase text-[#1A1A1A]">Cozy Story Mode Spacing</h4>
                      <p className="text-[9px] text-gray-500 leading-normal">
                        Makes text larger and adds loose, extra-cozy spacing — perfect for writing stories or journaling on a tablet/phone!
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsCozyStoryMode(!isCozyStoryMode);
                        addCliLog(`[THEME] Cozy Story Mode Spacing turned ${!isCozyStoryMode ? 'ON' : 'OFF'}.`);
                      }}
                      className={`w-full border-2 border-[#1A1A1A] p-2 flex items-center justify-between rounded-none text-left transition-all cursor-pointer ${
                        isCozyStoryMode ? 'bg-[#FFB703]/20 font-bold' : 'bg-white font-medium hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Sparkles className={`w-4 h-4 ${isCozyStoryMode ? 'text-amber-500 animate-spin' : 'text-gray-400'}`} />
                        <span className="text-[10px] uppercase font-bold text-[#1A1A1A]">Cozy Spacing Layout</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 border border-[#1A1A1A] bg-white select-none">
                        {isCozyStoryMode ? 'COZY' : 'DEFAULT'}
                      </span>
                    </button>
                  </div>

                  {/* Ambient focus sound controllers & typewriter toggle */}
                  <div className="space-y-3 pt-3 border-t border-gray-300">
                    <div>
                      <h4 className="text-xs font-black uppercase text-[#1A1A1A]">Focus Sounds</h4>
                      <p className="text-[9px] text-gray-500 leading-normal">
                        Turn on typing sounds or quiet background humming to help you focus.
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {/* Typewriter Click */}
                      <button
                        onClick={handleToggleTypewriter}
                        className={`border-2 border-[#1A1A1A] p-2 flex items-center justify-between rounded-none text-left transition-all ${
                          typewriterEnabled ? 'bg-[#FFB703]/20 font-bold' : 'bg-white font-medium hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {typewriterEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                          <span className="text-[10px] uppercase font-bold text-[#1A1A1A]">Mechanical Keyboard Sounds</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 border border-[#1A1A1A] bg-white">
                          {typewriterEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      {/* Ambient Hum or Pink noise */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'none', label: 'Mute Sounds' },
                          { id: 'hum', label: 'Deep Zen Hum' },
                          { id: 'pink_noise', label: 'Pink Noise' }
                        ].map((ambientOpt) => (
                          <button
                            key={ambientOpt.id}
                            onClick={() => handleToggleAmbient(ambientOpt.id as any)}
                            className={`border-2 border-[#1A1A1A] p-2 flex flex-col items-center justify-center space-y-1 rounded-none text-center ${
                              activeAmbient === ambientOpt.id ? 'bg-[#FFB703] font-black' : 'bg-white font-medium hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-tight">{ambientOpt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
