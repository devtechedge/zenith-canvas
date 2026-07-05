import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'server_db.json');

interface ServerDB {
  workspaces: Record<string, any>;
  canvases: Record<string, any>;
  elements: Record<string, any>;
  collections: Record<string, any>;
  collectionRows: Record<string, any>;
}

async function loadServerDB(): Promise<ServerDB> {
  try {
    const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      workspaces: {},
      canvases: {},
      elements: {},
      collections: {},
      collectionRows: {},
    };
  }
}

async function saveServerDB(dbData: ServerDB) {
  await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
  await fs.writeFile(DB_FILE_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
}

// GET lists or retrieves collection definitions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const canvasId = searchParams.get('canvasId');
    const tableId = searchParams.get('tableId');

    const dbData = await loadServerDB();

    if (tableId) {
      const collection = dbData.collections[tableId];
      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }
      // Get rows matching this tableId
      const rows = Object.values(dbData.collectionRows).filter(
        (row: any) => row.tableId === tableId
      );
      return NextResponse.json({ collection, rows });
    }

    if (canvasId) {
      // Find all collections matching canvasId
      const collections = Object.values(dbData.collections).filter(
        (col: any) => col.canvasId === canvasId
      );
      return NextResponse.json({ collections });
    }

    return NextResponse.json({
      collections: Object.values(dbData.collections),
      rows: Object.values(dbData.collectionRows),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST inserts/updates collection table schema or individual rows
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tableId, canvasId, name, schema, rowId, cells, sortOrder } = body;

    const dbData = await loadServerDB();

    if (action === 'create_table') {
      if (!canvasId || !name) {
        return NextResponse.json({ error: 'Missing canvasId or name' }, { status: 400 });
      }
      const newTableId = tableId || `table-${Math.random().toString(36).substring(2, 11)}`;
      dbData.collections[newTableId] = {
        id: newTableId,
        canvasId,
        name,
        schema: typeof schema === 'string' ? schema : JSON.stringify(schema || []),
      };
      await saveServerDB(dbData);
      return NextResponse.json({ success: true, table: dbData.collections[newTableId] });
    }

    if (action === 'save_row') {
      if (!tableId || !rowId) {
        return NextResponse.json({ error: 'Missing tableId or rowId' }, { status: 400 });
      }
      dbData.collectionRows[rowId] = {
        id: rowId,
        tableId,
        cells: typeof cells === 'string' ? cells : JSON.stringify(cells || {}),
        sortOrder: sortOrder || 1.0,
      };
      await saveServerDB(dbData);
      return NextResponse.json({ success: true, row: dbData.collectionRows[rowId] });
    }

    if (action === 'delete_row') {
      if (!rowId) {
        return NextResponse.json({ error: 'Missing rowId' }, { status: 400 });
      }
      delete dbData.collectionRows[rowId];
      await saveServerDB(dbData);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
