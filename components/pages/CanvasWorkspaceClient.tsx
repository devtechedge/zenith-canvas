'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import Sidebar from '@/components/layout/Sidebar';
import CommandPalette from '@/components/layout/CommandPalette';
import CanvasEditor from '@/components/editor/CanvasEditor';
import AcousticWaveOverlay from '@/components/editor/AcousticWaveOverlay';
import { 
  ChevronLeft, 
  Trash2, 
  Smile, 
  Image as ImageIcon, 
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Cloud,
  Check,
  Download,
  Share2,
  Menu,
  Lock,
  Unlock,
  Columns2,
  FolderTree,
  SlidersHorizontal,
  History,
  Clock,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import OpsControlDeck from '@/components/layout/OpsControlDeck';

const EMOJIS = ['📄', '🚀', '🎯', '📊', '💡', '🔥', '🎨', '⚙️', '📅', '📝', '🔒', '🛠️', '📣', '🌍'];

function generateElementId(prefix = 'el'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFriendlyActionDescription(tx: any) {
  let actionName = '';
  let icon = '✏️';
  let detail = '';

  try {
    const parsed = JSON.parse(tx.data);
    const blockTypeMap: Record<string, string> = {
      heading_1: 'large heading',
      heading_2: 'sub-heading',
      text: 'text paragraph',
      todo: 'checklist box',
      callout: 'callout box',
      code_sandbox: 'code playground',
      collection_ref: 'smart table',
      toggle_list: 'toggle list',
      quote: 'quote box',
      page_link: 'page link'
    };

    if (tx.table === 'canvases') {
      actionName = tx.action === 'insert' ? 'Created this page' : tx.action === 'delete' ? 'Deleted page' : 'Renamed page';
      icon = '📄';
      if (parsed.title) detail = `to "${parsed.title}"`;
    } else if (tx.table === 'elements') {
      const typeLabel = blockTypeMap[parsed.type] || parsed.type || 'block';
      if (tx.action === 'insert') {
        actionName = `Added a ${typeLabel}`;
        icon = '➕';
      } else if (tx.action === 'delete') {
        actionName = `Removed a ${typeLabel}`;
        icon = '❌';
      } else {
        actionName = `Edited a ${typeLabel}`;
        icon = '📝';
      }
      
      if (parsed.content) {
        detail = `("${parsed.content.substring(0, 30)}${parsed.content.length > 30 ? '...' : ''}")`;
      }
    } else if (tx.table === 'collections') {
      actionName = tx.action === 'insert' ? 'Created a new table' : 'Updated table name';
      icon = '📊';
      if (parsed.name) detail = `named "${parsed.name}"`;
    } else if (tx.table === 'collectionRows') {
      actionName = tx.action === 'insert' ? 'Added a new row to table' : tx.action === 'delete' ? 'Deleted a row from table' : 'Edited a row in table';
      icon = '🔢';
    } else {
      actionName = `${tx.action === 'insert' ? 'Added' : tx.action === 'delete' ? 'Deleted' : 'Updated'} ${tx.table}`;
    }
  } catch {
    actionName = `${tx.action === 'insert' ? 'Added' : tx.action === 'delete' ? 'Deleted' : 'Updated'} a change`;
  }

  return { desc: `${icon} ${actionName} ${detail}`, action: tx.action };
}

function LiveSyncQueueViewer({ canvasId }: { canvasId: string }) {
  const transactions = useLiveQuery(() => 
    db.syncQueue.orderBy('timestamp').reverse().limit(10).toArray()
  ) || [];

  if (transactions.length === 0) {
    return (
      <div className="text-emerald-400 font-bold py-1">
        🟢 All edits on this page have been successfully auto-saved!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx) => {
        const { desc, action } = getFriendlyActionDescription(tx);
        let color = 'text-blue-300';
        if (action === 'insert') {
          color = 'text-green-300';
        } else if (action === 'delete') {
          color = 'text-red-300';
        } else if (action === 'update') {
          color = 'text-amber-300';
        }

        return (
          <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/40 pb-1 text-[10px]">
            <span className={color}>
              [{new Date(tx.timestamp).toLocaleTimeString()}] {desc}
            </span>
            <span className="text-[8px] text-slate-500 font-mono">
              ID: {tx.recordId.substring(0, 8)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function CanvasWorkspaceClient() {
  const params = useParams();
  const router = useRouter();
  const canvasId = params?.canvasId as string;

  const { 
    updateCanvasTitle, 
    updateCanvasCover, 
    updateCanvasIcon, 
    deleteCanvasAndChildren,
    syncStatus,
    isOnline
  } = useCanvasSync();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverInput, setShowCoverInput] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [showHistoryTimeline, setShowHistoryTimeline] = useState(false);

  const transactionsList = useLiveQuery(() => 
    db.syncQueue.orderBy('timestamp').reverse().toArray()
  ) || [];

  // Split Screen states (Feature 27)
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [splitCanvasId, setSplitCanvasId] = useState<string | null>(null);

  // Focus & Accent Theme Settings
  const [accentTheme, setAccentTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'default';
    return localStorage.getItem(`zenith-theme-${canvasId}`) || 'default';
  });
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isCozyStoryMode, setIsCozyStoryMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`zenith-cozy-mode-${canvasId}`) === 'true';
  });

  // Batch 4: Look, Feeling & Personalization Customizations (Features 31-40)
  const [stationeryTheme, setStationeryTheme] = useState<'mint' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'mint';
    return (localStorage.getItem(`zenith-stationery-theme-${canvasId}`) as 'mint' | 'dark') || 'mint';
  });

  const [shadowDepth, setShadowDepth] = useState<number>(() => {
    if (typeof window === 'undefined') return 4;
    const val = localStorage.getItem(`zenith-shadow-depth-${canvasId}`);
    return val ? parseInt(val, 10) : 4;
  });

  const [borderWeight, setBorderWeight] = useState<'fine' | 'classic' | 'bold'>(() => {
    if (typeof window === 'undefined') return 'classic';
    return (localStorage.getItem(`zenith-border-weight-${canvasId}`) as 'fine' | 'classic' | 'bold') || 'classic';
  });

  const [textSize, setTextSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 14;
    const val = localStorage.getItem(`zenith-text-size-${canvasId}`);
    return val ? parseInt(val, 10) : 14;
  });

  const [smartScrollbar, setSmartScrollbar] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(`zenith-smart-scrollbar-${canvasId}`) !== 'false';
  });

  const [highlightBrush, setHighlightBrush] = useState<'none' | 'yellow' | 'mint' | 'pink' | 'cyan'>(() => {
    if (typeof window === 'undefined') return 'none';
    return (localStorage.getItem(`zenith-highlight-brush-${canvasId}`) as 'none' | 'yellow' | 'mint' | 'pink' | 'cyan') || 'none';
  });

  const [spacingDensity, setSpacingDensity] = useState<'compact' | 'normal' | 'relaxed'>(() => {
    if (typeof window === 'undefined') return 'normal';
    return (localStorage.getItem(`zenith-spacing-density-${canvasId}`) as 'compact' | 'normal' | 'relaxed') || 'normal';
  });

  const [headingFont, setHeadingFont] = useState<'clean' | 'handwritten'>(() => {
    if (typeof window === 'undefined') return 'clean';
    return (localStorage.getItem(`zenith-heading-font-${canvasId}`) as 'clean' | 'handwritten') || 'clean';
  });

  const [dividerStyle, setDividerStyle] = useState<'straight' | 'dashed' | 'zigzag' | 'thick'>(() => {
    if (typeof window === 'undefined') return 'straight';
    return (localStorage.getItem(`zenith-divider-style-${canvasId}`) as 'straight' | 'dashed' | 'zigzag' | 'thick') || 'straight';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`zenith-canvas-locked-${canvasId}`) === 'true';
  });
  const [backdropShader, setBackdropShader] = useState<string>(() => {
    if (typeof window === 'undefined') return 'none';
    return localStorage.getItem(`zenith-backdrop-shader-${canvasId}`) || 'none';
  });
  const [flashFingerprint, setFlashFingerprint] = useState(false);
  const [fingerprintCopied, setFingerprintCopied] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<{ establishedTime: string; checksumTime: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSessionLogs({
        establishedTime: new Date(Date.now() - 5000).toLocaleTimeString(),
        checksumTime: new Date().toLocaleTimeString(),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    localStorage.setItem(`zenith-canvas-locked-${canvasId}`, String(nextLocked));
  };

  // 1. Fetch current canvas details
  const canvas = useLiveQuery(() => db.canvases.get(canvasId), [canvasId]);

  // Fetch all non-archived canvases for path hierarchy and split panel options (Feature 21, 27)
  const canvases = useLiveQuery(() => db.canvases.where('isArchived').equals(0).toArray()) || [];

  // Feature 21: Compute dynamic path trail from root to current canvas
  const breadcrumbs = useMemo(() => {
    if (!canvas || !canvases.length) return [];
    const trail = [];
    let current: any = canvas;
    while (current) {
      trail.unshift(current);
      if (!current.parentId) break;
      current = canvases.find(c => c.id === current?.parentId);
    }
    return trail;
  }, [canvas, canvases]);

  // Load elements of current node layer to compute checksum
  const elements = useLiveQuery(async () => {
    return await db.elements.where('canvasId').equals(canvasId).toArray();
  }, [canvasId]) || [];

  // Compute live deterministic checksum of current Node Layer
  const checksumHash = useMemo(() => {
    if (!canvas || !elements) return 'ZN-000000000000';
    const contentSum = elements.map(e => `${e.id}:${e.content}:${e.type}`).join('|');
    const stateString = `${canvas.title}-${canvas.icon || ''}-${contentSum}`;
    
    // Simple deterministic FNV-1a checksum calculation
    let hash = 2166136261;
    for (let i = 0; i < stateString.length; i++) {
      hash ^= stateString.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const hex = (hash >>> 0).toString(16).toUpperCase();
    return `ZN-${hex.padStart(8, '0')}`;
  }, [canvas, elements]);

  // Flash fingerprint on update
  useEffect(() => {
    if (checksumHash && checksumHash !== 'ZN-000000000000') {
      const timerS = setTimeout(() => {
        setFlashFingerprint(true);
      }, 0);
      const timer = setTimeout(() => setFlashFingerprint(false), 800);
      return () => {
        clearTimeout(timerS);
        clearTimeout(timer);
      };
    }
  }, [checksumHash]);

  // 2. Fetch live bi-directional backlinks
  const backlinks = useLiveQuery(async () => {
    if (!canvas?.title) return [];
    const allCanvases = await db.canvases.toArray();
    const searchString = `[[${canvas.title}]]`;
    const matchingElements = await db.elements
      .filter(el => el.content.includes(searchString))
      .toArray();
    
    const parentCanvasIds = Array.from(new Set(matchingElements.map(el => el.canvasId)));
    const filteredIds = parentCanvasIds.filter(id => id !== canvasId);
    return allCanvases.filter(c => filteredIds.includes(c.id));
  }, [canvas?.title, canvasId]) || [];

  // Handle global key shortcut Ctrl+K
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

  // Update cover input value when canvas cover changes
  useEffect(() => {
    if (canvas?.coverImage) {
      const cover = canvas.coverImage;
      setTimeout(() => {
        setCoverUrl(cover);
      }, 0);
    }
  }, [canvas?.coverImage]);

  const handleTitleChange = async (newTitle: string) => {
    if (canvasId) {
      await updateCanvasTitle(canvasId, newTitle);
    }
  };

  const handleSelectEmoji = async (emoji: string) => {
    if (canvasId) {
      await updateCanvasIcon(canvasId, emoji);
      setShowEmojiPicker(false);
    }
  };

  const handleSaveCover = async () => {
    if (canvasId) {
      await updateCanvasCover(canvasId, coverUrl || null);
      setShowCoverInput(false);
    }
  };

  const generateProceduralCover = async (type: 'neo_grid' | 'bauhaus' | 'warning_stripes' | 'cosmic_pulse') => {
    let svgString = '';
    if (type === 'neo_grid') {
      svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
        <rect width="800" height="300" fill="#0B0C10" />
        <defs>
          <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4E0E2E" />
            <stop offset="100%" stop-color="#0A192F" />
          </linearGradient>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#66FCF1" stroke-width="0.5" stroke-opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="800" height="300" fill="url(#gridGrad)" />
        <rect width="800" height="300" fill="url(#grid)" />
        <line x1="100" y1="50" x2="700" y2="250" stroke="#FF007F" stroke-width="2" stroke-opacity="0.8" />
        <circle cx="400" cy="150" r="60" fill="none" stroke="#66FCF1" stroke-width="3" stroke-opacity="0.7" />
      </svg>`;
    } else if (type === 'bauhaus') {
      svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
        <rect width="800" height="300" fill="#F4F1EA" />
        <circle cx="200" cy="150" r="100" fill="#E63946" opacity="0.8" />
        <rect x="350" y="50" width="150" height="200" fill="#457B9D" opacity="0.8" />
        <polygon points="550,250 650,50 750,250" fill="#E9C46A" opacity="0.9" />
        <line x1="0" y1="150" x2="800" y2="150" stroke="#1A1A1A" stroke-width="4" />
        <line x1="400" y1="0" x2="400" y2="300" stroke="#1A1A1A" stroke-width="2" stroke-dasharray="10,5" />
      </svg>`;
    } else if (type === 'warning_stripes') {
      svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
        <rect width="800" height="300" fill="#FFB703" />
        <defs>
          <pattern id="stripes" width="40" height="40" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="40" stroke="#1A1A1A" stroke-width="20" />
          </pattern>
        </defs>
        <rect width="800" height="300" fill="url(#stripes)" />
        <rect x="150" y="100" width="500" height="100" fill="#1A1A1A" stroke="#FFB703" stroke-width="4" />
        <text x="400" y="160" fill="#FFB703" font-family="monospace" font-size="28" font-weight="900" text-anchor="middle">WARNING: ZENITH SYSTEM ACTIVE</text>
      </svg>`;
    } else if (type === 'cosmic_pulse') {
      svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
        <rect width="800" height="300" fill="#1D1A39" />
        <circle cx="400" cy="150" r="120" fill="none" stroke="#812F33" stroke-width="12" opacity="0.4" />
        <circle cx="400" cy="150" r="90" fill="none" stroke="#F15C5C" stroke-width="8" opacity="0.6" />
        <circle cx="400" cy="150" r="60" fill="none" stroke="#FFB067" stroke-width="4" opacity="0.8" />
        <circle cx="400" cy="150" r="30" fill="#FFB067" />
        <path d="M 100 150 Q 250 50, 400 150 T 700 150" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.5" />
      </svg>`;
    }
    
    const base64Svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    await updateCanvasCover(canvasId, base64Svg);
    setCoverUrl(base64Svg);
  };

  const handleDeleteCurrent = async () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    await deleteCanvasAndChildren(canvasId);
    router.push('/');
  };

  const handleLoadTemplate = async (templateId: 'sprint' | 'playground' | 'wiki') => {
    // Purge elements to replace with clean structure
    const currentElements = await db.elements.where('canvasId').equals(canvasId).toArray();
    for (const el of currentElements) {
      await db.elements.delete(el.id);
    }

    if (templateId === 'sprint') {
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'heading_1',
        content: '🚀 Product Launch & Sprint Roadmap',
        properties: '{}',
        sortOrder: 1.0,
        updatedAt: new Date(),
      });
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'callout',
        content: 'Keep track of your project tasks and milestones in this interactive board.',
        properties: JSON.stringify({ mood: 'success' }),
        sortOrder: 2.0,
        updatedAt: new Date(),
      });
      const tableId = generateElementId('table');
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'collection_ref',
        content: 'Data-Grid Table',
        properties: JSON.stringify({ tableId, provisioned: true }),
        sortOrder: 3.0,
        updatedAt: new Date(),
      });
      
      // Seed columns
      const columns = [
        { id: 'col-task', name: 'Milestone Task', type: 'Text' },
        { id: 'col-status', name: 'Status', type: 'Select' },
        { id: 'col-hours', name: 'Hours', type: 'Number' }
      ];
      await db.collections.add({
        id: tableId,
        canvasId,
        name: 'Sprint Board',
        schema: JSON.stringify(columns)
      });
      
      // Seed rows
      await db.collectionRows.add({
        id: generateElementId('row'),
        tableId,
        cells: JSON.stringify({ 'col-task': 'Verify offline autosave', 'col-status': 'In Progress', 'col-hours': 12 }),
        sortOrder: 1.0,
      });
      await db.collectionRows.add({
        id: generateElementId('row'),
        tableId,
        cells: JSON.stringify({ 'col-task': 'Turn on typewriter key sounds', 'col-status': 'Completed', 'col-hours': 6 }),
        sortOrder: 2.0,
      });
    } else if (templateId === 'playground') {
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'heading_1',
        content: '⚡ Live Javascript Playground Sanctuary',
        properties: '{}',
        sortOrder: 1.0,
        updatedAt: new Date(),
      });
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'callout',
        content: 'Write executable JS directly on your Canvas! Run logs inside the console box with execution latency timing statistics.',
        properties: JSON.stringify({ mood: 'energy' }),
        sortOrder: 2.0,
        updatedAt: new Date(),
      });
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'code_sandbox',
        content: `// Dynamic Fibonnaci sequence runner\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconst n = 15;\nconsole.log(\`Calculating Fibonacci value for: \${n}\`);\nconsole.log(\`Result:\`, fibonacci(n));`,
        properties: '{}',
        sortOrder: 3.0,
        updatedAt: new Date(),
      });
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'acoustic_wave',
        content: '',
        properties: JSON.stringify({ pitch: 528, waveform: 'sine' }),
        sortOrder: 4.0,
        updatedAt: new Date(),
      });
    } else if (templateId === 'wiki') {
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'heading_1',
        content: '🔮 Zenith Wiki Knowledge Hub',
        properties: '{}',
        sortOrder: 1.0,
        updatedAt: new Date(),
      });
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'quote',
        content: 'Organizing information is not about storing documents; it is about building dynamic connections that ignite intelligence.',
        properties: '{}',
        sortOrder: 2.0,
        updatedAt: new Date(),
      });
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'toggle_list',
        content: '💡 Quick Wiki Tips',
        properties: JSON.stringify({ open: true, body: '1. Link pages together easily using [[]] double brackets.\n2. Save backups of your page before making major changes.\n3. Turn on typing and background sounds to help you focus.' }),
        sortOrder: 3.0,
        updatedAt: new Date(),
      });
      await db.elements.add({
        id: generateElementId('el'),
        canvasId,
        type: 'page_link',
        content: 'Connected Node Link',
        properties: '{}',
        sortOrder: 4.0,
        updatedAt: new Date(),
      });
    }
  };

  // --- Feature 3: Portable Canvas Bundler Offline Export Engine ---
  const handleExportBundle = async () => {
    if (!canvas) return;
    
    const elementsToBundle = await db.elements.where('canvasId').equals(canvasId).toArray();
    const collectionsToBundle = await db.collections.where('canvasId').equals(canvasId).toArray();
    
    let collectionsHtml = '';
    for (const coll of collectionsToBundle) {
      const rowsToBundle = await db.collectionRows.where('tableId').equals(coll.id).toArray();
      let schemaCols: any[] = [];
      try { schemaCols = JSON.parse(coll.schema); } catch {}
      
      collectionsHtml += `
        <div style="border: 2px solid #1A1A1A; margin-top: 20px; padding: 15px; background: white; box-shadow: 4px 4px 0px #1A1A1A;">
          <h3 style="font-family: monospace; font-size: 13px; margin-top: 0; text-transform: uppercase;">📦 Datagrid Collection: ${coll.name}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: monospace; border: 2px solid #1A1A1A;">
            <thead>
              <tr style="background: #F4F7F6; border-bottom: 2px solid #1A1A1A;">
                ${schemaCols.map((c: any) => `<th style="padding: 8px; text-align: left; border-right: 1px solid #1A1A1A; font-weight: bold; border-bottom: 2px solid #1A1A1A;">${c.name}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rowsToBundle.map(r => {
                let cells: Record<string, any> = {};
                try { cells = JSON.parse(r.cells); } catch {}
                return `
                  <tr style="border-bottom: 1px solid #1A1A1A; background: white;">
                    ${schemaCols.map((c: any) => `<td style="padding: 8px; border-right: 1px solid #1A1A1A;">${cells[c.id] || ''}</td>`).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    const elementsHtml = elementsToBundle.map(el => {
      if (el.type === 'heading_1') return `<h1 style="font-size: 28px; font-weight: 900; border-bottom: 3px solid #1A1A1A; padding-bottom: 6px; margin-top: 30px; letter-spacing: -0.02em;">${el.content}</h1>`;
      if (el.type === 'heading_2') return `<h2 style="font-size: 18px; font-weight: 800; border-bottom: 2px solid #1A1A1A; padding-bottom: 4px; margin-top: 24px; letter-spacing: -0.01em;">${el.content}</h2>`;
      if (el.type === 'todo') {
        let checked = false;
        try { checked = JSON.parse(el.properties).checked; } catch {}
        return `
          <div style="display: flex; align-items: flex-start; margin: 8px 0; font-size: 13px;">
            <input type="checkbox" ${checked ? 'checked' : ''} disabled style="margin-right: 10px; margin-top: 3px; width: 15px; height: 15px; border: 2px solid #1A1A1A;">
            <span style="${checked ? 'text-decoration: line-through; color: #888; font-weight: 500;' : 'font-weight: bold;'}">${el.content}</span>
          </div>
        `;
      }
      if (el.type === 'callout') return `
        <div style="border: 2px solid #1A1A1A; background: #FFF; padding: 14px; margin: 15px 0; display: flex; align-items: flex-start; box-shadow: 3px 3px 0px #1A1A1A;">
          <span style="font-size: 18px; margin-right: 12px; display: inline-block;">💡</span>
          <span style="font-size: 12px; font-weight: bold;">${el.content}</span>
        </div>
      `;
      if (el.type === 'code_sandbox') return `
        <div style="border: 2px solid #1A1A1A; background: #0B0C10; color: #66FCF1; padding: 15px; font-family: monospace; font-size: 11px; margin: 15px 0; white-space: pre-wrap; box-shadow: 4px 4px 0px #1A1A1A;">
          <div style="color: #66FCF1; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 9px; font-weight: bold; text-transform: uppercase;">⌨️ STATIC NODE SANDBOX</div>
          ${el.content}
        </div>
      `;
      if (el.type === 'toggle_list') {
        let open = false;
        let body = '';
        try {
          const props = JSON.parse(el.properties);
          open = props.open;
          body = props.body || '';
        } catch {}
        return `
          <div style="border: 2px solid #1A1A1A; padding: 12px; margin: 15px 0; background: white; box-shadow: 3px 3px 0px #1A1A1A;">
            <div style="display: flex; align-items: center; font-weight: bold; font-size: 14px;">
              <span style="margin-right: 8px;">▶</span> ${el.content}
            </div>
            <div style="margin-top: 10px; padding-left: 20px; border-left: 2px solid #1A1A1A; color: #444; font-size: 12px; font-family: monospace; white-space: pre-wrap;">${body}</div>
          </div>
        `;
      }
      if (el.type === 'quote') {
        return `
          <div style="border-left: 4px solid #FFB703; padding: 10px 20px; margin: 15px 0; background: #FAF9F6; font-style: italic; font-family: serif; border: 2px solid #1A1A1A; border-left: 5px solid #FFB703;">
            ${el.content}
          </div>
        `;
      }
      if (el.type === 'page_link') {
        return `
          <div style="border: 2px solid #1A1A1A; padding: 12px; margin: 15px 0; background: #FFB70310; display: flex; align-items: center; justify-content: space-between; box-shadow: 3px 3px 0px #1A1A1A;">
            <div style="font-weight: bold; font-size: 13px;">🔗 Wiki Reference Connection Node</div>
            <div style="font-family: monospace; font-size: 11px; background: #FFB703; border: 1px solid #1A1A1A; padding: 2px 6px;">Connected</div>
          </div>
        `;
      }
      if (el.type === 'acoustic_wave') {
        let pitch = 440;
        try { pitch = JSON.parse(el.properties).pitch || 440; } catch {}
        return `
          <div style="border: 2px solid #1A1A1A; padding: 15px; margin: 15px 0; background: #FFF; box-shadow: 3px 3px 0px #1A1A1A;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #DDD; padding-bottom: 8px; margin-bottom: 10px;">
              <span style="font-weight: bold; font-size: 12px; font-family: monospace; color: #4F46E5;">🛰️ PORTABLE WAVE OSCILLATOR</span>
              <span style="background: #EEF2F6; color: #4F46E5; font-family: monospace; font-size: 10px; padding: 2px 6px; font-weight: bold; border-radius: 4px;">Web Audio API</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 900; color: #1A1A1A;">Oscillator Tuned to: <span style="color: #4F46E5;">${pitch} Hz</span></div>
                <div style="font-size: 10px; color: #666; margin-top: 2px;">Fully operational offline standalone Web Audio synthesizer.</div>
              </div>
              <button onclick="
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(${pitch}, ctx.currentTime);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
              " style="background: #FFB703; border: 2px solid #1A1A1A; font-weight: bold; font-size: 11px; padding: 6px 12px; cursor: pointer; box-shadow: 2px 2px 0px #1A1A1A;">
                TRIGGER TONE
              </button>
            </div>
          </div>
        `;
      }
      if (el.type === 'collection_ref') {
        return `<div style="margin: 20px 0;">${collectionsHtml}</div>`;
      }
      return `<p style="line-height: 1.6; margin: 10px 0; font-size: 13px; font-weight: 500; color: #1A1A1A;">${el.content}</p>`;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${canvas.title} • Zenith Portable Doc</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #F4F7F6;
      color: #1A1A1A;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 750px;
      margin: 30px auto;
      background: white;
      border: 4px solid #1A1A1A;
      box-shadow: 8px 8px 0px #1A1A1A;
      padding: 30px;
    }
    .header {
      border-bottom: 4px solid #1A1A1A;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .badge {
      font-family: monospace;
      font-size: 9px;
      background: #FFB703;
      border: 2px solid #1A1A1A;
      padding: 4px 8px;
      display: inline-block;
      margin-bottom: 15px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 50px;
      border-top: 2px dashed #1A1A1A;
      padding-top: 20px;
      text-align: center;
      font-family: monospace;
      font-size: 9px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">ZENITH CANVASES • OFFLINE PORTABLE REPLICA</span>
      <h1 style="margin: 0; font-size: 34px; font-weight: 900; letter-spacing: -0.03em;">${canvas.icon || '📄'} ${canvas.title}</h1>
    </div>
    <div class="content">
      ${elementsHtml}
    </div>
    <div class="footer">
      Zenith Canvas Engine • Auto-generated Portable Bundle • Fully Self-Contained Offline
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${canvas.title.toLowerCase().replace(/\s+/g, '-')}-offline.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (canvas === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F7F6]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#2D6A4F] animate-spin" />
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
            Loading your page...
          </p>
        </div>
      </div>
    );
  }

  if (canvas === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F7F6] p-6">
        <div className="max-w-md w-full border-4 border-[#1A1A1A] bg-white neo-shadow p-6 text-center space-y-4">
          <h2 className="text-xl font-black text-red-500">PAGE NOT FOUND</h2>
          <p className="text-xs font-medium text-gray-500">
            This page might have been deleted or moved. Go back to your home screen to find your pages.
          </p>
          <Link href="/">
            <button className="w-full py-2 bg-[#FFB703] border-2 border-[#1A1A1A] text-xs font-bold uppercase neo-shadow-sm">
              Go to Home Screen
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex h-screen overflow-hidden font-sans transition-all duration-300 ${
        stationeryTheme === 'dark' ? 'stationery-dark text-slate-100' : 'text-[#1A1A1A]'
      } ${
        smartScrollbar ? 'smart-scrollbar-active' : ''
      } ${
        `highlight-brush-${highlightBrush}`
      } ${
        `density-${spacingDensity}`
      } ${
        headingFont === 'handwritten' ? 'font-handwritten-active' : ''
      }`}
      style={{
        backgroundColor: stationeryTheme === 'dark' ? '#0B0C10' : '#F4F7F6',
        color: stationeryTheme === 'dark' ? '#F4F7F6' : '#1A1A1A',
        ['--bg-stationery' as any]: stationeryTheme === 'dark' ? '#0B0C10' : '#F4F7F6',
        ['--text-primary' as any]: stationeryTheme === 'dark' ? '#F4F7F6' : '#1A1A1A',
        ['--bg-card' as any]: stationeryTheme === 'dark' ? '#15161E' : '#FFFFFF',
        ['--border-color' as any]: stationeryTheme === 'dark' ? '#C5C6C7' : '#1A1A1A',
        ['--shadow-color' as any]: stationeryTheme === 'dark' ? '#000000' : '#1A1A1A',
        ['--shadow-depth' as any]: `${shadowDepth}px`,
        ['--border-weight' as any]: borderWeight === 'fine' ? '1px' : borderWeight === 'bold' ? '4px' : '2px',
        ['--font-scale' as any]: `${textSize / 14}`,
      }}
    >
      {/* Sidebar navigation */}
      {!isFocusMode && (
        <Sidebar 
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} 
          mobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}
 
      {/* Main editor page container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Control Header */}
        <header className="h-14 border-b-2 border-[#1A1A1A] bg-white px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center space-x-2 min-w-0">
            {!isFocusMode && (
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-1.5 border-2 border-[#1A1A1A] bg-[#FFB703] neo-shadow-sm mr-1 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex-shrink-0"
                title="Toggle Menu"
              >
                <Menu className="w-4 h-4 text-[#1A1A1A]" />
              </button>
            )}

            {/* Feature 21: Visual Breadcrumb Trail */}
            <div className="hidden md:flex items-center space-x-1 text-xs font-mono font-bold text-[#1A1A1A] bg-[#F4F7F6] border border-[#1A1A1A]/10 px-2 py-1 overflow-x-auto whitespace-nowrap scrollbar-none max-w-lg">
              <Link href="/" className="hover:text-[#2D6A4F] hover:underline flex items-center space-x-1">
                <span>🏠 root</span>
              </Link>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <div key={crumb.id} className="flex items-center space-x-1">
                    <span className="text-gray-400">/</span>
                    {isLast ? (
                      <span className="bg-[#FFB703]/20 text-[#2D6A4F] px-1 font-black max-w-[120px] truncate">
                        {crumb.icon || '📄'} {crumb.title || 'Untitled'}
                      </span>
                    ) : (
                      <Link 
                        href={`/canvas/${crumb.id}`} 
                        className="hover:text-[#2D6A4F] hover:underline max-w-[100px] truncate"
                      >
                        <span>{crumb.icon || '📄'} {crumb.title || 'Untitled'}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="md:hidden flex items-center space-x-1">
              <Link href="/">
                <button className="p-1 border border-transparent hover:border-[#1A1A1A] hover:bg-gray-100 rounded text-gray-500 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </Link>
              <span className="text-xs font-mono font-bold text-gray-400 truncate max-w-[100px]" title={canvas.title || 'Untitled Page'}>
                {canvas.title || 'Untitled Page'}
              </span>
            </div>

            {/* Real-time Dynamic Checksum Fingerprint badge */}
            <div 
              onClick={() => {
                navigator.clipboard.writeText(checksumHash);
                setFingerprintCopied(true);
                setTimeout(() => setFingerprintCopied(false), 1500);
              }}
              title="Click to copy page version code"
              className={`hidden lg:flex items-center space-x-1.5 px-2 py-1 border border-[#1A1A1A] font-mono text-[9px] font-black cursor-pointer select-none transition-all ${
                fingerprintCopied
                  ? 'bg-amber-400 text-[#1A1A1A] border-[#1A1A1A] translate-x-[1px] translate-y-[1px]'
                  : flashFingerprint 
                    ? 'bg-emerald-500 text-white border-emerald-600 scale-[1.03]' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:translate-x-[1px] hover:translate-y-[1px]'
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${fingerprintCopied ? 'bg-amber-800' : flashFingerprint ? 'bg-white animate-ping' : 'bg-emerald-500'}`} />
              <span className="opacity-75">{fingerprintCopied ? 'COPIED!' : 'REF:'}</span>
              <span>{checksumHash.substring(3)}</span>
            </div>
          </div>
 
          <div className="flex items-center space-x-2.5">
            {/* Sync Indicators */}
            <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-mono font-bold bg-[#F4F7F6] border-2 border-[#1A1A1A] px-2.5 py-1 rounded-none">
              <Cloud className={`w-3.5 h-3.5 ${isOnline ? 'text-[#2D6A4F]' : 'text-red-500'}`} />
              <span className="text-[#1A1A1A] uppercase">
                {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'saved' ? 'Synced' : syncStatus}
              </span>
            </div>

            {/* Feature 26: Global Search trigger button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-1.5 border-2 border-[#1A1A1A] bg-white hover:bg-gray-50 text-gray-700 rounded-none text-xs font-bold flex items-center space-x-1 transition-colors animate-fade-in"
              title="Search entire workspace (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Feature 27: Split Screen Viewing Toggle Button */}
            <button
              onClick={() => {
                if (isSplitScreen) {
                  setIsSplitScreen(false);
                } else {
                  setIsSplitScreen(true);
                  const otherPage = canvases.find(c => c.id !== canvasId);
                  if (otherPage) {
                    setSplitCanvasId(otherPage.id);
                  }
                }
              }}
              className={`p-1.5 border-2 border-[#1A1A1A] rounded-none text-xs font-bold flex items-center space-x-1 transition-colors ${
                isSplitScreen ? 'bg-amber-400 text-black' : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
              title="Toggle dual pane split view"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSplitScreen ? 'Split Pane' : 'Split View'}</span>
            </button>
 
            {/* Structural Blueprints drawer */}
            <button
              onClick={() => setShowBlueprintModal(true)}
              className="p-1.5 border-2 border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 text-black rounded-none text-xs font-bold flex items-center space-x-1 transition-colors"
              title="Apply Page Templates / Blueprints"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Blueprints</span>
            </button>

            {/* Feature 30: Page History Timeline slide button */}
            <button
              onClick={() => setShowHistoryTimeline(true)}
              className="p-1.5 border-2 border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 text-black rounded-none text-xs font-bold flex items-center space-x-1 transition-colors"
              title="View page edit and save timeline history"
            >
              <History className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* Portable Bundler HTML Exporter Button */}
            <button
              onClick={handleExportBundle}
              className="p-1.5 border-2 border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 text-black rounded-none text-xs font-bold flex items-center space-x-1 transition-colors"
              title="Export Offline Standalone Bundle"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Portable</span>
            </button>
 
            {/* Document Lock/Unlock Toggle */}
            <button
              onClick={toggleLock}
              className={`p-1.5 border-2 border-[#1A1A1A] rounded-none text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                isLocked 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
              title={isLocked ? "Unlock document to edit" : "Lock document to prevent edits"}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isLocked ? 'Locked' : 'Lock'}</span>
            </button>

            {/* Document actions */}
            <button
              onClick={() => setShowCoverInput(!showCoverInput)}
              className="p-1.5 border-2 border-[#1A1A1A] bg-white rounded-none hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center space-x-1"
              title="Change cover"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cover</span>
            </button>
 
            <button
              onClick={handleDeleteCurrent}
              className="p-1.5 border-2 border-red-500 bg-white text-red-500 rounded-none hover:bg-red-500 hover:text-white text-xs font-bold flex items-center space-x-1 transition-colors"
              title="Delete Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </header>
 
        {/* Cover image area */}
        <div className="flex-1 overflow-y-auto relative canvas-personalizer-wrapper">
          {isFocusMode && <AcousticWaveOverlay />}
          
          {/* Dynamic Cover Banner */}
          {canvas.coverImage && (
            <div className="h-44 sm:h-56 w-full relative border-b-2 border-[#1A1A1A] overflow-hidden bg-slate-200">
              {canvas.coverImage.startsWith('preset:') ? (
                <>
                  {canvas.coverImage === 'preset:zebra' && (
                    <div className="w-full h-full bg-[#FFB703]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1A1A1A, #1A1A1A 15px, transparent 15px, transparent 30px)' }} />
                  )}
                  {canvas.coverImage === 'preset:grid' && (
                    <div className="w-full h-full bg-[#F4F7F6]" style={{ backgroundImage: 'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                  )}
                  {canvas.coverImage === 'preset:cyber' && (
                    <div className="w-full h-full bg-gradient-to-r from-violet-600 via-pink-500 to-indigo-600 animate-pulse" />
                  )}
                  {canvas.coverImage === 'preset:dots' && (
                    <div className="w-full h-full bg-[#0B0C10]" style={{ backgroundImage: 'radial-gradient(#66FCF1 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
                  )}
                </>
              ) : (
                <img 
                  src={canvas.coverImage} 
                  alt="Canvas Cover"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Optional Backdrop Shader Overlay */}
              {backdropShader !== 'none' && (
                <div className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay opacity-50">
                  {backdropShader === 'scanlines' && (
                    <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 2px, transparent 2px, transparent 4px)', backgroundSize: '100% 4px' }} />
                  )}
                  {backdropShader === 'halftone' && (
                    <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #000 25%, transparent 26%)', backgroundSize: '6px 6px' }} />
                  )}
                  {backdropShader === 'dotgrid' && (
                    <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#66FCF1 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
                  )}
                  {backdropShader === 'warning_hatch' && (
                    <div className="w-full h-full shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 10px, transparent 10px, transparent 20px)' }} />
                  )}
                </div>
              )}
            </div>
          )}
 
          {/* Cover Input Field */}
          {showCoverInput && (
            <div className="max-w-4xl mx-auto px-6 mt-4 space-y-3 bg-white border-2 border-[#1A1A1A] neo-shadow-sm p-4 rounded-none">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={coverUrl}
                  placeholder="Paste cover image link (Unsplash, Picsum, etc.)..."
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="flex-1 text-xs font-mono outline-none border-none text-[#1A1A1A]"
                />
                <button
                  onClick={handleSaveCover}
                  className="px-3 py-1 bg-[#2D6A4F] text-white border-2 border-[#1A1A1A] text-xs font-bold uppercase rounded-none cursor-pointer"
                >
                  Save
                </button>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="text-[10px] font-bold font-mono text-gray-400 mb-2 uppercase tracking-wide">
                  ⚡ 2026 BRUTALIST VECTOR GENERATORS
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => generateProceduralCover('neo_grid')}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-[#0B0C10] text-[#66FCF1] hover:text-white text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    Neo Retro Grid
                  </button>
                  <button
                    onClick={() => generateProceduralCover('bauhaus')}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-[#F4F1EA] text-[#E63946] hover:text-[#1A1A1A] text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    Bauhaus Spheres
                  </button>
                  <button
                    onClick={() => generateProceduralCover('warning_stripes')}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-[#FFB703] text-[#1A1A1A] hover:bg-amber-400 text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    Danger Stripes
                  </button>
                  <button
                    onClick={() => generateProceduralCover('cosmic_pulse')}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-[#1D1A39] text-[#FFB067] hover:text-white text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    Cosmic Pulse
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="text-[10px] font-bold font-mono text-gray-400 mb-2 uppercase tracking-wide">
                  🛰️ BACKDROP FILTER OVERLAY SHADERS
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'none', label: 'None', bg: 'bg-white text-[#1A1A1A]' },
                    { id: 'scanlines', label: 'CRT Scanlines', bg: 'bg-indigo-500 text-white hover:bg-indigo-600' },
                    { id: 'halftone', label: 'Halftone Dot', bg: 'bg-rose-500 text-white hover:bg-rose-600' },
                    { id: 'dotgrid', label: 'Cyan Dot Grid', bg: 'bg-cyan-500 text-white hover:bg-cyan-600' },
                    { id: 'warning_hatch', label: 'Caution Stripes', bg: 'bg-[#FFB703] text-black hover:bg-amber-400' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setBackdropShader(item.id);
                        localStorage.setItem(`zenith-backdrop-shader-${canvasId}`, item.id);
                      }}
                      className={`p-1.5 border-2 border-[#1A1A1A] text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform ${item.bg} ${backdropShader === item.id ? 'ring-2 ring-emerald-500' : ''}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature 34: Beautiful Page Cover Banners */}
              <div className="border-t border-gray-100 pt-3">
                <div className="text-[10px] font-bold font-mono text-gray-400 mb-2 uppercase tracking-wide">
                  🌸 BEAUTIFUL PAGE COVER BANNERS
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={async () => {
                      const url = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200';
                      await updateCanvasCover(canvasId, url);
                      setCoverUrl(url);
                      console.log("[THEME] Cover: Family Hub Pastel Graphics applied.");
                    }}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-pink-100 text-[#1A1A1A] hover:bg-pink-200 text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    🏡 Family Hub
                  </button>
                  <button
                    onClick={async () => {
                      const url = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200';
                      await updateCanvasCover(canvasId, url);
                      setCoverUrl(url);
                      console.log("[THEME] Cover: Creative Classroom applied.");
                    }}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-sky-100 text-[#1A1A1A] hover:bg-sky-200 text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    🎓 School Desk
                  </button>
                  <button
                    onClick={async () => {
                      const url = 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=1200';
                      await updateCanvasCover(canvasId, url);
                      setCoverUrl(url);
                      console.log("[THEME] Cover: Cute Stationery Workspace applied.");
                    }}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-amber-100 text-[#1A1A1A] hover:bg-amber-200 text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    ✏️ Cozy Stationery
                  </button>
                  <button
                    onClick={async () => {
                      const url = 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200';
                      await updateCanvasCover(canvasId, url);
                      setCoverUrl(url);
                      console.log("[THEME] Cover: Lovely Botanicals applied.");
                    }}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-emerald-100 text-[#1A1A1A] hover:bg-emerald-200 text-[10px] font-black font-mono uppercase cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    🌿 Lovely Foliage
                  </button>
                </div>
              </div>
            </div>
          )}
 
          {/* Locked Notice Banner */}
          {isLocked && (
            <div className="max-w-4xl mx-auto px-6 mt-6">
              <div className="bg-red-50 border-2 border-red-500 p-3.5 text-xs font-mono font-extrabold text-red-700 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>VIEW-ONLY MODE: THIS PAGE IS SECURELY LOCKED.</span>
                </div>
                <button
                  onClick={toggleLock}
                  className="bg-red-500 text-white px-2 py-1 border border-red-700 hover:bg-red-600 transition-colors uppercase text-[10px] cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </div>
          )}

          {/* Canvas Title, Icon Header Block & Mascot Selector Desk (Feature 29) */}
          <div className="max-w-4xl mx-auto px-6 pt-8 space-y-4">
            
            {/* Feature 29: Custom Page Mascot Selection Desk */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-2 border-[#1A1A1A] p-3 rounded-none neo-shadow-sm">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative inline-block flex-shrink-0">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-12 h-12 border-2 border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 flex items-center justify-center font-bold text-2xl transition-all cursor-pointer neo-shadow-sm select-none"
                    title="Click to change companion mascot"
                  >
                    {canvas.icon || '📄'}
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute top-14 left-0 z-30 w-64 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-2">
                      <div className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1.5 px-1 font-mono">Select Mascot Character:</div>
                      <div className="grid grid-cols-6 gap-1">
                        {EMOJIS.concat(['🐯', '🦄', '🐼', '🦊', '🐨', '🧠', '🧙', '🛸', '👾', '🍀', '🍎', '🍺']).map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleSelectEmoji(emoji)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-amber-100 border hover:border-[#1A1A1A] text-lg cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-[#1A1A1A]/10 flex items-center space-x-1.5">
                        <span className="text-[9px] font-mono font-bold text-gray-500">Or Paste:</span>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="✨"
                          className="w-10 text-center border border-[#1A1A1A] text-xs py-0.5 outline-none font-bold"
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val) handleSelectEmoji(val);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="min-w-0">
                  <div className="text-[10px] font-mono font-black uppercase text-[#2D6A4F] tracking-wider flex items-center space-x-1">
                    <span>Mascot Active</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 truncate mt-0.5">
                    Click companion emoji to swap, or pick standard presets!
                  </p>
                </div>
              </div>

              {/* Quick Preset Choice Row */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['🧙', '🛸', '👾', '🎯', '🚀', '🔥', '📊', '💼'].map(quickEmoji => (
                  <button
                    key={quickEmoji}
                    onClick={() => handleSelectEmoji(quickEmoji)}
                    className={`w-7 h-7 flex items-center justify-center rounded-none border border-[#1A1A1A] text-sm hover:bg-amber-100 cursor-pointer ${
                      canvas.icon === quickEmoji ? 'bg-[#FFB703] border-2 font-bold' : 'bg-white'
                    }`}
                  >
                    {quickEmoji}
                  </button>
                ))}
              </div>
            </div>
 
            {/* Title Editor */}
            <input
              type="text"
              value={canvas.title}
              disabled={isLocked}
              placeholder="Untitled Document"
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight placeholder-gray-300 font-sans disabled:cursor-not-allowed"
            />
          </div>
  
          {/* Feature 27: Side-by-Side Dual-Pane Split-Screen Layout Grid */}
          <div className={`flex-1 flex overflow-hidden ${isSplitScreen ? 'divide-x-4 divide-[#1A1A1A]' : ''}`}>
            <div className="flex-1 overflow-y-auto">
              <CanvasEditor canvasId={canvasId} isLocked={isLocked} isCozyStoryMode={isCozyStoryMode} />
            </div>

            {isSplitScreen && (
              <div className="w-1/2 flex flex-col bg-[#F4F7F6] overflow-hidden border-l-2 border-[#1A1A1A]">
                {/* Secondary Pane Title Control Bar */}
                <div className="p-3 bg-white border-b-2 border-[#1A1A1A] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="text-[10px] font-black font-mono bg-rose-500 text-white px-2 py-0.5 border border-black uppercase tracking-wider flex-shrink-0">
                      SPLIT PANEL
                    </span>
                    <select
                      value={splitCanvasId || ''}
                      onChange={(e) => setSplitCanvasId(e.target.value || null)}
                      className="text-xs font-bold border-2 border-[#1A1A1A] bg-white px-2 py-1 outline-none min-w-[120px] max-w-[200px]"
                    >
                      <option value="">-- Choose split doc --</option>
                      {canvases.filter(c => c.id !== canvasId).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon || '📄'} {c.title || 'Untitled'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => setIsSplitScreen(false)}
                    className="px-2.5 py-1 bg-white border-2 border-[#1A1A1A] hover:bg-rose-500 hover:text-white text-[10px] font-black uppercase transition-colors"
                  >
                    Close ✕
                  </button>
                </div>

                {/* Secondary Scrollable Editor Canvas Container */}
                <div className="flex-1 overflow-y-auto relative bg-[#F4F7F6]">
                  {splitCanvasId ? (
                    <CanvasEditor canvasId={splitCanvasId} isLocked={isLocked} isCozyStoryMode={isCozyStoryMode} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                      <FolderTree className="w-8 h-8 text-gray-300 mb-2 animate-bounce" />
                      <p className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-widest leading-relaxed">
                        Select a secondary document<br />from the picker above to<br />split-view side-by-side!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
 
          {/* Bi-directional Backlinks Section */}
          {backlinks.length > 0 && (
            <div className="max-w-4xl mx-auto px-6 pb-12 mt-12">
              <div className={`cute-divider divider-${dividerStyle} mb-8`} />
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-4">
                <Share2 className="w-4 h-4 text-[#2D6A4F]" />
                <span>Bi-directional Backlinks ({backlinks.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {backlinks.map(b => (
                  <Link key={b.id} href={`/canvas/${b.id}`}>
                    <div className="border-2 border-[#1A1A1A] bg-white p-3.5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer neo-shadow-sm flex items-center space-x-2 rounded-none">
                      <span className="text-xl">{b.icon || '📄'}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-[#1A1A1A] truncate">{b.title || 'Untitled Node'}</h4>
                        <p className="text-[9px] font-mono text-gray-400 uppercase font-bold mt-0.5">Active Reference</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Append-Only Live Transaction Audit Ledger */}
          <div className="max-w-4xl mx-auto px-6 pb-24 mt-8">
            <div className={`cute-divider divider-${dividerStyle} mb-6`} />
            <div className="border-4 border-[#1A1A1A] bg-[#0F172A] text-slate-300 rounded-none overflow-hidden neo-shadow-sm">
              {/* Header Bar */}
              <div className="bg-[#1E293B] px-4 py-2 border-b-2 border-[#1A1A1A] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[9px] font-black tracking-widest text-[#FFB703] uppercase">
                    Your Page Save History
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      if (confirm("Do you want to clear the save history log?")) {
                        await db.syncQueue.clear();
                      }
                    }}
                    className="font-mono text-[8px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-1.5 py-0.5 border border-black cursor-pointer transition-colors shadow-sm uppercase"
                  >
                    Clear Save History
                  </button>
                  <span className="font-mono text-[8px] text-slate-400 font-bold hidden sm:inline">
                    Live Save Log
                  </span>
                </div>
              </div>
              
              {/* Log Viewport */}
              <div className="p-4 font-mono text-[10px] space-y-1.5 max-h-48 overflow-y-auto leading-relaxed scrollbar-thin select-text bg-[#030712]">
                <div className="text-slate-500">
                  [{sessionLogs?.establishedTime || '00:00:00 AM'}] Editor ready. Loaded page from local memory. 🚀
                </div>
                <div className="text-slate-500">
                  [{sessionLogs?.checksumTime || '00:00:00 AM'}] Page loaded successfully (Version {checksumHash}). ✅
                </div>
                <LiveSyncQueueViewer canvasId={canvasId} />
              </div>
            </div>
          </div>
 
        </div>
      </div>
 
      {/* Global Command palette Search overlay */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette 
            isOpen={isCommandPaletteOpen} 
            onClose={() => setIsCommandPaletteOpen(false)} 
          />
        )}
      </AnimatePresence>
 
      {/* Structural Blueprints Template Dialog */}
      <AnimatePresence>
        {showBlueprintModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-[#1A1A1A] w-full max-w-2xl p-6 rounded-none neo-shadow-lg"
            >
              <div className="flex justify-between items-center pb-4 border-b-2 border-[#1A1A1A]">
                <h3 className="text-sm font-black uppercase text-[#1A1A1A]">🌟 Choose Page Template</h3>
                <button 
                  onClick={() => setShowBlueprintModal(false)}
                  className="px-2 py-1 text-xs font-bold border-2 border-[#1A1A1A] hover:bg-red-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                Applying a template will instantly add helpful components (like tables, coding playgrounds, callout boxes, and links) to your page. <strong className="text-red-600">WARNING: This will replace existing elements on this page!</strong>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {[
                  {
                    id: 'sprint',
                    title: '🚀 Milestone Sprint Roadmap',
                    desc: 'A full Agile-styled roadmap with status tracker, callouts, checklists and a relational data grid.',
                    color: 'hover:bg-amber-50'
                  },
                  {
                    id: 'playground',
                    title: '⚡ Developer JS Playground',
                    desc: 'An interactive coding workspace featuring executable sandbox runtimes and pre-written algorithms.',
                    color: 'hover:bg-indigo-50'
                  },
                  {
                    id: 'wiki',
                    title: '🔮 Wiki Knowledge Hub',
                    desc: 'A highly structured reference portal complete with blockquotes, collapsible lists, and Wiki page link nodes.',
                    color: 'hover:bg-emerald-50'
                  }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={async () => {
                      await handleLoadTemplate(t.id as 'sprint' | 'playground' | 'wiki');
                      setShowBlueprintModal(false);
                    }}
                    className={`border-2 border-[#1A1A1A] p-4 text-left flex flex-col justify-between transition-all neo-shadow-sm cursor-pointer ${t.color}`}
                  >
                    <div>
                      <h4 className="text-xs font-black text-[#1A1A1A] mb-2">{t.title}</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed">{t.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#1A1A1A] mt-4 block border-t border-[#1A1A1A]/10 pt-2">Load Blueprint →</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Canvas Node"
        message="Are you sure you want to delete this canvas node and all nested child cards? This action is irreversible."
      />
 
      {/* Ops Center Floating Control Panel Drawer */}
      <OpsControlDeck 
        canvasId={canvasId} 
        isFocusMode={isFocusMode} 
        setIsFocusMode={setIsFocusMode}
        accentTheme={accentTheme}
        setAccentTheme={setAccentTheme}
        isCozyStoryMode={isCozyStoryMode}
        setIsCozyStoryMode={(val) => {
          setIsCozyStoryMode(val);
          localStorage.setItem(`zenith-cozy-mode-${canvasId}`, val ? 'true' : 'false');
        }}
        stationeryTheme={stationeryTheme}
        setStationeryTheme={setStationeryTheme}
        shadowDepth={shadowDepth}
        setShadowDepth={setShadowDepth}
        borderWeight={borderWeight}
        setBorderWeight={setBorderWeight}
        textSize={textSize}
        setTextSize={setTextSize}
        smartScrollbar={smartScrollbar}
        setSmartScrollbar={setSmartScrollbar}
        highlightBrush={highlightBrush}
        setHighlightBrush={setHighlightBrush}
        spacingDensity={spacingDensity}
        setSpacingDensity={setSpacingDensity}
        headingFont={headingFont}
        setHeadingFont={setHeadingFont}
        dividerStyle={dividerStyle}
        setDividerStyle={setDividerStyle}
      />

      {/* Page History Timeline Slide Overlay (Feature 30) */}
      <AnimatePresence>
        {showHistoryTimeline && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryTimeline(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 190 }}
              className="relative w-full max-w-md h-full bg-white border-l-4 border-[#1A1A1A] p-6 flex flex-col justify-between shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-10"
            >
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b-2 border-[#1A1A1A] mb-4">
                  <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-[#1A1A1A]" />
                    <h3 className="text-xs font-black uppercase text-[#1A1A1A] tracking-tight">📜 Revision Timeline</h3>
                  </div>
                  <button
                    onClick={() => setShowHistoryTimeline(false)}
                    className="p-1.5 border-2 border-[#1A1A1A] hover:bg-[#FFB703] text-black transition-colors rounded-none font-black text-[10px] cursor-pointer"
                  >
                    ✕ CLOSE
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed font-sans font-medium">
                  Browse the historical save trail of elements and canvases modifications. The auto-save engine registers local snapshots on index memory continuously.
                </p>

                {/* Timeline content */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                  <div className="relative border-l-2 border-dashed border-[#1A1A1A] pl-5 ml-2.5 space-y-6">
                    {transactionsList.length === 0 ? (
                      <div className="text-center py-12 text-xs font-bold text-gray-400">
                        No previous edits recorded for this workspace. Try making some modifications to seed history!
                      </div>
                    ) : (
                      transactionsList.map((tx, idx) => {
                        const { desc, action } = getFriendlyActionDescription(tx);
                        let badgeColor = 'bg-blue-100 text-blue-800 border-blue-400';
                        if (action === 'insert') {
                          badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-400';
                        } else if (action === 'delete') {
                          badgeColor = 'bg-rose-100 text-rose-800 border-rose-400';
                        } else if (action === 'update') {
                          badgeColor = 'bg-amber-100 text-amber-800 border-amber-400';
                        }

                        return (
                          <div key={tx.id || idx} className="relative group animate-fade-in">
                            {/* Marker circle dot */}
                            <div className="absolute -left-[26.5px] top-1.5 w-3 h-3 rounded-full border-2 border-black bg-white group-hover:bg-[#FFB703] transition-colors" />

                            <div className="border-2 border-[#1A1A1A] p-3 bg-[#F4F7F6] shadow-[2px_2px_0px_0px_#1A1A1A] group-hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[9px] text-gray-400 font-extrabold flex items-center">
                                  <Clock className="w-2.5 h-2.5 mr-1 text-[#1A1A1A]" />
                                  {new Date(tx.timestamp).toLocaleString()}
                                </span>
                                <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 border border-[#1A1A1A] rounded-none uppercase ${badgeColor}`}>
                                  {action}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-[#1A1A1A] leading-normal font-sans">
                                {desc}
                              </p>

                              <div className="pt-1.5 border-t border-[#1A1A1A]/5 flex items-center justify-between text-[8px] font-mono text-gray-400">
                                <span>Record ID: {tx.recordId.substring(0, 8)}</span>
                                <button
                                  onClick={async () => {
                                    alert("Snapshot State: " + JSON.stringify(JSON.parse(tx.data), null, 2));
                                  }}
                                  className="text-amber-600 hover:underline font-extrabold uppercase cursor-pointer"
                                >
                                  Inspect Data
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-[#1A1A1A] pt-4 mt-4 text-[10px] font-mono text-gray-500 flex items-center justify-between">
                <span>Total revisions: {transactionsList.length}</span>
                <button
                  onClick={async () => {
                    if (confirm("Do you want to clear the save history log?")) {
                      await db.syncQueue.clear();
                    }
                  }}
                  className="px-2 py-0.5 border border-black bg-rose-600 hover:bg-rose-500 text-white font-extrabold uppercase transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
