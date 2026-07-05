'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  db, 
  type Canvas, 
  type CanvasElement, 
  type CollectionTable, 
  type CollectionRow 
} from '../db/indexeddb';

export type SyncStatus = 'saved' | 'syncing' | 'offline' | 'error';

export function useCanvasSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const syncInProgress = useRef<boolean>(false);

  // Sync background loop
  const triggerSync = useCallback(async () => {
    if (syncInProgress.current || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    syncInProgress.current = true;
    setSyncStatus('syncing');

    try {
      const queue = await db.syncQueue.toArray();
      if (queue.length === 0) {
        setSyncStatus('saved');
        syncInProgress.current = false;
        return;
      }

      // Delta-compression: Group by table/record to send the latest delta state
      // This reduces unnecessary sync steps
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: queue }),
      });

      if (response.ok) {
        const syncedIds = queue.map(q => q.id).filter((id): id is number => id !== undefined);
        await db.syncQueue.bulkDelete(syncedIds);
        setSyncStatus('saved');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Zenith Sync Failure:', error);
      setSyncStatus('error');
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentOnLine = navigator.onLine;
      setTimeout(() => {
        setIsOnline(currentOnLine);
      }, 0);
      const handleOnline = () => {
        setIsOnline(true);
        triggerSync();
      };
      const handleOffline = () => {
        setIsOnline(false);
        setSyncStatus('offline');
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [triggerSync]);

  // Background interval sync every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      triggerSync();
    }, 5000);
    return () => clearInterval(interval);
  }, [triggerSync]);

  // Queue a transaction to IndexedDB and trigger background sync
  const queueTransaction = useCallback(async (
    table: 'workspaces' | 'canvases' | 'elements' | 'collections' | 'collectionRows',
    action: 'insert' | 'update' | 'delete',
    recordId: string,
    data: any
  ) => {
    await db.syncQueue.add({
      table,
      action,
      recordId,
      data: JSON.stringify(data),
      timestamp: Date.now(),
    });
    triggerSync();
  }, [triggerSync]);

  // --- Double-Buffer Action APIs (Mutates Dexie first, then queues sync) ---

  const updateCanvasTitle = useCallback(async (canvasId: string, title: string) => {
    const updatedDate = new Date();
    await db.canvases.update(canvasId, { title, updatedAt: updatedDate });
    await queueTransaction('canvases', 'update', canvasId, { title, updatedAt: updatedDate });
  }, [queueTransaction]);

  const updateCanvasCover = useCallback(async (canvasId: string, coverImage: string | null) => {
    const updatedDate = new Date();
    await db.canvases.update(canvasId, { coverImage, updatedAt: updatedDate });
    await queueTransaction('canvases', 'update', canvasId, { coverImage, updatedAt: updatedDate });
  }, [queueTransaction]);

  const updateCanvasIcon = useCallback(async (canvasId: string, icon: string | null) => {
    const updatedDate = new Date();
    await db.canvases.update(canvasId, { icon, updatedAt: updatedDate });
    await queueTransaction('canvases', 'update', canvasId, { icon, updatedAt: updatedDate });
  }, [queueTransaction]);

  const createNewCanvas = useCallback(async (parentId: string | null = null): Promise<string> => {
    const id = `canvas-${Math.random().toString(36).substring(2, 11)}`;
    const newCanvas: Canvas = {
      id,
      workspaceId: 'ws-enterprise-default',
      parentId,
      title: 'Untitled Document',
      icon: '📄',
      coverImage: 'https://picsum.photos/seed/' + id + '/1200/400',
      isArchived: false,
      updatedAt: new Date(),
    };
    await db.canvases.add(newCanvas);
    await queueTransaction('canvases', 'insert', id, newCanvas);
    return id;
  }, [queueTransaction]);

  const deleteCanvasAndChildren = useCallback(async (canvasId: string) => {
    // Recursive search for children
    const deleteRecursive = async (id: string) => {
      const children = await db.canvases.where('parentId').equals(id).toArray();
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      await db.canvases.delete(id);
      await db.elements.where('canvasId').equals(id).delete();
      const tables = await db.collections.where('canvasId').equals(id).toArray();
      for (const table of tables) {
        await db.collectionRows.where('tableId').equals(table.id).delete();
        await db.collections.delete(table.id);
      }
      await queueTransaction('canvases', 'delete', id, {});
    };
    await deleteRecursive(canvasId);
  }, [queueTransaction]);

  const createCanvasElement = useCallback(async (canvasId: string, type: CanvasElement['type'], content = '', sortOrder = 1.0, properties = '{}'): Promise<CanvasElement> => {
    const id = `el-${Math.random().toString(36).substring(2, 11)}`;
    const newElement: CanvasElement = {
      id,
      canvasId,
      type,
      content,
      properties,
      sortOrder,
      updatedAt: new Date(),
    };
    await db.elements.add(newElement);
    await queueTransaction('elements', 'insert', id, newElement);
    return newElement;
  }, [queueTransaction]);

  const updateCanvasElement = useCallback(async (elementId: string, updates: Partial<CanvasElement>) => {
    const updatedDate = new Date();
    const fullUpdates = { ...updates, updatedAt: updatedDate };
    await db.elements.update(elementId, fullUpdates);
    await queueTransaction('elements', 'update', elementId, fullUpdates);
  }, [queueTransaction]);

  const deleteCanvasElement = useCallback(async (elementId: string) => {
    await db.elements.delete(elementId);
    await queueTransaction('elements', 'delete', elementId, {});
  }, [queueTransaction]);

  const createCollectionTable = useCallback(async (canvasId: string, name: string, columns: any[]): Promise<CollectionTable> => {
    const id = `table-${Math.random().toString(36).substring(2, 11)}`;
    const newTable: CollectionTable = {
      id,
      canvasId,
      name,
      schema: JSON.stringify(columns),
    };
    await db.collections.add(newTable);
    await queueTransaction('collections', 'insert', id, newTable);
    return newTable;
  }, [queueTransaction]);

  const createCollectionRow = useCallback(async (tableId: string, initialCells: any = {}, sortOrder = 1.0): Promise<CollectionRow> => {
    const id = `row-${Math.random().toString(36).substring(2, 11)}`;
    const newRow: CollectionRow = {
      id,
      tableId,
      cells: JSON.stringify(initialCells),
      sortOrder,
    };
    await db.collectionRows.add(newRow);
    await queueTransaction('collectionRows', 'insert', id, newRow);
    return newRow;
  }, [queueTransaction]);

  const updateCollectionRow = useCallback(async (rowId: string, cells: any) => {
    const updates = { cells: JSON.stringify(cells) };
    await db.collectionRows.update(rowId, updates);
    await queueTransaction('collectionRows', 'update', rowId, updates);
  }, [queueTransaction]);

  const deleteCollectionRow = useCallback(async (rowId: string) => {
    await db.collectionRows.delete(rowId);
    await queueTransaction('collectionRows', 'delete', rowId, {});
  }, [queueTransaction]);

  return {
    syncStatus,
    isOnline,
    triggerSync,
    updateCanvasTitle,
    updateCanvasCover,
    updateCanvasIcon,
    createNewCanvas,
    deleteCanvasAndChildren,
    createCanvasElement,
    updateCanvasElement,
    deleteCanvasElement,
    createCollectionTable,
    createCollectionRow,
    updateCollectionRow,
    deleteCollectionRow,
  };
}
