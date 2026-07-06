'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CollectionTable, type CollectionRow } from '@/lib/db/indexeddb';
import { useCanvasSync } from '@/lib/hooks/useCanvasSync';
import FilterEngine, { type FilterRule } from './FilterEngine';
import { 
  Grid as GridIcon, 
  Columns as KanbanIcon, 
  Image as GalleryIcon, 
  Plus, 
  Trash2, 
  Settings, 
  ChevronDown, 
  Calendar, 
  Hash, 
  Type as TextIcon, 
  Check, 
  ChevronRight,
  Calculator,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clipboard,
  Sparkles,
  Trash,
  Palette,
  CheckSquare,
  Square,
  Eye,
  SlidersHorizontal,
  Zap
} from 'lucide-react';

interface DataGridProps {
  tableId: string;
}

export default function DataGrid({ tableId }: DataGridProps) {
  const { updateCollectionRow, createCollectionRow, deleteCollectionRow } = useCanvasSync();

  // 1. Fetch table details and rows
  const collectionTable = useLiveQuery(() => db.collections.get(tableId), [tableId]);
  const rows = useLiveQuery(() => 
    db.collectionRows.where('tableId').equals(tableId).toArray(), 
    [tableId]
  ) || [];

  // Active View mode ('grid', 'kanban', 'gallery' styled as Scrapbook)
  const [activeView, setActiveView] = useState<'grid' | 'kanban' | 'gallery'>('grid');
  
  // Custom states for Batch 2 features
  const [showTallyModal, setShowTallyModal] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [cellShadingEnabled, setCellShadingEnabled] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [quickFilter, setQuickFilter] = useState<'all' | 'checked' | 'high_priority' | 'numeric' | 'has_date'>('all');
  const [kanbanGroupingColId, setKanbanGroupingColId] = useState<string>('');

  // 2. Filter states
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');

  // Sorting and Aggregations states
  const [sortConfig, setSortConfig] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnAggregations, setColumnAggregations] = useState<Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>>({});

  // Parse schema columns
  const columns = useMemo(() => {
    if (!collectionTable?.schema) return [];
    try {
      return JSON.parse(collectionTable.schema) as Array<{ id: string; name: string; type: 'Text' | 'Number' | 'Select' | 'MultiSelect' | 'Date' }>;
    } catch {
      return [];
    }
  }, [collectionTable]);

  // Resolve active Kanban grouping column
  const selectColumnForKanban = useMemo(() => {
    return columns.find(c => c.id === kanbanGroupingColId) || columns.find(c => c.type === 'Select') || columns[0];
  }, [columns, kanbanGroupingColId]);

  // Unique options for the Select column (dynamically parsed from cell values)
  const selectOptionsForKanban = useMemo(() => {
    if (!selectColumnForKanban) return ['To Do', 'In Progress', 'Completed'];
    const colId = selectColumnForKanban.id;
    const values = rows.map(r => {
      try {
        const cells = JSON.parse(r.cells);
        return cells[colId];
      } catch {
        return '';
      }
    }).filter(Boolean);
    const uniqueValues = Array.from(new Set(values));
    return uniqueValues.length > 0 ? uniqueValues : ['Backlog', 'In Progress', 'Completed'];
  }, [rows, selectColumnForKanban]);

  // Handle manual column dragging/resizing (Feature 14)
  const handleResizeMouseDown = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[colId] || 160;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.pageX - startX;
      const newWidth = Math.max(90, startWidth + deltaX);
      setColumnWidths(prev => ({ ...prev, [colId]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Helper to extract first image URL in any cell (Feature 13 Scrapbook)
  const extractFirstImageUrl = (cellsObj: Record<string, any>) => {
    for (const key of Object.keys(cellsObj)) {
      const val = cellsObj[key];
      if (typeof val === 'string') {
        const imgRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp|svg|bmp)(?:\?[^\s]*)?)/i;
        const match = val.match(imgRegex);
        if (match) return match[0];
        
        // Secondary match: general Unsplash / Picsum / Placeholder URLs
        if (val.startsWith('http://') || val.startsWith('https://')) {
          if (val.includes('unsplash.com') || val.includes('picsum.photos') || val.includes('placeholder')) {
            return val;
          }
        }
      }
    }
    return null;
  };

  const handleSortToggle = (columnId: string) => {
    setSortConfig(current => {
      if (current?.columnId === columnId) {
        if (current.direction === 'asc') {
          return { columnId, direction: 'desc' };
        }
        return null;
      }
      return { columnId, direction: 'asc' };
    });
  };

  // High-Contrast Cell Shading color mapping (Feature 17)
  const getCellShadingClass = (val: any, colType: string) => {
    if (!cellShadingEnabled || val === undefined || val === null || val === '') return 'bg-transparent';
    const strVal = String(val).trim().toLowerCase();

    // Success / Completed shades
    if (['paid', 'done', 'completed', 'yes', 'true', 'low', 'finished', 'success', 'approved'].includes(strVal)) {
      return 'bg-emerald-50/90 text-emerald-900 border-emerald-200/60 font-medium px-2 py-1 rounded-sm';
    }

    // Warnings / In progress shades
    if (['in progress', 'doing', 'medium', 'pending', 'hold', 'warning'].includes(strVal)) {
      return 'bg-amber-50/90 text-amber-950 border-amber-200/60 font-medium px-2 py-1 rounded-sm';
    }

    // Danger / Critical shades
    if (['high', 'critical', 'urgent', 'late', 'no', 'false', 'rejected', 'failed', 'cancelled'].includes(strVal)) {
      return 'bg-rose-50/90 text-rose-900 border-rose-200/60 font-medium px-2 py-1 rounded-sm';
    }

    // Number shading
    if (colType === 'Number') {
      const num = Number(val);
      if (!isNaN(num)) {
        if (num < 0) return 'bg-rose-50/90 text-rose-900 border-rose-200 font-bold px-2 py-0.5 rounded-sm';
        if (num > 0) return 'bg-sky-50/90 text-sky-900 border-sky-200 font-bold px-2 py-0.5 rounded-sm';
      }
    }

    return 'bg-transparent';
  };

  // Smart Sorting and Pre-Made Choice Quick Filters (Feature 15)
  const quickFilteredRows = useMemo(() => {
    return rows.filter(row => {
      let cellsObj: Record<string, any> = {};
      try {
        cellsObj = JSON.parse(row.cells);
      } catch {
        return false;
      }

      if (quickFilter === 'all') return true;

      // "Show only checked/completed items"
      if (quickFilter === 'checked') {
        return Object.values(cellsObj).some(val => {
          const s = String(val).toLowerCase();
          return s === 'completed' || s === 'yes' || s === 'true' || s === 'done' || s === 'paid' || s === 'finished';
        });
      }

      // "High Priority Items"
      if (quickFilter === 'high_priority') {
        return Object.values(cellsObj).some(val => {
          const s = String(val).toLowerCase();
          return s === 'high' || s === 'urgent' || s === 'critical';
        });
      }

      // "Numbers greater than 0"
      if (quickFilter === 'numeric') {
        return Object.keys(cellsObj).some(key => {
          const col = columns.find(c => c.id === key);
          return col?.type === 'Number' && Number(cellsObj[key]) > 0;
        });
      }

      // "Has valid set due dates"
      if (quickFilter === 'has_date') {
        return Object.keys(cellsObj).some(key => {
          const col = columns.find(c => c.id === key);
          return col?.type === 'Date' && cellsObj[key] !== '';
        });
      }

      return true;
    });
  }, [rows, quickFilter, columns]);

  // Client-side Filter AST Pipeline
  const filteredRows = useMemo(() => {
    return quickFilteredRows.filter(row => {
      let cellsObj: Record<string, any> = {};
      try {
        cellsObj = JSON.parse(row.cells);
      } catch {
        return false;
      }

      if (filters.length === 0) return true;

      const filterResults = filters.map(filter => {
        const val = cellsObj[filter.columnId];
        const matchVal = filter.value;
        if (val === undefined || val === null) return false;

        switch (filter.operator) {
          case 'equals':
            return String(val).toLowerCase() === String(matchVal).toLowerCase();
          case 'contains':
            return String(val).toLowerCase().includes(String(matchVal).toLowerCase());
          case 'gt':
            return Number(val) > Number(matchVal);
          case 'lt':
            return Number(val) < Number(matchVal);
          case 'before':
            return new Date(val) < new Date(matchVal);
          case 'after':
            return new Date(val) > new Date(matchVal);
          default:
            return true;
        }
      });

      return logicalOperator === 'AND' 
        ? filterResults.every(Boolean) 
        : filterResults.some(Boolean);
    });
  }, [quickFilteredRows, filters, logicalOperator]);

  // Client-side sort pipeline on filtered rows
  const sortedAndFilteredRows = useMemo(() => {
    const result = [...filteredRows];
    if (sortConfig) {
      const { columnId, direction } = sortConfig;
      const column = columns.find(c => c.id === columnId);
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';
        try {
          valA = JSON.parse(a.cells)[columnId] ?? '';
          valB = JSON.parse(b.cells)[columnId] ?? '';
        } catch {}

        if (column?.type === 'Number') {
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return direction === 'asc' ? numA - numB : numB - numA;
          }
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return direction === 'asc' ? -1 : 1;
        if (strA > strB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filteredRows, sortConfig, columns]);

  // Columns mutations
  const handleAddColumn = async () => {
    if (!collectionTable) return;
    const newColId = `col-${Math.random().toString(36).substring(2, 9)}`;
    const newColName = `Field ${columns.length + 1}`;
    const newSchema = [...columns, { id: newColId, name: newColName, type: 'Text' as const }];
    await db.collections.update(tableId, { schema: JSON.stringify(newSchema) });
  };

  const handleUpdateColumnName = async (colId: string, name: string) => {
    if (!collectionTable) return;
    const newSchema = columns.map(c => c.id === colId ? { ...c, name } : c);
    await db.collections.update(tableId, { schema: JSON.stringify(newSchema) });
  };

  // Magic Column Type Switcher (Feature 16) with casting conversion
  const handleUpdateColumnTypeWithCasting = async (colId: string, type: 'Text' | 'Number' | 'Select' | 'MultiSelect' | 'Date') => {
    if (!collectionTable) return;
    
    // Cast values across rows
    for (const r of rows) {
      try {
        const cellsObj = JSON.parse(r.cells);
        const originalVal = cellsObj[colId] || '';
        let castedVal: any = originalVal;

        if (type === 'Number') {
          // Extract only digits and decimal points
          const cleaned = String(originalVal).replace(/[^0-9.-]/g, '');
          castedVal = cleaned ? Number(cleaned) : 0;
          if (isNaN(castedVal)) castedVal = 0;
        } else if (type === 'Date') {
          const testDate = new Date(originalVal);
          castedVal = !isNaN(testDate.getTime()) ? originalVal : '';
        } else if (type === 'Select') {
          castedVal = originalVal || 'In Progress';
        } else {
          castedVal = String(originalVal);
        }

        const updatedCells = { ...cellsObj, [colId]: castedVal };
        await updateCollectionRow(r.id, updatedCells);
      } catch (err) {
        console.error('Error casting column cell: ', err);
      }
    }

    const newSchema = columns.map(c => c.id === colId ? { ...c, type } : c);
    await db.collections.update(tableId, { schema: JSON.stringify(newSchema) });
  };

  const handleDeleteColumn = async (colId: string) => {
    if (!collectionTable) return;
    const newSchema = columns.filter(c => c.id !== colId);
    await db.collections.update(tableId, { schema: JSON.stringify(newSchema) });
  };

  // Rows mutations
  const handleAddRow = async () => {
    const initialCells: Record<string, any> = {};
    columns.forEach(col => {
      if (col.type === 'Number') initialCells[col.id] = 0;
      else if (col.type === 'Select') initialCells[col.id] = 'In Progress';
      else initialCells[col.id] = '';
    });
    const maxSort = rows.reduce((max, r) => Math.max(max, r.sortOrder), 0);
    await createCollectionRow(tableId, initialCells, maxSort + 1);
  };

  const handleCellChange = async (rowId: string, colId: string, value: any) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    let cellsObj = {};
    try {
      cellsObj = JSON.parse(row.cells);
    } catch {}
    const updatedCells = { ...cellsObj, [colId]: value };
    await updateCollectionRow(rowId, updatedCells);
  };

  const handleDeleteRow = async (rowId: string) => {
    await deleteCollectionRow(rowId);
    setSelectedRowIds(prev => {
      const copy = { ...prev };
      delete copy[rowId];
      return copy;
    });
  };

  // One-Click Row Tally Calculation Logic (Feature 11)
  const tallySummary = useMemo(() => {
    let checkedCount = 0;
    let totalMoneySpent = 0;
    let numericColsCount = 0;
    
    sortedAndFilteredRows.forEach(row => {
      try {
        const cells = JSON.parse(row.cells);
        Object.keys(cells).forEach(key => {
          const col = columns.find(c => c.id === key);
          const val = cells[key];
          
          // Count positive states / checked
          if (typeof val === 'string' || typeof val === 'boolean') {
            const s = String(val).toLowerCase();
            if (['completed', 'yes', 'true', 'done', 'paid', 'finished', 'checked'].includes(s)) {
              checkedCount++;
            }
          }

          // Count money / spending spent
          if (col?.type === 'Number') {
            const num = Number(val);
            if (!isNaN(num)) {
              totalMoneySpent += num;
              numericColsCount++;
            }
          }
        });
      } catch {}
    });

    return {
      rowCount: sortedAndFilteredRows.length,
      checkedCount,
      totalMoneySpent,
      numericColsCount
    };
  }, [sortedAndFilteredRows, columns]);

  // Bulk Item Action Triggers (Feature 18)
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(selectedRowIds).filter(id => selectedRowIds[id]);
    if (selectedIds.length === 0) return;
    
    if (confirm(`Are you sure you want to bulk-delete ${selectedIds.length} items?`)) {
      for (const id of selectedIds) {
        await deleteCollectionRow(id);
      }
      setSelectedRowIds({});
    }
  };

  const handleBulkChangeStatus = async (statusValue: string) => {
    const selectedIds = Object.keys(selectedRowIds).filter(id => selectedRowIds[id]);
    if (selectedIds.length === 0 || !selectColumnForKanban) return;

    for (const id of selectedIds) {
      await handleCellChange(id, selectColumnForKanban.id, statusValue);
    }
    setSelectedRowIds({});
  };

  // Copy Clean Clips Text (Feature 19)
  const handleCopyToClipboard = () => {
    if (sortedAndFilteredRows.length === 0) {
      alert("No visible table rows to copy!");
      return;
    }

    let clipText = `📋 DATA CLIPBOARD: ${collectionTable?.name || 'Smart Table'}\n`;
    clipText += `-------------------------------------------------\n`;
    
    // Headers
    clipText += columns.map(c => c.name.toUpperCase()).join(' | ') + '\n';
    clipText += `-------------------------------------------------\n`;

    // Rows
    sortedAndFilteredRows.forEach((row, idx) => {
      try {
        const cells = JSON.parse(row.cells);
        const rowText = columns.map(col => {
          const val = cells[col.id] ?? '';
          return String(val);
        }).join(' | ');
        clipText += `${idx + 1}. ${rowText}\n`;
      } catch {}
    });
    
    clipText += `-------------------------------------------------\n`;
    clipText += `Exported from Zenith Canvas 🎨`;

    navigator.clipboard.writeText(clipText);
    alert("✨ Clean plain-text table clip copied! You can now paste it cleanly in your emails, SMS, or Slack chats!");
  };

  // Aggregations Calculations in Footer
  const aggregations = useMemo(() => {
    const agg: Record<string, { value: string | number; type: string }> = {};
    columns.forEach(col => {
      const activeType = columnAggregations[col.id] || (col.type === 'Number' ? 'sum' : 'count');
      
      if (activeType === 'none') {
        agg[col.id] = { value: '-', type: 'none' };
        return;
      }

      const values = filteredRows.map(row => {
        try {
          const cells = JSON.parse(row.cells);
          return cells[col.id];
        } catch {
          return undefined;
        }
      }).filter(v => v !== undefined && v !== null && v !== '');

      if (activeType === 'count') {
        agg[col.id] = { value: `${values.length} rows`, type: 'count' };
        return;
      }

      const numValues = values.map(v => Number(v)).filter(n => !isNaN(n));

      if (numValues.length === 0) {
        agg[col.id] = { value: 0, type: activeType };
        return;
      }

      if (activeType === 'sum') {
        const sum = numValues.reduce((s, v) => s + v, 0);
        agg[col.id] = { value: sum, type: 'sum' };
      } else if (activeType === 'avg') {
        const sum = numValues.reduce((s, v) => s + v, 0);
        const avg = Math.round((sum / numValues.length) * 100) / 100;
        agg[col.id] = { value: avg, type: 'avg' };
      } else if (activeType === 'min') {
        const min = Math.min(...numValues);
        agg[col.id] = { value: min, type: 'min' };
      } else if (activeType === 'max') {
        const max = Math.max(...numValues);
        agg[col.id] = { value: max, type: 'max' };
      }
    });
    return agg;
  }, [filteredRows, columns, columnAggregations]);

  // HTML5 Drag and Drop for Kanban board lane transition
  const handleKanbanDragStart = (e: React.DragEvent, rowId: string) => {
    e.dataTransfer.setData('text/kanban-row-id', rowId);
  };

  const handleKanbanDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleKanbanDrop = async (e: React.DragEvent, targetLaneValue: string) => {
    e.preventDefault();
    const draggedRowId = e.dataTransfer.getData('text/kanban-row-id');
    if (draggedRowId && selectColumnForKanban) {
      await handleCellChange(draggedRowId, selectColumnForKanban.id, targetLaneValue);
    }
  };

  if (!collectionTable) {
    return (
      <div className="p-4 bg-red-50 text-red-500 border border-red-200">
        Relational Grid Collection not found or deleted.
      </div>
    );
  }

  // Determine if checkall is checked
  const isAllChecked = sortedAndFilteredRows.length > 0 && sortedAndFilteredRows.every(r => selectedRowIds[r.id]);
  const selectedCount = Object.values(selectedRowIds).filter(Boolean).length;

  return (
    <div className="space-y-4">
      
      {/* View Selector & Copy Tool Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1A1A1A] pb-3 bg-white p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveView('grid')}
            className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold uppercase border-2 border-[#1A1A1A] transition-all rounded ${
              activeView === 'grid' 
                ? 'bg-[#2D6A4F] text-white neo-shadow-sm' 
                : 'bg-white text-[#1A1A1A] hover:bg-gray-100'
            }`}
          >
            <GridIcon className="w-3.5 h-3.5" />
            <span>Grid view</span>
          </button>

          <button
            onClick={() => setActiveView('kanban')}
            className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold uppercase border-2 border-[#1A1A1A] transition-all rounded ${
              activeView === 'kanban' 
                ? 'bg-[#2D6A4F] text-white neo-shadow-sm' 
                : 'bg-white text-[#1A1A1A] hover:bg-gray-100'
            }`}
          >
            <KanbanIcon className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setActiveView('gallery')}
            className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold uppercase border-2 border-[#1A1A1A] transition-all rounded ${
              activeView === 'gallery' 
                ? 'bg-[#2D6A4F] text-white neo-shadow-sm' 
                : 'bg-white text-[#1A1A1A] hover:bg-gray-100'
            }`}
            title="View as visual polaroids and tape scraps"
          >
            <GalleryIcon className="w-3.5 h-3.5" />
            <span>Scrapbook Grid</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Automatic Cell Shading Switch (Feature 17) */}
          <button
            onClick={() => setCellShadingEnabled(!cellShadingEnabled)}
            className={`flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono font-bold uppercase border-2 border-[#1A1A1A] rounded ${
              cellShadingEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-500'
            }`}
            title="Toggle color-highlighted dynamic cell background shading"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Shading: {cellShadingEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Copy Clean Clips Button (Feature 19) */}
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono font-bold uppercase border-2 border-[#1A1A1A] bg-white hover:bg-slate-50 text-slate-700"
            title="Copy clean table text plain for email / chat pasting"
          >
            <Clipboard className="w-3.5 h-3.5 text-amber-500" />
            <span>Copy Clips</span>
          </button>

          <button
            onClick={handleAddRow}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold uppercase bg-[#FFB703] border-2 border-[#1A1A1A] neo-shadow-sm rounded hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Record</span>
          </button>
        </div>
      </div>

      {/* Pre-made Smart Sorting Quick Choice Buttons (Feature 15) */}
      <div className="bg-slate-50 border-2 border-dashed border-gray-300 p-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase mr-1 select-none flex items-center">
          <SlidersHorizontal className="w-3 h-3 mr-1" /> Quick Filters:
        </span>
        {[
          { id: 'all', label: '🧹 Show All' },
          { id: 'checked', label: '✅ Checked / Completed' },
          { id: 'high_priority', label: '🔥 High Priority' },
          { id: 'numeric', label: '🔢 Spending/Numbers > 0' },
          { id: 'has_date', label: '📅 Has Due Date' }
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setQuickFilter(btn.id as any)}
            className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition-all border ${
              quickFilter === btn.id 
                ? 'bg-[#1A1A1A] text-[#FFB703] border-black shadow-xs' 
                : 'bg-white hover:bg-slate-100 text-gray-700 border-gray-300'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Logical AST Compounding Filters Panel */}
      <FilterEngine 
        columns={columns}
        filters={filters}
        onFiltersChange={setFilters}
        logicalOperator={logicalOperator}
        onLogicalOperatorChange={setLogicalOperator}
      />

      {/* RENDER ACTIVE VIEW */}
      {activeView === 'grid' && (
        <div className="overflow-x-auto border-2 border-[#1A1A1A] bg-white rounded-none neo-shadow-sm relative pb-4">
          <table className="w-full text-left border-collapse table-fixed min-w-[750px]">
            {/* Headers */}
            <thead className="bg-[#F4F7F6] border-b-2 border-[#1A1A1A] text-xs font-bold font-mono">
              <tr>
                {/* Bulk Select All Checkbox Header */}
                <th className="p-2 w-10 text-center border-r-2 border-[#1A1A1A] bg-slate-100 select-none">
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const next: Record<string, boolean> = {};
                      sortedAndFilteredRows.forEach(r => {
                        next[r.id] = checked;
                      });
                      setSelectedRowIds(next);
                    }}
                    className="w-4 h-4 rounded cursor-pointer accent-[#FFB703]"
                    title="Select all rows for bulk action"
                  />
                </th>

                {columns.map(col => {
                  const isSorted = sortConfig?.columnId === col.id;
                  const colWidth = columnWidths[col.id] || 160;
                  return (
                    <th 
                      key={col.id} 
                      style={{ width: colWidth }}
                      className="p-2 border-r-2 border-[#1A1A1A] relative group/header min-w-[100px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 flex-1 min-w-0 pr-1">
                          <button 
                            type="button"
                            onClick={() => handleSortToggle(col.id)}
                            className={`p-0.5 rounded border border-transparent hover:border-gray-300 hover:bg-white text-gray-400 hover:text-[#1A1A1A] transition-all flex items-center justify-center mr-1 ${isSorted ? 'text-[#FFB703]' : ''}`}
                            title="Toggle column sort"
                          >
                            {isSorted ? (
                              sortConfig?.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1A1A1A]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1A1A1A]" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {col.type === 'Number' && <Hash className="w-3.5 h-3.5 text-sky-600" />}
                          {col.type === 'Date' && <Calendar className="w-3.5 h-3.5 text-rose-500" />}
                          {col.type === 'Text' && <TextIcon className="w-3.5 h-3.5 text-gray-500" />}
                          {col.type === 'Select' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => handleUpdateColumnName(col.id, e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-[#1A1A1A] focus:bg-white px-1 rounded w-full text-xs"
                          />
                        </div>

                        {/* Magic Column Type Switcher Popup (Feature 16) */}
                        <div className="flex items-center space-x-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity flex-shrink-0 z-20">
                          <select
                            value={col.type}
                            onChange={(e) => handleUpdateColumnTypeWithCasting(col.id, e.target.value as any)}
                            className="text-[9px] border-2 border-[#1A1A1A] bg-amber-50 font-black uppercase text-amber-950 p-0.5 rounded-none outline-none"
                            title="Magic Type Switcher with automatic casting conversion"
                          >
                            <option value="Text">🔤 Text</option>
                            <option value="Number">🔢 Num</option>
                            <option value="Select">🎨 Badge</option>
                            <option value="Date">📅 Date</option>
                          </select>
                          <button
                            onClick={() => handleDeleteColumn(col.id)}
                            className="p-0.5 hover:bg-red-100 text-red-500 rounded border border-transparent hover:border-red-400"
                            title="Delete column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Simple Drag Column Resizer Handle (Feature 14) */}
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, col.id)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-amber-400/80 active:bg-amber-500 transition-all z-20 select-none"
                        title="Drag to resize column"
                      />
                    </th>
                  );
                })}
                {/* Column addition trigger */}
                <th className="p-2 w-14 text-center bg-slate-50">
                  <button
                    onClick={handleAddColumn}
                    className="p-1.5 border-2 border-[#1A1A1A] bg-[#FFB703] rounded-none hover:bg-amber-400 hover:scale-105 transition-all"
                    title="Add new column"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </th>
              </tr>
            </thead>

            {/* Rows */}
            <tbody className="divide-y-2 divide-[#1A1A1A] text-xs font-mono">
              {sortedAndFilteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-10 text-center text-gray-400 font-sans font-medium">
                    No matching grid rows found. Add a record above or change filters to start.
                  </td>
                </tr>
              ) : (
                sortedAndFilteredRows.map(row => {
                  let cellData: Record<string, any> = {};
                  try {
                    cellData = JSON.parse(row.cells);
                  } catch {}

                  const isChecked = !!selectedRowIds[row.id];

                  return (
                    <tr key={row.id} className={`hover:bg-slate-50/70 border-b border-gray-100 ${isChecked ? 'bg-yellow-50/50' : ''}`}>
                      {/* Bulk Select Checkbox Cell */}
                      <td className="p-1 text-center border-r-2 border-[#1A1A1A] align-middle bg-slate-50/50 select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setSelectedRowIds(prev => ({ ...prev, [row.id]: e.target.checked }));
                          }}
                          className="w-4 h-4 rounded cursor-pointer accent-[#FFB703]"
                        />
                      </td>

                      {/* Normal data cells with High-Contrast shading */}
                      {columns.map(col => {
                        const val = cellData[col.id] || '';
                        const shadingClass = getCellShadingClass(val, col.type);
                        const colWidth = columnWidths[col.id] || 160;

                        return (
                          <td 
                            key={col.id} 
                            style={{ width: colWidth }}
                            className="p-1 border-r-2 border-[#1A1A1A] align-middle overflow-hidden"
                          >
                            <div className={`w-full min-h-[28px] flex items-center ${shadingClass}`}>
                              {col.type === 'Select' ? (
                                <div className={`border border-[#1A1A1A] px-1.5 py-0.5 font-bold text-[10px] uppercase inline-flex rounded-none transition-colors ${
                                  val === 'Completed' || val === 'Low' || val === 'Paid' || val === 'Yes' ? 'bg-[#D8F3DC] text-[#1B4332]' :
                                  val === 'In Progress' || val === 'Medium' || val === 'Pending' ? 'bg-[#CAF0F8] text-[#03045E]' :
                                  val === 'High' || val === 'Urgent' || val === 'Critical' ? 'bg-[#FFCCD5] text-[#A70000]' :
                                  'bg-white text-gray-700'
                                }`}>
                                  <select
                                    value={val}
                                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                    className="bg-transparent outline-none p-0.5 rounded font-black uppercase text-[10px] cursor-pointer"
                                  >
                                    <option value="Backlog" className="bg-white text-gray-700 font-sans">Backlog</option>
                                    <option value="In Progress" className="bg-white text-gray-700 font-sans">In Progress</option>
                                    <option value="Completed" className="bg-white text-gray-700 font-sans">Completed</option>
                                    <option value="Pending" className="bg-white text-gray-700 font-sans">Pending</option>
                                    <option value="Paid" className="bg-white text-gray-700 font-sans">Paid</option>
                                    <option value="Yes" className="bg-white text-gray-700 font-sans">Yes</option>
                                    <option value="No" className="bg-white text-gray-700 font-sans">No</option>
                                    <option value="High" className="bg-white text-gray-700 font-sans">High</option>
                                    <option value="Medium" className="bg-white text-gray-700 font-sans">Medium</option>
                                    <option value="Low" className="bg-white text-gray-700 font-sans">Low</option>
                                  </select>
                                </div>
                              ) : (
                                <input
                                  type={col.type === 'Number' ? 'number' : col.type === 'Date' ? 'date' : 'text'}
                                  value={val}
                                  onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                  placeholder={col.type === 'Number' ? '0' : col.type === 'Date' ? 'YYYY-MM-DD' : '...'}
                                  className="w-full bg-transparent outline-none border-none p-1 font-sans focus:bg-white rounded text-xs"
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                      {/* Delete Row Cell */}
                      <td className="p-1 text-center align-middle bg-slate-50/50">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 hover:bg-red-500 hover:text-white rounded border border-transparent hover:border-[#1A1A1A] transition-all"
                          title="Delete record row"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-white" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Calculations Aggregations Footer */}
            {filteredRows.length > 0 && (
              <tfoot className="bg-[#F4F7F6] border-t-4 border-[#1A1A1A] font-mono text-[10px] select-none">
                <tr className="divide-x-2 divide-[#1A1A1A]">
                  <td className="p-2 bg-slate-100" />
                  {columns.map(col => {
                    const currentType = columnAggregations[col.id] || (col.type === 'Number' ? 'sum' : 'count');
                    const aggData = aggregations[col.id] || { value: '-', type: 'none' };
                    const colWidth = columnWidths[col.id] || 160;

                    return (
                      <td 
                        key={col.id} 
                        style={{ width: colWidth }}
                        className="p-2 text-gray-500 font-bold space-y-2 bg-[#FAFBFA]"
                      >
                        <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Calculator className="w-3 h-3" />
                            <span className="text-[8px] uppercase">AGG</span>
                          </div>
                          <select
                            value={currentType}
                            onChange={(e) => setColumnAggregations(prev => ({ ...prev, [col.id]: e.target.value as any }))}
                            className="bg-white border border-gray-300 rounded text-[9px] p-0.5 outline-none font-bold text-gray-700 cursor-pointer hover:bg-slate-50"
                          >
                            <option value="none">None</option>
                            <option value="count">Count</option>
                            {col.type === 'Number' && (
                              <>
                                <option value="sum">Sum</option>
                                <option value="avg">Avg</option>
                                <option value="min">Min</option>
                                <option value="max">Max</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div className="text-xs text-[#1A1A1A] font-black tracking-tight flex items-center flex-wrap gap-1">
                          <span className="uppercase text-[8px] text-emerald-800 font-extrabold bg-emerald-100 px-1 py-0.5 rounded">
                            {aggData.type}:
                          </span>
                          <span className="text-[11px]">{aggData.value}</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-2 bg-gray-100" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* COLOR-LANE GROUPING KANBAN BOARD VIEW (Feature 12) */}
      {activeView === 'kanban' && (
        <div className="space-y-3">
          {/* Group selector */}
          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 border-2 border-dashed border-gray-300">
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Grouping Category:</span>
            <select
              value={kanbanGroupingColId}
              onChange={(e) => setKanbanGroupingColId(e.target.value)}
              className="bg-white border-2 border-[#1A1A1A] text-xs font-bold font-mono py-0.5 px-2 text-[#1A1A1A] rounded"
            >
              {columns.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
            <span className="text-[9px] font-mono text-gray-400">Drag items seamlessly between lanes to shift status.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectOptionsForKanban.map((lane, index) => {
              const laneRows = filteredRows.filter(row => {
                try {
                  const cells = JSON.parse(row.cells);
                  return String(cells[selectColumnForKanban?.id] || '').trim().toLowerCase() === String(lane).trim().toLowerCase();
                } catch {
                  return false;
                }
              });

              // Apply distinct lane colors
              const isCompletedLane = ['completed', 'done', 'finished', 'paid', 'yes', 'low'].includes(lane.toLowerCase());
              const isProgressLane = ['in progress', 'doing', 'pending', 'medium'].includes(lane.toLowerCase());
              const isBacklogLane = ['backlog', 'to do', 'high', 'critical', 'urgent'].includes(lane.toLowerCase());

              const laneColorClass = isCompletedLane 
                ? 'bg-emerald-50/75 border-emerald-300 shadow-[4px_4px_0px_0px_#10B981]' 
                : isProgressLane 
                ? 'bg-amber-50/75 border-amber-300 shadow-[4px_4px_0px_0px_#F59E0B]' 
                : isBacklogLane
                ? 'bg-rose-50/75 border-rose-300 shadow-[4px_4px_0px_0px_#EF4444]'
                : 'bg-slate-50/75 border-slate-300 shadow-[4px_4px_0px_0px_#4B5563]';

              return (
                <div 
                  key={lane} 
                  className={`border-4 p-4 rounded-none flex flex-col min-h-[420px] transition-all duration-200 ${laneColorClass}`}
                  onDragOver={handleKanbanDragOver}
                  onDrop={(e) => handleKanbanDrop(e, lane)}
                >
                  {/* Lane Header */}
                  <div className="pb-3 mb-2 border-b border-black/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white border-2 border-black px-2 py-0.5 rounded-none shadow-sm">
                        {laneRows.length}
                      </span>
                      <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight">{lane}</h3>
                    </div>
                    <button 
                      onClick={async () => {
                        const initialCells: Record<string, any> = {};
                        columns.forEach(col => {
                          if (col.id === selectColumnForKanban?.id) initialCells[col.id] = lane;
                          else if (col.type === 'Number') initialCells[col.id] = 0;
                          else initialCells[col.id] = '';
                        });
                        const maxSort = rows.reduce((max, r) => Math.max(max, r.sortOrder), 0);
                        await createCollectionRow(tableId, initialCells, maxSort + 1);
                      }}
                      className="p-1 border-2 border-black bg-[#FFB703] hover:bg-amber-400 rounded-none shadow-xs"
                      title="Add card directly inside this lane"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cards List */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {laneRows.length === 0 ? (
                      <div className="h-28 border-2 border-dashed border-black/15 bg-white/45 rounded-none flex flex-col items-center justify-center text-[10px] text-gray-400 font-mono">
                        <span>LANE EMPTY</span>
                        <span>Drag cards here</span>
                      </div>
                    ) : (
                      laneRows.map(row => {
                        let cells: Record<string, any> = {};
                        try {
                          cells = JSON.parse(row.cells);
                        } catch {}

                        // Highlight card if checked
                        const isChecked = !!selectedRowIds[row.id];

                        return (
                          <div
                            key={row.id}
                            draggable
                            onDragStart={(e) => handleKanbanDragStart(e, row.id)}
                            className={`border-2 border-black p-3 rounded-none bg-white hover:translate-x-[1px] hover:translate-y-[1px] cursor-grab active:cursor-grabbing transition-all space-y-2 group relative shadow-sm ${
                              isChecked ? 'bg-yellow-50/90 border-dashed border-amber-500' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              {/* Selection checkbox */}
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  setSelectedRowIds(prev => ({ ...prev, [row.id]: e.target.checked }));
                                }}
                                className="w-3.5 h-3.5 rounded cursor-pointer accent-[#FFB703] mt-0.5"
                              />

                              <span className="font-extrabold text-xs text-[#1A1A1A] line-clamp-2 flex-1 ml-1.5 leading-snug">
                                {cells[columns[1]?.id] || cells[columns[0]?.id] || 'Unnamed card'}
                              </span>
                              
                              <button
                                onClick={() => handleDeleteRow(row.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 hover:text-red-500 rounded transition-all text-gray-400 border border-transparent hover:border-red-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Extra Fields metadata list */}
                            <div className="space-y-1 pt-1.5 border-t border-dashed border-gray-300 text-[9px] font-mono text-gray-400">
                              {columns.slice(2).map(col => {
                                const v = cells[col.id];
                                if (!v) return null;
                                return (
                                  <div key={col.id} className="flex justify-between items-center gap-1.5">
                                    <span className="uppercase text-gray-400 font-bold truncate max-w-[50px]">{col.name}:</span>
                                    <span className="font-bold text-[#1A1A1A] truncate max-w-[80px]">{v}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PICTURE CARD SCRAPBOOK POLAROID GRID VIEW (Feature 13) */}
      {activeView === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-3 select-none">
          {filteredRows.length === 0 ? (
            <div className="col-span-full border-4 border-dashed border-black/20 p-12 text-center text-sm font-bold text-gray-400 bg-white shadow-inner">
              No matching scrapbook cards to display. Add records with picture URLs or text!
            </div>
          ) : (
            filteredRows.map((row, idx) => {
              let cells: Record<string, any> = {};
              try {
                cells = JSON.parse(row.cells);
              } catch {}

              const title = cells[columns[1]?.id] || cells[columns[0]?.id] || 'Untitled Scrap';
              
              // Smart extract photo or use seed-based fallback cover (Feature 13)
              const firstImage = extractFirstImageUrl(cells);
              const bgSeed = encodeURIComponent(title.substring(0, 6));
              const finalImageSrc = firstImage || `https://picsum.photos/seed/${bgSeed}/360/240`;

              // Apply playful Polaroid tilt rotation
              const tilts = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-0'];
              const activeTilt = tilts[idx % tilts.length];

              // High-Contrast checked styling
              const isChecked = !!selectedRowIds[row.id];

              return (
                <div 
                  key={row.id}
                  className={`border-4 border-black bg-[#FCFBF7] rounded-none p-3.5 pb-5 shadow-[5px_5px_0px_0px_#1A1A1A] transition-all duration-300 hover:scale-102 hover:shadow-[7px_7px_0px_0px_#FFB703] flex flex-col relative overflow-visible ${activeTilt} ${
                    isChecked ? 'border-dashed border-amber-500 bg-yellow-50/60 shadow-[5px_5px_0px_0px_#FFB703]' : ''
                  }`}
                >
                  {/* Adhesive tape scrap illustration (Feature 13 aesthetic decoration) */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-yellow-200/80 border border-yellow-300 shadow-xs rotate-2 z-10" />

                  {/* Polaroid Image Cover */}
                  <div className="h-40 bg-slate-200 border-2 border-black relative overflow-hidden group">
                    <img 
                      src={finalImageSrc} 
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        // fallback image on error
                        e.currentTarget.src = `https://picsum.photos/seed/broken/360/240`;
                      }}
                    />
                    
                    {/* Delete overlays */}
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 border-2 border-black bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-none shadow-xs"
                        title="Delete scrapbook card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Checkbox Overlay */}
                    <div className="absolute bottom-1.5 left-1.5 bg-white border-2 border-black p-0.5 shadow-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setSelectedRowIds(prev => ({ ...prev, [row.id]: e.target.checked }));
                        }}
                        className="w-4 h-4 cursor-pointer accent-[#FFB703]"
                      />
                    </div>

                    {/* Image indicator badge */}
                    {firstImage && (
                      <span className="absolute bottom-1.5 right-1.5 text-[8px] font-mono font-bold uppercase tracking-wider bg-[#FFB703] border-2 border-black text-[#1A1A1A] px-1 shadow-sm">
                        🖼️ Attached Image
                      </span>
                    )}
                  </div>

                  {/* Polaroid text bottom caption */}
                  <div className="pt-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Handwritten title vibe */}
                      <h4 className="text-sm font-black font-serif italic text-slate-800 line-clamp-2 leading-relaxed border-b border-black/10 pb-1.5">
                        {title}
                      </h4>
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase mt-1.5 text-gray-400">
                        <span>LANE / STATE:</span>
                        <span className="text-emerald-700 bg-emerald-50 px-1 border border-emerald-200">
                          {cells[selectColumnForKanban?.id] || 'No category'}
                        </span>
                      </div>
                    </div>

                    {/* Secondary metadata keys list */}
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200 text-[10px] font-mono">
                      {columns.map(col => {
                        const val = cells[col.id];
                        // skip rendering title cells & category again
                        if (col.id === columns[1]?.id || col.id === columns[0]?.id || col.id === selectColumnForKanban?.id) return null;
                        if (!val) return null;

                        return (
                          <div key={col.id} className="flex justify-between gap-1 text-slate-500">
                            <span className="uppercase text-[9px] text-slate-400 font-extrabold">{col.name}:</span>
                            <span className="font-bold text-slate-800 truncate max-w-[130px]" title={val}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 11. ONE-CLICK ROW TALLY FLOATING POPUP DIALOG MODAL */}
      <div className="flex justify-start select-none pt-2.5">
        <button
          onClick={() => setShowTallyModal(true)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-[#1F2833] hover:bg-slate-800 border-2 border-black text-white text-[11px] font-bold font-mono uppercase tracking-wider neo-shadow-sm cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-[#FFB703] animate-pulse" />
          <span>📊 Run One-Click Tally Summary</span>
        </button>
      </div>

      {showTallyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-white border-4 border-black w-full max-w-md p-6 shadow-[8px_8px_0px_0px_#1A1A1A] animate-fade-in relative">
            <button
              onClick={() => setShowTallyModal(false)}
              className="absolute top-4 right-4 text-[#1A1A1A] hover:text-red-500 font-extrabold text-sm border-2 border-black bg-white px-1.5 py-0.5 cursor-pointer hover:bg-slate-50 transition-all"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 border-b-4 border-black pb-3 mb-4">
              <Calculator className="w-6 h-6 text-[#FFB703]" />
              <div>
                <h3 className="text-md font-black text-[#1A1A1A] uppercase tracking-tight">Granny&apos;s Table Tally Ticker 👵✨</h3>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Dead-Simple Real-time Calculations</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Calculations layout cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-black p-3 bg-amber-50">
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Total Rows Scan</span>
                  <span className="text-2xl font-black text-[#1A1A1A]">{tallySummary.rowCount}</span>
                  <span className="text-[9px] font-mono text-gray-400 block mt-1">active records</span>
                </div>

                <div className="border-2 border-black p-3 bg-emerald-50">
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Checked/Done Count</span>
                  <span className="text-2xl font-black text-emerald-800">{tallySummary.checkedCount}</span>
                  <span className="text-[9px] font-mono text-gray-400 block mt-1">completed cells</span>
                </div>
              </div>

              <div className="border-2 border-black p-4 bg-indigo-50/80">
                <span className="text-[10px] font-mono font-extrabold text-gray-500 uppercase block">Spending / Money Spent (Totals)</span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-3xl font-black text-indigo-950">${tallySummary.totalMoneySpent.toLocaleString()}</span>
                  <span className="text-xs font-mono font-bold text-indigo-700">USD total</span>
                </div>
                <p className="text-[9px] font-mono text-indigo-600/80 mt-1 uppercase">
                  SUM OF ALL COLUMNS WITH NUMERIC FIELD VALUES
                </p>
              </div>

              {/* Grandma's friendly note */}
              <div className="bg-[#FCFBF7] border-2 border-dashed border-amber-400 p-3 flex items-start space-x-2.5">
                <span className="text-2xl select-none">👵</span>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-[#1A1A1A] uppercase">Granny Approved Tip:</h4>
                  <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
                    &ldquo;My dears, your checklist shows <strong className="text-[#1A1A1A]">{tallySummary.checkedCount} items</strong> are checked or paid off, and you have tallied a spend of <strong className="text-indigo-950">${tallySummary.totalMoneySpent.toLocaleString()}</strong>. Remember, a stitch in time saves nine!&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowTallyModal(false)}
              className="mt-5 w-full py-2.5 bg-[#FFB703] text-[#1A1A1A] font-extrabold text-xs font-mono uppercase tracking-wider border-2 border-black neo-shadow-sm hover:bg-amber-400 active:translate-y-0.5 cursor-pointer"
            >
              Close Ticker Report
            </button>
          </div>
        </div>
      )}

      {/* 18. STICKY BULK ITEM ACTION DRAWER / TRAY */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-full max-w-xl px-4 animate-fade-in select-none">
          <div className="bg-[#FFB703] border-4 border-black p-4 shadow-[6px_6px_0px_0px_#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#1A1A1A]">
            <div className="flex items-center space-x-2">
              <span className="animate-ping w-2.5 h-2.5 bg-rose-600 rounded-full" />
              <div className="text-xs">
                <span className="font-extrabold text-[13px] tracking-tight uppercase block">⚡ BULK ACTION TRAY ACTIVE</span>
                <span className="font-mono font-extrabold bg-[#1A1A1A] text-[#FFB703] px-1.5 py-0.5 text-[10px]">
                  {selectedCount} rows selected
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Set category dropdown select list */}
              {selectColumnForKanban && (
                <div className="flex items-center space-x-1 border border-black bg-white px-2 py-1">
                  <span className="text-[9px] font-mono font-bold uppercase text-gray-500">SET TAG:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkChangeStatus(e.target.value);
                      }
                    }}
                    defaultValue=""
                    className="text-[10px] font-bold font-mono outline-none cursor-pointer bg-transparent"
                  >
                    <option value="" disabled>Choose...</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Backlog">Backlog</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold uppercase text-[10px] border-2 border-black shadow-xs cursor-pointer"
                title="Bulk delete selected rows"
              >
                <Trash className="w-3 h-3" />
                <span>Delete ({selectedCount})</span>
              </button>

              <button
                onClick={() => setSelectedRowIds({})}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-[10px] font-mono uppercase font-bold border border-black cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
