'use client';

import { useState } from 'react';
import { Plus, Trash2, Filter, Settings, RefreshCw } from 'lucide-react';

export interface FilterRule {
  id: string;
  columnId: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'before' | 'after';
  value: string;
}

interface FilterEngineProps {
  columns: Array<{ id: string; name: string; type: string }>;
  filters: FilterRule[];
  onFiltersChange: (filters: FilterRule[]) => void;
  logicalOperator: 'AND' | 'OR';
  onLogicalOperatorChange: (op: 'AND' | 'OR') => void;
}

export default function FilterEngine({
  columns,
  filters,
  onFiltersChange,
  logicalOperator,
  onLogicalOperatorChange
}: FilterEngineProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddFilter = () => {
    if (columns.length === 0) return;
    const defaultColumn = columns[0];
    const newRule: FilterRule = {
      id: `filter-${Math.random().toString(36).substring(2, 9)}`,
      columnId: defaultColumn.id,
      operator: 'equals',
      value: '',
    };
    onFiltersChange([...filters, newRule]);
  };

  const handleUpdateRule = (id: string, updates: Partial<FilterRule>) => {
    onFiltersChange(
      filters.map(f => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveRule = (id: string) => {
    onFiltersChange(filters.filter(f => f.id !== id));
  };

  const handleReset = () => {
    onFiltersChange([]);
  };

  const getOperatorsForType = (type: string) => {
    switch (type) {
      case 'Number':
        return [
          { id: 'equals', label: 'Equals' },
          { id: 'gt', label: 'Greater Than (>)' },
          { id: 'lt', label: 'Less Than (<)' },
        ];
      case 'Date':
        return [
          { id: 'equals', label: 'On Date' },
          { id: 'before', label: 'Is Before' },
          { id: 'after', label: 'Is After' },
        ];
      case 'Select':
      case 'MultiSelect':
        return [
          { id: 'equals', label: 'Is' },
          { id: 'contains', label: 'Contains' },
        ];
      default:
        return [
          { id: 'equals', label: 'Equals' },
          { id: 'contains', label: 'Contains' },
        ];
    }
  };

  return (
    <div className="border-2 border-[#1A1A1A] bg-white p-3 rounded-none neo-shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 border-2 border-[#1A1A1A] bg-[#FFB703] text-xs font-bold uppercase tracking-wider rounded neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>AST Filter Engine ({filters.length})</span>
        </button>

        {filters.length > 0 && (
          <button 
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-2 py-1 text-[11px] border-2 border-red-500 hover:bg-red-500 hover:text-white rounded text-red-500 font-bold transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="pt-2 border-t border-gray-100 space-y-3">
          {/* Logical AST Toggle */}
          {filters.length > 1 && (
            <div className="flex items-center space-x-2 bg-[#F4F7F6] border border-[#1A1A1A] p-2 rounded">
              <span className="text-xs font-bold text-gray-500 uppercase font-mono">Match logical condition:</span>
              <button
                onClick={() => onLogicalOperatorChange('AND')}
                className={`px-2.5 py-0.5 border border-[#1A1A1A] text-xs font-bold rounded ${
                  logicalOperator === 'AND' 
                    ? 'bg-[#2D6A4F] text-white' 
                    : 'bg-white text-[#1A1A1A] hover:bg-gray-50'
                }`}
              >
                AND (All match)
              </button>
              <button
                onClick={() => onLogicalOperatorChange('OR')}
                className={`px-2.5 py-0.5 border border-[#1A1A1A] text-xs font-bold rounded ${
                  logicalOperator === 'OR' 
                    ? 'bg-[#2D6A4F] text-white' 
                    : 'bg-white text-[#1A1A1A] hover:bg-gray-50'
                }`}
              >
                OR (Any match)
              </button>
            </div>
          )}

          {/* Rules List */}
          {filters.length === 0 ? (
            <div className="text-center py-4 text-xs font-medium text-gray-400">
              No logical filter rules defined. Click &quot;Add Rule&quot; to compound parameters.
            </div>
          ) : (
            <div className="space-y-2">
              {filters.map((rule, index) => {
                const col = columns.find(c => c.id === rule.columnId) || columns[0];
                const operators = getOperatorsForType(col?.type || 'Text');

                return (
                  <div 
                    key={rule.id} 
                    className="flex items-center space-x-2 bg-[#F4F7F6] border-2 border-[#1A1A1A] p-2 rounded neo-shadow-sm"
                  >
                    {/* Index or Logical Join Label */}
                    <div className="w-12 text-center text-[10px] font-bold font-mono text-gray-400 uppercase">
                      {index === 0 ? 'Where' : logicalOperator}
                    </div>

                    {/* Column Select */}
                    <select
                      value={rule.columnId}
                      onChange={(e) => handleUpdateRule(rule.id, { columnId: e.target.value, operator: 'equals', value: '' })}
                      className="text-xs font-bold bg-white border-2 border-[#1A1A1A] px-2 py-1 outline-none"
                    >
                      {columns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    {/* Operator Select */}
                    <select
                      value={rule.operator}
                      onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as any })}
                      className="text-xs font-bold bg-white border-2 border-[#1A1A1A] px-2 py-1 outline-none"
                    >
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.label}</option>
                      ))}
                    </select>

                    {/* Value Field */}
                    <input
                      type={col?.type === 'Number' ? 'number' : col?.type === 'Date' ? 'date' : 'text'}
                      value={rule.value}
                      placeholder="Enter match parameter..."
                      onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                      className="flex-1 text-xs font-medium bg-white border-2 border-[#1A1A1A] px-2 py-1 outline-none font-sans"
                    />

                    {/* Remove Rule */}
                    <button
                      onClick={() => handleRemoveRule(rule.id)}
                      className="p-1 border-2 border-[#1A1A1A] hover:bg-red-500 hover:text-white transition-colors bg-white rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleAddFilter}
              className="flex items-center space-x-1 px-3 py-1 bg-[#2D6A4F] text-white border-2 border-[#1A1A1A] text-xs font-bold rounded neo-shadow-sm hover:bg-[#1b4332]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Compound Rule</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
