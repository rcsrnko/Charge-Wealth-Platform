import { useState, createContext, useContext, useCallback, ReactNode } from 'react';
import styles from './Toast.module.css';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showError: (message: string, action?: Toast['action']) => void;
  showSuccess: (message: string) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);
    setTimeout(() => hideToast(id), duration);
  }, [hideToast]);

  const showError = useCallback((message: string, action?: Toast['action']) => {
    showToast({ message, type: 'error', action });
  }, [showToast]);

  const showSuccess = useCallback((message: string) => {
    showToast({ message, type: 'success' });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, hideToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]}`}
          >
            <div className={styles.toastIcon}>
              {toast.type === 'error' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
              {toast.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
              {toast.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </div>
            <span className={styles.toastMessage}>{toast.message}</span>
            {toast.action && (
              <button
                className={styles.toastAction}
                onClick={() => {
                  toast.action?.onClick();
                  hideToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              className={styles.toastClose}
              onClick={() => hideToast(toast.id)}
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
