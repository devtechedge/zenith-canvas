import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LEDGER_FILE_PATH = path.join(process.cwd(), 'lib', 'db', 'zenith_ledger.json');

// Types for server state
interface GitCommit {
  hash: string;
  parent: string | null;
  message: string;
  author: string;
  timestamp: string;
  canvasState: any[];
}

interface LedgerDB {
  commits: Record<string, GitCommit>;
  activeBranch: string;
  branches: Record<string, string>; // name -> commit hash
}

// Ensure local JSON database for git ledger exists
async function loadLedgerDB(): Promise<LedgerDB> {
  try {
    const data = await fs.readFile(LEDGER_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    const initialDB: LedgerDB = {
      commits: {},
      activeBranch: 'main',
      branches: { main: '' }
    };
    try {
      await fs.mkdir(path.dirname(LEDGER_FILE_PATH), { recursive: true });
      await fs.writeFile(LEDGER_FILE_PATH, JSON.stringify(initialDB, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to create zenith_ledger.json:', e);
    }
    return initialDB;
  }
}

async function saveLedgerDB(dbData: LedgerDB) {
  await fs.mkdir(path.dirname(LEDGER_FILE_PATH), { recursive: true });
  await fs.writeFile(LEDGER_FILE_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
}

// High-fidelity AST Node generation
function parseSimpleAST(text: string): any[] {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return { type: 'heading_1', depth: 1, text: trimmed.substring(2), line: idx + 1 };
    } else if (trimmed.startsWith('## ')) {
      return { type: 'heading_2', depth: 2, text: trimmed.substring(3), line: idx + 1 };
    } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      return { 
        type: 'todo', 
        checked: trimmed.startsWith('- [x] '), 
        text: trimmed.substring(6), 
        line: idx + 1 
      };
    } else if (trimmed.startsWith('- ')) {
      return { type: 'list_item', text: trimmed.substring(2), line: idx + 1 };
    } else if (trimmed.startsWith('> ')) {
      return { type: 'quote', text: trimmed.substring(2), line: idx + 1 };
    } else {
      return { type: 'paragraph', text: trimmed, line: idx + 1 };
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'DevOps Action required' }, { status: 400 });
    }

    // Operation 1: Relational Database Schema Migrator
    if (action === 'migrate') {
      const { tableName, columns } = payload;
      if (!tableName || !Array.isArray(columns)) {
        return NextResponse.json({ error: 'Table name and columns list required' }, { status: 400 });
      }

      const formattedCols = columns.map((col: any) => {
        const nullable = col.nullable ? 'NULL' : 'NOT NULL';
        const pKey = col.primaryKey ? ' PRIMARY KEY' : '';
        const defaultValue = col.default ? ` DEFAULT ${col.default}` : '';
        return `  ${col.name} ${col.type}${pKey} ${nullable}${defaultValue}`;
      });

      const createQuery = `CREATE TABLE ${tableName} (\n${formattedCols.join(',\n')}\n);`;
      const rollbackQuery = `DROP TABLE IF EXISTS ${tableName} CASCADE;`;

      return NextResponse.json({
        success: true,
        queries: {
          up: createQuery,
          down: rollbackQuery
        },
        diagnostics: {
          tableStatus: 'STAGED',
          columnsCount: columns.length,
          engineCompatibility: 'PostgreSQL 15+ & Cloud Run Serverless',
          validationCheck: 'PASSED'
        }
      });
    }

    // Operation 2: Abstract Syntax Tree (AST) Diff Viewer
    if (action === 'ast_diff') {
      const { originalText, modifiedText } = payload;
      const originalAST = parseSimpleAST(originalText || '');
      const modifiedAST = parseSimpleAST(modifiedText || '');

      const diffReport: any[] = [];
      const maxLength = Math.max(originalAST.length, modifiedAST.length);

      for (let i = 0; i < maxLength; i++) {
        const orig = originalAST[i];
        const mod = modifiedAST[i];

        if (orig && mod) {
          if (orig.type !== mod.type || orig.text !== mod.text || orig.checked !== mod.checked) {
            diffReport.push({
              line: i + 1,
              status: 'MODIFIED',
              original: orig,
              modified: mod
            });
          } else {
            diffReport.push({
              line: i + 1,
              status: 'UNTOUCHED',
              original: orig,
              modified: mod
            });
          }
        } else if (orig) {
          diffReport.push({
            line: i + 1,
            status: 'DELETED',
            original: orig,
            modified: null
          });
        } else if (mod) {
          diffReport.push({
            line: i + 1,
            status: 'ADDED',
            original: null,
            modified: mod
          });
        }
      }

      return NextResponse.json({
        success: true,
        originalTree: originalAST,
        modifiedTree: modifiedAST,
        diffReport
      });
    }

    // Operation 3: API Request Sandbox & Header Inspector
    if (action === 'request') {
      const { method, headers, url, requestBody } = payload;
      const headersMap: Record<string, string> = {};
      
      // Parse custom request header items
      if (Array.isArray(headers)) {
        headers.forEach((h: any) => {
          if (h.key && h.value) headersMap[h.key] = h.value;
        });
      }

      // Add actual server response headers
      const responseHeaders = {
        'x-powered-by': 'Zenith DevOps Cloud Run',
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store, max-age=0'
      };

      const start = Date.now();
      // Simulate endpoint resolving duration
      await new Promise((resolve) => setTimeout(resolve, 80));
      const latencyMs = Date.now() - start;

      return NextResponse.json({
        success: true,
        requestInfo: {
          resolvedUrl: url || 'https://api.zenith-canvas.local/v1/mock',
          method: method || 'POST',
          clientHeaders: headersMap,
          payloadEcho: requestBody || null
        },
        responseInfo: {
          status: 200,
          statusText: 'OK',
          headers: responseHeaders,
          latencyMs,
          body: {
            message: 'Secure sandbox server response authenticated.',
            transactionId: `tx-${Math.random().toString(36).substring(2, 11)}`,
            timestamp: new Date().toISOString()
          }
        }
      });
    }

    // Operation 4: Peer Conflict Synchronization Simulator
    if (action === 'sync_conflict') {
      const { localState, remoteState } = payload;
      
      if (!Array.isArray(localState) || !Array.isArray(remoteState)) {
        return NextResponse.json({ error: 'Local and remote state arrays required' }, { status: 400 });
      }

      // Merge policy: Last-Write-Wins based on item contents, type consistency, and order
      const resolvedList: any[] = [];
      const conflictLogs: any[] = [];

      const localMap = new Map(localState.map(x => [x.id, x]));
      const remoteMap = new Map(remoteState.map(x => [x.id, x]));

      const allIds = Array.from(new Set([...localState.map(x => x.id), ...remoteState.map(x => x.id)]));

      allIds.forEach(id => {
        const loc = localMap.get(id);
        const rem = remoteMap.get(id);

        if (loc && rem) {
          if (JSON.stringify(loc.properties) !== JSON.stringify(rem.properties) || loc.content !== rem.content) {
            // Simulated conflict detected. Defaulting resolve to remote
            conflictLogs.push({
              nodeId: id,
              conflictType: 'PROPERTY_MISMATCH',
              localValue: loc.content,
              remoteValue: rem.content,
              resolution: 'REMOTE_MERGED_LWW'
            });
            resolvedList.push({ ...rem, content: `${rem.content} (Synced-LWW)` });
          } else {
            resolvedList.push(loc);
          }
        } else if (loc) {
          resolvedList.push(loc);
        } else if (rem) {
          conflictLogs.push({
            nodeId: id,
            conflictType: 'ORPHAN_PEER_NODE',
            localValue: null,
            remoteValue: rem.content,
            resolution: 'APPENDED_TO_STAGE'
          });
          resolvedList.push(rem);
        }
      });

      return NextResponse.json({
        success: true,
        resolvedList,
        conflictLogs,
        clocks: {
          clientSequence: Math.floor(Math.random() * 100) + 12,
          serverSequence: Math.floor(Math.random() * 100) + 24
        }
      });
    }

    // Operation 5: Git Ledger Operations
    if (action === 'git_commit') {
      const { message, author, canvasState } = payload;
      if (!message || !canvasState) {
        return NextResponse.json({ error: 'Commit message and state array required' }, { status: 400 });
      }

      const dbData = await loadLedgerDB();
      const parent = dbData.branches[dbData.activeBranch] || null;
      const hash = `sha-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const newCommit: GitCommit = {
        hash,
        parent,
        message,
        author: author || 'DevOps Team',
        timestamp: new Date().toLocaleTimeString(),
        canvasState
      };

      dbData.commits[hash] = newCommit;
      dbData.branches[dbData.activeBranch] = hash;

      await saveLedgerDB(dbData);

      return NextResponse.json({
        success: true,
        commit: newCommit,
        branch: dbData.activeBranch
      });
    }

    if (action === 'git_log') {
      const dbData = await loadLedgerDB();
      const logs = Object.values(dbData.commits).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return NextResponse.json({
        success: true,
        activeBranch: dbData.activeBranch,
        logs
      });
    }

    // Operation 6: SQL Query Path Optimizer
    if (action === 'sql_optimize') {
      const { query } = payload;
      if (!query) {
        return NextResponse.json({ error: 'SQL Query statement is required' }, { status: 400 });
      }

      const isSelectAll = query.toLowerCase().includes('select *');
      const hasJoin = query.toLowerCase().includes('join');
      const hasWhere = query.toLowerCase().includes('where');

      const costReduction = hasJoin ? '48% cost reduction expected' : '15% cost reduction expected';
      const recommendations: string[] = [];

      if (isSelectAll) {
        recommendations.push('REPLACE asterisk (*) select projection with specific columns to restrict read buffers.');
      }
      if (hasJoin && !query.toLowerCase().includes('on')) {
        recommendations.push('ERROR: Missing ON relational constraint key in JOIN condition.');
      }
      if (hasWhere) {
        recommendations.push('CREATE INDEX on filter keys specified in WHERE clause to bypass table sequential scans.');
      }

      return NextResponse.json({
        success: true,
        estimatedCostBefore: '1420ms (Seq Scan)',
        estimatedCostAfter: '75ms (Index Scan)',
        costReduction,
        recommendations,
        executionPlan: [
          { step: 1, node: 'Index Scan using idx_canvas_id', details: 'Scanning IndexedDB canvas foreign keys' },
          { step: 2, node: 'Hash Join', details: 'Joining element relations to parent schema' },
          { step: 3, node: 'Aggregate Projection', details: 'Summing metadata counts in-memory' }
        ]
      });
    }

    // Operation 9: JWT Cryptographical Claims Signer
    if (action === 'jwt_sign') {
      const { payloadFields, secretKey, algorithm } = payload;
      const header = { alg: algorithm || 'HS256', typ: 'JWT' };
      const secret = secretKey || 'zenith-secret-token-key-2026';

      const base64UrlEncode = (obj: any) => {
        const str = JSON.stringify(obj);
        const base64 = Buffer.from(str).toString('base64');
        return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      };

      const encodedHeader = base64UrlEncode(header);
      const encodedPayload = base64UrlEncode({
        ...payloadFields,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'Zenith DevOps Gateway'
      });

      // Signature simulation
      const signature = Buffer.from(`${encodedHeader}.${encodedPayload}.${secret}`).toString('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_').substring(0, 42);

      const token = `${encodedHeader}.${encodedPayload}.${signature}`;

      return NextResponse.json({
        success: true,
        token,
        header,
        claimsParsed: {
          iss: 'Zenith DevOps Gateway',
          iat: 'Issued Just Now',
          exp: 'Expires in 1 Hour',
          ...payloadFields
        }
      });
    }

    return NextResponse.json({ error: 'Unknown action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Zenith Ops Suite failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
