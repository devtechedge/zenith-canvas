'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Heading1, 
  Heading2, 
  Type, 
  CheckSquare, 
  Info, 
  Terminal, 
  Grid,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  FolderLock,
  Quote,
  Link,
  ChevronDown,
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
  Search
} from 'lucide-react';

export interface CommandItem {
  id: 'heading_1' | 'heading_2' | 'text' | 'todo' | 'callout' | 'code_sandbox' | 'collection_ref' | 'toggle_list' | 'quote' | 'page_link' | 'acoustic_wave' | 'matrix_view' | 'node_router' | 'spectrogram' | 'layout_sandbox' | 'ast_parser' | 'cycle_timeline' | 'telemetry_deck' | 'markdown_ast' | 'relation_graph' | 'search_matrix';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const COMMANDS: CommandItem[] = [
  {
    id: 'text',
    title: 'Text Paragraph',
    description: 'Plain body text with basic styling',
    icon: Type,
  },
  {
    id: 'heading_1',
    title: 'Heading 1',
    description: 'Large display canvas header',
    icon: Heading1,
  },
  {
    id: 'heading_2',
    title: 'Heading 2',
    description: 'Medium sub-heading section',
    icon: Heading2,
  },
  {
    id: 'toggle_list',
    title: 'Toggle Accordion',
    description: 'Collapsible header with foldout content',
    icon: ChevronDown,
  },
  {
    id: 'todo',
    title: 'To-do List',
    description: 'Interactive checklist with check states',
    icon: CheckSquare,
  },
  {
    id: 'quote',
    title: 'Blockquote',
    description: 'Stylized quote container for key ideas',
    icon: Quote,
  },
  {
    id: 'callout',
    title: 'Alert Callout',
    description: 'High-contrast info callout with accent presets',
    icon: Info,
  },
  {
    id: 'acoustic_wave',
    title: 'Acoustic Synthesizer',
    description: 'Interactive browser-synthesized audio node',
    icon: Volume2,
  },
  {
    id: 'page_link',
    title: 'Wiki Page Link',
    description: 'Hyperlink connection to another Canvas',
    icon: Link,
  },
  {
    id: 'code_sandbox',
    title: 'Live Code Sandbox',
    description: 'Executable Javascript playground',
    icon: Terminal,
  },
  {
    id: 'collection_ref',
    title: 'Relational Data-Grid',
    description: 'Spreadsheet, Kanban, or Gallery collection',
    icon: Grid,
  },
  {
    id: 'matrix_view',
    title: 'AST Matrix Mapper',
    description: 'Coordinate key-value-value property matrix block',
    icon: LayoutGrid,
  },
  {
    id: 'node_router',
    title: 'Cluster Node Router',
    description: 'Dynamic canvas transition & routing diagram',
    icon: GitFork,
  },
  {
    id: 'spectrogram',
    title: 'Acoustic Spectrogram',
    description: 'Real-time HTML5 audio waveform visualization',
    icon: Activity,
  },
  {
    id: 'layout_sandbox',
    title: 'Nesting Grid Sandbox',
    description: 'Draggable pane sandbox, alternative to toggles',
    icon: Layers,
  },
  {
    id: 'ast_parser',
    title: 'JSON AST Parser',
    description: 'Interactive structural schema parser & validator',
    icon: FileJson,
  },
  {
    id: 'cycle_timeline',
    title: 'Chronos Timeline',
    description: 'Task cycle timeline with dependencies',
    icon: GitCommit,
  },
  {
    id: 'telemetry_deck',
    title: 'Diagnostic Telemetry',
    description: 'Dexie DB stats, system performance terminal',
    icon: Cpu,
  },
  {
    id: 'markdown_ast',
    title: 'Markdown AST Parser',
    description: 'Dual compiler with interactive node-tree viewer',
    icon: FileText,
  },
  {
    id: 'relation_graph',
    title: 'Layer Connectivity Graph',
    description: 'Warp navigation map of related canvas layers',
    icon: Share2,
  },
  {
    id: 'search_matrix',
    title: 'Semantic Tag Weight Matrix',
    description: 'Weighted tag matrix and high-speed search index',
    icon: Search,
  }
];

interface SlashCommandsProps {
  position: { top: number; left: number };
  onSelect: (commandId: CommandItem['id']) => void;
  onClose: () => void;
}

export default function SlashCommands({ position, onSelect, onClose }: SlashCommandsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus or scroll adjustments
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % COMMANDS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + COMMANDS.length) % COMMANDS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(COMMANDS[selectedIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [selectedIndex, onSelect, onClose]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  return (
    <div 
      ref={containerRef}
      className="absolute z-50 w-72 bg-[#F4F7F6] border-2 border-[#1A1A1A] neo-shadow rounded-none p-1 overflow-hidden"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px` 
      }}
    >
      <div className="px-2 py-1.5 border-b border-[#1A1A1A] text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
        <span>Insert Element</span>
        <span className="flex items-center"><ArrowDown className="w-2.5 h-2.5 mr-0.5" /><ArrowUp className="w-2.5 h-2.5 mr-0.5" /> Navigate</span>
      </div>

      <div className="max-h-64 overflow-y-auto mt-1 space-y-0.5">
        {COMMANDS.map((cmd, idx) => {
          const Icon = cmd.icon;
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd.id)}
              className={`w-full flex items-start p-2 text-left border rounded transition-all ${
                isSelected 
                  ? 'bg-white border-[#1A1A1A] neo-shadow-sm' 
                  : 'border-transparent hover:border-[#1A1A1A] hover:bg-white text-gray-700'
              }`}
            >
              <div className={`p-1.5 border-2 border-[#1A1A1A] mr-2.5 flex items-center justify-center rounded-none bg-[#FFB703] text-[#1A1A1A]`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1A1A1A]">{cmd.title}</div>
                <div className="text-[10px] font-mono text-gray-500 truncate mt-0.5">{cmd.description}</div>
              </div>
              {isSelected && (
                <ChevronRight className="w-3.5 h-3.5 self-center text-[#2D6A4F]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
