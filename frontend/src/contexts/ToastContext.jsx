import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   ToastContext — ýeke-täk global bildiriş ulgamy
   ───────────────────────────────────────────────────────────
   const { toast, success, error, warning, info } = useToast();
   success('Ýatda saklandy');
   toast({ title, description, variant, duration, action });

   Awtomatiki ýapylýar (default 4.5s), hover-de durýar,
   stack limiti 4, `aria-live="polite"` bilen a11y.
   ═══════════════════════════════════════════════════════════ */

const ToastContext = createContext(null);

const MAX_TOASTS = 4;
const DEFAULT_DURATION = 4500;

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastProvider({ children, position = 'top' }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const seq = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (options) => {
      const opts = typeof options === 'string' ? { title: options } : options;
      const id = ++seq.current;

      const item = {
        id,
        variant: 'info',
        duration: DEFAULT_DURATION,
        title: '',
        description: '',
        action: null,
        ...opts,
      };

      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), item]);

      if (item.duration > 0) {
        const timer = setTimeout(() => dismiss(id), item.duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  /** Hover-de wagty duruzýar, çykanda dowam etdirýär */
  const pause = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const resume = useCallback((id, duration = 2000) => {
    if (timers.current.has(id)) return;
    timers.current.set(id, setTimeout(() => dismiss(id), duration));
  }, [dismiss]);

  const success = useCallback(
    (title, description, opts) => toast({ variant: 'success', title, description, ...opts }),
    [toast],
  );
  const error = useCallback(
    (title, description, opts) => toast({ variant: 'error', title, description, duration: 6500, ...opts }),
    [toast],
  );
  const warning = useCallback(
    (title, description, opts) => toast({ variant: 'warning', title, description, ...opts }),
    [toast],
  );
  const info = useCallback(
    (title, description, opts) => toast({ variant: 'info', title, description, ...opts }),
    [toast],
  );

  const dismissAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setToasts([]);
  }, []);

  const value = useMemo(
    () => ({ toast, success, error, warning, info, dismiss, dismissAll }),
    [toast, success, error, warning, info, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} onPause={pause} onResume={resume} position={position} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss, onPause, onResume, position }) {
  return (
    <div
      className={`toast-container${position === 'bottom' ? ' toast-container--bottom' : ''}`}
      role="region"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          onDismiss={() => onDismiss(t.id)}
          onPause={() => onPause(t.id)}
          onResume={() => onResume(t.id)}
        />
      ))}
    </div>
  );
}

function ToastCard({ toast: t, onDismiss, onPause, onResume }) {
  const Icon = ICONS[t.variant] || ICONS.info;

  return (
    <div
      className={`toast toast--${t.variant}`}
      role={t.variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
    >
      <span className="toast__icon"><Icon size={17} strokeWidth={2.2} /></span>

      <div className="toast__content">
        {t.title && <div className="toast__title">{t.title}</div>}
        {t.description && <div className="toast__desc">{t.description}</div>}
        {t.action && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ marginTop: 6, paddingLeft: 0, color: 'var(--text-accent)' }}
            onClick={() => { t.action.onClick?.(); onDismiss(); }}
          >
            {t.action.label}
          </button>
        )}
      </div>

      <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={15} />
      </button>

      {t.duration > 0 && (
        <span
          className="toast__progress"
          style={{
            width: '100%',
            color: `var(--${t.variant === 'info' ? 'info' : t.variant})`,
            animation: `fadeOut ${t.duration}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Provider ýok — sessiz no-op (komponent unit-testlerinde döwülmezligi üçin)
    const noop = () => {};
    return { toast: noop, success: noop, error: noop, warning: noop, info: noop, dismiss: noop, dismissAll: noop };
  }
  return ctx;
}
