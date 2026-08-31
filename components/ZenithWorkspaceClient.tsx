"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus,
  Trash2,
  Lock,
  Unlock,
  Shield,
  Share2,
  Key,
  Users,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Save,
  CheckSquare,
  Sparkles,
  Clock,
  Eye,
  Activity,
  Compass,
  Music,
  Check,
  RotateCcw,
  BookOpen,
  Sliders,
  X,
  FileText,
  AlertTriangle,
  Mail,
  Calendar,
  Archive,
  RefreshCw,
  Palette
} from 'lucide-react';
import { estimateBoardWidth, nextEqualSlot, packEqualCards } from '@/lib/layout';
import { ThemeToggle } from '@/components/ThemeToggle';

// --- TYPES & INTERFACES ---
interface CanvasElement {
  id: string;
  type: 'text' | 'checklist' | 'sketch' | 'countdown' | 'media' | 'sound';
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  content?: string; // For text element
  checklistItems?: { id: string; text: string; done: boolean }[]; // For checklist
  sketchData?: string; // Data URL for canvas sketch
  countdownTarget?: string; // Date string
  mediaUrl?: string; // Image link
  soundType?: 'rain' | 'campfire' | 'ocean' | 'forest';
  soundVolume?: number;
  createdAt?: number; // added for archival/aging
  deadline?: string; // added for task deadline reminders
  livePreviewActive?: boolean; // added for dynamic live variable rendering
  stickers?: string[]; // added for Custom Canvas Layout Sticker Book
}

interface FamilyCanvas {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
  stationery: 'ivory' | 'blueprint' | 'cozy' | 'terminal' | 'cyber';
}

interface GuestPass {
  id: string;
  code: string;
  label: string;
  expiry: number;
}

interface ActivityLog {
  id: string;
  member: string;
  avatar: string;
  action: string;
  time: string;
  timestamp: number;
}

// --- HELPER FOR SSR SAFE IMPURE OPERATIONS ---
function getSafeTimestamp(): number {
  return typeof window !== 'undefined' ? Date.now() : 0;
}

function getSafeRandom(): number {
  return typeof window !== 'undefined' ? Math.random() : 0.5;
}

function buildHomeCards(now: number, mode: 'seed' | 'fresh' = 'seed'): CanvasElement[] {
  const p = mode === 'seed' ? 'elem' : `starter-${now}`;
  const tryMeId = mode === 'seed' ? 'todo-try-me' : `${p}-try-me`;
  const welcomeTitle = mode === 'seed' ? 'Welcome' : 'Welcome to Zenith Canvas!';
  return [
    {
      id: `${p}-welcome`,
      type: 'text',
      title: welcomeTitle,
      x: 0,
      y: 0,
      w: 260,
      h: 240,
      color: '#FEF08A',
      content: 'Family board. Check a box, or add a card from the bar.',
      createdAt: now,
      livePreviewActive: false
    },
    {
      id: `${p}-try-this`,
      type: 'checklist',
      title: 'Try this',
      x: 0,
      y: 0,
      w: 260,
      h: 240,
      color: '#A7F3D0',
      checklistItems: [
        { id: tryMeId, text: 'Check this off', done: false },
        { id: `${p}-todo-2`, text: 'Drag a card', done: false },
        { id: `${p}-todo-3`, text: 'Open Control Deck', done: false }
      ],
      createdAt: now
    },
    {
      id: `${p}-note`,
      type: 'text',
      title: 'Note',
      x: 0,
      y: 0,
      w: 260,
      h: 240,
      color: '#E0F2FE',
      content: 'Write a note.',
      createdAt: now,
      livePreviewActive: false
    },
    {
      id: `${p}-checklist`,
      type: 'checklist',
      title: 'Checklist',
      x: 0,
      y: 0,
      w: 260,
      h: 240,
      color: '#FFD8A8',
      checklistItems: [
        { id: `${p}-list-1`, text: 'First item', done: false },
        { id: `${p}-list-2`, text: 'Second item', done: false }
      ],
      createdAt: now
    },
    {
      id: `${p}-sketch`,
      type: 'sketch',
      title: 'Sketch',
      x: 0,
      y: 0,
      w: 260,
      h: 240,
      color: '#F5D0FE',
      sketchData: '',
      createdAt: now
    },
    {
      id: `${p}-timer`,
      type: 'countdown',
      title: 'Timer',
      x: 0,
      y: 0,
      w: 260,
      h: 240,
      color: '#FDE047',
      countdownTarget: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: now
    },
    {
      id: `${p}-sound`,
      type: 'sound',
      title: 'Sound',
      x: 0,
      y: 0,
      w: 260,
      h: 240,
      color: '#FBCFE8',
      soundType: 'rain',
      soundVolume: 0.5,
      createdAt: now
    }
  ];
}

function DeckSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="deck-section space-y-3">
      <header className="space-y-0.5">
        <h3 className="text-[13px] font-black tracking-tight text-black">{title}</h3>
        {hint ? <p className="text-[11px] text-stone-500 leading-snug">{hint}</p> : null}
      </header>
      {children}
    </section>
  );
}

function DeckToggleRow({
  label,
  hint,
  on,
  onClick,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-11 flex items-center justify-between gap-3 border-2 border-black bg-white px-3 py-2 text-left cursor-pointer hover:bg-stone-50"
    >
      <span className="min-w-0">
        <span className="block text-[12px] font-bold text-black">{label}</span>
        {hint ? <span className="block text-[11px] text-stone-500 mt-0.5 leading-snug">{hint}</span> : null}
      </span>
      <span className="deck-knob" data-on={on ? 'true' : 'false'} aria-hidden>
        <span className="deck-knob-dot" />
      </span>
    </button>
  );
}

