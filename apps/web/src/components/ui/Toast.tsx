'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const toastConfig: Record<
  ToastType,
  { icon: React.ReactNode; borderColor: string; glowColor: string; iconColor: string; label: string }
> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    borderColor: 'border-cyan-500/30',
    glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    iconColor: 'text-cyan-400',
    label: 'Success',
  },
  error: {
    icon: <XCircle size={18} />,
    borderColor: 'border-red-500/30',
    glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    iconColor: 'text-red-400',
    label: 'Error',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    borderColor: 'border-yellow-500/30',
    glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
    iconColor: 'text-yellow-400',
    label: 'Warning',
  },
  info: {
    icon: <Info size={18} />,
    borderColor: 'border-zinc-500/30',
    glowColor: 'shadow-[0_0_20px_rgba(113,113,122,0.15)]',
    iconColor: 'text-zinc-400',
    label: 'Info',
  },
};

function ToastNotification({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const config = toastConfig[toast.type];

  useEffect(() => {
    // Trigger slide-in animation on mount
    const showTimer = setTimeout(() => setVisible(true), 10);

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, toast.duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.duration]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl
        min-w-[300px] max-w-[420px] cursor-pointer select-none
        transition-all duration-300 ease-out
        ${config.borderColor}
        ${config.glowColor}
        ${visible && !exiting
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full'
        }
      `}
      style={{ background: 'rgba(18, 18, 24, 0.95)' }}
      onClick={handleDismiss}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        {config.icon}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 leading-snug break-words">
          {toast.message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] rounded-b-xl ${
          toast.type === 'success'
            ? 'bg-cyan-500'
            : toast.type === 'error'
            ? 'bg-red-500'
            : toast.type === 'warning'
            ? 'bg-yellow-500'
            : 'bg-zinc-500'
        }`}
        style={{
          animation: `shrink ${toast.duration}ms linear forwards`,
          width: '100%',
        }}
      />

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto relative overflow-hidden">
          <ToastNotification toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
