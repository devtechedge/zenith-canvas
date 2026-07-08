"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';

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

export default function ZenithWorkspace() {
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
  const [isDailyBannerDismissed, setIsDailyBannerDismissed] = useState<boolean>(false);
  const [highlightIncomplete, setHighlightIncomplete] = useState<boolean>(false);
  const [incomingEmail, setIncomingEmail] = useState({
    from: 'mom-inbox@zenith-mail.com',
    subject: 'Vet Appointment update 🐶',
    body: 'Please check the vet schedule! Teddy needs his shot on Thursday morning. Make sure to feed him on time.'
  });
  const [activeNotifications, setActiveNotifications] = useState<string[]>([]);

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

  // --- INITIAL LOADING (LOCALSTORAGE) ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
        { id: 'canvas-1', name: 'Family Groceries', emoji: '🍎', createdAt: Date.now() - 50000, stationery: 'blueprint' },
        { id: 'canvas-2', name: 'Summer Travel Plan', emoji: '✈️', createdAt: Date.now() - 40000, stationery: 'ivory' },
        { id: 'canvas-3', name: 'Lucy\'s Creative Sandbox', emoji: '🎨', createdAt: Date.now() - 30000, stationery: 'cozy' },
        { id: 'canvas-4', name: 'Secure Private Archive', emoji: '🔒', createdAt: Date.now() - 20000, stationery: 'terminal' }
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
      // Default elements
      const defaultElements: CanvasElement[] = [
        {
          id: 'elem-1',
          type: 'text',
          title: '📌 Welcome Note',
          x: 40,
          y: 40,
          w: 320,
          h: 200,
          color: '#FEF08A',
          content: 'Welcome to your Zenith Workspace! This is a real-time responsive family workspace.\n\n👉 Switch canvases in the left panel.\n👉 Add checklist items, sketch drawings, launch timers, or adjust focus noise!\n👉 Check out the right Ops Control Panel for advanced layout themes and safety PIN gates.\n\n💡 Enter {{current_date}} or {{user_email}} anywhere in this text area and click "👁️ Live Preview" to see active variable evaluation!',
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          livePreviewActive: false
        },
        {
          id: 'elem-2',
          type: 'checklist',
          title: '🛒 Grocery Runs',
          x: 400,
          y: 40,
          w: 280,
          h: 260,
          color: '#A7F3D0',
          checklistItems: [
            { id: 'todo-1', text: 'Organic Fuji Apples', done: true },
            { id: 'todo-2', text: 'Lactose-Free Milk', done: false },
            { id: 'todo-3', text: 'Whole Wheat Bread', done: false },
            { id: 'todo-4', text: 'Greek Yogurt (Honey flavor)', done: false }
          ],
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          deadline: '2026-07-08' // Due today! Triggers smart notifications instantly
        },
        {
          id: 'elem-3',
          type: 'sketch',
          title: '✏️ Quick Doodle Pad',
          x: 40,
          y: 280,
          w: 320,
          h: 300,
          color: '#E0F2FE',
          sketchData: '',
          createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
        },
        {
          id: 'elem-4',
          type: 'countdown',
          title: '⏱️ Family Picnic Countdown',
          x: 720,
          y: 40,
          w: 300,
          h: 210,
          color: '#FDE047',
          countdownTarget: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: Date.now() - 12 * 60 * 60 * 1000
        },
        {
          id: 'elem-5',
          type: 'sound',
          title: '🧘 Focus Noise Engine',
          x: 400,
          y: 330,
          w: 280,
          h: 250,
          color: '#FBCFE8',
          soundType: 'rain',
          soundVolume: 0.5,
          createdAt: Date.now() - 2 * 60 * 60 * 1000
        }
      ];
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
  }, [isCopyInterceptEnabled]);

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

  // --- AUDIO SYNTHESIZER BEARDS (AMBIENT FOCUS NOISE GENERATOR) ---
  const triggerWarningBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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
  };

  const playMilestoneChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

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
      alert('Keep at least one workspace open!');
      return;
    }
    if (!confirm(`Are you absolutely sure you want to remove canvas "${name}"?`)) return;
    const remaining = canvases.filter(c => c.id !== id);
    setCanvases(remaining);
    if (activeCanvasId === id) {
      setActiveCanvasId(remaining[0].id);
    }
    addActivityLog('System', `🗑️ Removed canvas board "${name}"`);
  };

  // Create workspace elements
  const handleAddElement = (type: 'text' | 'checklist' | 'sketch' | 'countdown' | 'media' | 'sound') => {
    if (isReadOnlyMode) {
      alert('Read-Only Safe Mode is enabled in the Ops Control Deck. Turn it off to append objects.');
      return;
    }
    const colors = ['#FEF08A', '#A7F3D0', '#E0F2FE', '#FBCFE8', '#FDE047', '#FFD8A8'];
    const randomColor = colors[Math.floor(getSafeRandom() * colors.length)];
    
    // Position randomly on current board
    const boardWidth = boardRef.current?.clientWidth || 800;
    const boardHeight = boardRef.current?.clientHeight || 600;
    const rx = Math.max(20, Math.floor(getSafeRandom() * (boardWidth - 320)));
    const ry = Math.max(20, Math.floor(getSafeRandom() * (boardHeight - 240)));

    const newElement: CanvasElement = {
      id: `elem-${Date.now()}-${getSafeRandom()}`,
      type,
      title: `📝 New ${type.toUpperCase()}`,
      x: rx,
      y: ry,
      w: type === 'sketch' ? 320 : 280,
      h: type === 'sketch' ? 300 : type === 'checklist' ? 240 : 200,
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
      alert('Read-Only mode blocks element removals.');
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
      alert('Safety Guard: Read-Only mode is active.');
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
      alert('⚡ Weekly Checklist Layout successfully spawned on the canvas board!');
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
      alert('🧹 Archival Scan complete: No stale (30+ days old) items were found on the board!');
      return;
    }
    
    setElements(prev => prev.filter(e => {
      const created = e.createdAt || now;
      return (now - created) <= thirtyDaysMs;
    }));
    
    setArchivedElements(prev => [...prev, ...stale]);
    addActivityLog('System', `🧹 Moved ${stale.length} month-old items into the folder archives`);
    alert(`🧹 Success! Scanned board and moved ${stale.length} stale cards (older than 30 days) into the archives.`);
  };

  // 81. One-Click Page Template Blueprints: sets up ready-made structures instantly
  const loadBlueprintTemplate = (blueprintType: 'school' | 'pet' | 'wellness', append: boolean) => {
    if (isReadOnlyMode) {
      alert('Read-Only mode blocks adding blueprints.');
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
      alert('Safety Guard: Read-only mode is active.');
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
    alert('🧹 One-Touch Reset: All checked items on your checklists have been reset to unchecked!');
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
      alert('Safety Guard: Read-Only mode is active.');
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
    alert(`📨 Email hooked successfully! Check the new card "📬 Email: ${incomingEmail.subject}" on your board!`);
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
        const checklistItems = lines.map((l, idx) => ({
          id: `csv-todo-${idx}-${t}`,
          text: l.startsWith('- ') ? l.substring(2) : l,
          done: false
        }));
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
        alert('📊 CSV file parsed and successfully imported as a Checklist!');
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
        alert('📄 Text file parsed and successfully imported as a Sticky Note!');
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
    } catch (e) {
      alert('Backup generation failed.');
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
          alert('Backup Database imported successfully!');
          addActivityLog('Admin', '📂 Fully restored workspace from imported JSON database archive');
        } else {
          alert('Invalid backup structure.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON.');
      }
    };
    fileReader.readAsText(targetFile);
  };

  // 86. External File Drop Importer
  const handleFileDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    if (isReadOnlyMode) {
      alert('Safety Guard: Read-Only mode is active.');
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
        const checklistItems = lines.map((l, idx) => ({
          id: `csv-todo-${idx}-${t}`,
          text: l.startsWith('- ') ? l.substring(2) : l,
          done: false
        }));
        
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
        alert('📊 Excel/CSV File parsed and unpacked into a Checklist widget!');
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
        alert('📄 Text Document parsed and unpacked into a Sticky Note widget!');
      }
    };
    reader.readAsText(file);
  };

  // --- PIN LOCK FLOW ---
  const handleSetPIN = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinSetupVal.length !== 4 || isNaN(Number(pinSetupVal))) {
      alert('PIN must be exactly 4 numeric digits.');
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
      handleUpdateElement(draggedElementId, {
        x: Math.max(10, Math.min(2000, nx)),
        y: Math.max(10, Math.min(2000, ny))
      });
    }

    if (isResizing && draggedElementId) {
      const activeEl = elements.find(el => el.id === draggedElementId);
      if (!activeEl) return;
      const dw = e.clientX - resizeStartPos.x;
      const dh = e.clientY - resizeStartPos.y;
      handleUpdateElement(draggedElementId, {
        w: Math.max(200, resizeStartSize.w + dw),
        h: Math.max(150, resizeStartSize.h + dh)
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedElementId(null);
    setIsResizing(false);
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

  return (
    <div className={`min-h-screen flex flex-col md:flex-row relative overflow-hidden select-none`}>
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
            <h1 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]">Zenith Workspace</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase leading-none">Cooperative Family Canvas</p>
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

        {/* Achievements & Milestones Widget Block (Batch 10 Feature 92, 94, 97) */}
        <div className="border-2 border-black p-3 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] space-y-3 text-xs rounded-none mb-4 neo-shadow-sm text-black">
          <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
            <span className="font-black text-[10px] uppercase tracking-wider text-amber-900 flex items-center gap-1">
              🏆 Milestones & Stamps
            </span>
            <div className="flex text-amber-500 text-xs">
              {Array.from({ length: getProductivityStars() }).map((_, i) => (
                <span key={i}>★</span>
              ))}
              {Array.from({ length: 5 - getProductivityStars() }).map((_, i) => (
                <span key={i} className="text-stone-300">★</span>
              ))}
            </div>
          </div>

          {/* Consistency Streak */}
          <div className="flex items-center justify-between bg-white border border-black/15 p-2 rounded-none">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm animate-bounce">🔥</span>
              <div>
                <div className="font-extrabold text-[10px] text-stone-900 leading-none">Daily Consistency</div>
                <div className="text-[8px] text-stone-500 font-bold uppercase mt-0.5">{streakCount} Days Active</div>
              </div>
            </div>
            <button
              onClick={() => {
                setStreakCount(prev => prev + 1);
                playMilestoneChime();
                triggerConfettiCelebrate();
                addActivityLog('System', '🔥 Logged daily consistency check-in streak point!');
              }}
              title="Click to check in today!"
              className="bg-orange-500 hover:bg-orange-600 text-white text-[8px] font-black px-1.5 py-1 uppercase border border-black rounded-none cursor-pointer active:translate-y-0.5 shrink-0"
            >
              Check-in
            </button>
          </div>

          {/* Level-Up Stamp Badges */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black text-amber-950 uppercase block">Digital Stamp Book</span>
            <div className="grid grid-cols-4 gap-1">
              {/* Stamp 1 */}
              <div 
                title="Pioneer: Add an element card to canvas"
                className={`p-1 border border-black text-center relative flex flex-col items-center justify-center rounded-none ${elements.length > 0 ? 'bg-amber-400 font-bold' : 'bg-stone-100 opacity-40'}`}
              >
                <span className="text-sm">⭐️</span>
                <span className="text-[7px] font-black uppercase leading-none block mt-1">Pioneer</span>
              </div>
              {/* Stamp 2 */}
              <div 
                title="Consistency: 3+ days streak active"
                className={`p-1 border border-black text-center relative flex flex-col items-center justify-center rounded-none ${streakCount >= 3 ? 'bg-red-400 font-bold' : 'bg-stone-100 opacity-40'}`}
              >
                <span className="text-sm">🔥</span>
                <span className="text-[7px] font-black uppercase leading-none block mt-1">Streak</span>
              </div>
              {/* Stamp 3 */}
              <div 
                title="Achiever: Complete checklist tasks"
                className={`p-1 border border-black text-center relative flex flex-col items-center justify-center rounded-none ${completedTasksCount >= 5 ? 'bg-blue-400 font-bold' : 'bg-stone-100 opacity-40'}`}
              >
                <span className="text-sm">🚀</span>
                <span className="text-[7px] font-black uppercase leading-none block mt-1">Achiever</span>
              </div>
              {/* Stamp 4 */}
              <div 
                title="Master: Multiple canvases active"
                className={`p-1 border border-black text-center relative flex flex-col items-center justify-center rounded-none ${canvases.length >= 4 ? 'bg-purple-400 font-bold' : 'bg-stone-100 opacity-40'}`}
              >
                <span className="text-sm">👑</span>
                <span className="text-[7px] font-black uppercase leading-none block mt-1">Master</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info box */}
        <div className="border-2 border-black p-2.5 bg-neutral-50 space-y-2 text-[10px]">
          <div className="flex items-center justify-between text-gray-500">
            <span className="font-bold">SYSTEM STATS:</span>
            <span className="font-mono text-[9px] text-emerald-600 font-bold">LIVE ●</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-[9px]">
            <div className="bg-white border border-black/20 p-1">
              <div className="text-[11px] font-black">{elements.length}</div>
              <div className="text-[7px] text-gray-400">ELEMENTS</div>
            </div>
            <div className="bg-white border border-black/20 p-1">
              <div className="text-[11px] font-black">{guestPasses.length}</div>
              <div className="text-[7px] text-gray-400">GUESTS</div>
            </div>
          </div>
          <button
            onClick={() => setIsControlDeckOpen(true)}
            className="w-full bg-[#1A1A1A] hover:bg-[#FFB703] hover:text-black text-white p-1.5 font-bold uppercase tracking-wider text-center border-2 border-black transition-colors rounded-none cursor-pointer flex items-center justify-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Control Deck</span>
          </button>
          <button
            onClick={() => setShowArchitectureModal(true)}
            className="w-full bg-[#1e293b] hover:bg-slate-700 text-sky-300 p-1.5 font-bold uppercase tracking-wider text-center border-2 border-black transition-colors rounded-none cursor-pointer flex items-center justify-center gap-1"
          >
            <span>⚙️ Blueprint Stack</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CANVAS CONTENT SECTION --- */}
      <main
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
                  <span className="text-xs font-normal font-sans text-stone-700 capitalize">
                    • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
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
              Family Workspace • Stationery Style:{' '}
              <span className="font-bold uppercase tracking-wider text-[#FFB703] bg-black px-1 py-0.2 rounded-none">
                {activeStationery}
              </span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => handleAddElement('text')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Sticky Note
            </button>
            <button
              onClick={() => handleAddElement('checklist')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Checklist
            </button>
            <button
              onClick={() => handleAddElement('sketch')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Whiteboard Sketch
            </button>
            <button
              onClick={() => handleAddElement('countdown')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Countdown
            </button>
            <button
              onClick={() => handleAddElement('sound')}
              className="bg-white text-black hover:bg-[#FFB703] border-2 border-black px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-none neo-shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              + Audio Mixer
            </button>
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
        <div
          className="fixed top-0 right-0 h-full w-full max-w-sm bg-white border-l-4 border-black p-5 flex flex-col z-50 neo-shadow animate-in slide-in-from-right duration-300"
        >
            {/* Control Panel Header Row */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div className="flex items-center space-x-1.5 text-black">
                <Sliders className="w-5 h-5 text-[#FFB703]" />
                <h2 className="text-xs font-black uppercase tracking-wider">Zenith Control Deck</h2>
              </div>
              <button
                onClick={() => setIsControlDeckOpen(false)}
                className="p-1 hover:bg-red-500 hover:text-white border-2 border-black bg-stone-50 rounded-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-navigation categories */}
            <div className="flex border-b-2 border-black mb-4 gap-1 overflow-x-auto">
              {(['appearance', 'safety', 'sharing', 'audio', 'automations'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-[9px] font-black uppercase p-1.5 border-t-2 border-x-2 border-transparent text-center transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-black text-[#FFB703] border-black font-black translate-y-0.5'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Dynamic tabs container */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* TAB 1: APPEARANCE */}
              {activeTab === 'appearance' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-stone-400 mb-1">Canvas Theme Selector</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['ivory', 'blueprint', 'cozy', 'terminal', 'cyber'] as const).map(theme => (
                        <button
                          key={theme}
                          onClick={() => {
                            setCanvases(prev =>
                              prev.map(c => (c.id === activeCanvasId ? { ...c, stationery: theme } : c))
                            );
                            addActivityLog('System', `🎨 Swapped workspace stationery background to: ${theme}`);
                          }}
                          className={`p-2 border-2 border-black rounded-none text-left font-bold capitalize cursor-pointer text-[10px] ${
                            activeStationery === theme ? 'bg-[#FFB703]' : 'bg-stone-50 hover:bg-stone-100'
                          }`}
                        >
                          {theme} Stationery
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 96. Cozy Background Theme Selector (Batch 10) */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-stone-400 mb-1">Cozy Ambient Background Mood</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'default', label: 'Default Stationery' },
                        { id: 'hearth', label: '🔥 Fireside Hearth' },
                        { id: 'moonlight', label: '🌙 Midnight Forest' },
                        { id: 'ivory', label: '📜 Antique Ivory' },
                        { id: 'sunset', label: '🌅 Crimson Sunset' },
                        { id: 'slate', label: 'Obsidian Slate 🖤' },
                      ].map(bgTheme => (
                        <button
                          key={bgTheme.id}
                          onClick={() => {
                            setCanvasBackgroundTheme(bgTheme.id);
                            playMilestoneChime();
                            triggerConfettiCelebrate();
                            addActivityLog('System', `🎭 Changed ambient background mood to: ${bgTheme.label}`);
                          }}
                          className={`p-2 border-2 border-black rounded-none text-left font-bold cursor-pointer text-[10px] text-black ${
                            canvasBackgroundTheme === bgTheme.id ? 'bg-[#FFB703]' : 'bg-stone-50 hover:bg-stone-100'
                          }`}
                        >
                          {bgTheme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black uppercase text-stone-400 mb-1">Border Weight</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[2, 4].map(w => (
                        <button
                          key={w}
                          onClick={() => setBorderWeight(w)}
                          className={`p-2 border-2 border-black rounded-none text-[10px] font-bold uppercase text-center cursor-pointer ${
                            borderWeight === w ? 'bg-black text-white' : 'bg-stone-50 hover:bg-stone-100'
                          }`}
                        >
                          {w}px Stroke
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black uppercase text-stone-400 mb-1">Interactive Elements Text Size</h3>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['sm', 'md', 'lg'] as const).map(sz => (
                        <button
                          key={sz}
                          onClick={() => setTextSize(sz)}
                          className={`p-2 border-2 border-black rounded-none text-[10px] font-bold uppercase text-center cursor-pointer ${
                            textSize === sz ? 'bg-black text-white' : 'bg-stone-50'
                          }`}
                        >
                          {sz} Text
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black uppercase text-stone-400 mb-1">Neo-Brutalist Shadow Depth</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'none', label: 'Flat Zero' },
                        { id: 'neo-shadow-sm', label: 'Cozy (2px)' },
                        { id: 'neo-shadow', label: 'Neo Bold (4px)' },
                        { id: 'neo-shadow-lg', label: 'Cyber Giant (8px)' }
                      ].map(sh => (
                        <button
                          key={sh.id}
                          onClick={() => setShadowDepth(sh.id)}
                          className={`p-2 border-2 border-black rounded-none text-[10px] font-bold uppercase text-center cursor-pointer ${
                            shadowDepth === sh.id ? 'bg-black text-[#FFB703] font-black' : 'bg-stone-50 hover:bg-stone-100'
                          }`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SAFETY LOCKS */}
              {activeTab === 'safety' && (
                <div className="space-y-4">
                  {/* Read Only Safeguard Toggle */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">Workspace Edit Safeguard</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setIsReadOnlyMode(true);
                          addActivityLog('System', '👓 Read-Only safeguarding toggle turned ON');
                        }}
                        className={`border-2 border-black p-2 text-left cursor-pointer transition-all ${
                          isReadOnlyMode ? 'bg-[#FFB703] text-black font-black' : 'bg-stone-50 hover:bg-stone-100'
                        }`}
                      >
                        <div className="text-[10px] font-black">👓 READ-ONLY</div>
                        <div className="text-[8px] opacity-75">Blocks edits</div>
                      </button>
                      <button
                        onClick={() => {
                          setIsReadOnlyMode(false);
                          addActivityLog('System', '✍️ Full-Edit writing canvas turned ON');
                        }}
                        className={`border-2 border-black p-2 text-left cursor-pointer transition-all ${
                          !isReadOnlyMode ? 'bg-black text-[#FFB703] font-black' : 'bg-stone-50 hover:bg-stone-100'
                        }`}
                      >
                        <div className="text-[10px] font-black">✍️ FULL EDIT</div>
                        <div className="text-[8px] opacity-75">Allows edits</div>
                      </button>
                    </div>
                  </div>

                  {/* Private Document Vault with PIN setup */}
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">🔒 Private Document PIN Vault</span>
                    
                    {!vaultPIN ? (
                      <form onSubmit={handleSetPIN} className="space-y-2 bg-amber-50/50 p-3 border-2 border-dashed border-amber-300">
                        <p className="text-[9px] text-amber-950 font-bold leading-normal">
                          Lock this entire board behind a secret 4-digit PIN lock. When anyone opens it, the lock gate dialpad overlay will activate.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="4-digit PIN"
                            value={pinSetupVal}
                            onChange={(e) => setPinSetupVal(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 text-xs border-2 border-black p-1 rounded-none font-mono focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={pinSetupVal.length !== 4}
                            className="bg-black text-[#FFB703] hover:bg-stone-800 disabled:opacity-50 text-[10px] font-black px-3 py-1 border-2 border-black rounded-none cursor-pointer"
                          >
                            Set PIN
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-3 bg-red-50 border-2 border-red-500 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Key className="w-4 h-4 text-red-600 animate-pulse" />
                          <span className="text-[10px] font-black text-red-950 uppercase">PIN Shield Engaged</span>
                        </div>
                        <button
                          onClick={handleRemovePIN}
                          className="bg-red-600 hover:bg-red-500 text-white text-[8px] font-black uppercase px-2 py-1 border border-black rounded-none cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Copy intercept protection button */}
                  <div className="space-y-1.5 pt-3 border-t border-gray-200">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">Copy Intercept Shield</span>
                    <button
                      onClick={() => {
                        const next = !isCopyInterceptEnabled;
                        setIsCopyInterceptEnabled(next);
                        addActivityLog('System', `🛡️ Copy Intercept Shield turned ${next ? 'ON' : 'OFF'}`);
                      }}
                      className={`w-full border-2 border-black p-3 flex items-center justify-between rounded-none text-left cursor-pointer transition-all ${
                        isCopyInterceptEnabled ? 'bg-amber-100 text-black font-black' : 'bg-stone-50 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase flex items-center gap-1 text-[#1A1A1A]">
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          Intercept Clipboard Copy
                        </span>
                        <span className="text-[8px] text-stone-500 mt-0.5">Restrict viewer copying and trigger synth beeps</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 border border-black bg-white">
                        {isCopyInterceptEnabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SHARING ACCESS */}
              {activeTab === 'sharing' && (
                <div className="space-y-4">
                  {/* Share Link Generator Box */}
                  <div>
                    <span className="text-[10px] font-black uppercase text-stone-400 block mb-1">One-Tap Share URL</span>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black p-3 font-black uppercase text-[10px] rounded-none cursor-pointer flex items-center justify-center gap-2 neo-shadow-sm"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Generate Public Link</span>
                    </button>
                  </div>

                  {/* Guest Passes */}
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">🎫 Generate Guest Access Passes</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateGuestPass(1)}
                        className="flex-1 bg-stone-50 hover:bg-stone-100 border-2 border-black p-1.5 text-[9px] font-black uppercase rounded-none cursor-pointer"
                      >
                        + 1 Day Pass
                      </button>
                      <button
                        onClick={() => handleGenerateGuestPass(7)}
                        className="flex-1 bg-stone-50 hover:bg-stone-100 border-2 border-black p-1.5 text-[9px] font-black uppercase rounded-none cursor-pointer"
                      >
                        + 7 Day Pass
                      </button>
                    </div>

                    {guestPasses.length > 0 && (
                      <div className="border-2 border-black max-h-32 overflow-y-auto divide-y divide-black bg-stone-50">
                        {guestPasses.map(pass => (
                          <div key={pass.id} className="p-2 flex items-center justify-between text-[9px] font-mono bg-white">
                            <div>
                              <span className="bg-amber-100 px-1 py-0.5 border border-amber-300 font-bold text-amber-900">{pass.code}</span>
                              <span className="ml-1 text-gray-500">({pass.label})</span>
                            </div>
                            <button
                              onClick={() => handleRevokeGuestPass(pass.id, pass.code)}
                              className="text-red-600 hover:underline font-black uppercase"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Simulated Cursor Trails Toggle */}
                  <div className="space-y-1.5 pt-3 border-t border-gray-200">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">Simulate Family Cooperators</span>
                    <button
                      onClick={() => {
                        const next = !isCursorTrailsEnabled;
                        setIsCursorTrailsEnabled(next);
                        addActivityLog('System', `👥 Simulated cooperator cursors trails turned ${next ? 'ON' : 'OFF'}`);
                      }}
                      className={`w-full border-2 border-black p-3 flex items-center justify-between rounded-none text-left cursor-pointer transition-all ${
                        isCursorTrailsEnabled ? 'bg-sky-100 text-black font-black' : 'bg-stone-50 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase flex items-center gap-1 text-[#1A1A1A]">
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                          Cursor Trails Simulation
                        </span>
                        <span className="text-[8px] text-stone-500 mt-0.5">Visualize cursor paths for Mom, Dad, Lucy & Billy</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 border border-black bg-white">
                        {isCursorTrailsEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEM DATABASE ARCHIVE BACKUPS */}
              {activeTab === 'audio' && (
                <div className="space-y-4">
                  {/* Backup / Restore Database Console */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">🗄️ Full Workspace Database Archive</span>
                    <p className="text-[9px] text-stone-500 font-bold leading-normal">
                      Export this workspace&apos;s complete canvases, stickies, sketch drawings, and safety parameters into a local JSON archive file, or upload an archive to restore your layout state instantly.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleExportBackup}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase p-2 border-2 border-black rounded-none flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export DB</span>
                      </button>
                      <label className="bg-sky-600 hover:bg-sky-700 text-white text-[9px] font-black uppercase p-2 border-2 border-black rounded-none flex items-center justify-center gap-1 cursor-pointer text-center">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import DB</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Family ties activity log stream */}
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-stone-400">👪 Family Activity Log</span>
                      <button
                        onClick={() => {
                          const members = ['Mom', 'Dad', 'Lucy', 'Billy'];
                          const actions = [
                            '✏️ Appended checklist items to "Grocery Runs"',
                            '🎨 Drafted custom smiley drawing sketchpad',
                            '⏱️ Recalibrated Picnic countdown deadline',
                            '🧘 Tuned wave ambient audio volume up',
                            '🔒 Reset secure lock screen barrier'
                          ];
                          const m = members[Math.floor(getSafeRandom() * members.length)];
                          const a = actions[Math.floor(getSafeRandom() * actions.length)];
                          addActivityLog(m, a);
                        }}
                        className="text-[8px] bg-black text-[#FFB703] border-2 border-black px-1.5 py-0.5 uppercase font-bold cursor-pointer"
                      >
                        Simulate Action
                      </button>
                    </div>

                    <div className="border-2 border-black bg-stone-50 text-[9px] max-h-48 overflow-y-auto divide-y divide-black/10 font-mono p-1">
                      {activityLogs.length === 0 ? (
                        <div className="p-4 text-center text-stone-400">No active activity logs found.</div>
                      ) : (
                        activityLogs.map(log => (
                          <div key={log.id} className="p-1 flex items-start space-x-1.5 text-stone-800">
                            <span className="shrink-0 text-xs">{log.avatar}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between text-[7px] text-stone-400 font-bold">
                                <span>{log.member}</span>
                                <span>{log.time}</span>
                              </div>
                              <p className="font-semibold text-stone-700 leading-tight mt-0.5">{log.action}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AUTOMATIONS & ARCHIVE (Batch 9) */}
              {activeTab === 'automations' && (
                <div className="space-y-4">
                  {/* Automated Spawners */}
                  <div className="space-y-2 border-b border-black/10 pb-3">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">🗓️ Sunday Layout Spawner</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-700">Auto-spawn layouts</span>
                      <button
                        onClick={() => {
                          setWeeklySpawnerEnabled(prev => !prev);
                          addActivityLog('System', `Weekly layout spawner toggle changed to: ${!weeklySpawnerEnabled ? 'ENABLED' : 'DISABLED'}`);
                        }}
                        className={`text-[9px] font-black px-2 py-1 border-2 border-black rounded-none cursor-pointer ${weeklySpawnerEnabled ? 'bg-emerald-400 text-black border-black neo-shadow-sm font-black' : 'bg-stone-100 text-stone-500 border-stone-300'}`}
                      >
                        {weeklySpawnerEnabled ? 'ACTIVE ON SUNDAYS' : 'DISABLED'}
                      </button>
                    </div>
                    <button
                      onClick={() => triggerWeeklySpawner(true)}
                      className="w-full bg-white hover:bg-stone-50 border-2 border-black py-1.5 text-[9px] font-black uppercase rounded-none text-center cursor-pointer transition-all active:translate-y-0.5"
                    >
                      Spawn Empty Weekly Checklist Now
                    </button>
                  </div>

                  {/* Smart Email Inbox Sim */}
                  <div className="space-y-2 border-b border-black/10 pb-3">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">📬 Simulate Email Inbox Hook</span>
                    <p className="text-[9px] text-stone-500 font-bold leading-normal">
                      Send notes to your system board address <span className="bg-stone-100 px-1 font-mono text-black">board-inbox@zenith.com</span> to automatically append elements:
                    </p>
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Email Subject Header..."
                        value={simulatedEmailSubject}
                        onChange={(e) => setSimulatedEmailSubject(e.target.value)}
                        className="w-full text-[10px] border-2 border-black p-1 bg-white font-semibold rounded-none focus:outline-none"
                      />
                      <textarea
                        placeholder="Type body details to send..."
                        value={simulatedEmailBody}
                        onChange={(e) => setSimulatedEmailBody(e.target.value)}
                        rows={2}
                        className="w-full text-[10px] border-2 border-black p-1 bg-white font-semibold rounded-none focus:outline-none resize-none"
                      />
                      <button
                        onClick={handleSimulatedEmailSend}
                        className="w-full bg-black text-[#FFB703] hover:bg-stone-900 border-2 border-black py-1 text-[9px] font-black uppercase rounded-none cursor-pointer transition-all active:translate-y-0.5"
                      >
                        Simulate Email Arrival
                      </button>
                    </div>
                  </div>

                  {/* Auto Archive Rules */}
                  <div className="space-y-2 border-b border-black/10 pb-3">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">🗃️ Auto-Archive Rule Schedule</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-700">Archive 30-day old cards</span>
                      <button
                        onClick={() => {
                          setAutoArchiveEnabled(prev => !prev);
                          addActivityLog('System', `Auto-archive rule schedule toggle changed to: ${!autoArchiveEnabled ? 'ENABLED' : 'DISABLED'}`);
                        }}
                        className={`text-[9px] font-black px-2 py-1 border-2 border-black rounded-none cursor-pointer ${autoArchiveEnabled ? 'bg-emerald-400 text-black border-black neo-shadow-sm font-black' : 'bg-stone-100 text-stone-500 border-stone-300'}`}
                      >
                        {autoArchiveEnabled ? 'SCHEDULED ACTIVE' : 'MUTED'}
                      </button>
                    </div>
                    <button
                      onClick={() => archiveStaleElements(true)}
                      className="w-full bg-stone-100 hover:bg-stone-200 border-2 border-black py-1.5 text-[9px] font-black uppercase rounded-none text-center cursor-pointer transition-all active:translate-y-0.5"
                    >
                      Run 30-Day Archival Scan Now
                    </button>
                  </div>

                  {/* Archives List Drawer Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-stone-400">📁 Archived Elements ({archivedElements.length})</span>
                      {archivedElements.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Permanently purge ALL archived elements forever?')) {
                              setArchivedElements([]);
                              addActivityLog('System', '🧹 Permanently purged the entire archived cards folder');
                            }
                          }}
                          className="text-[8px] bg-red-100 text-red-600 border border-red-400 px-1 hover:bg-red-200 uppercase font-black rounded-none cursor-pointer"
                        >
                          Purge All
                        </button>
                      )}
                    </div>
                    
                    <div className="border-2 border-black bg-stone-50 text-[9px] max-h-44 overflow-y-auto divide-y divide-black/10 font-sans p-1">
                      {archivedElements.length === 0 ? (
                        <div className="p-4 text-center text-stone-400 font-bold uppercase">Archive folder is empty.</div>
                      ) : (
                        archivedElements.map(item => (
                          <div key={item.id} className="p-1.5 flex flex-col gap-1 bg-white border border-stone-200 my-0.5 rounded-none text-black">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-black uppercase truncate max-w-[150px]">
                                {item.title || 'Untitled Card'}
                              </span>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setElements(prev => [...prev, item]);
                                    setArchivedElements(prev => prev.filter(e => e.id !== item.id));
                                    addActivityLog('System', `Restored archived card: "${item.title}" back to active canvas`);
                                  }}
                                  className="bg-black text-white hover:bg-stone-800 text-[8px] font-black px-1.5 py-0.5 uppercase rounded-none cursor-pointer"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={() => {
                                    setArchivedElements(prev => prev.filter(e => e.id !== item.id));
                                    addActivityLog('System', `Permanently deleted archived card: "${item.title}"`);
                                  }}
                                  className="text-red-600 hover:bg-red-50 text-[8px] font-black px-1 py-0.5 uppercase border border-stone-300 rounded-none cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            {item.content && (
                              <p className="text-[9px] text-stone-500 font-semibold line-clamp-2 truncate">
                                {item.content}
                              </p>
                            )}
                            {item.checklistItems && (
                              <span className="text-[8px] text-stone-400 font-black uppercase">
                                Checklist • {item.checklistItems.length} items
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 100. One-Click Fresh Start Initialization (Batch 10) */}
                  <div className="space-y-2 pt-3 border-t-2 border-dashed border-red-500/30">
                    <span className="text-[10px] font-black uppercase text-red-600 block">⚠️ Recruiter One-Click Fresh Start Reset</span>
                    <p className="text-[9px] text-stone-500 font-bold leading-normal text-black">
                      Instantly purges all active cards, sketchpads, and guest passes, triggers a celebratory sound synth and confetti, and spawns a pristine pre-loaded layout for immediate testing!
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Are you ready to trigger a Fresh Start? This will reset and pre-populate your board with a clean, beautifully styled setup!')) {
                          setElements([]);
                          setGuestPasses([]);
                          setArchivedElements([]);
                          setStreakCount(1);
                          setCompletedTasksCount(0);
                          setCanvasBackgroundTheme('default');
                          
                          const t = Date.now();
                          const defaultStarterElements: CanvasElement[] = [
                            {
                              id: `starter-well-1-${t}`,
                              type: 'text',
                              title: '📝 Welcome to Zenith Canvas!',
                              x: 40,
                              y: 60,
                              w: 300,
                              h: 230,
                              color: '#FEF08A',
                              content: `Hey! Press the "✨" button in any widget header to apply sticker stamps. Or drag a CSV file onto the board!\n\nToday is: {{current_date}}\nTime: {{current_time}}`,
                              createdAt: t,
                              livePreviewActive: true
                            },
                            {
                              id: `starter-well-2-${t}`,
                              type: 'checklist',
                              title: '📋 Recruiter Wow Factor Goals',
                              x: 360,
                              y: 60,
                              w: 290,
                              h: 230,
                              color: '#A7F3D0',
                              checklistItems: [
                                { id: `starter-check-1-${t}`, text: 'Click "✨" sticker button on card', done: false },
                                { id: `starter-check-2-${t}`, text: 'Check off a task to play chime sound', done: false },
                                { id: `starter-check-3-${t}`, text: 'Check-in on "Daily Consistency" streak', done: false },
                                { id: `starter-check-4-${t}`, text: 'Click "⚙️ Blueprint Stack" in left sidebar', done: false }
                              ],
                              createdAt: t
                            }
                          ];
                          setElements(defaultStarterElements);
                          playMilestoneChime();
                          triggerConfettiCelebrate();
                          addActivityLog('System', '🔄 Performed 100% One-Click Fresh Start Initialization!');
                          alert('🔄 Zenith board successfully restored to a fresh, clean, pre-loaded starter setup!');
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white border-2 border-black py-2 text-[10px] font-black uppercase rounded-none cursor-pointer transition-all active:translate-y-0.5 text-center flex items-center justify-center gap-1.5"
                    >
                      <span>🔄 Trigger Fresh Start Reset</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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

      {/* 95. Interactive Help Guide Mascot (Zenny the Owl 🦉) (Batch 10) */}
      <div className="fixed bottom-4 right-4 z-[99999] flex flex-col items-end select-none">
        {/* Help Speech Bubble */}
        {isMascotBubbleOpen && (() => {
          const mascotTips = [
            'Try checking off a checklist item to trigger retro chime sound waves and confetti showers!',
            'You can drag-and-drop text or CSV files directly onto the canvas to instantly unpack widgets.',
            'Protect your workspace by setting a secure 4-digit PIN lock inside the Control Deck!',
            'Press "⚙️ Blueprint Stack" in the left sidebar to inspect the full technology and data flows!',
            'Stuck on style? Apply gorgeous fireside or midnight mood backdrops in the Control Deck!',
            'Tired of a blank sheet? Trigger "Fresh Start Reset" inside the Control Deck Automations tab!'
          ];
          return (
            <div className="bg-white text-black border-4 border-black p-3.5 max-w-[240px] neo-shadow rounded-none mb-2 text-xs relative animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Close button */}
              <button
                onClick={() => setIsMascotBubbleOpen(false)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white font-black border-2 border-black rounded-none flex items-center justify-center text-[8px] cursor-pointer"
              >
                ×
              </button>
              <div className="font-black text-amber-600 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                🦉 Zenny Says:
              </div>
              <p className="font-extrabold text-stone-800 text-[10px] leading-normal">
                {mascotTips[mascotTipIndex % mascotTips.length]}
              </p>
              <div className="mt-2 pt-1.5 border-t border-black/10 flex justify-between gap-1">
                <button
                  onClick={() => {
                    setMascotTipIndex(prev => (prev + 1) % mascotTips.length);
                    playMilestoneChime();
                  }}
                  className="text-[8px] font-black uppercase text-amber-700 hover:underline cursor-pointer bg-amber-50 px-1 py-0.5 border border-black/20"
                >
                  Next Tip
                </button>
                <button
                  onClick={() => {
                    setShowArchitectureModal(true);
                    setIsMascotBubbleOpen(false);
                  }}
                  className="text-[8px] font-black uppercase text-blue-700 hover:underline cursor-pointer bg-blue-50 px-1 py-0.5 border border-black/20"
                >
                  Architecture
                </button>
              </div>
            </div>
          );
        })()}
        
        {/* Floating Zenny Trigger Icon */}
        <button
          onClick={() => {
            setIsMascotBubbleOpen(prev => !prev);
            playMilestoneChime();
            triggerConfettiCelebrate();
          }}
          className="w-12 h-12 rounded-none bg-[#FFB703] border-4 border-black neo-shadow flex items-center justify-center text-2xl hover:scale-105 active:scale-95 cursor-pointer select-none transition-all animate-bounce"
          title="Click to talk to Zenny!"
        >
          🦉
        </button>
      </div>

      {/* 99. Interactive System Architecture Blueprint Page Modal (Batch 10) */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 text-black select-text">
          <div className="bg-[#0f172a] text-slate-100 border-4 border-black p-6 w-full max-w-3xl neo-shadow relative rounded-none flex flex-col max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setShowArchitectureModal(false)}
              className="absolute top-4 right-4 text-xs font-black border-2 border-black bg-rose-500 text-white w-7 h-7 flex items-center justify-center rounded-none cursor-pointer hover:bg-rose-600"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-4 border-b-2 border-slate-700 pb-3 select-none">
              <span className="text-[9px] font-black uppercase tracking-widest bg-sky-500 text-black px-2 py-0.5 border border-black inline-block">
                Feature 99: Recruiter Wow Factor
              </span>
              <h3 className="text-base font-black uppercase tracking-tight mt-1 text-sky-400">
                ⚙️ Interactive System Architecture Blueprint
              </h3>
              <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                Technical layout details & active data processing pipelines for zenith-workspace engine.
              </p>
            </div>

            {/* Interactive Blueprint diagram and explanation */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 py-1 text-xs">
              
              {/* Core pipeline diagram */}
              <div className="border-2 border-slate-700 bg-slate-900/60 p-4 font-mono text-[9px] text-sky-300 rounded-none leading-normal overflow-x-auto select-none">
                <div className="text-center font-bold text-slate-400 mb-2">▲ ZENITH COOPERATIVE RUNTIME PIPELINE ▲</div>
                {` [Browser Sandbox / Client-Side Viewport]
     │
     ├──► [Drag-and-Drop Handler] ──► Reads File Streams (.txt/.csv)
     │                                    │
     │                                    ▼
     │                             [File Parser] ──► Creates Checklists/Sticky Widgets
     │
     ├──► [Interactive Canvas] ──► Dynamic State (elements & coordinates)
     │                                    │
     │                                    ▼
     │                             [LocalStorage Sync Engine] ──► 100% Client Offline Lock
     │
     └──► [Web Audio API Synth] ──► Playback (Oscillators, Chime frequencies, Gain Mixer)`}
              </div>

              {/* Sub-modules information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Module 1: Layout Engine */}
                <div className="border border-slate-700 p-3 bg-slate-900/30">
                  <h4 className="font-extrabold text-[11px] text-sky-400 uppercase tracking-wider">📐 Absolute Canvas Coordinates</h4>
                  <p className="text-[10px] text-slate-300 leading-normal mt-1">
                    Widget cards are positioned absolutely on a dynamic virtual board grid. Coordinates, dimensions, color settings, checklist item states, and stickers are computed using precise reactive React hooks.
                  </p>
                </div>

                {/* Module 2: Audio Synthesis */}
                <div className="border border-slate-700 p-3 bg-slate-900/30">
                  <h4 className="font-extrabold text-[11px] text-emerald-400 uppercase tracking-wider">🎵 Custom Sound Synthesizers</h4>
                  <p className="text-[10px] text-slate-300 leading-normal mt-1">
                    Instead of using bulky external mp3 media, Zenith synthesizes rich digital tone chimes in real-time using native browser <span className="text-emerald-400">Web Audio API Oscillators</span>, complete with decay gain curves.
                  </p>
                </div>

                {/* Module 3: Security & Vault */}
                <div className="border border-slate-700 p-3 bg-slate-900/30">
                  <h4 className="font-extrabold text-[11px] text-amber-400 uppercase tracking-wider">🔒 Client Safe Shield Vault</h4>
                  <p className="text-[10px] text-slate-300 leading-normal mt-1">
                    A secure 4-digit numeric dialpad intercepts workspace viewing and restricts access, supported by clipboard copy block mechanics to guarantee safety.
                  </p>
                </div>

                {/* Module 4: Engagement & Fun */}
                <div className="border border-slate-700 p-3 bg-slate-900/30">
                  <h4 className="font-extrabold text-[11px] text-pink-400 uppercase tracking-wider">🎉 Engagement Delighters</h4>
                  <p className="text-[10px] text-slate-300 leading-normal mt-1">
                    The streak checking system, productivity star algorithms, and interactive confetti celebration streams keep users motivated and offer recruiters a polished experience.
                  </p>
                </div>
              </div>

              {/* Technologies list */}
              <div className="pt-2 border-t border-slate-800 select-none">
                <span className="font-black text-[9px] uppercase text-slate-400 block mb-1">Project Stack Specifications</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                  {['React 19', 'Next.js 15 (App Router)', 'Tailwind CSS v4', 'Web Audio Synth Engine', 'Interactive LocalStorage Sync'].map(tech => (
                    <span key={tech} className="bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            <div className="text-[10px] text-slate-400 font-bold uppercase text-center mt-4 pt-3 border-t border-slate-800 select-none">
              ⚡ Proudly built for recruiters with clean design and attention to detail.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