function DeckSegment<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="grid border-2 border-black" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((opt, i) => (
        <button
          key={String(opt.id)}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`min-h-10 px-1 text-[11px] font-bold cursor-pointer ${
            i > 0 ? 'border-l-2 border-black' : ''
          } ${value === opt.id ? 'bg-black text-[#FFB703]' : 'bg-white hover:bg-stone-50 text-black'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ZenithWorkspace() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- STATE DECLARATIONS ---
  const [canvases, setCanvases] = useState<FamilyCanvas[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string>('');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  
  // Custom workspace parameters (Feature 8 controls)
  const [accentTheme, setAccentTheme] = useState<string>('yellow'); // yellow, green, blue, pink
  const [isCozyStoryMode, setIsCozyStoryMode] = useState<boolean>(false);
  const [borderWeight, setBorderWeight] = useState<number>(4); // 2px vs 4px
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [shadowDepth, setShadowDepth] = useState<string>('neo-shadow'); // none, neo-shadow-sm, neo-shadow, neo-shadow-lg
  
  // Ops Control Panel states
  const [activeTab, setActiveTab] = useState<'appearance' | 'safety' | 'sharing' | 'audio' | 'automations'>('appearance');
  const [isControlDeckOpen, setIsControlDeckOpen] = useState<boolean>(false);
  
  // Sharing & Safety states
  const [isReadOnlyMode, setIsReadOnlyMode] = useState<boolean>(false);
  const [isCopyInterceptEnabled, setIsCopyInterceptEnabled] = useState<boolean>(false);
  const [isCursorTrailsEnabled, setIsCursorTrailsEnabled] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  
  // PIN lock protection
  const [vaultPIN, setVaultPIN] = useState<string | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinSetupVal, setPinSetupVal] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Guest Passes & Activity Logs
  const [guestPasses, setGuestPasses] = useState<GuestPass[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [simulatedCursors, setSimulatedCursors] = useState<Array<{ name: string; avatar: string; x: number; y: number; color: string }>>([]);

  // Batch 9: Ready-Made Setup Templates & Automated Flows states
  const [archivedElements, setArchivedElements] = useState<CanvasElement[]>([]);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState<boolean>(true);
  const [weeklySpawnerEnabled, setWeeklySpawnerEnabled] = useState<boolean>(true);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState<boolean>(false);
  const [isDailyBannerDismissed, setIsDailyBannerDismissed] = useState<boolean>(true);
  const [highlightIncomplete, setHighlightIncomplete] = useState<boolean>(false);
  const [incomingEmail, setIncomingEmail] = useState({
    from: 'mom-inbox@zenith-mail.com',
    subject: 'Vet Appointment update 🐶',
    body: 'Please check the vet schedule! Teddy needs his shot on Thursday morning. Make sure to feed him on time.'
  });
  const [activeNotifications, setActiveNotifications] = useState<string[]>([]);

  // Premium Neo-Brutalist Custom Toasts and Confirm Modals (Browser Friendly & Performance-Optimized)
  interface ToastMessage {
    id: string;
    text: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  interface ConfirmConfig {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const triggerToast = (text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dragCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const resizeCoordsRef = useRef<{ w: number; h: number } | null>(null);

  // Audio Context Nodes state
  const [ambientAudioActive, setAmbientAudioActive] = useState<boolean>(false);
  const [audioVolumes, setAudioVolumes] = useState<{ rain: number; campfire: number; ocean: number; forest: number }>({
    rain: 0.3,
    campfire: 0,
    ocean: 0,
    forest: 0
  });

  // Batch 10: Engagement Delighters & Playful Milestones
  const [confettiPool, setConfettiPool] = useState<Array<{ id: number; left: number; top: number; color: string; size: number; duration: number; rotate: number }>>([]);
  const [streakCount, setStreakCount] = useState<number>(3); // defaulted to 3 days
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(5); // defaulted to 5
  const [mascotTipIndex, setMascotTipIndex] = useState<number>(0);
  const [isMascotBubbleOpen, setIsMascotBubbleOpen] = useState<boolean>(true);
  const [canvasBackgroundTheme, setCanvasBackgroundTheme] = useState<'default' | 'hearth' | 'moonlight' | 'ivory' | 'sunset' | 'slate'>('default');
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [activeStickerPickerId, setActiveStickerPickerId] = useState<string | null>(null);
  const [formattedDate, setFormattedDate] = useState<string>('');

  // Dragging and resizing states (Client Only)
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeStartSize, setResizeStartSize] = useState({ w: 0, h: 0 });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });

  // Refs for custom elements
  const boardRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<{ [key: string]: { oscs: OscillatorNode[]; gain: GainNode } }>({});

  // --- AUDIO SYNTHESIZER BEARDS (AMBIENT FOCUS NOISE GENERATOR) ---
  const getSafeAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch (e) {
      return null;
    }
  }, []);

  const triggerWarningBeep = useCallback(() => {
    try {
      const ctx = getSafeAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }, [getSafeAudioContext]);

  // --- INITIAL LOADING (LOCALSTORAGE) ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set formatted date for safe client hydration
    setFormattedDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

    // v3 first-paint: seven equal Home cards. Returning demo visitors
    // still have the two-card v2 board in localStorage — reset it.
    if (localStorage.getItem('zenith-ui-version') !== '3') {
      localStorage.removeItem('zenith-canvases');
      localStorage.removeItem('zenith-elements');
      localStorage.removeItem('zenith-active-canvas-id');
      localStorage.removeItem('zenith-family-activities');
      localStorage.setItem('zenith-ui-version', '3');
    }

    // Load Canvases
    const savedCanvases = localStorage.getItem('zenith-canvases');
    let loadedCanvases: FamilyCanvas[] = [];
    if (savedCanvases) {
      try {
        loadedCanvases = JSON.parse(savedCanvases);
      } catch (e) {
        loadedCanvases = [];
      }
    }

    if (loadedCanvases.length === 0) {
      loadedCanvases = [
        { id: 'canvas-1', name: 'Home', emoji: '🏠', createdAt: Date.now(), stationery: 'ivory' }
      ];
      localStorage.setItem('zenith-canvases', JSON.stringify(loadedCanvases));
    }
    setCanvases(loadedCanvases);

    // Set Active Canvas
    const savedActiveId = localStorage.getItem('zenith-active-canvas-id') || loadedCanvases[0]?.id || '';
    setActiveCanvasId(savedActiveId);

    // Load Elements
    const savedElements = localStorage.getItem('zenith-elements');
    if (savedElements) {
      try {
        setElements(JSON.parse(savedElements));
      } catch (e) {
        setElements([]);
      }
    } else {
      const defaultElements = packEqualCards(
        buildHomeCards(Date.now(), 'seed'),
        estimateBoardWidth(window.innerWidth)
      );
      setElements(defaultElements);
      localStorage.setItem('zenith-elements', JSON.stringify(defaultElements));
    }

    // Load PIN
    const savedPin = localStorage.getItem('zenith-vault-pin');
    if (savedPin) {
      setVaultPIN(savedPin);
      setIsVaultUnlocked(false);
    }

    // Load Guest Passes
    const savedPasses = localStorage.getItem('zenith-guest-passes');
    if (savedPasses) {
      try {
        setGuestPasses(JSON.parse(savedPasses));
      } catch (e) {}
    }

    // Load Logs
    const savedLogs = localStorage.getItem('zenith-family-activities');
    if (savedLogs) {
      try {
        setActivityLogs(JSON.parse(savedLogs));
      } catch (e) {}
    } else {
      const defaultLogs: ActivityLog[] = [
        { id: 'act-1', member: 'Mom', avatar: '👩‍🦰', action: '✏️ Updated checklist: "Grocery Runs"', time: '3 mins ago', timestamp: Date.now() - 180000 },
        { id: 'act-2', member: 'Dad', avatar: '👨‍🦱', action: '🧘 Activated Rain sound loop in Control Deck', time: '10 mins ago', timestamp: Date.now() - 600000 },
        { id: 'act-3', member: 'Lucy', avatar: '👧', action: '🎨 Drew a flower in "Quick Doodle Pad"', time: '1 hr ago', timestamp: Date.now() - 3600000 }
      ];
      setActivityLogs(defaultLogs);
      localStorage.setItem('zenith-family-activities', JSON.stringify(defaultLogs));
    }

    // Load Archived Elements and Preferences
    const savedArchived = localStorage.getItem('zenith-archived-elements');
    if (savedArchived) {
      try {
        setArchivedElements(JSON.parse(savedArchived));
      } catch (e) {}
    }
    const savedAutoArchive = localStorage.getItem('zenith-auto-archive-preference');
    if (savedAutoArchive !== null) {
      setAutoArchiveEnabled(savedAutoArchive === 'true');
    }
    const savedWeeklySpawner = localStorage.getItem('zenith-weekly-spawner-preference');
    if (savedWeeklySpawner !== null) {
      setWeeklySpawnerEnabled(savedWeeklySpawner === 'true');
    }

    const savedStreak = localStorage.getItem('zenith-streak-count');
    if (savedStreak !== null) setStreakCount(parseInt(savedStreak, 10));

    const savedTasksCount = localStorage.getItem('zenith-completed-tasks');
    if (savedTasksCount !== null) setCompletedTasksCount(parseInt(savedTasksCount, 10));

    const savedBgTheme = localStorage.getItem('zenith-viewport-theme') as any;
    if (savedBgTheme) setCanvasBackgroundTheme(savedBgTheme);
  }, []);

  // Sync canvases and elements state back to local storage
  useEffect(() => {
    if (canvases.length > 0) {
      localStorage.setItem('zenith-canvases', JSON.stringify(canvases));
    }
  }, [canvases]);

  useEffect(() => {
    if (elements.length > 0) {
      localStorage.setItem('zenith-elements', JSON.stringify(elements));
    }
  }, [elements]);

  useEffect(() => {
    localStorage.setItem('zenith-archived-elements', JSON.stringify(archivedElements));
  }, [archivedElements]);

  useEffect(() => {
    localStorage.setItem('zenith-auto-archive-preference', String(autoArchiveEnabled));
  }, [autoArchiveEnabled]);

  useEffect(() => {
    localStorage.setItem('zenith-weekly-spawner-preference', String(weeklySpawnerEnabled));
  }, [weeklySpawnerEnabled]);

  useEffect(() => {
    localStorage.setItem('zenith-streak-count', String(streakCount));
  }, [streakCount]);

  useEffect(() => {
    localStorage.setItem('zenith-completed-tasks', String(completedTasksCount));
  }, [completedTasksCount]);

  useEffect(() => {
    localStorage.setItem('zenith-viewport-theme', canvasBackgroundTheme);
  }, [canvasBackgroundTheme]);

  useEffect(() => {
    if (activeCanvasId) {
      localStorage.setItem('zenith-active-canvas-id', activeCanvasId);
      // Automatically lock again if active canvas changes and PIN is set
      if (vaultPIN) {
        setIsVaultUnlocked(false);
        setPinInput('');
      }
    }
  }, [activeCanvasId, vaultPIN]);

  // 83. Task-Driven Smart Date Notifications: Auto-scan elements for deadlines matching today's date
  useEffect(() => {
    const checkDeadlines = () => {
      // e.g. "2026-07-08"
      const todayStr = new Date().toISOString().split('T')[0];
      const matches: string[] = [];
      elements.forEach(e => {
        if (e.deadline === todayStr) {
          matches.push(`☑️ Checklist: "${e.title}" is due TODAY!`);
        }
        if (e.countdownTarget === todayStr) {
          matches.push(`⏳ Countdown: "${e.title}" target is TODAY!`);
        }
      });
      setActiveNotifications(matches);
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 20000);
    return () => clearInterval(interval);
  }, [elements]);

  // --- CONTENT COPY INTERCEPT GUARD ---
  useEffect(() => {
    if (!isCopyInterceptEnabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      // Visual feedback banner
      const banner = document.createElement('div');
      banner.className = "fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-[#FFB703] text-black border-4 border-black p-4 neo-shadow font-mono font-black text-xs uppercase flex flex-col gap-1 rounded-none text-center animate-bounce";
      banner.innerHTML = "⚠️ SECURITY COVERT INTERCEPT ACTIVE<br/><span class='text-[10px] text-gray-800 font-bold font-sans normal-case'>This shared family canvas is copy-protected to maintain layout integrity and private metadata values.</span>";
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 4000);

      // Play synthesizer warning beep
      triggerWarningBeep();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const banner = document.createElement('div');
      banner.className = "fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-red-500 text-white border-4 border-black p-4 neo-shadow font-mono font-black text-xs uppercase flex flex-col gap-1 rounded-none text-center animate-pulse";
      banner.innerHTML = "🚫 CONTEXT MENU RESTRICTED<br/><span class='text-[10px] text-red-100 font-bold font-sans normal-case'>Viewer operations are locked in cooperative safety mode.</span>";
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 3000);
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isCopyInterceptEnabled, triggerWarningBeep]);

  // --- COOPERATIVE LIVE CURSOR TRAILS SIMULATION ---
  useEffect(() => {
    if (!isCursorTrailsEnabled) {
      setSimulatedCursors([]);
      return;
    }

    const membersList = [
      { name: 'Mom', avatar: '👩‍🦰', color: '#EC4899' },
      { name: 'Dad', avatar: '👨‍🦱', color: '#3B82F6' },
      { name: 'Lucy', avatar: '👧', color: '#10B981' },
      { name: 'Billy', avatar: '👦', color: '#F59E0B' }
    ];

    // Initialize position list
    const initial = membersList.map(m => ({
      name: m.name,
      avatar: m.avatar,
      x: 300 + getSafeRandom() * 400,
      y: 200 + getSafeRandom() * 300,
      color: m.color
    }));
    setSimulatedCursors(initial);

    const interval = setInterval(() => {
      setSimulatedCursors(prev =>
        prev.map(c => {
          const dx = (getSafeRandom() - 0.5) * 160;
          const dy = (getSafeRandom() - 0.5) * 160;
          return {
            ...c,
            x: Math.max(100, Math.min(window.innerWidth - 300, c.x + dx)),
            y: Math.max(100, Math.min(window.innerHeight - 300, c.y + dy))
          };
        })
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [isCursorTrailsEnabled]);

  // --- MOUNTED GUARD FOR SSR ---
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] font-mono text-xs text-stone-500">
        <div className="text-center p-8 border-4 border-black bg-white neo-shadow max-w-sm">
          <h2 className="text-sm font-black uppercase mb-2">Zenith Workspace</h2>
          <p className="text-[10px] leading-relaxed text-[#1A1A1A] font-bold">
            Opening your board.
          </p>
        </div>
      </div>
    );
  }

  // --- AUDIO SYNTHESIZER BEARDS (AMBIENT FOCUS NOISE GENERATOR) ---
  const playMilestoneChime = () => {
    try {
      const ctx = getSafeAudioContext();
      if (!ctx) return;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25); // C6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.25); // E6

      gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.65);
      osc2.stop(ctx.currentTime + 0.65);
    } catch (e) {}
  };

  const triggerConfettiCelebrate = () => {
    const colors = ['#FFD8A8', '#FFB703', '#FF6B6B', '#4DABF7', '#51CF66', '#FCC419', '#E599F7'];
    const newConfetti = Array.from({ length: 45 }).map((_, idx) => ({
      id: Date.now() + idx,
      left: Math.random() * 100, // percentage left of viewport
      top: Math.random() * 40 + 40, // starting height
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 12 + 6,
      duration: Math.random() * 2 + 2.5, // 2.5s to 4.5s duration
      rotate: Math.random() * 360
    }));
    setConfettiPool(newConfetti);
    setTimeout(() => {
      setConfettiPool([]);
    }, 4500);
  };

  const toggleAmbientAudio = () => {
    if (typeof window === 'undefined') return;
    
    if (ambientAudioActive) {
      // Disconnect all
      Object.keys(audioNodesRef.current).forEach(key => {
        try {
          audioNodesRef.current[key].gain.disconnect();
          audioNodesRef.current[key].oscs.forEach(o => o.stop());
        } catch (e) {}
      });
      audioNodesRef.current = {};
      setAmbientAudioActive(false);
      addActivityLog('System', '🔇 Stopped custom ambient sound engine');
      return;
    }

    try {
      const ctx = getSafeAudioContext();
      if (!ctx) return;

      // Create synthetic noise nodes (Rain, campfire, waves, forest)
      const startSynthesizedLoop = (name: string, baseFreqs: number[], vol: number) => {
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(vol, ctx.currentTime);
        
        const oscs: OscillatorNode[] = [];
        baseFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          // Modulated parameters for ambient sound simulation
          osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          
          // Low-frequency oscillator (LFO) for wave/rain volume swells
          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.2 + idx * 0.1, ctx.currentTime);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(10, ctx.currentTime);
          
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();
          
          osc.connect(gainNode);
          osc.start();
          oscs.push(osc);
        });

        gainNode.connect(ctx.destination);
        audioNodesRef.current[name] = { oscs, gain: gainNode };
      };

      // Base configurations
      startSynthesizedLoop('rain', [90, 110, 140], audioVolumes.rain);
      startSynthesizedLoop('campfire', [120, 130], audioVolumes.campfire);
      startSynthesizedLoop('ocean', [55, 60], audioVolumes.ocean);
      startSynthesizedLoop('forest', [220, 310], audioVolumes.forest);

      setAmbientAudioActive(true);
      addActivityLog('System', '🔊 Initialized multi-track focus sound engine');
    } catch (e) {
      console.error('Audio initialization failed', e);
    }
  };

  const updateSoundVolume = (track: 'rain' | 'campfire' | 'ocean' | 'forest', val: number) => {
    setAudioVolumes(prev => {
      const next = { ...prev, [track]: val };
      if (ambientAudioActive && audioNodesRef.current[track]) {
        try {
          audioNodesRef.current[track].gain.gain.setValueAtTime(val, audioContextRef.current?.currentTime || 0);
        } catch (e) {}
      }
      return next;
    });
  };

  // --- LOGGING WORKFLOW ---
  const addActivityLog = (member: string, action: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${getSafeRandom()}`,
      member,
      avatar: member === 'Mom' ? '👩‍🦰' : member === 'Dad' ? '👨‍🦱' : member === 'Lucy' ? '👧' : member === 'Billy' ? '👦' : '🤖',
      action,
      time: 'Just now',
      timestamp: Date.now()
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev.slice(0, 15)];
      localStorage.setItem('zenith-family-activities', JSON.stringify(updated));
      return updated;
    });
  };

  // --- ACTIONS ---
  const handleCreateCanvas = () => {
    const name = prompt('Enter name for the new Family Canvas:');
    if (!name) return;
    const emojiList = ['🏠', '🌻', '🍎', '📅', '📝', '🔒', '💡', '🎒'];
    const randomEmoji = emojiList[Math.floor(getSafeRandom() * emojiList.length)];
    const newCanvas: FamilyCanvas = {
      id: `canvas-${Date.now()}`,
      name,
      emoji: randomEmoji,
      createdAt: Date.now(),
      stationery: 'ivory'
    };
    setCanvases(prev => [...prev, newCanvas]);
    setActiveCanvasId(newCanvas.id);
    addActivityLog('System', `📂 Spawned new Canvas Board "${randomEmoji} ${name}"`);
  };

  const handleDeleteCanvas = (id: string, name: string) => {
    if (canvases.length <= 1) {
      triggerToast('Keep at least one workspace open!', 'warning');
      return;
    }
    requestConfirm(
      'Delete Canvas Board',
      `Are you absolutely sure you want to remove canvas "${name}"?`,
      () => {
        const remaining = canvases.filter(c => c.id !== id);
        setCanvases(remaining);
        if (activeCanvasId === id) {
          setActiveCanvasId(remaining[0].id);
        }
        addActivityLog('System', `🗑️ Removed canvas board "${name}"`);
        triggerToast(`Successfully deleted canvas "${name}"`, 'success');
      }
    );
  };

  // Create workspace elements
  const handleAddElement = (type: 'text' | 'checklist' | 'sketch' | 'countdown' | 'media' | 'sound') => {
    if (isReadOnlyMode) {
      triggerToast('Read-Only Safe Mode is enabled in the Ops Control Deck. Turn it off to append objects.', 'error');
      return;
    }
    const colors = ['#FEF08A', '#A7F3D0', '#E0F2FE', '#FBCFE8', '#FDE047', '#FFD8A8'];
    const randomColor = colors[Math.floor(getSafeRandom() * colors.length)];
    
    const boardWidth = boardRef.current?.clientWidth || estimateBoardWidth(window.innerWidth);
    const slot = nextEqualSlot(elements.length, boardWidth);

    const newElement: CanvasElement = {
      id: `elem-${Date.now()}-${getSafeRandom()}`,
      type,
      title: `📝 New ${type.toUpperCase()}`,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      color: randomColor,
      content: type === 'text' ? 'Write thoughts, suggestions, or notes here...' : '',
      checklistItems: type === 'checklist' ? [{ id: `todo-${Date.now()}`, text: 'First list item', done: false }] : [],
      countdownTarget: type === 'countdown' ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
      mediaUrl: type === 'media' ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80' : '',
      createdAt: Date.now(),
      deadline: '',
      livePreviewActive: false
    };

    setElements(prev => [...prev, newElement]);
    addActivityLog('System', `➕ Mounted "${type}" component sandbox on the board`);
  };

  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    if (isReadOnlyMode) return;
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDeleteElement = (id: string, type: string) => {
    if (isReadOnlyMode) {
      triggerToast('Read-Only mode blocks element removals.', 'error');
      return;
    }
    setElements(prev => prev.filter(e => e.id !== id));
    addActivityLog('System', `🗑️ Purged "${type}" component sandbox from canvas`);
  };

  // --- BATCH 9 AUTOMATED WORKFLOW HELPER FUNCTIONS ---

  // 82. Dynamic Live Variable Inserter: replaces friendly placeholders with active date strings
  const parseDynamicVariables = (text: string): string => {
    if (!text) return '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
    const emailStr = 'devtechedge@gmail.com';
    return text
      .replace(/\{\{current_date\}\}/g, dateStr)
      .replace(/\{\{current_time\}\}/g, timeStr)
      .replace(/\{\{current_day\}\}/g, dayStr)
      .replace(/\{\{user_email\}\}/g, emailStr);
  };

  // 85. Smart Auto-Labeling Engine: auto-computes tags based on row words
  const getAutoLabels = (element: CanvasElement): string[] => {
    const labels: string[] = [];
    const textToScan = [
      element.title || '',
      element.content || '',
      ...(element.checklistItems || []).map(item => item.text)
    ].join(' ').toLowerCase();

    if (/school|class|exam|assignment|teacher|math|study|homework|college/i.test(textToScan)) {
      labels.push('School 📚');
    }
    if (/dog|cat|vet|pet|feed|kitten|puppy|animal|veterinary/i.test(textToScan)) {
      labels.push('Pet Care 🐾');
    }
    if (/milk|egg|store|grocery|buy|shop|supermarket|target|walmart/i.test(textToScan)) {
      labels.push('Shopping 🛒');
    }
    if (/gym|workout|run|swim|fitness|health|exercise|cardio|stretching/i.test(textToScan)) {
      labels.push('Health 🏃‍♂️');
    }
    if (/rent|bill|pay|invoice|price|cost|budget|finance|money|dollar|euro|invoice/i.test(textToScan)) {
      labels.push('Finance 💰');
    }
    if (/work|meeting|office|project|boss|client|schedule|corporate/i.test(textToScan)) {
      labels.push('Work 💼');
    }
    return labels;
  };

  // 84. Automated Weekly Layout Spawner: automatically creates empty layouts every Sunday
  const triggerWeeklySpawner = (force: boolean = false) => {
    if (isReadOnlyMode) {
      triggerToast('Safety Guard: Read-Only mode is active.', 'error');
      return;
    }
    
    const spawnerTime = Date.now();
    const newItems: CanvasElement[] = [
      {
        id: `elem-weekly-1-${spawnerTime}`,
        type: 'checklist',
        title: '📅 Weekly Agenda (Mon-Wed)',
        x: 80,
        y: 120,
        w: 280,
        h: 260,
        color: '#E0F2FE',
        checklistItems: [
          { id: `sp-item-1-${spawnerTime}`, text: 'Organize high school binders', done: false },
          { id: `sp-item-2-${spawnerTime}`, text: 'Review Math syllabus chapters', done: false },
          { id: `sp-item-3-${spawnerTime}`, text: 'Finish weekly spelling assignments', done: false }
        ],
        createdAt: spawnerTime
      },
      {
        id: `elem-weekly-2-${spawnerTime}`,
        type: 'checklist',
        title: '📅 Weekly Agenda (Thu-Fri)',
        x: 390,
        y: 120,
        w: 280,
        h: 260,
        color: '#A7F3D0',
        checklistItems: [
          { id: `sp-item-4-${spawnerTime}`, text: 'Prepare presentation notes', done: false },
          { id: `sp-item-5-${spawnerTime}`, text: 'Submit science fair outline draft', done: false },
          { id: `sp-item-6-${spawnerTime}`, text: 'Verify weekend event tickets', done: false }
        ],
        createdAt: spawnerTime
      },
      {
        id: `elem-weekly-3-${spawnerTime}`,
        type: 'checklist',
        title: '🎉 Weekend Family Fun',
        x: 700,
        y: 120,
        w: 280,
        h: 220,
        color: '#FDE047',
        checklistItems: [
          { id: `sp-item-7-${spawnerTime}`, text: 'Plan Sunday hiking trip route', done: false },
          { id: `sp-item-8-${spawnerTime}`, text: 'Saturday night popcorn movie session', done: false }
        ],
        createdAt: spawnerTime
      },
      {
        id: `elem-weekly-4-${spawnerTime}`,
        type: 'text',
        title: '📝 Weekly Reflection Log',
        x: 80,
        y: 400,
        w: 420,
        h: 200,
        color: '#FBCFE8',
        content: 'Reflections for the week of {{current_date}}:\n\nReflections:\n- \n\n🎯 What we can improve next week:\n- \n\n💭 Cozy thoughts:',
        createdAt: spawnerTime,
        livePreviewActive: false
      }
    ];

    setElements(prev => [...prev, ...newItems]);
    addActivityLog('System', '🤖 Executed Automated Weekly Layout Spawner');
    if (force) {
      triggerToast('Weekly Checklist Layout successfully spawned!', 'success');
    }
  };

  // 89. Archival Expiration Schedule Rule: moves stale, month-old items into archive folder
  const archiveStaleElements = () => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    // Find elements that are older than 30 days
    const stale = elements.filter(e => {
      const created = e.createdAt || now;
      return (now - created) > thirtyDaysMs;
    });
    
    if (stale.length === 0) {
      triggerToast('Archival Scan complete: No stale (30+ days old) items were found.', 'info');
      return;
    }
    
    setElements(prev => prev.filter(e => {
      const created = e.createdAt || now;
      return (now - created) <= thirtyDaysMs;
    }));
    
    setArchivedElements(prev => [...prev, ...stale]);
    addActivityLog('System', `🧹 Moved ${stale.length} month-old items into the folder archives`);
    triggerToast(`Success! Scanned board and archived ${stale.length} stale cards.`, 'success');
  };

  // 81. One-Click Page Template Blueprints: sets up ready-made structures instantly
  const loadBlueprintTemplate = (blueprintType: 'school' | 'pet' | 'wellness', append: boolean) => {
    if (isReadOnlyMode) {
      triggerToast('Read-Only mode blocks adding blueprints.', 'error');
      return;
    }

    const t = Date.now();
    let blueprintElements: CanvasElement[] = [];

    if (blueprintType === 'school') {
      blueprintElements = [
        {
          id: `school-elem-1-${t}`,
          type: 'text',
          title: '📚 Academic Planner Instructions',
          x: 40,
          y: 60,
          w: 300,
          h: 220,
          color: '#FEF08A',
          content: 'Hello Student! Here is your school planner template.\n\nToday is {{current_date}} ({{current_day}}).\n\nKeep track of courses, assignments, and study materials here!',
          createdAt: t,
          livePreviewActive: true
        },
        {
          id: `school-elem-2-${t}`,
          type: 'checklist',
          title: '✏️ Homework & Assignments List',
          x: 360,
          y: 60,
          w: 280,
          h: 260,
          color: '#A7F3D0',
          checklistItems: [
            { id: `todo-school-1-${t}`, text: 'Complete algebra page 45 exercises', done: false },
            { id: `todo-school-2-${t}`, text: 'Write draft for biology report', done: false },
            { id: `todo-school-3-${t}`, text: 'Revise chemistry periodic table notes', done: false }
          ],
          createdAt: t
        },
        {
          id: `school-elem-3-${t}`,
          type: 'countdown',
          title: '⏳ Math Midterm Exam Alarm',
          x: 660,
          y: 60,
          w: 300,
          h: 210,
          color: '#FDE047',
          countdownTarget: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: t
        },
        {
          id: `school-elem-4-${t}`,
          type: 'sound',
          title: '🎧 Lofi Studying Station',
          x: 40,
          y: 300,
          w: 280,
          h: 250,
          color: '#FBCFE8',
          soundType: 'rain',
          soundVolume: 0.4,
          createdAt: t
        }
      ];
    } else if (blueprintType === 'pet') {
      blueprintElements = [
        {
          id: `pet-elem-1-${t}`,
          type: 'text',
          title: '🐾 Veterinary Info & Contacts',
          x: 40,
          y: 60,
          w: 300,
          h: 220,
          color: '#FBCFE8',
          content: '🐶 PET CARE LOG\n\nVeterinary Clinic: Oakwood Animal Hospital\nPhone: (555) 234-5678\nTeddy\'s Grooming details: Last visited 2 weeks ago.\n\nEmergency services: (555) 911-PETS',
          createdAt: t,
          livePreviewActive: false
        },
        {
          id: `pet-elem-2-${t}`,
          type: 'checklist',
          title: '🐕 Daily Teddy Walks & Feeding',
          x: 360,
          y: 60,
          w: 280,
          h: 260,
          color: '#FEF08A',
          checklistItems: [
            { id: `todo-pet-1-${t}`, text: 'Morning walk & park fetch play (30m)', done: false },
            { id: `todo-pet-2-${t}`, text: 'Serve breakfast dry kibble with salmon oil', done: false },
            { id: `todo-pet-3-${t}`, text: 'Check water bowl level and clean it', done: false },
            { id: `todo-pet-4-${t}`, text: 'Evening stroll & grooming brushing', done: false }
          ],
          createdAt: t
        },
        {
          id: `pet-elem-3-${t}`,
          type: 'media',
          title: '🐕 Teddy\'s Photo Desk',
          x: 660,
          y: 60,
          w: 300,
          h: 280,
          color: '#E0F2FE',
          mediaUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80',
          createdAt: t
        }
      ];
    } else if (blueprintType === 'wellness') {
      blueprintElements = [
        {
          id: `well-elem-1-${t}`,
          type: 'text',
          title: '🧘 Daily Wellness Guide',
          x: 40,
          y: 60,
          w: 320,
          h: 220,
          color: '#E0F2FE',
          content: 'Hello, take a deep breath in...\n\nToday is {{current_day}}, {{current_date}}.\n\nUse this cozy layout to track your physical workouts, drinking patterns, and sound focus to align your mental energy.',
          createdAt: t,
          livePreviewActive: true
        },
        {
          id: `well-elem-2-${t}`,
          type: 'checklist',
          title: '🏃‍♂️ Vital Fitness Routines',
          x: 380,
          y: 60,
          w: 280,
          h: 260,
          color: '#A7F3D0',
          checklistItems: [
            { id: `todo-well-1-${t}`, text: 'Drink 3 liters of spring water', done: false },
            { id: `todo-well-2-${t}`, text: 'Perform 30 minutes cardio session', done: false },
            { id: `todo-well-3-${t}`, text: 'Read 10 pages of book', done: false },
            { id: `todo-well-4-${t}`, text: 'Evening meditation breathing exercises', done: false }
          ],
          createdAt: t
        },
        {
          id: `well-elem-3-${t}`,
          type: 'sound',
          title: '🧘 Forest Yoga Zen',
          x: 680,
          y: 60,
          w: 280,
          h: 250,
          color: '#FDE047',
          soundType: 'forest',
          soundVolume: 0.6,
          createdAt: t
        }
      ];
    }

    if (append) {
      setElements(prev => [...prev, ...blueprintElements]);
      addActivityLog('System', `📑 Appended Ready-Made "${blueprintType.toUpperCase()}" template blueprint`);
    } else {
      setElements(blueprintElements);
      addActivityLog('System', `📑 Loaded & Reset board to "${blueprintType.toUpperCase()}" template blueprint`);
    }

    setShowBlueprintModal(false);
  };

  // 90. One-Touch Layout Reset Blueprint: unchecks all completed items
  const triggerGlobalLayoutReset = () => {
    if (isReadOnlyMode) {
      triggerToast('Safety Guard: Read-only mode is active.', 'error');
      return;
    }
    setElements(prev => prev.map(e => {
      if (e.type === 'checklist' && e.checklistItems) {
        return {
          ...e,
          checklistItems: e.checklistItems.map(item => ({ ...item, done: false }))
        };
      }
      return e;
    }));
    addActivityLog('System', '🧹 Triggered global layout checklist reset');
    triggerToast('All checked checklist items have been reset to unchecked!', 'success');
  };

  const triggerIndividualChecklistReset = (id: string) => {
    if (isReadOnlyMode) return;
    setElements(prev => prev.map(e => {
      if (e.id === id && e.checklistItems) {
        return {
          ...e,
          checklistItems: e.checklistItems.map(item => ({ ...item, done: false }))
        };
      }
      return e;
    }));
    addActivityLog('System', '🧹 Reset checklist card tasks to unchecked');
  };

  // 87. Email-to-Page Inbox Hook simulation
  const handleSimulatedEmailSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      triggerToast('Safety Guard: Read-Only mode is active.', 'error');
      return;
    }
    const t = Date.now();
    const newMailElement: CanvasElement = {
      id: `elem-email-${t}`,
      type: 'text',
      title: `📬 Email: ${incomingEmail.subject}`,
      x: 120,
      y: 120,
      w: 320,
      h: 240,
      color: '#FBCFE8',
      content: `From: ${incomingEmail.from}\nSubject: ${incomingEmail.subject}\nReceived: {{current_time}}\n\n${incomingEmail.body}`,
      createdAt: t,
      livePreviewActive: false
    };

    setElements(prev => [newMailElement, ...prev]);
    addActivityLog('System', `📨 Simulated Email-to-Page Inbox hook received from ${incomingEmail.from}`);
    triggerToast(`Email hooked successfully as a new card: "📬 Email: ${incomingEmail.subject}"`, 'success');
  };

  // 86. Click-to-import upload handler (for manual imports when drop is not used)
  const handleManualImportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const t = Date.now();
      if (file.name.endsWith('.csv') || text.includes(',')) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const checklistItems = lines.map((l, idx) => {
          let itemText = l.startsWith('- ') ? l.substring(2) : l;
          // Protect against CSV Formula Injection (OWASP Security Audit)
          if (['=', '+', '-', '@'].some(char => itemText.startsWith(char))) {
            itemText = `'${itemText}`;
          }
          return {
            id: `csv-todo-${idx}-${t}`,
            text: itemText,
            done: false
          };
        });
        const newElement: CanvasElement = {
          id: `elem-csv-${t}`,
          type: 'checklist',
          title: `📊 Imported List: ${file.name.replace(/\.[^/.]+$/, "")}`,
          x: 100,
          y: 100,
          w: 300,
          h: 260,
          color: '#E0F2FE',
          checklistItems: checklistItems,
          createdAt: t
        };
        setElements(prev => [...prev, newElement]);
        addActivityLog('System', `📥 Manually imported CSV spreadsheet: "${file.name}"`);
        triggerToast('CSV spreadsheet successfully imported as a Checklist widget!', 'success');
      } else {
        const newElement: CanvasElement = {
          id: `elem-txt-${t}`,
          type: 'text',
          title: `📄 Imported Note: ${file.name.replace(/\.[^/.]+$/, "")}`,
          x: 100,
          y: 100,
          w: 320,
          h: 240,
          color: '#FEF08A',
          content: text,
          createdAt: t,
          livePreviewActive: false
        };
        setElements(prev => [...prev, newElement]);
        addActivityLog('System', `📥 Manually imported Text document: "${file.name}"`);
        triggerToast('Text file successfully imported as a Sticky Note widget!', 'success');
      }
    };
    reader.readAsText(file);
  };

  // --- EXPORT / IMPORT FULL LOCAL DATABASE ---
  const handleExportBackup = () => {
    try {
      const dbArchive = {
        canvases,
        elements,
        guestPasses,
        activityLogs,
        appearance: { accentTheme, isCozyStoryMode, borderWeight, textSize, shadowDepth }
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dbArchive, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `zenith_family_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addActivityLog('Admin', '💾 Exported complete database backup archive file');
      triggerToast('Database backup successfully generated and downloaded!', 'success');
    } catch (e) {
      triggerToast('Backup generation failed.', 'error');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const targetFile = event.target.files?.[0];
    if (!targetFile) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.canvases && parsed.elements) {
          setCanvases(parsed.canvases);
          setElements(parsed.elements);
          if (parsed.guestPasses) setGuestPasses(parsed.guestPasses);
          if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
          if (parsed.appearance) {
            if (parsed.appearance.accentTheme) setAccentTheme(parsed.appearance.accentTheme);
            if (parsed.appearance.isCozyStoryMode !== undefined) setIsCozyStoryMode(parsed.appearance.isCozyStoryMode);
            if (parsed.appearance.borderWeight) setBorderWeight(parsed.appearance.borderWeight);
            if (parsed.appearance.textSize) setTextSize(parsed.appearance.textSize);
            if (parsed.appearance.shadowDepth) setShadowDepth(parsed.appearance.shadowDepth);
          }
          triggerToast('Backup Database imported successfully!', 'success');
          addActivityLog('Admin', '📂 Fully restored workspace from imported JSON database archive');
        } else {
          triggerToast('Invalid backup structure.', 'error');
        }
      } catch (err) {
        triggerToast('Failed to parse backup JSON.', 'error');
      }
    };
    fileReader.readAsText(targetFile);
  };

  // 86. External File Drop Importer
  const handleFileDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    if (isReadOnlyMode) {
      triggerToast('Safety Guard: Read-Only mode is active.', 'error');
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const t = Date.now();
      
      if (file.name.endsWith('.csv') || text.includes(',')) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const checklistItems = lines.map((l, idx) => {
          let itemText = l.startsWith('- ') ? l.substring(2) : l;
          // Protect against CSV Formula Injection (OWASP Security Audit)
          if (['=', '+', '-', '@'].some(char => itemText.startsWith(char))) {
            itemText = `'${itemText}`;
          }
          return {
            id: `csv-todo-${idx}-${t}`,
            text: itemText,
            done: false
          };
        });
        
        const newElement: CanvasElement = {
          id: `elem-csv-${t}`,
          type: 'checklist',
          title: `📊 Dropped List: ${file.name.replace(/\.[^/.]+$/, "")}`,
          x: 100,
          y: 120,
          w: 300,
          h: 260,
          color: '#E0F2FE',
          checklistItems: checklistItems,
          createdAt: t
        };
        setElements(prev => [...prev, newElement]);
        addActivityLog('System', `📥 Dropped CSV spreadsheet: "${file.name}" unpacked as Checklist`);
        triggerToast('Excel/CSV Spreadsheet unpacked successfully!', 'success');
      } else {
        const newElement: CanvasElement = {
          id: `elem-txt-${t}`,
          type: 'text',
          title: `📄 Dropped Note: ${file.name.replace(/\.[^/.]+$/, "")}`,
          x: 120,
          y: 120,
          w: 320,
          h: 240,
          color: '#FEF08A',
          content: text,
          createdAt: t,
          livePreviewActive: false
        };
        setElements(prev => [...prev, newElement]);
        addActivityLog('System', `📥 Dropped TXT note: "${file.name}" unpacked as Sticky Note`);
        triggerToast('Text document unpacked successfully!', 'success');
      }
    };
    reader.readAsText(file);
  };

  // --- PIN LOCK FLOW ---
  const handleSetPIN = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinSetupVal.length !== 4 || isNaN(Number(pinSetupVal))) {
      triggerToast('PIN must be exactly 4 numeric digits.', 'error');
      return;
    }
    localStorage.setItem('zenith-vault-pin', pinSetupVal);
    setVaultPIN(pinSetupVal);
    setIsVaultUnlocked(true);
    setPinSetupVal('');
    addActivityLog('Admin', '🔒 Configured 4-digit Private PIN Vault barrier');
  };

  const handleRemovePIN = () => {
    localStorage.removeItem('zenith-vault-pin');
    setVaultPIN(null);
    setIsVaultUnlocked(false);
    setPinInput('');
    addActivityLog('Admin', '🔓 Dismantled Private PIN Vault shield');
  };

  const handleUnlockWithPIN = () => {
    if (pinInput === vaultPIN) {
      setIsVaultUnlocked(true);
      setPinError(false);
      setPinInput('');
      addActivityLog('Visitor', '🔑 Successfully unlocked PIN Private Vault access');
    } else {
      setPinError(true);
      setPinInput('');
      triggerWarningBeep();
      setTimeout(() => setPinError(false), 1200);
    }
  };

  // --- EXPIRING GUEST ACCESS PASSES ---
  const handleGenerateGuestPass = (days: number) => {
    const code = 'ZEN-' + Math.floor(100000 + getSafeRandom() * 900000);
    const newPass: GuestPass = {
      id: `pass-${Date.now()}-${getSafeRandom()}`,
      code,
      label: `${days}-Day Access Pass`,
      expiry: Date.now() + days * 24 * 60 * 60 * 1000
    };
    const nextPasses = [...guestPasses, newPass];
    setGuestPasses(nextPasses);
    localStorage.setItem('zenith-guest-passes', JSON.stringify(nextPasses));
    addActivityLog('Admin', `🎫 Generated ${days}-day guest pass "${code}"`);
  };

  const handleRevokeGuestPass = (id: string, code: string) => {
    const nextPasses = guestPasses.filter(p => p.id !== id);
    setGuestPasses(nextPasses);
    localStorage.setItem('zenith-guest-passes', JSON.stringify(nextPasses));
    addActivityLog('Admin', `🎟️ Revoked guest pass "${code}"`);
  };

  // --- DRAG / RESIZE MECHANICS ---
  const handleDragStart = (e: React.MouseEvent, id: string, element: CanvasElement) => {
    if (isReadOnlyMode) return;
    if (isResizing) return;
    setDraggedElementId(id);
    setDragOffset({
      x: e.clientX - element.x,
      y: e.clientY - element.y
    });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (draggedElementId && !isResizing) {
      const activeEl = elements.find(el => el.id === draggedElementId);
      if (!activeEl) return;
      const nx = e.clientX - dragOffset.x;
      const ny = e.clientY - dragOffset.y;
      const safeX = Math.max(10, Math.min(2000, nx));
      const safeY = Math.max(10, Math.min(2000, ny));

      // Direct DOM style update for ultimate performance bypass
      const cardEl = document.getElementById(`card-${draggedElementId}`);
      if (cardEl) {
        cardEl.style.left = `${safeX}px`;
        cardEl.style.top = `${safeY}px`;
      }
      dragCoordsRef.current = { x: safeX, y: safeY };
    }

    if (isResizing && draggedElementId) {
      const activeEl = elements.find(el => el.id === draggedElementId);
      if (!activeEl) return;
      const dw = e.clientX - resizeStartPos.x;
      const dh = e.clientY - resizeStartPos.y;
      const safeW = Math.max(200, resizeStartSize.w + dw);
      const safeH = Math.max(150, resizeStartSize.h + dh);

      // Direct DOM style update for ultimate performance bypass
      const cardEl = document.getElementById(`card-${draggedElementId}`);
      if (cardEl) {
        cardEl.style.width = `${safeW}px`;
        cardEl.style.height = `${safeH}px`;
      }
      resizeCoordsRef.current = { w: safeW, h: safeH };
    }
  };

  const handleDragEnd = () => {
    if (draggedElementId) {
      if (!isResizing && dragCoordsRef.current) {
        handleUpdateElement(draggedElementId, {
          x: dragCoordsRef.current.x,
          y: dragCoordsRef.current.y
        });
      } else if (isResizing && resizeCoordsRef.current) {
        handleUpdateElement(draggedElementId, {
          w: resizeCoordsRef.current.w,
          h: resizeCoordsRef.current.h
        });
      }
    }
    setDraggedElementId(null);
    setIsResizing(false);
    dragCoordsRef.current = null;
    resizeCoordsRef.current = null;
  };

  const handleResizeStart = (e: React.MouseEvent, id: string, element: CanvasElement) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggedElementId(id);
    setIsResizing(true);
    setResizeStartSize({ w: element.w, h: element.h });
    setResizeStartPos({ x: e.clientX, y: e.clientY });
  };

  // Active Canvas Theme class helpers
  const currentCanvas = canvases.find(c => c.id === activeCanvasId) || canvases[0];
  const activeStationery = currentCanvas?.stationery || 'ivory';

  const getProductivityStars = () => {
    const allChecklistItems = elements.flatMap(e => e.checklistItems || []);
    if (allChecklistItems.length === 0) return 3; // default
    const completed = allChecklistItems.filter(i => i.done).length;
    const ratio = completed / allChecklistItems.length;
    if (ratio <= 0.2) return 1;
    if (ratio <= 0.4) return 2;
    if (ratio <= 0.6) return 3;
    if (ratio <= 0.8) return 4;
    return 5;
  };

  const getStationeryClass = () => {
    // Custom cozy background themes override
    if (canvasBackgroundTheme && canvasBackgroundTheme !== 'default') {
      switch (canvasBackgroundTheme) {
        case 'hearth':
          return 'bg-gradient-to-tr from-amber-950 via-[#3a1d0f] to-[#78350F] text-amber-100 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px]';
        case 'moonlight':
          return 'bg-gradient-to-b from-[#020617] via-[#091e14] to-[#022c22] text-emerald-100 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:22px_22px]';
        case 'ivory':
          return 'bg-[#FDFBF7] text-amber-950 bg-[radial-gradient(#b45309_0.5px,transparent_0.5px)] [background-size:20px_20px]';
        case 'sunset':
          return 'bg-gradient-to-br from-[#2e1065] via-[#4c0519] to-[#3b0764] text-[#fdf2f8] bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:18px_18px]';
        case 'slate':
          return 'bg-gradient-to-r from-stone-900 via-stone-800 to-neutral-900 text-stone-100 bg-[radial-gradient(#78716c_1px,transparent_1px)] [background-size:20px_20px]';
      }
    }

    switch (activeStationery) {
      case 'blueprint':
        return 'bg-sky-950 text-sky-100 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:16px_16px]';
      case 'cozy':
        return 'bg-[#FAF6F0] text-amber-950 border-amber-900 bg-[radial-gradient(#eab308_0.5px,transparent_0.5px)] [background-size:24px_24px]';
      case 'terminal':
        return 'bg-[#0A0F0D] text-emerald-400 font-mono';
      case 'cyber':
        return 'bg-[#181124] text-pink-300 bg-[linear-gradient(rgba(244,63,94,0.05)_1px,transparent_1px)] [background-size:100%_4px]';
      case 'ivory':
      default:
        return 'bg-[#FCFBF7] text-stone-900 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px]';
    }
  };

  // Sketch Pad Whiteboard Helpers
  const DrawingCanvas = ({ element }: { element: CanvasElement }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#1A1A1A');

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw saved data URL
      if (element.sketchData) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = element.sketchData;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, [element.sketchData]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isReadOnlyMode) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || isReadOnlyMode) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL();
      handleUpdateElement(element.id, { sketchData: dataUrl });
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      handleUpdateElement(element.id, { sketchData: '' });
    };

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-1 mb-1 bg-white/60 p-1 border border-black/20">
          <div className="flex gap-1.5">
            {['#1A1A1A', '#DC2626', '#2563EB', '#16A34A', '#D97706'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-3.5 h-3.5 border border-black rounded-none cursor-pointer ${color === c ? 'ring-2 ring-[#FFB703]' : ''}`}
              />
            ))}
          </div>
          <button
            onClick={clearCanvas}
            className="text-[8px] font-black uppercase border border-black px-1.5 py-0.5 bg-white hover:bg-stone-100"
          >
            Clear
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={element.w - 30}
          height={element.h - 90}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="bg-white border-2 border-black flex-1 cursor-crosshair touch-none"
        />
      </div>
    );
  };

  try {
    return (
      <div data-testid="workspace-shell" className={`min-h-screen flex flex-col md:flex-row relative overflow-hidden select-none`}>
      {/* Dynamic Keyframes for Confetti Float animations (Batch 10 Feature 91) */}
      <style>{`
        @keyframes confettiFloatUp {
          0% {
            transform: translateY(20vh) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-110vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>

      {/* Floating Confetti Celebrations */}
      <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
        {confettiPool.map(particle => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.left}%`,
              bottom: '0px',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              transform: `rotate(${particle.rotate}deg)`,
              animation: `confettiFloatUp ${particle.duration}s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
            }}
            className="rounded-sm opacity-90 animate-pulse"
          />
        ))}
      </div>
      
      {/* --- PIN GATE OVERLAY PANEL --- */}
      {vaultPIN && !isVaultUnlocked && (
        <div className="fixed inset-0 bg-neutral-950/95 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-black p-6 w-full max-w-sm neo-shadow rounded-none text-center relative">
            <div className="w-16 h-16 bg-red-100 border-4 border-black flex items-center justify-center mx-auto mb-4 text-red-600 animate-pulse">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-md font-black uppercase tracking-widest mb-1 text-black">Private Workspace Vault</h2>
            <p className="text-[11px] text-gray-500 font-bold mb-4">
              Enter the 4-digit security PIN to access elements on this board.
            </p>

            {/* Dialpad Display */}
            <div className={`border-4 border-black h-14 flex items-center justify-center font-mono text-2xl tracking-widest mb-4 bg-stone-100 ${pinError ? 'bg-red-50 text-red-600 border-red-600 animate-shake' : 'text-black font-black'}`}>
              {pinError ? 'FAIL' : '• '.repeat(pinInput.length) + '_ '.repeat(4 - pinInput.length)}
            </div>

            {/* Custom Interactive Dialpad Grid */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => pinInput.length < 4 && setPinInput(p => p + num)}
                  className="bg-stone-50 hover:bg-stone-100 active:translate-y-0.5 active:shadow-none border-2 border-black p-2 text-xs font-black uppercase rounded-none cursor-pointer transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPinInput('')}
                className="bg-rose-500 hover:bg-rose-600 text-white border-2 border-black p-2 text-[10px] font-black uppercase rounded-none cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => pinInput.length < 4 && setPinInput(p => p + '0')}
                className="bg-stone-50 hover:bg-stone-100 border-2 border-black p-2 text-xs font-black uppercase rounded-none cursor-pointer"
              >
                0
              </button>
              <button
                onClick={handleUnlockWithPIN}
                disabled={pinInput.length !== 4}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white border-2 border-black p-2 text-[10px] font-black uppercase rounded-none cursor-pointer font-black"
              >
                Enter
              </button>
            </div>

            <div className="text-[9px] text-gray-400 font-mono flex items-center justify-center gap-1 mt-2">
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>Workspace Safe Shield Shielding active</span>
            </div>
          </div>
        </div>
      )}

      {/* --- LEFT SIDEBAR PANEL --- */}
      <aside className="w-full md:w-64 bg-white border-b-4 md:border-b-0 md:border-r-4 border-black p-4 flex flex-col shrink-0 z-20">
        <div className="flex items-center gap-2 pb-4 border-b-2 border-black mb-4">
          <div className="w-10 h-10 bg-[#FFB703] border-2 border-black flex items-center justify-center neo-shadow-sm shrink-0">
            <Compass className="w-6 h-6 text-black animate-spin-slow" />
          </div>
          <div>
            <h1 data-testid="workspace-title" className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]">Zenith Workspace</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase leading-none">Family board</p>
          </div>
        </div>

        {/* Canvases Directory list */}
        <div className="flex-1 space-y-2 overflow-y-auto mb-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Canvases ({canvases.length})</span>
            <button
              onClick={handleCreateCanvas}
              className="p-1 hover:bg-[#FFB703] border-2 border-black bg-white rounded-none cursor-pointer"
              title="Add New Canvas"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {canvases.map(canvas => (
              <div
                key={canvas.id}
                className={`flex items-center justify-between border-2 p-2 rounded-none transition-all cursor-pointer ${
                  activeCanvasId === canvas.id
                    ? 'bg-[#FFB703] border-black font-black neo-shadow-sm translate-x-1'
                    : 'bg-white border-transparent hover:border-black/40'
                }`}
                onClick={() => setActiveCanvasId(canvas.id)}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-sm">{canvas.emoji}</span>
                  <span className="text-xs truncate">{canvas.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCanvas(canvas.id, canvas.name);
                  }}
                  className="p-0.5 hover:bg-red-500 hover:text-white border border-transparent hover:border-black rounded-none cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsControlDeckOpen(true)}
          data-testid="control-deck-open"
          className="w-full bg-[#1A1A1A] hover:bg-[#FFB703] hover:text-black text-white p-2 font-bold uppercase tracking-wider text-center border-2 border-black transition-colors rounded-none cursor-pointer flex items-center justify-center gap-1"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Control Deck</span>
        </button>
      </aside>

      {/* --- MAIN CANVAS CONTENT SECTION --- */}
      <main
        data-testid="canvas-board"
        ref={boardRef}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
        onDragEnter={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => handleFileDrop(e)}
        className={`flex-1 relative overflow-auto p-6 ${getStationeryClass()} min-h-[600px] transition-colors`}
      >
        {isDraggingFile && (
          <div className="absolute inset-0 bg-[#FFD8A8]/90 z-50 flex flex-col items-center justify-center border-8 border-dashed border-black p-8 text-center backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-4 border-black p-6 neo-shadow max-w-sm rounded-none text-black">
              <Upload className="w-12 h-12 mx-auto mb-4 animate-bounce" />
              <h3 className="text-sm font-black uppercase tracking-wider mb-2">Unpack Document Widget</h3>
              <p className="text-[11px] text-stone-600 font-black leading-normal">
                Release your `.txt` or `.csv` spreadsheet files right here to instantly unpack them into interactive board widget components!
              </p>
            </div>
          </div>
        )}
        {/* Smart Deadline Alerts */}
        {activeNotifications.length > 0 && (
          <div className="mb-4 space-y-2">
            {activeNotifications.map((alertMessage, i) => (
              <div
                key={i}
                className="bg-amber-300 text-black border-4 border-black p-3.5 neo-shadow rounded-none flex items-center justify-between font-black text-xs uppercase animate-bounce"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{alertMessage}</span>
                </div>
                <span className="bg-black text-[#FFB703] px-2 py-0.5 text-[8px] font-black tracking-wider border border-black">
                  DUE TODAY
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 88. Daily Reminder Notification Banner */}
        {!isDailyBannerDismissed && (
          <div className="bg-[#A7F3D0] text-black border-4 border-black p-4 md:p-5 neo-shadow rounded-none mb-6 relative transition-all animate-in fade-in slide-in-from-top duration-300">
            <button
              onClick={() => setIsDailyBannerDismissed(true)}
              className="absolute top-3 right-3 p-1 hover:bg-black hover:text-[#A7F3D0] border-2 border-black bg-white rounded-none cursor-pointer"
              title="Dismiss Briefing"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest bg-black text-[#A7F3D0] px-2 py-0.5 rounded-none border border-black inline-block">
                  Cozy Family Companion
                </span>
                <h3 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-1.5 mt-1">
                  <span>🏡 Good Morning, Family Briefing</span>
                  {formattedDate && (
                    <span className="text-xs font-normal font-sans text-stone-700 capitalize">
                      • {formattedDate}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-stone-700 font-bold max-w-2xl leading-relaxed">
                  Welcome to Zenith! You have{' '}
                  <span className="font-extrabold text-black underline decoration-2 decoration-red-500">
                    {elements.filter(e => e.type === 'checklist' && e.checklistItems?.some(i => !i.done)).length} checklist boards
                  </span>{' '}
                  containing pending action items. Manage them below or toggle highlighting to identify gaps.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setHighlightIncomplete(prev => !prev)}
                  className={`border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5 ${
                    highlightIncomplete ? 'bg-red-500 text-white border-black' : 'bg-white text-black hover:bg-stone-50'
                  }`}
                >
                  {highlightIncomplete ? '● Highlighting Active' : '🔍 Highlight Pending'}
                </button>
                <button
                  onClick={triggerGlobalLayoutReset}
                  className="bg-[#FEF08A] text-black hover:bg-[#FDE047] border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>One-Touch Reset</span>
                </button>
                <button
                  onClick={() => triggerWeeklySpawner(true)}
                  className="bg-[#E0F2FE] text-black hover:bg-sky-200 border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
                >
                  Spawn Weekly
                </button>
                <button
                  onClick={() => setShowBlueprintModal(true)}
                  className="bg-[#FBCFE8] text-black hover:bg-pink-200 border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
                >
                  📑 Templates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic header row inside canvas space */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-black/10 mb-8">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{currentCanvas?.emoji || '📋'}</span>
              <h2 className="text-lg font-black uppercase tracking-tight">
                {currentCanvas?.name || 'Loading Canvas...'}
              </h2>
            </div>
            <p className="text-[11px] opacity-75 mt-0.5">
              Drag cards. Check things off.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => handleAddElement('text')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black w-[6.75rem] h-9 inline-flex items-center justify-center text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Note
            </button>
            <button
              onClick={() => handleAddElement('checklist')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black w-[6.75rem] h-9 inline-flex items-center justify-center text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Checklist
            </button>
            <button
              onClick={() => handleAddElement('sketch')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black w-[6.75rem] h-9 inline-flex items-center justify-center text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Sketch
            </button>
            <button
              onClick={() => handleAddElement('countdown')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black w-[6.75rem] h-9 inline-flex items-center justify-center text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Timer
            </button>
            <button
              onClick={() => handleAddElement('sound')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black w-[6.75rem] h-9 inline-flex items-center justify-center text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Sound
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Floating Cooperative Cursor Trails overlay */}
        {isCursorTrailsEnabled &&
          simulatedCursors.map(cursor => (
            <div
              key={cursor.name}
              className="absolute pointer-events-none z-50 flex flex-col items-start transition-all duration-1000 ease-out"
              style={{ left: cursor.x, top: cursor.y }}
            >
              <div className="flex items-center space-x-1 bg-white border-2 border-black p-1 rounded-none neo-shadow-sm text-[10px] font-black text-black">
                <span>{cursor.avatar}</span>
                <span>{cursor.name}</span>
              </div>
              <svg className="w-5 h-5 -mt-1 -ml-1 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 3V17l4-4 4 8 2.5-1.5-4-8 5.5-1.5L4.5 3z" />
              </svg>
            </div>
          ))}

        {/* Empty State warning */}
        {elements.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-black/20 bg-stone-50/50 max-w-xl mx-auto my-12 text-center text-stone-500">
            <Sparkles className="w-10 h-10 text-gray-300 mb-2 animate-bounce" />
            <h3 className="font-bold uppercase text-stone-700">Canvas Board is Clean</h3>
            <p className="text-xs max-w-md mt-1 leading-normal">
              Click any of the &quot;+ Add Component&quot; buttons above to append a sticky note, interactive todo list, drawing pad canvas, or audio mixers to your board!
            </p>
          </div>
        )}

        {/* --- ELEMENTS GRID CANVAS BOARD --- */}
        <div className="relative min-h-[500px]">
          {elements.map(element => {
            const sizeClass = textSize === 'sm' ? 'text-xs' : textSize === 'lg' ? 'text-base' : 'text-sm';
            const hasIncompleteChecklist = element.type === 'checklist' && element.checklistItems && element.checklistItems.some(i => !i.done);
            const isHighlighted = highlightIncomplete && hasIncompleteChecklist;

            return (
              <div
                key={element.id}
                data-testid="canvas-card"
                style={{
                  position: 'absolute',
                  left: element.x,
                  top: element.y,
                  width: element.w,
                  height: element.h,
                  backgroundColor: element.color,
                  zIndex: draggedElementId === element.id ? 40 : 10,
                }}
                className={`border-${borderWeight} border-black p-3 flex flex-col rounded-none cursor-default select-none ${shadowDepth} transition-all relative ${isHighlighted ? 'ring-4 ring-rose-500 animate-pulse' : ''}`}
                id={`card-${element.id}`}
              >
                {/* Visual Sticker Stamps overlay (Batch 10 Feature 98) */}
                {element.stickers && element.stickers.length > 0 && (
                  <div className="absolute -bottom-2 -right-2 flex gap-1 pointer-events-none z-30 select-none">
                    {element.stickers.map((stk, idx) => (
                      <span
                        key={idx}
                        className="text-lg bg-white border-2 border-black px-1.5 py-0.5 rounded-none neo-shadow-sm font-black transform rotate-12 scale-110 select-none block animate-bounce"
                        style={{ animationDelay: `${idx * 0.15}s` }}
                      >
                        {stk}
                      </span>
                    ))}
                  </div>
                )}

                {/* Drag handle header bar */}
                <div
                  onMouseDown={(e) => handleDragStart(e, element.id, element)}
                  className="bg-black/10 -mx-3 -mt-3 p-1.5 px-3 flex items-center justify-between cursor-move border-b-2 border-black text-black select-none"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider truncate flex items-center gap-1.5">
                    {element.type === 'sketch' && '🎨'}
                    {element.type === 'checklist' && '☑️'}
                    {element.type === 'text' && '📌'}
                    {element.type === 'countdown' && '⏳'}
                    {element.type === 'sound' && '🎵'}
                    {element.title}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Sticker stamp book trigger (Batch 10 Feature 98) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const stickersList = ['🦉', '🚀', '☕', '🔥', '🎉', '💡', '🏆', '🍕'];
                        const currentStickers = element.stickers || [];
                        const randomSticker = stickersList[Math.floor(Math.random() * stickersList.length)];
                        const nextStickers = currentStickers.includes(randomSticker) 
                          ? currentStickers.filter(s => s !== randomSticker)
                          : [...currentStickers, randomSticker];
                        handleUpdateElement(element.id, { stickers: nextStickers });
                        playMilestoneChime();
                        triggerConfettiCelebrate();
                        addActivityLog('System', `✨ Applied a lovely ${randomSticker} sticker onto "${element.title}"`);
                      }}
                      title="Sticker Stamp Book: Toggle visual sticker stamps!"
                      className="p-0.5 bg-white/40 hover:bg-[#FFB703] text-black border border-black rounded-none cursor-pointer flex items-center justify-center"
                    >
                      <span className="text-[10px] leading-none">✨</span>
                    </button>
                    {element.type === 'checklist' && (
                      <button
                        onClick={() => triggerIndividualChecklistReset(element.id)}
                        title="Reset Checklist Checklist Items"
                        className="p-0.5 bg-white/45 hover:bg-amber-400 text-black border border-black rounded-none cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteElement(element.id, element.type)}
                      className="p-0.5 bg-white/40 hover:bg-red-500 hover:text-white border border-black rounded-none cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Card Main content body based on type */}
                <div className={`flex-1 overflow-y-auto pt-2 text-[#1A1A1A] ${sizeClass}`}>
                  {/* TEXT TYPE */}
                  {element.type === 'text' && (
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-black/5 shrink-0">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Dynamic Note</span>
                        <button
                          onClick={() => handleUpdateElement(element.id, { livePreviewActive: !element.livePreviewActive })}
                          className={`px-1.5 py-0.5 border text-[8px] font-black uppercase tracking-wider rounded-none cursor-pointer transition-all ${
                            element.livePreviewActive 
                              ? 'bg-amber-400 text-black border-black neo-shadow-sm' 
                              : 'bg-stone-100 text-gray-600 border-stone-300'
                          }`}
                        >
                          {element.livePreviewActive ? '👁️ Live Render' : '✏️ Code Raw'}
                        </button>
                      </div>
                      <div className="flex-1 min-h-[80px]">
                        {element.livePreviewActive ? (
                          <div className="w-full h-full bg-white/40 p-1.5 border border-black/10 font-bold text-xs leading-relaxed overflow-y-auto select-text whitespace-pre-wrap rounded-none">
                            {parseDynamicVariables(element.content || '')}
                          </div>
                        ) : (
                          <textarea
                            value={element.content || ''}
                            disabled={isReadOnlyMode}
                            onChange={(e) => handleUpdateElement(element.id, { content: e.target.value })}
                            placeholder="Type note details... use placeholders like {{current_date}}, {{current_time}}, {{current_day}}, or {{user_email}}!"
                            className="w-full h-full bg-transparent border-0 focus:ring-0 p-0 text-xs font-semibold leading-relaxed focus:outline-none resize-none"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* CHECKLIST TYPE */}
                  {element.type === 'checklist' && (
                    <div className="flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto space-y-1.5">
                        {element.checklistItems?.map(item => (
                          <label key={item.id} className="flex items-start space-x-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.done}
                              disabled={isReadOnlyMode}
                              data-testid={`checklist-toggle-${item.id}`}
                              onChange={() => {
                                const nextDoneValue = !item.done;
                                const updatedItems = element.checklistItems?.map(i =>
                                  i.id === item.id ? { ...i, done: nextDoneValue } : i
                                );
                                handleUpdateElement(element.id, { checklistItems: updatedItems });
                                if (nextDoneValue) {
                                  playMilestoneChime();
                                  triggerConfettiCelebrate();
                                  setCompletedTasksCount(prev => prev + 1);
                                  addActivityLog('System', `🎉 Completed task: "${item.text}"`);
                                }
                              }}
                              className="mt-0.5 rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer animate-none"
                            />
                            <span className={`text-[11px] font-bold ${item.done ? 'line-through text-black/50' : ''}`}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* Add new checklist entry box */}
                      {!isReadOnlyMode && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const input = form.elements.namedItem('todoText') as HTMLInputElement;
                            if (!input.value.trim()) return;
                            const newItem = {
                              id: `todo-${Date.now()}-${getSafeRandom()}`,
                              text: input.value,
                              done: false
                            };
                            const items = [...(element.checklistItems || []), newItem];
                            handleUpdateElement(element.id, { checklistItems: items });
                            input.value = '';
                          }}
                          className="flex gap-1 mt-2 pt-2 border-t border-black/10 shrink-0"
                        >
                          <input
                            type="text"
                            name="todoText"
                            placeholder="Add item..."
                            className="flex-1 text-[10px] border-2 border-black p-1 focus:outline-none bg-white rounded-none"
                          />
                          <button
                            type="submit"
                            className="bg-black text-[#FFB703] border-2 border-black px-2 py-1 text-[10px] font-black uppercase rounded-none cursor-pointer"
                          >
                            Add
                          </button>
                        </form>
                      )}

                      {/* 83. Deadline Date Input for smart alerts */}
                      <div className="flex items-center justify-between text-[10px] mt-2 pt-1.5 border-t border-black/10 shrink-0">
                        <span className="font-bold text-black/70 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-600" />
                          <span>Deadline:</span>
                        </span>
                        <input
                          type="date"
                          value={element.deadline || ''}
                          disabled={isReadOnlyMode}
                          onChange={(e) => handleUpdateElement(element.id, { deadline: e.target.value })}
                          className="text-[9px] border-2 border-black bg-white px-1 py-0.5 rounded-none font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* SKETCH TYPE */}
                  {element.type === 'sketch' && <DrawingCanvas element={element} />}

                  {/* COUNTDOWN TYPE */}
                  {element.type === 'countdown' && (
                    <div className="flex flex-col items-center justify-center text-center space-y-2 h-full">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-black/60">Target: {element.countdownTarget}</div>
                      <div className="text-2xl font-black font-mono tracking-widest bg-black text-[#FFB703] px-3 py-1.5 border-2 border-black neo-shadow-sm">
                        {(() => {
                          if (!element.countdownTarget) return '00:00:00';
                          const diff = new Date(element.countdownTarget).getTime() - Date.now();
                          if (diff <= 0) return 'EVENT ONGOING 🎉';
                          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          return `${days}D:${hours}H:${minutes}M`;
                        })()}
                      </div>
                      <input
                        type="date"
                        value={element.countdownTarget}
                        disabled={isReadOnlyMode}
                        onChange={(e) => handleUpdateElement(element.id, { countdownTarget: e.target.value })}
                        className="text-[10px] border-2 border-black bg-white p-1 rounded-none focus:outline-none font-bold cursor-pointer"
                      />
                    </div>
                  )}

                  {/* SOUND MIXER TYPE */}
                  {element.type === 'sound' && (
                    <div className="space-y-2 h-full flex flex-col justify-center">
                      <div className="text-[10px] font-black uppercase text-stone-600 flex items-center justify-between">
                        <span>🎹 Ambient Loop Controllers</span>
                        <button
                          onClick={toggleAmbientAudio}
                          className={`px-1.5 py-0.5 border-2 border-black font-black uppercase text-[8px] cursor-pointer ${
                            ambientAudioActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                          }`}
                        >
                          {ambientAudioActive ? 'ENG OFF' : 'ENG ON'}
                        </button>
                      </div>

                      <div className="space-y-1.5 text-[10px] font-bold">
                        <div className="flex items-center justify-between">
                          <span>🌧️ Rain Storm</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={audioVolumes.rain}
                            onChange={(e) => updateSoundVolume('rain', parseFloat(e.target.value))}
                            className="w-24 cursor-pointer accent-black"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🔥 Wood Crackle</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={audioVolumes.campfire}
                            onChange={(e) => updateSoundVolume('campfire', parseFloat(e.target.value))}
                            className="w-24 cursor-pointer accent-black"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🌊 Ocean Wave Swell</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={audioVolumes.ocean}
                            onChange={(e) => updateSoundVolume('ocean', parseFloat(e.target.value))}
                            className="w-24 cursor-pointer accent-black"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🌲 Forest Whispers</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={audioVolumes.forest}
                            onChange={(e) => updateSoundVolume('forest', parseFloat(e.target.value))}
                            className="w-24 cursor-pointer accent-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 85. Smart Auto-Labeling tags list displayed dynamically */}
                {(() => {
                  const computedLabels = getAutoLabels(element);
                  if (computedLabels.length > 0) {
                    return (
                      <div className="mt-1.5 pt-1.5 border-t-2 border-black/10 flex flex-wrap gap-1 shrink-0">
                        {computedLabels.map(lbl => (
                          <span
                            key={lbl}
                            className="text-[8px] font-black uppercase tracking-wider bg-white border border-black px-1.5 py-0.5 rounded-none text-black neo-shadow-sm shrink-0"
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Resize trigger anchor */}
                {!isReadOnlyMode && (
                  <div
                    onMouseDown={(e) => handleResizeStart(e, element.id, element)}
                    className="absolute bottom-0 right-0 w-4 h-4 bg-black cursor-se-resize flex items-center justify-center shrink-0"
                    style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* --- RIGHT OPS CONTROL DECK DRAWER --- */}
      {isControlDeckOpen && (
        <>
        <button
          type="button"
          aria-label="Close Control Deck"
          onClick={() => setIsControlDeckOpen(false)}
          className="fixed inset-0 z-40 bg-black/35 cursor-pointer"
        />
        <aside
          data-testid="control-deck"
          className="fixed top-0 right-0 h-full w-full max-w-md bg-[#F7F4EE] border-l-4 border-black flex flex-col z-50 neo-shadow-lg"
        >
            <div className="bg-[#FFB703] border-b-4 border-black px-5 py-4 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/55">Workspace</p>
                <h2 className="text-[17px] font-black tracking-tight text-black leading-tight mt-0.5">Zenith Control Deck</h2>
                <p className="text-[12px] text-black/70 mt-1 leading-snug">Look, lock, share, and reset — without leaving the board.</p>
              </div>
              <button
                onClick={() => setIsControlDeckOpen(false)}
                className="w-11 h-11 shrink-0 hover:bg-black hover:text-[#FFB703] border-2 border-black bg-white cursor-pointer flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 border-b-4 border-black shrink-0">
              {([
                { id: 'appearance', label: 'Look', Icon: Palette },
                { id: 'safety', label: 'Lock', Icon: Shield },
                { id: 'sharing', label: 'Share', Icon: Share2 },
                { id: 'audio', label: 'Data', Icon: Archive },
                { id: 'automations', label: 'Auto', Icon: Sparkles },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`control-tab-${tab.id}`}
                  className={`min-h-12 px-1 py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold cursor-pointer border-r-2 border-black last:border-r-0 ${
                    activeTab === tab.id
                      ? 'bg-black text-[#FFB703]'
                      : 'bg-[#F7F4EE] text-stone-600 hover:bg-white'
                  }`}
                >
                  <tab.Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* TAB 1: APPEARANCE */}
              {activeTab === 'appearance' && (
                <div className="space-y-3">
                  <DeckSection title="Paper" hint="The board’s stationery.">
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { id: 'ivory', label: 'Ivory', swatch: '#FCFBF7' },
                        { id: 'blueprint', label: 'Blueprint', swatch: '#0c4a6e' },
                        { id: 'cozy', label: 'Cozy', swatch: '#FAF6F0' },
                        { id: 'terminal', label: 'Terminal', swatch: '#0A0F0D' },
                        { id: 'cyber', label: 'Cyber', swatch: '#181124' },
                      ] as const).map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setCanvases(prev =>
                              prev.map(c => (c.id === activeCanvasId ? { ...c, stationery: theme.id } : c))
                            );
                            addActivityLog('System', `🎨 Swapped workspace stationery background to: ${theme.id}`);
                          }}
                          className={`min-h-10 px-2.5 py-2 border-2 border-black text-[12px] font-bold text-left cursor-pointer ${
                            activeStationery === theme.id ? 'bg-[#FFB703]' : 'bg-white hover:bg-stone-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-black shrink-0" style={{ background: theme.swatch }} />
                            {theme.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </DeckSection>

                  <DeckSection title="Mood" hint="A wash over the stationery.">
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'default', label: 'None', swatch: '#F7F4EE' },
                        { id: 'hearth', label: 'Hearth', swatch: '#78350F' },
                        { id: 'moonlight', label: 'Moonlight', swatch: '#022c22' },
                        { id: 'ivory', label: 'Antique', swatch: '#FDFBF7' },
                        { id: 'sunset', label: 'Sunset', swatch: '#4c0519' },
                        { id: 'slate', label: 'Slate', swatch: '#292524' },
                      ].map(bgTheme => (
                        <button
                          key={bgTheme.id}
                          onClick={() => {
                            setCanvasBackgroundTheme(bgTheme.id as any);
                            playMilestoneChime();
                            triggerConfettiCelebrate();
                            addActivityLog('System', `🎭 Changed ambient background mood to: ${bgTheme.label}`);
                          }}
                          className={`min-h-10 px-2.5 py-2 border-2 border-black text-[12px] font-bold text-left cursor-pointer ${
                            canvasBackgroundTheme === bgTheme.id ? 'bg-[#FFB703]' : 'bg-white hover:bg-stone-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-black shrink-0" style={{ background: bgTheme.swatch }} />
                            {bgTheme.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </DeckSection>

                  <DeckSection title="Stroke">
                    <DeckSegment
                      options={[{ id: 2, label: '2px' }, { id: 4, label: '4px' }]}
                      value={borderWeight}
                      onChange={setBorderWeight}
                    />
                  </DeckSection>

                  <DeckSection title="Type">
                    <DeckSegment
                      options={[
                        { id: 'sm', label: 'Small' },
                        { id: 'md', label: 'Medium' },
                        { id: 'lg', label: 'Large' },
                      ]}
                      value={textSize}
                      onChange={setTextSize}
                    />
                  </DeckSection>

                  <DeckSection title="Shadow">
                    <DeckSegment
                      options={[
                        { id: 'none', label: 'Flat' },
                        { id: 'neo-shadow-sm', label: 'Soft' },
                        { id: 'neo-shadow', label: 'Bold' },
                        { id: 'neo-shadow-lg', label: 'Giant' },
                      ]}
                      value={shadowDepth}
                      onChange={setShadowDepth}
                    />
                  </DeckSection>
                </div>
              )}

              {/* TAB 2: SAFETY LOCKS */}
              {activeTab === 'safety' && (
                <div className="space-y-3">
                  <DeckSection title="Editing" hint="Lock the board so nobody nudges a card.">
                    <DeckSegment
                      options={[
                        { id: 'edit', label: 'Can edit' },
                        { id: 'readonly', label: 'Read-only' },
                      ]}
                      value={isReadOnlyMode ? 'readonly' : 'edit'}
                      onChange={(next) => {
                        const readOnly = next === 'readonly';
                        setIsReadOnlyMode(readOnly);
                        addActivityLog('System', readOnly ? '👓 Read-Only safeguarding toggle turned ON' : '✍️ Full-Edit writing canvas turned ON');
                      }}
                    />
                  </DeckSection>

                  <DeckSection title="PIN lock" hint="A 4-digit gate on this browser. Not a real vault.">
                    {!vaultPIN ? (
                      <form onSubmit={handleSetPIN} className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="••••"
                            value={pinSetupVal}
                            onChange={(e) => setPinSetupVal(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 min-h-11 text-sm border-2 border-black px-3 font-mono tracking-[0.4em] focus:outline-none bg-white"
                          />
                          <button
                            type="submit"
                            disabled={pinSetupVal.length !== 4}
                            className="min-h-11 bg-black text-[#FFB703] hover:bg-stone-800 disabled:opacity-40 text-[12px] font-black px-4 border-2 border-black cursor-pointer"
                          >
                            Set
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="min-h-11 border-2 border-black bg-white px-3 py-2 flex items-center justify-between">
                        <span className="text-[12px] font-bold flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          PIN is on
                        </span>
                        <button
                          onClick={handleRemovePIN}
                          className="text-[12px] font-bold underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </DeckSection>

                  <DeckSection title="Clipboard">
                    <DeckToggleRow
                      label="Block copy"
                      hint="Beep and skip the clipboard."
                      on={isCopyInterceptEnabled}
                      onClick={() => {
                        const next = !isCopyInterceptEnabled;
                        setIsCopyInterceptEnabled(next);
                        addActivityLog('System', `🛡️ Copy Intercept Shield turned ${next ? 'ON' : 'OFF'}`);
                      }}
                    />
                  </DeckSection>
                </div>
              )}

              {/* TAB 3: SHARING ACCESS */}
              {activeTab === 'sharing' && (
                <div className="space-y-3">
                  <DeckSection title="Share link" hint="Copy a URL. This demo does not host a live share.">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full min-h-11 bg-black text-[#FFB703] hover:bg-stone-800 border-2 border-black px-3 font-black text-[12px] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Generate link
                    </button>
                  </DeckSection>

                  <DeckSection title="Guest passes" hint="Local codes only — they live in this browser.">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleGenerateGuestPass(1)}
                        className="min-h-10 bg-white hover:bg-stone-50 border-2 border-black text-[12px] font-bold cursor-pointer"
                      >
                        1 day
                      </button>
                      <button
                        onClick={() => handleGenerateGuestPass(7)}
                        className="min-h-10 bg-white hover:bg-stone-50 border-2 border-black text-[12px] font-bold cursor-pointer"
                      >
                        7 days
                      </button>
                    </div>
                    {guestPasses.length > 0 && (
                      <div className="border-2 border-black max-h-36 overflow-y-auto divide-y-2 divide-black bg-white">
                        {guestPasses.map(pass => (
                          <div key={pass.id} className="px-3 py-2 flex items-center justify-between gap-2 text-[12px]">
                            <div className="min-w-0">
                              <span className="font-mono font-bold bg-[#FFB703] px-1.5 py-0.5 border border-black">{pass.code}</span>
                              <span className="ml-2 text-stone-500">{pass.label}</span>
                            </div>
                            <button
                              onClick={() => handleRevokeGuestPass(pass.id, pass.code)}
                              className="text-[12px] font-bold underline cursor-pointer shrink-0"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </DeckSection>

                  <DeckSection title="Presence">
                    <DeckToggleRow
                      label="Cursor trails"
                      hint="Fake family cursors on the board."
                      on={isCursorTrailsEnabled}
                      onClick={() => {
                        const next = !isCursorTrailsEnabled;
                        setIsCursorTrailsEnabled(next);
                        addActivityLog('System', `👥 Simulated cooperator cursors trails turned ${next ? 'ON' : 'OFF'}`);
                      }}
                    />
                  </DeckSection>
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="space-y-3">
                  <DeckSection title="Backup" hint="Download or restore this browser’s JSON snapshot.">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={handleExportBackup}
                        className="min-h-11 bg-black text-[#FFB703] text-[12px] font-black border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer hover:bg-stone-800"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <label className="min-h-11 bg-white hover:bg-stone-50 text-black text-[12px] font-black border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Import
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </DeckSection>

                  <DeckSection title="Activity" hint="A local log. Simulate adds a fake family event.">
                    <button
                      onClick={() => {
                        const members = ['Mom', 'Dad', 'Lucy', 'Billy'];
                        const actions = [
                          'Appended checklist items to Grocery Runs',
                          'Drafted a sketch',
                          'Recalibrated a countdown',
                          'Tuned ambient audio',
                          'Reset the lock screen'
                        ];
                        const m = members[Math.floor(getSafeRandom() * members.length)];
                        const a = actions[Math.floor(getSafeRandom() * actions.length)];
                        addActivityLog(m, a);
                      }}
                      className="min-h-10 w-full bg-white hover:bg-stone-50 border-2 border-black text-[12px] font-bold cursor-pointer"
                    >
                      Simulate action
                    </button>
                    <div className="border-2 border-black bg-white text-[12px] max-h-52 overflow-y-auto divide-y divide-black/10">
                      {activityLogs.length === 0 ? (
                        <div className="p-4 text-center text-stone-400">Nothing yet.</div>
                      ) : (
                        activityLogs.map(log => (
                          <div key={log.id} className="px-3 py-2 flex items-start gap-2">
                            <span className="shrink-0">{log.avatar}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between text-[11px] text-stone-400 font-bold">
                                <span>{log.member}</span>
                                <span>{log.time}</span>
                              </div>
                              <p className="text-stone-800 leading-snug mt-0.5">{log.action}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DeckSection>
                </div>
              )}

              {activeTab === 'automations' && (
                <div className="space-y-3">
                  <DeckSection title="Weekly spawn" hint="Drops an empty weekly checklist on Sundays, or now.">
                    <DeckToggleRow
                      label="Auto-spawn on Sundays"
                      on={weeklySpawnerEnabled}
                      onClick={() => {
                        setWeeklySpawnerEnabled(prev => !prev);
                        addActivityLog('System', `Weekly layout spawner toggle changed to: ${!weeklySpawnerEnabled ? 'ENABLED' : 'DISABLED'}`);
                      }}
                    />
                    <button
                      onClick={() => triggerWeeklySpawner(true)}
                      className="w-full min-h-10 bg-white hover:bg-stone-50 border-2 border-black text-[12px] font-bold cursor-pointer"
                    >
                      Spawn checklist now
                    </button>
                  </DeckSection>

                  <DeckSection title="Email in" hint="Pretend a note arrived at board-inbox@zenith.com.">
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Subject"
                        value={incomingEmail.subject}
                        onChange={(e) => setIncomingEmail(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full min-h-10 text-[12px] border-2 border-black px-3 bg-white font-semibold focus:outline-none"
                      />
                      <textarea
                        placeholder="Body"
                        value={incomingEmail.body}
                        onChange={(e) => setIncomingEmail(prev => ({ ...prev, body: e.target.value }))}
                        rows={2}
                        className="w-full text-[12px] border-2 border-black p-2.5 bg-white font-semibold focus:outline-none resize-none"
                      />
                      <button
                        onClick={handleSimulatedEmailSend}
                        className="w-full min-h-10 bg-black text-[#FFB703] hover:bg-stone-900 border-2 border-black text-[12px] font-black cursor-pointer"
                      >
                        Simulate arrival
                      </button>
                    </div>
                  </DeckSection>

                  <DeckSection title="Auto-archive" hint="Cards older than 30 days.">
                    <DeckToggleRow
                      label="Archive stale cards"
                      on={autoArchiveEnabled}
                      onClick={() => {
                        setAutoArchiveEnabled(prev => !prev);
                        addActivityLog('System', `Auto-archive rule schedule toggle changed to: ${!autoArchiveEnabled ? 'ENABLED' : 'DISABLED'}`);
                      }}
                    />
                    <button
                      onClick={() => archiveStaleElements()}
                      className="w-full min-h-10 bg-white hover:bg-stone-50 border-2 border-black text-[12px] font-bold cursor-pointer"
                    >
                      Run scan now
                    </button>
                  </DeckSection>

                  <DeckSection title={`Archive (${archivedElements.length})`}>
                    {archivedElements.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Permanently purge ALL archived elements forever?')) {
                            setArchivedElements([]);
                            addActivityLog('System', 'Permanently purged the entire archived cards folder');
                          }
                        }}
                        className="text-[12px] font-bold underline cursor-pointer"
                      >
                        Purge all
                      </button>
                    )}
                    <div className="border-2 border-black bg-white text-[12px] max-h-44 overflow-y-auto divide-y divide-black/10">
                      {archivedElements.length === 0 ? (
                        <div className="p-4 text-center text-stone-400">Empty.</div>
                      ) : (
                        archivedElements.map(item => (
                          <div key={item.id} className="px-3 py-2 flex flex-col gap-1">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-bold truncate">{item.title || 'Untitled'}</span>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    setElements(prev => [...prev, item]);
                                    setArchivedElements(prev => prev.filter(e => e.id !== item.id));
                                    addActivityLog('System', `Restored archived card: "${item.title}" back to active canvas`);
                                  }}
                                  className="text-[12px] font-bold underline cursor-pointer"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={() => {
                                    setArchivedElements(prev => prev.filter(e => e.id !== item.id));
                                    addActivityLog('System', `Permanently deleted archived card: "${item.title}"`);
                                  }}
                                  className="text-[12px] font-bold underline cursor-pointer text-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            {item.content && (
                              <p className="text-[11px] text-stone-500 line-clamp-2">{item.content}</p>
                            )}
                            {item.checklistItems && (
                              <span className="text-[11px] text-stone-400">{item.checklistItems.length} items</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </DeckSection>

                  <DeckSection title="Fresh start" hint="Clears cards and guest passes, then loads the starter board.">
                    <button
                      onClick={() => {
                        requestConfirm(
                          'Trigger Fresh Start Reset',
                          'Are you ready to trigger a Fresh Start? This will reset and pre-populate your board with a clean, beautifully styled setup!',
                          () => {
                            setElements([]);
                            setGuestPasses([]);
                            setArchivedElements([]);
                            setStreakCount(1);
                            setCompletedTasksCount(0);
                            setCanvasBackgroundTheme('default');

                            const t = Date.now();
                            const defaultStarterElements = packEqualCards(
                              buildHomeCards(t, 'fresh'),
                              estimateBoardWidth(window.innerWidth)
                            );
                            setElements(defaultStarterElements);
                            playMilestoneChime();
                            triggerConfettiCelebrate();
                            addActivityLog('System', 'Performed One-Click Fresh Start Initialization');
                            triggerToast('Zenith board successfully restored to a fresh, clean setup!', 'success');
                          }
                        );
                      }}
                      className="w-full min-h-11 bg-[#FFB703] hover:bg-[#F5C518] text-black border-2 border-black text-[12px] font-black cursor-pointer"
                      data-testid="fresh-start"
                    >
                      Reset the board
                    </button>
                  </DeckSection>
                </div>
              )}
            </div>
        </aside>
        </>
        )}

      {/* --- PUBLIC SHARE LINK MODAL POPUP --- */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-4 border-black p-5 w-full max-w-md neo-shadow relative rounded-none text-[#1A1A1A]">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setCopiedShareLink(false);
                }}
                className="absolute top-3 right-3 text-sm font-black border-2 border-black bg-rose-500 text-white w-6 h-6 flex items-center justify-center rounded-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1">
                <Share2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                One-Tap Public Link Generator
              </h3>
              <p className="text-[10px] text-stone-500 leading-normal mb-4 font-bold">
                Instantly copy the private access URL to invite family members or guests to review the canvas workspace.
              </p>

              <div className="space-y-3">
                <div className="border-2 border-black p-2 bg-stone-50 font-mono text-[9px] break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/canvas/${activeCanvasId}` : 'http://localhost:3000/'}
                </div>

                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(`${window.location.origin}/canvas/${activeCanvasId}`);
                      setCopiedShareLink(true);
                      setTimeout(() => setCopiedShareLink(false), 2000);
                    }
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black p-2 text-xs font-black uppercase rounded-none transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {copiedShareLink ? '✅ Link Copied Successfully!' : '📋 Copy Link URL to Clipboard'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* --- PAGE TEMPLATE BLUEPRINTS SELECTOR MODAL --- */}
      {showBlueprintModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 text-black">
          <div className="bg-white border-4 border-black p-6 w-full max-w-2xl neo-shadow relative rounded-none flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowBlueprintModal(false)}
              className="absolute top-4 right-4 text-xs font-black border-2 border-black bg-rose-500 text-white w-7 h-7 flex items-center justify-center rounded-none cursor-pointer hover:bg-rose-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest bg-black text-[#FEF08A] px-2 py-0.5 border border-black inline-block">
                Feature 81: One-Click Setup Blueprints
              </span>
              <h3 className="text-sm font-black uppercase tracking-tight mt-1">
                📑 Page Template Blueprints Selector
              </h3>
              <p className="text-[11px] text-gray-500 font-bold leading-tight mt-0.5">
                Choose a ready-made workspace template to instantly setup widgets, layouts, and ambient sounds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 overflow-y-auto pr-1 flex-1 py-1">
              {/* Option 1: School Student Planner */}
              <div className="border-4 border-black p-4 bg-[#FEF08A] neo-shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-1">📚</div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Academic Planner</h4>
                  <p className="text-[10px] text-stone-700 font-semibold leading-relaxed mt-1">
                    Preloaded with student helpers: Sticky notes, Homework Checklists, Midterm Exam Countdowns, and Rain ambient Study focus loop.
                  </p>
                </div>
                <div className="mt-4 space-y-1.5 pt-3 border-t border-black/10">
                  <button
                    onClick={() => {
                      loadBlueprintTemplate('school', false);
                      setShowBlueprintModal(false);
                    }}
                    className="w-full bg-black text-[#FEF08A] border-2 border-black text-[9px] font-black uppercase py-1.5 text-center cursor-pointer hover:bg-stone-900 transition-all active:translate-y-0.5 rounded-none"
                  >
                    ⚡ Overwrite Board
                  </button>
                  <button
                    onClick={() => {
                      loadBlueprintTemplate('school', true);
                      setShowBlueprintModal(false);
                    }}
                    className="w-full bg-white text-black border-2 border-black text-[9px] font-black uppercase py-1 text-center cursor-pointer hover:bg-stone-50 transition-all active:translate-y-0.5 rounded-none"
                  >
                    ➕ Append Widgets
                  </button>
                </div>
              </div>

              {/* Option 2: Pet Care Log */}
              <div className="border-4 border-black p-4 bg-[#FBCFE8] neo-shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-1">🐾</div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Pet Care Log</h4>
                  <p className="text-[10px] text-stone-700 font-semibold leading-relaxed mt-1">
                    Keep your pets happy! Loaded with Veterinary clinic contact sticky card, Daily walking checklist, and a cute doggy photo desk frame.
                  </p>
                </div>
                <div className="mt-4 space-y-1.5 pt-3 border-t border-black/10">
                  <button
                    onClick={() => {
                      loadBlueprintTemplate('pet', false);
                      setShowBlueprintModal(false);
                    }}
                    className="w-full bg-black text-[#FBCFE8] border-2 border-black text-[9px] font-black uppercase py-1.5 text-center cursor-pointer hover:bg-stone-900 transition-all active:translate-y-0.5 rounded-none"
                  >
                    ⚡ Overwrite Board
                  </button>
                  <button
                    onClick={() => {
                      loadBlueprintTemplate('pet', true);
                      setShowBlueprintModal(false);
                    }}
                    className="w-full bg-white text-black border-2 border-black text-[9px] font-black uppercase py-1 text-center cursor-pointer hover:bg-stone-50 transition-all active:translate-y-0.5 rounded-none"
                  >
                    ➕ Append Widgets
                  </button>
                </div>
              </div>

              {/* Option 3: Holistic Family Wellness Guide */}
              <div className="border-4 border-black p-4 bg-[#A7F3D0] neo-shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-1">🧘</div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">Wellness Guide</h4>
                  <p className="text-[10px] text-stone-700 font-semibold leading-relaxed mt-1">
                    Focus on body and soul. Spawns daily guide text widget, a 4-item healthy routine checklist, and active Serene Forest noise mixers.
                  </p>
                </div>
                <div className="mt-4 space-y-1.5 pt-3 border-t border-black/10">
                  <button
                    onClick={() => {
                      loadBlueprintTemplate('wellness', false);
                      setShowBlueprintModal(false);
                    }}
                    className="w-full bg-black text-[#A7F3D0] border-2 border-black text-[9px] font-black uppercase py-1.5 text-center cursor-pointer hover:bg-stone-900 transition-all active:translate-y-0.5 rounded-none"
                  >
                    ⚡ Overwrite Board
                  </button>
                  <button
                    onClick={() => {
                      loadBlueprintTemplate('wellness', true);
                      setShowBlueprintModal(false);
                    }}
                    className="w-full bg-white text-black border-2 border-black text-[9px] font-black uppercase py-1 text-center cursor-pointer hover:bg-stone-50 transition-all active:translate-y-0.5 rounded-none"
                  >
                    ➕ Append Widgets
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-stone-500 font-bold font-mono uppercase text-center mt-4">
              💡 Pro Tip: Appending retains your active canvas widgets. Overwriting wipes them!
            </div>
          </div>
        </div>
      )}

      {/* --- PREMIUM NEO-BRUTALIST CUSTOM TOAST NOTIFICATIONS --- */}
      <div className="fixed bottom-4 left-4 z-[200000] flex flex-col gap-2 max-w-xs pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto border-4 border-black p-3.5 neo-shadow-sm font-black text-[10px] uppercase flex items-center justify-between gap-3 rounded-none animate-in slide-in-from-bottom duration-300 ${
              toast.type === 'success' ? 'bg-emerald-400 text-black' :
              toast.type === 'error' ? 'bg-rose-500 text-white' :
              toast.type === 'warning' ? 'bg-[#FFB703] text-black' :
              'bg-sky-400 text-black'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>
                {toast.type === 'success' && '✅'}
                {toast.type === 'error' && '❌'}
                {toast.type === 'warning' && '⚠️'}
                {toast.type === 'info' && 'ℹ️'}
              </span>
              <span className="leading-tight">{toast.text}</span>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-xs font-bold px-1 py-0.5 hover:bg-black/10 shrink-0 cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* --- PREMIUM NEO-BRUTALIST CUSTOM CONFIRM MODAL --- */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[199999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div data-testid="confirm-dialog" className="bg-white border-4 border-black p-5 max-w-sm w-full neo-shadow rounded-none text-black">
            <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 text-black">
              ⚠️ {confirmConfig.title}
            </h4>
            <p className="text-[10px] text-stone-600 font-bold leading-normal mb-5">
              {confirmConfig.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="bg-stone-50 hover:bg-stone-100 border-2 border-black px-3 py-1.5 text-[9px] font-black uppercase rounded-none cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                  confirmConfig.onConfirm();
                  playMilestoneChime();
                }}
                data-testid="confirm-yes"
                className="bg-black text-[#FFB703] hover:bg-stone-900 border-2 border-black px-3 py-1.5 text-[9px] font-black uppercase rounded-none cursor-pointer"
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
  } catch (e: any) {
    console.error("SSR Prerender bypass active. Caught error:", e);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] font-mono text-xs text-stone-500">
        <div className="text-center p-8 border-4 border-black bg-white neo-shadow max-w-sm">
          <h2 className="text-sm font-black uppercase mb-2">Zenith Workspace</h2>
          <p className="text-[10px] leading-relaxed text-[#1A1A1A] font-bold">
            Opening your board.
          </p>
        </div>
      </div>
    );
  }
}
