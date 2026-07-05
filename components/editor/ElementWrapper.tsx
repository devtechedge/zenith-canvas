'use client';

import { useState } from 'react';
import { GripVertical, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface ElementWrapperProps {
  id: string;
  sortOrder: number;
  onDelete: () => void;
  onAddBelow: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
  isLocked?: boolean;
}

export default function ElementWrapper({
  id,
  sortOrder,
  onDelete,
  onAddBelow,
  onMoveUp,
  onMoveDown,
  children,
  isLocked = false
}: ElementWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // HTML5 Drag and Drop handlers for block-based sorting
  const handleDragStart = (e: React.DragEvent) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/element-id', id);
    e.dataTransfer.setData('text/sort-order', sortOrder.toString());
    e.dataTransfer.effectAllowed = 'move';
    // Create a subtle drag preview if desired
  };

  return (
    <div
      onMouseEnter={() => !isLocked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-start w-full my-1 rounded border-2 transition-all ${
        isDraggingOver 
          ? 'border-emerald-500 bg-emerald-50/50' 
          : 'border-transparent hover:border-gray-200'
      }`}
    >
      {/* Sidebar Controls (Drag Handle & Add buttons) */}
      {!isLocked && (
        <div 
          className={`flex items-center space-x-0.5 pr-2 pl-1 select-none flex-shrink-0 transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: '64px', minHeight: '36px' }}
        >
          {/* HTML5 Drag Handle */}
          <div
            draggable={!isLocked}
            onDragStart={handleDragStart}
            className="p-1 border border-transparent hover:border-[#1A1A1A] hover:bg-white rounded cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#1A1A1A] transition-all"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Quick Insert Below */}
          <button
            onClick={onAddBelow}
            className="p-1 border border-transparent hover:border-[#1A1A1A] hover:bg-[#FFB703] text-gray-400 hover:text-[#1A1A1A] rounded transition-all"
            title="Insert block below"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 pr-4 py-1.5 ${isLocked ? 'pl-4' : ''}`}>
        {children}
      </div>

      {/* Block Utility Actions Menu */}
      {!isLocked && (
        <div 
          className={`absolute right-2 top-1.5 flex items-center space-x-1 transition-opacity duration-150 bg-[#F4F7F6]/90 px-1.5 py-0.5 border border-[#1A1A1A] neo-shadow-sm rounded ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {onMoveUp && (
            <button 
              onClick={onMoveUp}
              title="Move block up"
              className="p-0.5 hover:bg-white border border-transparent hover:border-[#1A1A1A] rounded text-gray-500 hover:text-[#1A1A1A]"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button 
              onClick={onMoveDown}
              title="Move block down"
              className="p-0.5 hover:bg-white border border-transparent hover:border-[#1A1A1A] rounded text-gray-500 hover:text-[#1A1A1A]"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={onDelete}
            title="Delete block"
            className="p-0.5 hover:bg-red-500 hover:text-white border border-transparent hover:border-[#1A1A1A] rounded text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
