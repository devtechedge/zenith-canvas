import Dexie, { type Table } from 'dexie';

// --- Types reflecting Prisma Schema for local offline storage ---

export interface AccountWorkspace {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Canvas {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  title: string;
  icon?: string | null;
  coverImage?: string | null;
  isArchived: boolean;
  updatedAt: Date;
}

export interface CanvasElement {
  id: string;
  canvasId: string;
  type: 'heading_1' | 'heading_2' | 'text' | 'todo' | 'callout' | 'code_sandbox' | 'collection_ref' | 'toggle_list' | 'quote' | 'page_link' | 'acoustic_wave' | 'matrix_view' | 'node_router' | 'spectrogram' | 'layout_sandbox' | 'ast_parser' | 'cycle_timeline' | 'telemetry_deck' | 'markdown_ast' | 'relation_graph' | 'search_matrix' | 'formula_grid' | 'vector_diagram' | 'sql_schema_visualizer' | 'conflict_sync_simulator' | 'audio_sampler' | 'ast_query_builder' | 'theme_engine_sandbox' | 'revision_ledger' | 'bento_composer' | 'ai_grounding_workspace' | 'uml_studio' | 'cron_scheduler' | 'db_migrator' | 'api_request_builder' | 'regex_tester' | 'kanban_orchestrator' | 'math_mesh' | 'format_converter' | 'ast_diff_viewer' | 'state_machine_designer';
  content: string;
  properties: string; // JSON string: { checked?: boolean, language?: string, tableId?: string, open?: boolean, body?: string, mood?: string, targetCanvasId?: string }
  sortOrder: number;
  updatedAt: Date;
}

export interface CollectionTable {
  id: string;
  canvasId: string;
  name: string;
  schema: string; // JSON array of column definitions: Array<{ id: string, name: string, type: 'Text' | 'Number' | 'Select' | 'MultiSelect' | 'Date' }>
}

export interface CollectionRow {
  id: string;
  tableId: string;
  cells: string; // JSON object: { [columnId: string]: any }
  sortOrder: number;
}

// Transaction item for offline-first delta synchronization
export interface SyncTransaction {
  id?: number;
  table: 'workspaces' | 'canvases' | 'elements' | 'collections' | 'collectionRows';
  action: 'insert' | 'update' | 'delete';
  recordId: string;
  data: string; // JSON string representation of the record (or changes)
  timestamp: number;
}

class ZenithDexie extends Dexie {
  workspaces!: Table<AccountWorkspace, string>;
  canvases!: Table<Canvas, string>;
  elements!: Table<CanvasElement, string>;
  collections!: Table<CollectionTable, string>;
  collectionRows!: Table<CollectionRow, string>;
  syncQueue!: Table<SyncTransaction, number>;

