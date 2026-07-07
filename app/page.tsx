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
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [activeTab, setActiveTab] = useState<'appearance' | 'safety' | 'sharing' | 'audio'>('appearance');
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

  // Audio Context Nodes state
  const [ambientAudioActive, setAmbientAudioActive] = useState<boolean>(false);
  const [audioVolumes, setAudioVolumes] = useState<{ rain: number; campfire: number; ocean: number; forest: number }>({
    rain: 0.3,
    campfire: 0,
    ocean: 0,
    forest: 0
  });

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
          content: 'Welcome to your Zenith Workspace! This is a real-time responsive family workspace.\n\n👉 Switch canvases in the left panel.\n👉 Add checklist items, sketch drawings, launch timers, or adjust focus noise!\n👉 Check out the right Ops Control Panel for advanced layout themes and safety PIN gates.'
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
          ]
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
          sketchData: ''
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
          countdownTarget: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
          soundVolume: 0.5
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
    if (activeCanvasId) {
      localStorage.setItem('zenith-active-canvas-id', activeCanvasId);
      // Automatically lock again if active canvas changes and PIN is set
      if (vaultPIN) {
        setIsVaultUnlocked(false);
        setPinInput('');
      }
    }
  }, [activeCanvasId, vaultPIN]);

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
      mediaUrl: type === 'media' ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80' : ''
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

  const getStationeryClass = () => {
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
        </div>
      </aside>

      {/* --- MAIN CANVAS CONTENT SECTION --- */}
      <main
        ref={boardRef}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        className={`flex-1 relative overflow-auto p-6 ${getStationeryClass()} min-h-[600px] transition-colors`}
      >
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
                className={`border-${borderWeight} border-black p-3 flex flex-col rounded-none cursor-default select-none ${shadowDepth} transition-shadow relative`}
                id={`card-${element.id}`}
              >
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
                    <textarea
                      value={element.content || ''}
                      disabled={isReadOnlyMode}
                      onChange={(e) => handleUpdateElement(element.id, { content: e.target.value })}
                      placeholder="Type note details..."
                      className="w-full h-full bg-transparent border-0 focus:ring-0 p-0 text-xs font-semibold leading-relaxed focus:outline-none resize-none"
                    />
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
                                const updatedItems = element.checklistItems?.map(i =>
                                  i.id === item.id ? { ...i, done: !i.done } : i
                                );
                                handleUpdateElement(element.id, { checklistItems: updatedItems });
                              }}
                              className="mt-0.5 rounded-none border-2 border-black text-black focus:ring-0 cursor-pointer"
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
                          className="flex gap-1 mt-2 pt-2 border-t border-black/10"
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
      <AnimatePresence>
        {isControlDeckOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white border-l-4 border-black p-5 flex flex-col z-50 neo-shadow"
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
            <div className="flex border-b-2 border-black mb-4 gap-1">
              {(['appearance', 'safety', 'sharing', 'audio'] as const).map(tab => (
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PUBLIC SHARE LINK MODAL POPUP --- */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
      </AnimatePresence>

    </div>
  );
}
