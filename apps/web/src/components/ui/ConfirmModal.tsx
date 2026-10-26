'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Handle ESC key press
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    },
    [isLoading, onCancel],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-description"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) {
              onCancel();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full max-w-md rounded-2xl backdrop-blur-2xl bg-zinc-950/90 border border-white/10 ${
              isDanger
                ? 'shadow-[0_0_50px_rgba(239,68,68,0.2)]'
                : 'shadow-[0_0_50px_rgba(245,158,11,0.2)]'
            } p-6 overflow-hidden`}
          >
            {/* Top decorative gradient glow */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                isDanger
                  ? 'from-transparent via-red-500 to-transparent'
                  : 'from-transparent via-amber-400 to-transparent'
              } opacity-70`}
            />

            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  isDanger
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  id="confirm-modal-title"
                  className="text-lg font-bold text-white tracking-tight leading-snug"
                >
                  {title}
                </h3>
                <p
                  id="confirm-modal-description"
                  className="text-sm text-zinc-400 mt-2 leading-relaxed"
                >
                  {message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 text-sm font-semibold border border-zinc-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDanger
                    ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                }`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
