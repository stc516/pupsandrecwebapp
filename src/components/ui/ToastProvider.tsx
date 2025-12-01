import clsx from 'clsx';
import { nanoid } from 'nanoid';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type ToastTone = 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (toast: { message: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: { message: string; tone?: ToastTone }) => {
    const id = nanoid();
    const tone = toast.tone ?? 'success';
    setToasts((prev) => [...prev, { id, tone, message: toast.message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-[calc(5rem+var(--safe-area-bottom))] left-0 right-0 z-50 flex flex-col items-center gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              'w-full max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-card backdrop-blur',
              toast.tone === 'success'
                ? 'border-brand-border bg-white text-brand-primary'
                : 'border-red-200 bg-white text-red-600',
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

