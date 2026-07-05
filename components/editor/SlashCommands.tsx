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
  ArrowUp
} from 'lucide-react';

export interface CommandItem {
  id: 'heading_1' | 'heading_2' | 'text' | 'todo' | 'callout' | 'code_sandbox' | 'collection_ref';
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
    id: 'todo',
    title: 'To-do List',
    description: 'Interactive checklist with check states',
    icon: CheckSquare,
  },
  {
    id: 'callout',
    title: 'Callout',
    description: 'High-contrast info callout container',
    icon: Info,
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
