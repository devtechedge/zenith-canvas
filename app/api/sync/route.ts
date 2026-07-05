import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'server_db.json');

// Interface for server database file structure
interface ServerDB {
  workspaces: Record<string, any>;
  canvases: Record<string, any>;
  elements: Record<string, any>;
  collections: Record<string, any>;
  collectionRows: Record<string, any>;
}

// Ensure the db directory and file exist
async function loadServerDB(): Promise<ServerDB> {
  try {
    const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    // If not exists, initialize
    const initialDB: ServerDB = {
      workspaces: {},
      canvases: {},
      elements: {},
      collections: {},
      collectionRows: {},
    };
    try {
      await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
      await fs.writeFile(DB_FILE_PATH, JSON.stringify(initialDB, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write empty server db:', e);
    }
    return initialDB;
  }
}

async function saveServerDB(dbData: ServerDB) {
  await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
  await fs.writeFile(DB_FILE_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const { transactions } = await req.json();
    if (!Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Transactions list required' }, { status: 400 });
    }

    const dbData = await loadServerDB();

    for (const tx of transactions) {
      const { table, action, recordId, data } = tx;
      if (!table || !action || !recordId) continue;

      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      // Map IndexedDB tables to ServerDB keys
      const dbKey = table as keyof ServerDB;

      if (!dbData[dbKey]) {
        dbData[dbKey] = {};
      }

      if (action === 'insert' || action === 'update') {
        dbData[dbKey][recordId] = {
          ...dbData[dbKey][recordId],
          ...parsedData,
          updatedAt: new Date().toISOString(),
        };
      } else if (action === 'delete') {
        delete dbData[dbKey][recordId];
      }
    }

    await saveServerDB(dbData);

    return NextResponse.json({ success: true, processedCount: transactions.length });
  } catch (error: any) {
    console.error('Sync endpoint failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const dbData = await loadServerDB();
    return NextResponse.json(dbData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