  constructor() {
    super('ZenithCanvasDB');
    this.version(1).stores({
      workspaces: 'id, title, updatedAt',
      canvases: 'id, workspaceId, parentId, title, isArchived, updatedAt',
      elements: 'id, canvasId, type, sortOrder, updatedAt',
      collections: 'id, canvasId, name',
      collectionRows: 'id, tableId, sortOrder',
      syncQueue: '++id, table, action, recordId, timestamp',
    });
  }
}

export const db = new ZenithDexie();

// Lock to avoid concurrent execution of seeding
let seedingPromise: Promise<void> | null = null;

// Helper to seed initial high-polish data if database is empty
export function seedInitialData(): Promise<void> {
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    const workspaceCount = await db.workspaces.count();
    if (workspaceCount > 0) return;

    const defaultWorkspaceId = 'ws-enterprise-default';
    
    await db.workspaces.put({
      id: defaultWorkspaceId,
      title: 'Enterprise Workspace',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const canvases: Canvas[] = [
      {
        id: 'canvas-root-1',
        workspaceId: defaultWorkspaceId,
        parentId: null,
        title: '🚀 Product Launch Roadmap',
        icon: '🚀',
        coverImage: 'https://picsum.photos/seed/launch/1200/400',
        isArchived: false,
        updatedAt: new Date(),
      },
      {
        id: 'canvas-sub-1',
        workspaceId: defaultWorkspaceId,
        parentId: 'canvas-root-1',
        title: '🎯 Design System Alignment',
        icon: '🎯',
        coverImage: 'https://picsum.photos/seed/design/1200/400',
        isArchived: false,
        updatedAt: new Date(),
      },
      {
        id: 'canvas-root-2',
        workspaceId: defaultWorkspaceId,
        parentId: null,
        title: '📊 Customer Success Matrix',
        icon: '📊',
        coverImage: 'https://picsum.photos/seed/matrix/1200/400',
        isArchived: false,
        updatedAt: new Date(),
      }
    ];

    for (const canvas of canvases) {
      await db.canvases.put(canvas);
    }

    // Seed elements for Product Launch Roadmap
    const roadmapElements: CanvasElement[] = [
      {
        id: 'el-1',
        canvasId: 'canvas-root-1',
        type: 'heading_1',
        content: 'Product Launch 2026',
        properties: '{}',
        sortOrder: 1.0,
        updatedAt: new Date(),
      },
      {
        id: 'el-2',
        canvasId: 'canvas-root-1',
        type: 'text',
        content: 'Welcome to the Zenith Canvas dynamic project planner. Below is our dynamic data collection grid for tracking sprints, team assignments, and launch critical-path actions.',
        properties: '{}',
        sortOrder: 2.0,
        updatedAt: new Date(),
      },
      {
        id: 'el-3',
        canvasId: 'canvas-root-1',
        type: 'callout',
        content: '💡 PRO TIP: Zenith Canvas uses high-contrast drop-shadows and neo-brutalist solid borders for aesthetic clarity. Use slash command `/` to insert checklists, database views, or live sandboxes.',
        properties: '{}',
        sortOrder: 3.0,
        updatedAt: new Date(),
      },
      {
        id: 'el-4',
        canvasId: 'canvas-root-1',
        type: 'todo',
        content: 'Finalize core multi-tenant synchronization protocol',
        properties: JSON.stringify({ checked: true }),
        sortOrder: 4.0,
        updatedAt: new Date(),
      },
      {
        id: 'el-5',
        canvasId: 'canvas-root-1',
        type: 'todo',
        content: 'Validate AST compound query engine on large datasets',
        properties: JSON.stringify({ checked: false }),
        sortOrder: 5.0,
        updatedAt: new Date(),
      },
      {
        id: 'el-6',
        canvasId: 'canvas-root-1',
        type: 'heading_2',
        content: 'Live Executable Sandbox',
        properties: '{}',
        sortOrder: 6.0,
        updatedAt: new Date(),
      },
      {
        id: 'el-7',
        canvasId: 'canvas-root-1',
        type: 'code_sandbox',
        content: `// Zenith Dynamic Calculation Sandbox\nconst baseSpeed = 450;\nconst concurrencyFactor = 1.8;\nconst responseTime = Math.round(baseSpeed / concurrencyFactor);\nconsole.log(\`Calculated response: \${responseTime}ms per workspace worker node.\`);`,
        properties: JSON.stringify({ language: 'javascript' }),
        sortOrder: 7.0,
        updatedAt: new Date(),
      },
      {
        id: 'el-8',
        canvasId: 'canvas-root-1',
        type: 'heading_2',
        content: 'Interactive Epic Sprint Board',
        properties: '{}',
        sortOrder: 8.0,
        updatedAt: new Date(),
      },
      {
        id: 'el-9',
        canvasId: 'canvas-root-1',
        type: 'collection_ref',
        content: 'Sprint Table',
        properties: JSON.stringify({ tableId: 'table-sprints' }),
        sortOrder: 9.0,
        updatedAt: new Date(),
      }
    ];

    for (const el of roadmapElements) {
      await db.elements.put(el);
    }

    // Seed Table Sprints
    const schemaObj = [
      { id: 'col-id', name: 'Task ID', type: 'Text' as const },
      { id: 'col-title', name: 'Title', type: 'Text' as const },
      { id: 'col-status', name: 'Status', type: 'Select' as const },
      { id: 'col-priority', name: 'Priority', type: 'Select' as const },
      { id: 'col-date', name: 'Due Date', type: 'Date' as const }
    ];

    await db.collections.put({
      id: 'table-sprints',
      canvasId: 'canvas-root-1',
      name: 'Sprint Tasks',
      schema: JSON.stringify(schemaObj),
    });

    const rows: CollectionRow[] = [
      {
        id: 'row-1',
        tableId: 'table-sprints',
        cells: JSON.stringify({
          'col-id': 'ZEN-101',
          'col-title': 'Double-buffer sync ledger implementation',
          'col-status': 'In Progress',
          'col-priority': 'High',
          'col-date': '2026-07-10',
        }),
        sortOrder: 1.0,
      },
      {
        id: 'row-2',
        tableId: 'table-sprints',
        cells: JSON.stringify({
          'col-id': 'ZEN-102',
          'col-title': 'Recursive sidebar virtualization rendering',
          'col-status': 'Completed',
          'col-priority': 'Medium',
          'col-date': '2026-07-01',
        }),
        sortOrder: 2.0,
      },
      {
        id: 'row-3',
        tableId: 'table-sprints',
        cells: JSON.stringify({
          'col-id': 'ZEN-103',
          'col-title': 'Compound AST logical query interface',
          'col-status': 'Backlog',
          'col-priority': 'High',
          'col-date': '2026-07-25',
        }),
        sortOrder: 3.0,
      },
      {
        id: 'row-4',
        tableId: 'table-sprints',
        cells: JSON.stringify({
          'col-id': 'ZEN-104',
          'col-title': 'Neo-brutalist user theme integration',
          'col-status': 'Completed',
          'col-priority': 'Low',
          'col-date': '2026-06-28',
        }),
        sortOrder: 4.0,
      }
    ];

    for (const row of rows) {
      await db.collectionRows.put(row);
    }
  })();

  return seedingPromise;
}
