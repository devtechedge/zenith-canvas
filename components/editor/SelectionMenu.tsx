'use client';

import { useEffect, useRef } from 'react';
import { Bold, Italic, Code, Highlighter, Trash2 } from 'lucide-react';

interface SelectionMenuProps {
  position: { top: number; left: number };
  onApplyFormat: (format: 'bold' | 'italic' | 'code' | 'highlight') => void;
  onDeleteElement: () => void;
  onClose: () => void;
}

export default function SelectionMenu({ position, onApplyFormat, onDeleteElement, onClose }: SelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 flex items-center space-x-0.5 bg-[#F4F7F6] border-2 border-[#1A1A1A] neo-shadow rounded-none p-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      <button
        onClick={() => onApplyFormat('bold')}
        className="p-1.5 hover:bg-white border border-transparent hover:border-[#1A1A1A] rounded text-[#1A1A1A] transition-all"
        title="Bold (**text**)"
      >
        <Bold className="w-3.5 h-3.5 font-bold" />
      </button>

      <button
        onClick={() => onApplyFormat('italic')}
        className="p-1.5 hover:bg-white border border-transparent hover:border-[#1A1A1A] rounded text-[#1A1A1A] transition-all"
        title="Italic (*text*)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onApplyFormat('code')}
        className="p-1.5 hover:bg-white border border-transparent hover:border-[#1A1A1A] rounded text-[#1A1A1A] transition-all"
        title="Inline Code (`code`)"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onApplyFormat('highlight')}
        className="p-1.5 hover:bg-white border border-transparent hover:border-[#1A1A1A] rounded text-[#1A1A1A] transition-all"
        title="Highlight (::text::)"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-[#1A1A1A] mx-1" />

      <button
        onClick={onDeleteElement}
        className="p-1.5 hover:bg-red-500 hover:text-white border border-transparent hover:border-[#1A1A1A] rounded text-red-500 transition-all"
        title="Delete Block"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
