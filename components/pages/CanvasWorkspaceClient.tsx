'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import Sidebar from '@/components/layout/Sidebar';
import CommandPalette from '@/components/layout/CommandPalette';
import CanvasEditor from '@/components/editor/CanvasEditor';
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
  Share2
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

  // Focus & Accent Theme Settings
  const [accentTheme, setAccentTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'default';
    return localStorage.getItem(`zenith-theme-${canvasId}`) || 'default';
  });
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // 1. Fetch current canvas details
  const canvas = useLiveQuery(() => db.canvases.get(canvasId), [canvasId]);

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
        content: 'Keep track of core engineering sprints and live developer tasks in this interactive ledger board.',
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
        name: 'Sprint Ledger',
        schema: JSON.stringify(columns)
      });
      
      // Seed rows
      await db.collectionRows.add({
        id: generateElementId('row'),
        tableId,
        cells: JSON.stringify({ 'col-task': 'Refactor offline Sync transactions', 'col-status': 'In Progress', 'col-hours': 12 }),
        sortOrder: 1.0,
      });
      await db.collectionRows.add({
        id: generateElementId('row'),
        tableId,
        cells: JSON.stringify({ 'col-task': 'Synthesize typewriter keystroke sounds', 'col-status': 'Completed', 'col-hours': 6 }),
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
        content: '💡 Collaborative Best Practices Ledger',
        properties: JSON.stringify({ open: true, body: '1. Keep document pages highly linked using [[]] syntax.\n2. Leverage the time travel ledger snapshots before deleting critical sections.\n3. Turn on focus ambient binaural beats to accelerate focus flow.' }),
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
            Resolving Zenith Node Ledger...
          </p>
        </div>
      </div>
    );
  }

  if (canvas === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F7F6] p-6">
        <div className="max-w-md w-full border-4 border-[#1A1A1A] bg-white neo-shadow p-6 text-center space-y-4">
          <h2 className="text-xl font-black text-red-500">404 CANVAS NOT FOUND</h2>
          <p className="text-xs font-medium text-gray-500">
            This Zenith Canvas node has either been garbage collected, archived, or deleted from the local ledger.
          </p>
          <Link href="/">
            <button className="w-full py-2 bg-[#FFB703] border-2 border-[#1A1A1A] text-xs font-bold uppercase neo-shadow-sm">
              Return to Hub
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans text-[#1A1A1A] bg-[#F4F7F6]">
      {/* Sidebar navigation */}
      {!isFocusMode && <Sidebar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />}
 
      {/* Main editor page container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Control Header */}
        <header className="h-14 border-b-2 border-[#1A1A1A] bg-white px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <button className="p-1 border border-transparent hover:border-[#1A1A1A] hover:bg-gray-100 rounded text-gray-500 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Link>
            <span className="text-xs font-mono font-bold text-gray-400">
              Canvases / {canvas.title || 'Untitled Node'}
            </span>
          </div>
 
          <div className="flex items-center space-x-2.5">
            {/* Sync Indicators */}
            <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold bg-[#F4F7F6] border-2 border-[#1A1A1A] px-2.5 py-1 rounded-none neo-shadow-sm">
              <Cloud className={`w-3.5 h-3.5 ${isOnline ? 'text-[#2D6A4F]' : 'text-red-500'}`} />
              <span className="text-[#1A1A1A] uppercase">
                {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'saved' ? 'Synced' : syncStatus}
              </span>
            </div>
 
            {/* Structural Blueprints drawer */}
            <button
              onClick={() => setShowBlueprintModal(true)}
              className="p-1.5 border-2 border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 text-black rounded-none text-xs font-bold flex items-center space-x-1 transition-colors"
              title="Apply Page Templates / Blueprints"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Blueprints</span>
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
        <div className="flex-1 overflow-y-auto relative">
          
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
            </div>
          )}
 
          {/* Cover Input Field */}
          {showCoverInput && (
            <div className="max-w-4xl mx-auto px-6 mt-4">
              <div className="bg-white border-2 border-[#1A1A1A] neo-shadow-sm p-3 rounded-none flex items-center space-x-2">
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
                  className="px-3 py-1 bg-[#2D6A4F] text-white border-2 border-[#1A1A1A] text-xs font-bold uppercase rounded-none"
                >
                  Save
                </button>
              </div>
            </div>
          )}
 
          {/* Canvas Title, Icon Header Block */}
          <div className="max-w-4xl mx-auto px-6 pt-8 space-y-4">
            
            {/* Emoji Icon Badge */}
            <div className="relative inline-block">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-16 h-16 border-4 border-[#1A1A1A] bg-white hover:bg-gray-50 neo-shadow flex items-center justify-center font-bold text-3xl transition-all cursor-pointer"
              >
                {canvas.icon || '📄'}
              </button>
 
              {/* Popover Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute top-20 left-0 z-30 w-52 bg-white border-2 border-[#1A1A1A] neo-shadow-sm p-2 grid grid-cols-5 gap-1">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
 
            {/* Title Editor */}
            <input
              type="text"
              value={canvas.title}
              placeholder="Untitled Document"
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight placeholder-gray-300 font-sans"
            />
          </div>
 
          {/* Poly-morphic block list Canvas Editor */}
          <CanvasEditor canvasId={canvasId} />
 
          {/* Bi-directional Backlinks Section */}
          {backlinks.length > 0 && (
            <div className="max-w-4xl mx-auto px-6 pb-12 mt-12 pt-8 border-t-2 border-dashed border-[#1A1A1A]">
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
                <h3 className="text-sm font-black uppercase text-[#1A1A1A]">🌟 Choose Structural Blueprint Template</h3>
                <button 
                  onClick={() => setShowBlueprintModal(false)}
                  className="px-2 py-1 text-xs font-bold border-2 border-[#1A1A1A] hover:bg-red-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                Applying a blueprint template will instantly seed standard modular nodes (Relational databases, Sandboxes, Callouts, Page references) into your current workspace. <strong className="text-red-600">WARNING: This will replace existing elements in this Canvas!</strong>
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
      />
    </div>
  );
}
