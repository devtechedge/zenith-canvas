'use client';

import { useState, useMemo } from 'react';
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
  ArrowDown
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

  const [activeView, setActiveView] = useState<'grid' | 'kanban' | 'gallery'>('grid');
  
  // 2. Filter states
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');

  // Sorting and Aggregations states
  const [sortConfig, setSortConfig] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnAggregations, setColumnAggregations] = useState<Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>>({});

  const handleSortToggle = (colId: string) => {
    setSortConfig(current => {
      if (current?.columnId === colId) {
        if (current.direction === 'asc') {
          return { columnId: colId, direction: 'desc' };
        }
        return null; // Toggle off
      }
      return { columnId: colId, direction: 'asc' };
    });
  };

  // Parse schema columns
  const columns = useMemo(() => {
    if (!collectionTable?.schema) return [];
    try {
      return JSON.parse(collectionTable.schema) as Array<{ id: string; name: string; type: 'Text' | 'Number' | 'Select' | 'MultiSelect' | 'Date' }>;
    } catch {
      return [];
    }
  }, [collectionTable]);

  // Active Kanban Grouping column (must be of type 'Select', default to first Select column or any)
  const selectColumnForKanban = useMemo(() => {
    return columns.find(c => c.type === 'Select') || columns[0];
  }, [columns]);

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

  // 3. Client-side Filter AST Pipeline
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
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
  }, [rows, filters, logicalOperator]);

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

  // 4. Columns mutations
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

  const handleUpdateColumnType = async (colId: string, type: 'Text' | 'Number' | 'Select' | 'MultiSelect' | 'Date') => {
    if (!collectionTable) return;
    const newSchema = columns.map(c => c.id === colId ? { ...c, type } : c);
    await db.collections.update(tableId, { schema: JSON.stringify(newSchema) });
  };

  const handleDeleteColumn = async (colId: string) => {
    if (!collectionTable) return;
    const newSchema = columns.filter(c => c.id !== colId);
    await db.collections.update(tableId, { schema: JSON.stringify(newSchema) });
  };

  // 5. Rows mutations
  const handleAddRow = async () => {
    const initialCells: Record<string, any> = {};
    columns.forEach(col => {
      if (col.type === 'Number') initialCells[col.id] = 0;
      else if (col.type === 'Select') initialCells[col.id] = 'In Progress';
      else initialCells[col.id] = '';
    });
    // Highest sortOrder + 1
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
  };

  // 6. Aggregations Calculations in Footer
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

  return (
    <div className="space-y-4">
      {/* View Selector Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1A1A1A] pb-3 bg-white p-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveView('grid')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 border-[#1A1A1A] transition-all rounded ${
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
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 border-[#1A1A1A] transition-all rounded ${
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
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase border-2 border-[#1A1A1A] transition-all rounded ${
              activeView === 'gallery' 
                ? 'bg-[#2D6A4F] text-white neo-shadow-sm' 
                : 'bg-white text-[#1A1A1A] hover:bg-gray-100'
            }`}
          >
            <GalleryIcon className="w-3.5 h-3.5" />
            <span>Gallery Card Grid</span>
          </button>
        </div>

        <button
          onClick={handleAddRow}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase bg-[#FFB703] border-2 border-[#1A1A1A] neo-shadow-sm rounded hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Record</span>
        </button>
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
        <div className="overflow-x-auto border-2 border-[#1A1A1A] bg-white rounded-none neo-shadow-sm">
          <table className="w-full text-left border-collapse table-fixed min-w-[600px]">
            {/* Headers */}
            <thead className="bg-[#F4F7F6] border-b-2 border-[#1A1A1A] text-xs font-bold font-mono">
              <tr>
                {columns.map(col => {
                  const isSorted = sortConfig?.columnId === col.id;
                  return (
                    <th key={col.id} className="p-2 border-r-2 border-[#1A1A1A] relative group/header min-w-[150px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <button 
                            type="button"
                            onClick={() => handleSortToggle(col.id)}
                            className={`p-0.5 rounded border border-transparent hover:border-gray-300 hover:bg-white text-gray-400 hover:text-[#1A1A1A] transition-all flex items-center justify-center mr-1 ${isSorted ? 'text-[#FFB703]' : ''}`}
                            title="Toggle column sort"
                          >
                            {isSorted ? (
                              sortConfig?.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {col.type === 'Number' && <Hash className="w-3 h-3 text-gray-500" />}
                          {col.type === 'Date' && <Calendar className="w-3 h-3 text-gray-500" />}
                          {col.type === 'Text' && <TextIcon className="w-3 h-3 text-gray-500" />}
                          {col.type === 'Select' && <Check className="w-3 h-3 text-gray-500" />}
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => handleUpdateColumnName(col.id, e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-[#1A1A1A] focus:bg-white px-1 rounded max-w-[100px]"
                          />
                        </div>

                      {/* Header utilities (Type transformer & deleter) */}
                      <div className="flex items-center space-x-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
                        <select
                          value={col.type}
                          onChange={(e) => handleUpdateColumnType(col.id, e.target.value as any)}
                          className="text-[9px] border border-gray-300 rounded p-0.5 bg-white outline-none"
                        >
                          <option value="Text">Text</option>
                          <option value="Number">Num</option>
                          <option value="Select">Select</option>
                          <option value="Date">Date</option>
                        </select>
                        <button
                          onClick={() => handleDeleteColumn(col.id)}
                          className="p-0.5 hover:bg-red-100 text-red-500 rounded"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </th>
                );})}
                {/* Column addition trigger */}
                <th className="p-2 w-12 text-center">
                  <button
                    onClick={handleAddColumn}
                    className="p-1 border-2 border-[#1A1A1A] bg-[#FFB703] rounded-none hover:bg-amber-400"
                    title="Add column"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </th>
              </tr>
            </thead>

            {/* Rows */}
            <tbody className="divide-y-2 divide-[#1A1A1A] text-xs">
              {sortedAndFilteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-gray-400 font-medium">
                    No matching grid rows found. Add a record to start.
                  </td>
                </tr>
              ) : (
                sortedAndFilteredRows.map(row => {
                  let cellData: Record<string, any> = {};
                  try {
                    cellData = JSON.parse(row.cells);
                  } catch {}

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      {columns.map(col => {
                        const val = cellData[col.id] || '';
                        return (
                          <td key={col.id} className="p-1 border-r-2 border-[#1A1A1A] align-middle">
                            {col.type === 'Select' ? (
                              <div className={`border border-[#1A1A1A] px-1.5 py-0.5 font-bold text-[10px] uppercase inline-flex rounded-none transition-colors ${
                                val === 'Completed' || val === 'Low' ? 'bg-[#D8F3DC] text-[#1B4332]' :
                                val === 'In Progress' || val === 'Medium' ? 'bg-[#CAF0F8] text-[#03045E]' :
                                val === 'High' ? 'bg-[#FFCCD5] text-[#A70000]' :
                                'bg-[#FFE5EC] text-[#590D22]'
                              }`}>
                                <select
                                  value={val}
                                  onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                  className="bg-transparent outline-none p-0.5 rounded font-black uppercase text-[10px] cursor-pointer"
                                >
                                  <option value="Backlog" className="bg-white text-gray-700 font-sans">Backlog</option>
                                  <option value="In Progress" className="bg-white text-gray-700 font-sans">In Progress</option>
                                  <option value="Completed" className="bg-white text-gray-700 font-sans">Completed</option>
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
                                className="w-full bg-transparent outline-none border-none p-1 font-sans focus:bg-white rounded"
                              />
                            )}
                          </td>
                        );
                      })}
                      {/* Delete Row Cell */}
                      <td className="p-1 text-center">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 hover:bg-red-500 hover:text-white rounded border border-transparent hover:border-[#1A1A1A]"
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
              <tfoot className="bg-[#F4F7F6] border-t-4 border-[#1A1A1A] font-mono text-[10px]">
                <tr className="divide-x-2 divide-[#1A1A1A]">
                  {columns.map(col => {
                    const currentType = columnAggregations[col.id] || (col.type === 'Number' ? 'sum' : 'count');
                    const aggData = aggregations[col.id] || { value: '-', type: 'none' };
                    return (
                      <td key={col.id} className="p-2 text-gray-500 font-bold space-y-2 bg-[#FAFBFA]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Calculator className="w-3 h-3" />
                            <span>AGGREGATION</span>
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
                        <div className="text-xs text-[#1A1A1A] font-black tracking-tight">
                          <span className="uppercase text-[9px] text-emerald-800 font-extrabold mr-1 bg-emerald-100 px-1 py-0.5 rounded">
                            {aggData.type}:
                          </span>
                          <span>{aggData.value}</span>
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

      {/* KANBAN BOARD VIEW */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectOptionsForKanban.map(lane => {
            const laneRows = filteredRows.filter(row => {
              try {
                const cells = JSON.parse(row.cells);
                return cells[selectColumnForKanban?.id] === lane;
              } catch {
                return false;
              }
            });

            return (
              <div 
                key={lane} 
                className="border-2 border-[#1A1A1A] bg-white rounded-none neo-shadow-sm flex flex-col min-h-[400px]"
                onDragOver={handleKanbanDragOver}
                onDrop={(e) => handleKanbanDrop(e, lane)}
              >
                {/* Lane Header */}
                <div className="p-3 border-b-2 border-[#1A1A1A] bg-[#F4F7F6] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold uppercase font-mono bg-white border border-[#1A1A1A] px-2 py-0.5 rounded-none neo-shadow-sm">
                      {laneRows.length}
                    </span>
                    <h3 className="text-sm font-black text-[#1A1A1A]">{lane}</h3>
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
                    className="p-1 border border-[#1A1A1A] bg-[#FFB703] hover:bg-amber-400 rounded-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards List */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {laneRows.length === 0 ? (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-none flex items-center justify-center text-xs text-gray-400 font-medium">
                      Drag cards here
                    </div>
                  ) : (
                    laneRows.map(row => {
                      let cells: Record<string, any> = {};
                      try {
                        cells = JSON.parse(row.cells);
                      } catch {}

                      return (
                        <div
                          key={row.id}
                          draggable
                          onDragStart={(e) => handleKanbanDragStart(e, row.id)}
                          className="bg-[#F4F7F6] border-2 border-[#1A1A1A] neo-shadow-sm p-3 rounded-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-grab active:cursor-grabbing transition-all space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-extrabold text-xs text-[#1A1A1A] line-clamp-2">
                              {cells[columns[1]?.id] || cells[columns[0]?.id] || 'Unnamed card'}
                            </span>
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 hover:text-red-500 rounded transition-all text-gray-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Extra Fields metadata list */}
                          <div className="space-y-1 pt-1.5 border-t border-gray-200 text-[10px] font-mono text-gray-500">
                            {columns.slice(2).map(col => {
                              const v = cells[col.id];
                              if (!v) return null;
                              return (
                                <div key={col.id} className="flex justify-between items-center">
                                  <span className="uppercase">{col.name}:</span>
                                  <span className="font-bold text-[#1A1A1A]">{v}</span>
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
      )}

      {/* GALLERY CARD GRID VIEW */}
      {activeView === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRows.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-gray-300 p-12 text-center text-sm font-medium text-gray-400 bg-white">
              No matching records to display in Gallery.
            </div>
          ) : (
            filteredRows.map(row => {
              let cells: Record<string, any> = {};
              try {
                cells = JSON.parse(row.cells);
              } catch {}

              const title = cells[columns[1]?.id] || cells[columns[0]?.id] || 'Untitled Item';
              // Set background seed based on title hash code
              const bgSeed = encodeURIComponent(title.substring(0, 5));

              return (
                <div 
                  key={row.id}
                  className="border-2 border-[#1A1A1A] bg-white rounded-none neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col overflow-hidden group"
                >
                  {/* Card Cover */}
                  <div className="h-32 bg-slate-100 border-b-2 border-[#1A1A1A] relative">
                    <img 
                      src={`https://picsum.photos/seed/${bgSeed}/400/200`} 
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 border border-[#1A1A1A] bg-white text-red-500 hover:bg-red-500 hover:text-white rounded"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-[#1A1A1A] line-clamp-1">{title}</h4>
                      <p className="text-[10px] font-mono text-[#2D6A4F] uppercase font-extrabold mt-0.5">
                        {cells[selectColumnForKanban?.id] || 'No Group'}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-gray-100 text-[11px] font-mono">
                      {columns.map(col => {
                        const val = cells[col.id];
                        if (col.id === columns[1]?.id || col.id === columns[0]?.id || col.id === selectColumnForKanban?.id) return null;
                        if (!val) return null;

                        return (
                          <div key={col.id} className="flex justify-between gap-2 text-gray-500">
                            <span className="uppercase text-gray-400 font-bold">{col.name}:</span>
                            <span className="font-extrabold text-[#1A1A1A] truncate max-w-[120px]">{val}</span>
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
    </div>
  );
}
