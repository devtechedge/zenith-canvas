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
  FileCheck
} from 'lucide-react';

export interface CommandItem {
  id: 'heading_1' | 'heading_2' | 'text' | 'todo' | 'callout' | 'code_sandbox' | 'collection_ref' | 'toggle_list' | 'quote' | 'page_link' | 'acoustic_wave' | 'matrix_view' | 'node_router' | 'spectrogram' | 'layout_sandbox' | 'ast_parser' | 'cycle_timeline' | 'telemetry_deck' | 'markdown_ast' | 'relation_graph' | 'search_matrix' | 'formula_grid' | 'vector_diagram' | 'sql_schema_visualizer' | 'conflict_sync_simulator' | 'audio_sampler' | 'ast_query_builder' | 'theme_engine_sandbox' | 'revision_ledger' | 'bento_composer' | 'ai_grounding_workspace' | 'uml_studio' | 'cron_scheduler' | 'db_migrator' | 'api_request_builder' | 'regex_tester' | 'kanban_orchestrator' | 'math_mesh' | 'format_converter' | 'ast_diff_viewer' | 'state_machine_designer' | 'packet_analyzer' | 'sql_optimizer' | 'color_auditor' | 'jwt_inspector' | 'git_simulator' | 'crypto_lab' | 'schema_validator' | 'css_sandbox' | 'markdown_tokenizer' | 'sys_topology' | 'formula_compiler' | 'cross_node_linker' | 'filter_matrix' | 'schema_dependency_visualizer' | 'rollup_aggregator' | 'schema_migrator' | 'graph_router' | 'db_join_inspector' | 'cascading_states' | 'index_sandbox';
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
  },
  {
    id: 'formula_grid',
    title: 'Formula Spreadsheet Sandbox',
    description: 'Tabular grid with cell reactive formula parser',
    icon: Calculator,
  },
  {
    id: 'vector_diagram',
    title: 'SVG Flow Sketchpad',
    description: 'Vector draw board with coordinates layout storage',
    icon: Paintbrush,
  },
  {
    id: 'sql_schema_visualizer',
    title: 'Relational SQL Schema Visualizer',
    description: 'Interactive table link engine with SQL DDL generation',
    icon: Database,
  },
  {
    id: 'conflict_sync_simulator',
    title: 'Conflict Sync & Merge Terminal',
    description: 'Offline state conflict resolution simulation ledger',
    icon: GitCompare,
  },
  {
    id: 'audio_sampler',
    title: 'Audio Waveform Slicer',
    description: 'Sound bit recorder with slice markers visual controls',
    icon: Disc,
  },
  {
    id: 'ast_query_builder',
    title: 'Distributed AST Query Builder',
    description: 'Interactive block query filters compiler',
    icon: Filter,
  },
  {
    id: 'theme_engine_sandbox',
    title: 'Aesthetic Theme Customizer',
    description: 'Live layout padding & brutalist shadow design tool',
    icon: Palette,
  },
  {
    id: 'revision_ledger',
    title: 'Git-Like Revision Ledger',
    description: 'Local time-travel history diffs commit ledger',
    icon: History,
  },
  {
    id: 'bento_composer',
    title: 'Bento Grid Dashboard Arranger',
    description: 'Draggable responsive grid dimensions composer',
    icon: Layout,
  },
  {
    id: 'ai_grounding_workspace',
    title: 'Contextual AI Prompt Grounding',
    description: 'Gemini system prompt engineer with canvas nodes token math',
    icon: Brain,
  },
  {
    id: 'uml_studio',
    title: 'UML Class Diagram Studio',
    description: 'Design software object models with real-time class code builders',
    icon: Network,
  },
  {
    id: 'cron_scheduler',
    title: 'Cron Job Scheduler Configurator',
    description: 'Visual cron generator with timeline forecast & logs terminal',
    icon: Clock,
  },
  {
    id: 'db_migrator',
    title: 'Migration CLI Simulator',
    description: 'Plan & track table schema migrations with dynamic rollback',
    icon: ArrowUpRight,
  },
  {
    id: 'api_request_builder',
    title: 'API Request & Payload Builder',
    description: 'Design requests, header lists, and simulate mock HTTP responses',
    icon: Globe,
  },
  {
    id: 'regex_tester',
    title: 'RegEx Visual Tester & Debugger',
    description: 'Verify patterns, test capture groups, and audit string matching',
    icon: Binary,
  },
  {
    id: 'kanban_orchestrator',
    title: 'Kanban Sprint Lane Orchestrator',
    description: 'Interactive board mapping workflows with metrics indicators',
    icon: Trello,
  },
  {
    id: 'math_mesh',
    title: 'Bilinear Chart & Math Mesh',
    description: 'Interactive mathematical wave mesh coordinate visualizer',
    icon: Waves,
  },
  {
    id: 'format_converter',
    title: 'JSON/YAML/CSV Format Converter',
    description: 'Convert data formats in real-time with compliance parser',
    icon: Shuffle,
  },
  {
    id: 'ast_diff_viewer',
    title: 'AST Source Code Diff Visualizer',
    description: 'Dual-panel change compiler highlighting modified structural nodes',
    icon: GitPullRequest,
  },
  {
    id: 'state_machine_designer',
    title: 'State Machine & DFA Designer',
    description: 'Design states & trigger transitions inside an interactive live visualizer',
    icon: Workflow,
  },
  {
    id: 'packet_analyzer',
    title: 'TCP Packet Analyzer Simulator',
    description: 'Simulate TCP 3-way handshake and analyze packet frame headers',
    icon: Activity,
  },
  {
    id: 'sql_optimizer',
    title: 'SQL Explain Cost Optimizer',
    description: 'Optimize queries, visualize join strategies, and inspect scan indexes',
    icon: Database,
  },
  {
    id: 'color_auditor',
    title: 'Color Contrast Palette Auditor',
    description: 'Check hex colors for WCAG AA/AAA compliance and contrast ratio',
    icon: Eye,
  },
  {
    id: 'jwt_inspector',
    title: 'JWT Token Claims Decoder',
    description: 'Decode token segment parameters and verify signatures in real-time',
    icon: Key,
  },
  {
    id: 'git_simulator',
    title: 'Git Branch & Rebase Simulator',
    description: 'Visualize interactive branching nodes, commit graphs, and merge conflicts',
    icon: GitCommit,
  },
  {
    id: 'crypto_lab',
    title: 'Crypto Hash & Cipher Lab',
    description: 'Perform secure hex conversions, hash computations, and cipher testing',
    icon: Fingerprint,
  },
  {
    id: 'schema_validator',
    title: 'JSON Schema Draft Validator',
    description: 'Verify dynamic payloads against draft-07 constraints',
    icon: FileCheck,
  },
  {
    id: 'css_sandbox',
    title: 'CSS Grid & Flexbox Canvas',
    description: 'Configure multi-dimensional layouts with live nested flex nodes',
    icon: Grid,
  },
  {
    id: 'markdown_tokenizer',
    title: 'Markdown AST Lexical Compiler',
    description: 'Inspect abstract syntax compilation tokens and rule mapping',
    icon: FileText,
  },
  {
    id: 'sys_topology',
    title: 'System Architecture Topology',
    description: 'Map microservice nodes, load balancers, and trace latency buffers',
    icon: Layers,
  },
  {
    id: 'formula_compiler',
    title: 'Multi-Variable Formula Compiler',
    description: 'Design mathematical equations and render dynamic curves with real-time sliders',
    icon: Calculator,
  },
  {
    id: 'cross_node_linker',
    title: 'Cross-Node Relational Linker',
    description: 'Link distinct canvas nodes to map property flows, events, and metrics',
    icon: Share2,
  },
  {
    id: 'filter_matrix',
    title: 'Multi-Column Filter Matrix',
    description: 'Construct complex compound queries and visual condition sets with instant counts',
    icon: Filter,
  },
  {
    id: 'schema_dependency_visualizer',
    title: 'Graph Schema Dependency Tree',
    description: 'Visualize databases, foreign key connections, and cascading action flows',
    icon: Network,
  },
  {
    id: 'rollup_aggregator',
    title: 'Relational Rollup Aggregator',
    description: 'Apply high-end math rollups over interactive dataset streams',
    icon: Layers,
  },
  {
    id: 'schema_migrator',
    title: 'Dynamic Schema Field Migrator',
    description: 'Plan model modifications, type casts, and generate safe SQL migration steps',
    icon: Database,
  },
  {
    id: 'graph_router',
    title: 'Graph Link Topology Router',
    description: 'Place path nodes and run shortest-path route traversals step-by-step',
    icon: GitFork,
  },
  {
    id: 'db_join_inspector',
    title: 'Relational DB Joint Inspector',
    description: 'Inspect Inner, Left, and Outer joins with Venn interactive sets',
    icon: GitCompare,
  },
  {
    id: 'cascading_states',
    title: 'Cascading State Lifecycle Machine',
    description: 'Define cross-tier state machines with automatic dependency checks',
    icon: Workflow,
  },
  {
    id: 'index_sandbox',
    title: 'Composite Index Optimizer Sandbox',
    description: 'Measure query cost reduction and index skip-scans with field ordering rules',
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
