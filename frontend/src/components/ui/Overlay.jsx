import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '../../lib/hooks';
import { Button } from './Button';

/* ═══════════════════════════════════════════════════════════
   Overlay — Modal · Drawer · ConfirmDialog
   ───────────────────────────────────────────────────────────
   Hemmesi `createPortal` bilen <body>-a goşulýar (z-index/overflow
   problem-leriniň öňüni alýar), focus-trap + Escape + scroll-lock
   + backdrop-click goldaýar.

   AUDIT.md F25: öňki modallarda focus trap we Escape ýokdy.
   ═══════════════════════════════════════════════════════════ */

const usePortal = () => {
  const [el] = useState(() => (typeof document === 'undefined' ? null : document.createElement('div')));

  useEffect(() => {
    if (!el) return undefined;
    el.setAttribute('data-overlay-root', '');
    document.body.appendChild(el);
    return () => { el.remove(); };
  }, [el]);

  return el;
};

/* ─── Modal ───────────────────────────────────────────────── */
export function Modal({
  open = false,
  onClose,
  title,
  subtitle,
  size = 'md',              // sm | md | lg | xl | full
  footer,
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showClose = true,
  initialFocus,
}) {
  const portal = usePortal();
  // `initialFocus` berlen bolsa trap-yň awto-focusyny öçürýäris we
  // görkezilen elementi özümiz fokuslaýarys (a11y: forma açylanda
  // birinji meýdana düşmeli).
  const trapRef = useFocusTrap(open, !initialFocus);
  useLockBodyScroll(open);
  useEscapeKey(() => closeOnEscape && onClose?.(), open && closeOnEscape);

  useEffect(() => {
    if (!open || !initialFocus) return undefined;
    const raf = requestAnimationFrame(() => {
      const el = typeof initialFocus === 'string'
        ? document.querySelector(initialFocus)
        : (initialFocus?.current ?? initialFocus);
      el?.focus?.({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, initialFocus]);

  if (!open || !portal) return null;

  const handleBackdrop = (e) => {
    // Diňe backdrop-yň özüne basylanda ýapýarys (içindäki element däl)
    if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div className="modal-backdrop" onMouseDown={handleBackdrop} role="presentation">
      <div
        ref={trapRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        {(title || showClose) && (
          <header className="modal-header">
            <div style={{ minWidth: 0 }}>
              {title && <h2 className="modal-title" id="modal-title">{title}</h2>}
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
            {showClose && (
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close dialog">
                <X size={17} />
              </button>
            )}
          </header>
        )}

        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    portal,
  );
}

/* ─── Drawer ──────────────────────────────────────────────── */
export function Drawer({
  open = false,
  onClose,
  title,
  subtitle,
  placement = 'right',      // left | right | bottom
  footer,
  children,
  closeOnBackdrop = true,
}) {
  const portal = usePortal();
  const trapRef = useFocusTrap(open);
  useLockBodyScroll(open);
  useEscapeKey(() => onClose?.(), open);

  if (!open || !portal) return null;

  return createPortal(
    <>
      <div
        className="drawer-backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
        role="presentation"
      />
      <aside
        ref={trapRef}
        className={`drawer drawer--${placement}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Panel'}
      >
        <header className="drawer__header">
          <div style={{ minWidth: 0 }}>
            {title && <h2 className="modal-title">{title}</h2>}
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close panel">
            <X size={17} />
          </button>
        </header>

        <div className="drawer__body">{children}</div>
        {footer && <footer className="drawer__footer">{footer}</footer>}
      </aside>
    </>,
    portal,
  );
}

/* ─── ConfirmDialog ───────────────────────────────────────── */
export function ConfirmDialog({
  open = false,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',       // danger | primary
  loading = false,
  children,
}) {
  const handle = async () => {
    try {
      await onConfirm?.();
    } finally {
      // onConfirm özi ýapmasa, biz ýapýarys
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      showClose={!loading}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant} onClick={handle} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    >
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        {variant === 'danger' && (
          <span
            style={{
              display: 'grid', placeItems: 'center', width: 40, height: 40, flex: 'none',
              borderRadius: 'var(--radius-full)', background: 'var(--error-bg)', color: 'var(--error-text)',
            }}
            aria-hidden="true"
          >
            <AlertTriangle size={19} />
          </span>
        )}
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
          {description && <p>{description}</p>}
          {children}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Popover / Dropdown (trigger + menu) ─────────────────── */
export function Dropdown({
  trigger,
  children,
  align = 'right',
  width = 220,
  className = '',
  onOpenChange,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  // Daşyna basylanda ýap
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} className={className}>
      {typeof trigger === 'function'
        ? trigger({ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) })
        : <span onClick={() => setOpen((v) => !v)} role="presentation">{trigger}</span>}

      {open && (
        <div
          ref={menuRef}
          className={`dropdown ${align === 'left' ? 'dropdown--left' : ''}`}
          style={{
            top: 'calc(100% + 6px)',
            [align === 'left' ? 'left' : 'right']: 0,
            width,
            transformOrigin: align === 'left' ? 'top left' : 'top right',
          }}
          role="menu"
        >
          {typeof children === 'function'
            ? children({ close: () => setOpen(false) })
            : children}
        </div>
      )}
    </div>
  );
}

export const DropdownItem = ({ icon: Icon, children, danger = false, hint, onClick, ...rest }) => (
  <button
    type="button"
    className={`dropdown__item ${danger ? 'dropdown__item--danger' : ''}`}
    role="menuitem"
    onClick={onClick}
    {...rest}
  >
    {Icon && <Icon size={15} aria-hidden="true" />}
    <span style={{ flex: 1, minWidth: 0 }} className="truncate">{children}</span>
    {hint && <span className="dropdown__item__hint">{hint}</span>}
  </button>
);

export const DropdownLabel = ({ children }) => <div className="dropdown__label">{children}</div>;
export const DropdownSeparator = () => <div className="dropdown__sep" role="separator" />;
