import React, { createContext, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface ToastMessage {
  id: string;
  text: string;
  isError?: boolean;
}

interface ToastContextValue {
  toast: ToastMessage | null;
  showToast: (text: string, isError?: boolean) => void;
  clearToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const showToast = (text: string, isError = false) => {
    setToast({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      isError,
    });
  };

  const clearToast = () => setToast(null);

  React.useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ toast, showToast, clearToast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-end px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              aria-live={toast.isError ? 'assertive' : 'polite'}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10, scale: 0.98 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className={`pointer-events-auto rounded border px-4 py-3 text-xs font-bold shadow-lg ${
                toast.isError
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-slate-950 bg-slate-900 text-white'
              }`}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
