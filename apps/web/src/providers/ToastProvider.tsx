'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { ToastContainer, ToastItem, ToastType } from '@/components/ui/Toast';

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextProps>({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [
        // Keep max 5 toasts visible at once
        ...prev.slice(-4),
        { id, message, type, duration },
      ]);
    },
    [],
  );

  const showSuccess = useCallback(
    (message: string, duration = 4000) => showToast(message, 'success', duration),
    [showToast],
  );

  const showError = useCallback(
    (message: string, duration = 4000) => showToast(message, 'error', duration),
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, duration = 4000) => showToast(message, 'warning', duration),
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, duration = 4000) => showToast(message, 'info', duration),
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
