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
  Search,
  Calculator,
  Paintbrush,
  Database,
  GitCompare,
  Disc,
  Filter,
  Palette,
  History,
  Layout,
  Brain,
  Network,
  Clock,
  ArrowUpRight,
  Globe,
  Binary,
  Trello,
  Waves,
  Shuffle,
  GitPullRequest,
  Workflow,
  Shield,
  Fingerprint,
  Eye,
  Key,
  FileCheck,
  Navigation
} from 'lucide-react';

export interface CommandItem {
  id: 'heading_1' | 'heading_2' | 'text' | 'todo' | 'callout' | 'code_sandbox' | 'collection_ref' | 'toggle_list' | 'quote' | 'page_link' | 'acoustic_wave' | 'matrix_view' | 'node_router' | 'spectrogram' | 'layout_sandbox' | 'ast_parser' | 'cycle_timeline' | 'telemetry_deck' | 'markdown_ast' | 'relation_graph' | 'search_matrix' | 'formula_grid' | 'vector_diagram' | 'sql_schema_visualizer' | 'conflict_sync_simulator' | 'audio_sampler' | 'ast_query_builder' | 'theme_engine_sandbox' | 'revision_ledger' | 'bento_composer' | 'ai_grounding_workspace' | 'uml_studio' | 'cron_scheduler' | 'db_migrator' | 'api_request_builder' | 'regex_tester' | 'kanban_orchestrator' | 'math_mesh' | 'format_converter' | 'ast_diff_viewer' | 'state_machine_designer' | 'packet_analyzer' | 'sql_optimizer' | 'color_auditor' | 'jwt_inspector' | 'git_simulator' | 'crypto_lab' | 'schema_validator' | 'css_sandbox' | 'markdown_tokenizer' | 'sys_topology' | 'formula_compiler' | 'cross_node_linker' | 'filter_matrix' | 'schema_dependency_visualizer' | 'rollup_aggregator' | 'schema_migrator' | 'graph_router' | 'db_join_inspector' | 'cascading_states' | 'index_sandbox' | 'productivity_nav_deck' | 'zenith_ops_deck';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const COMMANDS: CommandItem[] = [
  {
    id: 'text',
    title: 'Text',
    description: 'Type plain text or write notes',
    icon: Type,
  },
  {
    id: 'heading_1',
    title: 'Big Heading',
    description: 'Main title of your section',
    icon: Heading1,
  },
  {
    id: 'heading_2',
    title: 'Medium Heading',
    description: 'Sub-title or sub-section',
    icon: Heading2,
  },
  {
    id: 'toggle_list',
    title: 'Dropdown Notes',
    description: 'Collapsible section to hide or reveal notes',
    icon: ChevronDown,
  },
  {
    id: 'todo',
    title: 'Checklist',
    description: 'List of tasks with checkboxes',
    icon: CheckSquare,
  },
  {
    id: 'quote',
    title: 'Quote Block',
    description: 'Highlight a famous quote or key message',
    icon: Quote,
  },
  {
    id: 'callout',
    title: 'Highlight Box',
    description: 'A colored notice box to emphasize important tips',
    icon: Info,
  },
  {
    id: 'acoustic_wave',
    title: 'Sound Maker',
    description: 'Play zen focus humming sounds or waves',
    icon: Volume2,
  },
  {
    id: 'page_link',
    title: 'Link to Another Page',
    description: 'Connect this document to another page',
    icon: Link,
  },
  {
    id: 'code_sandbox',
    title: 'Code Sandbox',
    description: 'Write and run JavaScript code in real-time',
    icon: Terminal,
  },
  {
    id: 'collection_ref',
    title: 'Smart Database Table',
    description: 'Keep track of items in lists, tables, or board views',
    icon: Grid,
  },
  {
    id: 'matrix_view',
    title: 'Compare Grid',
    description: 'Compare features across categories in a custom grid',
    icon: LayoutGrid,
  },
  {
    id: 'node_router',
    title: 'Mind Map Route',
    description: 'Draw paths connecting your page views',
    icon: GitFork,
  },
  {
    id: 'spectrogram',
    title: 'Sound Visualizer',
    description: 'See a colorful moving wave pattern of active sounds',
    icon: Activity,
  },
  {
    id: 'layout_sandbox',
    title: 'Custom Window Boxes',
    description: 'Move and arrange draggable boxes side-by-side',
    icon: Layers,
  },
  {
    id: 'ast_parser',
    title: 'JSON Code Checker',
    description: 'Write JSON code and verify if it has syntax errors',
    icon: FileJson,
  },
  {
    id: 'cycle_timeline',
    title: 'Project Timeline',
    description: 'Plot tasks on a left-to-right project schedule timeline',
    icon: GitCommit,
  },
  {
    id: 'telemetry_deck',
    title: 'App Status Meter',
    description: 'See database speed, storage size, and sync latency',
    icon: Cpu,
  },
  {
    id: 'markdown_ast',
    title: 'Markdown Writer',
    description: 'Write Markdown notes and see how they compile',
    icon: FileText,
  },
  {
    id: 'relation_graph',
    title: 'Page Web Map',
    description: 'Visualize how all your pages connect together in a web',
    icon: Share2,
  },
  {
    id: 'search_matrix',
    title: 'Tag Search Filter',
    description: 'Search across multiple category tags in a speed grid',
    icon: Search,
  },
  {
    id: 'formula_grid',
    title: 'Calculator Sheet',
    description: 'A spreadsheet that auto-calculates math cells (e.g., A1 + B1)',
    icon: Calculator,
  },
  {
    id: 'vector_diagram',
    title: 'Doodle Drawing Board',
    description: 'A simple canvas to draw shapes, lines, and doodles',
    icon: Paintbrush,
  },
  {
    id: 'sql_schema_visualizer',
    title: 'Table Connector Map',
    description: 'Create tables and visually link them with lines',
    icon: Database,
  },
  {
    id: 'conflict_sync_simulator',
    title: 'Sync Conflict Solver',
    description: 'Simulate how edits are combined without losing changes',
    icon: GitCompare,
  },
  {
    id: 'productivity_nav_deck',
    title: 'Super Quick Navigator',
    description: 'Quick-search your entire workspace in one bar',
    icon: Navigation,
  },
  {
    id: 'zenith_ops_deck',
    title: 'All-in-One Settings Panel',
    description: 'Access backups, custom themes, code testing, and sounds',
    icon: Cpu,
  },
  {
    id: 'audio_sampler',
    title: 'Voice & Sound Slicer',
    description: 'Record audio clips and slice them into separate segments',
    icon: Disc,
  },
  {
    id: 'ast_query_builder',
    title: 'Filter Builder',
    description: 'Filter data collections easily with simple conditions',
    icon: Filter,
  },
  {
    id: 'theme_engine_sandbox',
    title: 'Style Designer',
    description: 'Change margins, padding, and brutalist borders interactively',
    icon: Palette,
  },
  {
    id: 'revision_ledger',
    title: 'Time Machine Backups',
    description: 'Review your history and restore previous versions',
    icon: History,
  },
  {
    id: 'bento_composer',
    title: 'Bento Dashboard Designer',
    description: 'Arrange custom panels into a neat bento grid layout',
    icon: Layout,
  },
  {
    id: 'ai_grounding_workspace',
    title: 'AI Writing Assistant',
    description: 'Give smart prompts to write and summarize pages',
    icon: Brain,
  },
  {
    id: 'uml_studio',
    title: 'Flowchart Diagram Studio',
    description: 'Build software layouts and generate raw source classes',
    icon: Network,
  },
  {
    id: 'cron_scheduler',
    title: 'Alarm & Timer Planner',
    description: 'Schedule tasks and see live countdown timers and logs',
    icon: Clock,
  },
  {
    id: 'db_migrator',
    title: 'Database Version Planner',
    description: 'Draft database structure changes with safety rollback buttons',
    icon: ArrowUpRight,
  },
  {
    id: 'api_request_builder',
    title: 'Web Request Checker',
    description: 'Send web requests to URLs and see the JSON response',
    icon: Globe,
  },
  {
    id: 'regex_tester',
    title: 'Text Pattern Finder',
    description: 'Find specific words or patterns in texts easily',
    icon: Binary,
  },
  {
    id: 'kanban_orchestrator',
    title: 'Task Kanban Board',
    description: 'Drag cards between columns like To Do, In Progress, Done',
    icon: Trello,
  },
  {
    id: 'math_mesh',
    title: '3D Math Wave Wave',
    description: 'Interactive mathematical coordinate wave visualizer',
    icon: Waves,
  },
  {
    id: 'format_converter',
    title: 'File Format Converter',
    description: 'Convert text between JSON, YAML, and CSV formats instantly',
    icon: Shuffle,
  },
  {
    id: 'ast_diff_viewer',
    title: 'Side-by-Side Change Viewer',
    description: 'Compare two versions of a document to see differences',
    icon: GitPullRequest,
  },
  {
    id: 'state_machine_designer',
    title: 'State Flow Designer',
    description: 'Connect circle nodes representing workflow statuses',
    icon: Workflow,
  },
  {
    id: 'packet_analyzer',
    title: 'Internet Connection Tester',
    description: 'See how computers connect and talk to each other',
    icon: Activity,
  },
  {
    id: 'sql_optimizer',
    title: 'Database Search Optimizer',
    description: 'Make your database queries search faster with visual steps',
    icon: Database,
  },
  {
    id: 'color_auditor',
    title: 'Color Contrast Checker',
    description: 'Test background and text colors to ensure clear readability',
    icon: Eye,
  },
  {
    id: 'jwt_inspector',
    title: 'Secure Sign-in Decoder',
    description: 'Decode security tokens and inspect user login parameters',
    icon: Key,
  },
  {
    id: 'git_simulator',
    title: 'Version Control Simulator',
    description: 'Visualize branches, commits, and conflicts in Git',
    icon: GitCommit,
  },
  {
    id: 'crypto_lab',
    title: 'Secret Codes & Hashing Lab',
    description: 'Generate secret hashes and encrypt message texts safely',
    icon: Fingerprint,
  },
  {
    id: 'schema_validator',
    title: 'Form Schema Validator',
    description: 'Validate form content payloads against specific rules',
    icon: FileCheck,
  },
  {
    id: 'css_sandbox',
    title: 'CSS Flexbox Sandbox',
    description: 'Design page layouts with borders, grids, and flexible margins',
    icon: Grid,
  },
  {
    id: 'markdown_tokenizer',
    title: 'Markdown Code Viewer',
    description: 'See how text characters are converted into Markdown symbols',
    icon: FileText,
  },
  {
    id: 'sys_topology',
    title: 'Server Network Map',
    description: 'Design servers, load balancers, and see data flow speeds',
    icon: Layers,
  },
  {
    id: 'formula_compiler',
    title: 'Graph Plotter',
    description: 'Plot complex math equations on a live grid with sliders',
    icon: Calculator,
  },
  {
    id: 'cross_node_linker',
    title: 'Cross-Page Linker',
    description: 'Connect properties and event values across multiple pages',
    icon: Share2,
  },
  {
    id: 'filter_matrix',
    title: 'Data Filter Grid',
    description: 'Filter data records using custom dynamic visual rules',
    icon: Filter,
  },
  {
    id: 'schema_dependency_visualizer',
    title: 'Database Connection Map',
    description: 'Map database table relationships and foreign key actions',
    icon: Network,
  },
  {
    id: 'rollup_aggregator',
    title: 'Rollup Data Summarizer',
    description: 'Summarize, sum, and average data lists in real-time',
    icon: Layers,
  },
  {
    id: 'schema_migrator',
    title: 'Schema Migration Tool',
    description: 'Draft table structure updates and generate raw SQL plans',
    icon: Database,
  },
  {
    id: 'graph_router',
    title: 'Shortest Path Solver',
    description: 'Place maps, routers, and compute the absolute fastest route',
    icon: GitFork,
  },
  {
    id: 'db_join_inspector',
    title: 'Database Joins Visualizer',
    description: 'See how tables overlap using interactive Venn diagrams',
    icon: GitCompare,
  },
  {
    id: 'cascading_states',
    title: 'Cascading Status Tracker',
    description: 'Trace status rules and cascading changes across cards',
    icon: Workflow,
  },
  {
    id: 'index_sandbox',
    title: 'Index Speed Sandbox',
    description: 'See how databases locate files quickly with search indexes',
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
