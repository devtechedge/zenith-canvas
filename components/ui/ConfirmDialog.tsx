'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative max-w-md w-full bg-white border-4 border-[#1A1A1A] neo-shadow p-6 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 border-2 border-[#1A1A1A] bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-[#1A1A1A] leading-tight">
                {title}
              </h3>
              <p className="text-xs font-mono font-bold text-gray-400 mt-0.5">
                destructive action
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm font-medium text-gray-700 leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 border-2 border-[#1A1A1A] bg-white hover:bg-gray-100 font-bold uppercase text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2 border-2 border-[#1A1A1A] bg-red-500 text-white neo-shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-bold uppercase text-xs cursor-pointer"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
