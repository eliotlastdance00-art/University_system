import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { gradientFor, initials as toInitials } from '../../lib/format';

/* ═══════════════════════════════════════════════════════════
   Primitives — kiçi, gaýtadan ulanylýan UI bölekleri
   ═══════════════════════════════════════════════════════════ */

/* ─── Badge ───────────────────────────────────────────────── */
const BADGE_TONE = {
  primary: 'badge-primary', success: 'badge-success', warning: 'badge-warning',
  error: 'badge-error', info: 'badge-info', neutral: 'badge-neutral',
};

export function Badge({
  tone = 'neutral', icon: Icon, dot = false, soft = false, size = 'md', children, className = '', ...rest
}) {
  const cls = [
    'badge',
    BADGE_TONE[tone] || BADGE_TONE.neutral,
    dot ? 'badge--dot' : '',
    soft ? 'badge--soft' : '',
    size === 'lg' ? 'badge--lg' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={cls} {...rest}>
      {Icon && <Icon size={12} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Status tekstinden ("present", "active", …) ton awtomatik saýlaýar */
const STATUS_TONE = {
  active: 'success', present: 'success', held: 'success', completed: 'success',
  sent: 'success', read: 'neutral', published: 'success', open: 'success',
  inactive: 'neutral', absent: 'error', failed: 'error', cancelled: 'error',
  unread: 'primary', draft: 'warning', pending: 'warning', processing: 'info',
  late: 'warning', excused: 'info', scheduled: 'info', closed: 'neutral',
};

export function StatusBadge({ status, label, tone, ...rest }) {
  const key = String(status || '').toLowerCase().replace(/[\s-]/g, '');
  return (
    <Badge tone={tone || STATUS_TONE[key] || 'neutral'} dot {...rest}>
      {label || status}
    </Badge>
  );
}

/* ─── Avatar ──────────────────────────────────────────────── */
const AVATAR_SIZE = { xs: 'avatar--xs', sm: 'avatar--sm', md: 'avatar--md', lg: 'avatar--lg', xl: 'avatar--xl', '2xl': 'avatar--2xl' };

export function Avatar({
  name, email, src, size = 'md', square = false, presence, stableKey, className = '', ...rest
}) {
  const [failed, setFailed] = useState(false);
  const key = stableKey || name || email || src || '?';

  return (
    <span
      className={`avatar ${AVATAR_SIZE[size] || ''} ${square ? 'avatar--square' : ''} ${className}`}
      style={src && !failed ? undefined : { background: gradientFor(key) }}
      aria-hidden={rest['aria-label'] ? undefined : 'true'}
      {...rest}
    >
      {src && !failed
        ? <img src={src} alt="" onError={() => setFailed(true)} />
        : toInitials(name, email)}
      {presence && <span className="avatar__presence" style={{ background: `var(--${presence})` }} />}
    </span>
  );
}

export function AvatarStack({ people = [], max = 4, size = 'sm' }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <span className="avatar-stack">
      {shown.map((p, i) => (
        <Avatar key={p.id ?? `${p.name || p.email}-${i}`} name={p.name || p.full_name} email={p.email} size={size} />
      ))}
      {extra > 0 && (
        <span className={`avatar ${AVATAR_SIZE[size] || ''}`} style={{ background: 'var(--bg-sunken)', color: 'var(--text-muted)' }}>
          +{extra}
        </span>
      )}
    </span>
  );
}

/* ─── Spinner / Skeleton ──────────────────────────────────── */
export const Spinner = ({ size = 'md', inverse = false, className = '' }) => (
  <span
    className={`spinner ${size === 'lg' ? 'spinner--lg' : ''} ${size === 'sm' ? 'spinner--sm' : ''} ${inverse ? 'spinner--inverse' : ''} ${className}`}
    role="status"
    aria-label="Loading"
  />
);

export const Skeleton = ({ className = '', style, width, height }) => (
  <div className={`skeleton ${className}`} style={{ width, height, ...style }} aria-hidden="true" />
);

export function SkeletonTable({ rows = 6, cols = 4 }) {
  return (
    <div className="table-container" aria-hidden="true">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton width={70 + ((i * 23) % 50)} height={10} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><Skeleton width={`${55 + ((r * 13 + c * 29) % 40)}%`} height={12} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const SkeletonCards = ({ count = 4 }) => (
  <div className="grid grid-4">
    {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="skeleton-card" />)}
  </div>
);

/* ─── Card ────────────────────────────────────────────────── */
export function Card({ hover = false, flat = false, className = '', children, ...rest }) {
  return (
    <section
      className={`card ${hover ? 'card--hover' : ''} ${flat ? 'card--flat' : ''} ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <header className="card__header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
        {Icon && (
          <span className="stat-card__icon" style={{ width: 34, height: 34 }}>
            <Icon size={17} aria-hidden="true" />
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <h3 className="card__title truncate">{title}</h3>
          {subtitle && <p className="card__subtitle truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 'none' }}>{actions}</div>}
    </header>
  );
}

export const CardBody = ({ className = '', children, ...rest }) => (
  <div className={`card__body ${className}`} {...rest}>{children}</div>
);

export const CardFooter = ({ between = false, className = '', children, ...rest }) => (
  <div className={`card__footer ${between ? 'modal-footer--between' : ''} ${className}`} {...rest}>{children}</div>
);

/* ─── StatCard ────────────────────────────────────────────── */
export function StatCard({
  label, value, icon: Icon, tone = 'accent', delta, hint, onClick, delay = 0, suffix,
  as: Component, ...rest
}) {
  // `as={Link} to="…"` ýa-da `onClick` → interaktiv; ýogsa ýönekeý <div>
  const Wrapper = Component || (onClick ? 'button' : 'div');
  const interactive = !!onClick || !!Component;
  const toneVar = tone === 'accent' ? 'var(--accent-soft)' : `var(--${tone}-bg)`;
  const toneColor = tone === 'accent' ? 'var(--text-accent)' : `var(--${tone}-text)`;

  const deltaTone = delta == null || Number.isNaN(Number(delta))
    ? 'flat'
    : Number(delta) > 0 ? 'up' : Number(delta) < 0 ? 'down' : 'flat';

  return (
    <Wrapper
      className={`stat-card ${interactive ? 'stat-card--interactive' : ''}`}
      onClick={onClick}
      style={{
        animation: `slideUp 0.45s var(--ease-out) ${delay}ms both`,
        cursor: interactive ? 'pointer' : undefined,
        textAlign: interactive ? 'left' : undefined,
        width: '100%',
      }}
      type={onClick && !Component ? 'button' : undefined}
      {...rest}
    >
      <div className="stat-card__head">
        <div style={{ minWidth: 0 }}>
          <div className="stat-label truncate">{label}</div>
          <div className="stat-value" style={{ marginTop: 4 }}>
            {value}
            {suffix && <span style={{ fontSize: 'var(--font-lg)', marginLeft: 2 }}>{suffix}</span>}
          </div>
        </div>
        {Icon && (
          <span className="stat-card__icon" style={{ background: toneVar, color: toneColor }}>
            <Icon size={19} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>

      {(delta != null || hint) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {delta != null && (
            <span className={`stat-delta stat-delta--${deltaTone}`}>
              {Number(delta) > 0 ? '+' : ''}{delta}%
            </span>
          )}
          {hint && <span className="text-xs text-muted truncate">{hint}</span>}
        </div>
      )}
    </Wrapper>
  );
}

/* ─── Empty / error states ────────────────────────────────── */
export function EmptyState({ icon: Icon = Info, title, description, actions, compact = false }) {
  return (
    <div className="empty-state" style={compact ? { padding: 'var(--space-8) var(--space-4)' } : undefined}>
      <span className="empty-state-icon"><Icon size={26} strokeWidth={1.7} aria-hidden="true" /></span>
      {title && <p className="empty-state-title">{title}</p>}
      {description && <p className="empty-state-text">{description}</p>}
      {actions && <div className="empty-state-actions">{actions}</div>}
    </div>
  );
}

const ALERT_ICON = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: AlertCircle };

export function Alert({ variant = 'info', title, children, onClose, icon: Icon, className = '' }) {
  const AlertIcon = Icon || ALERT_ICON[variant] || Info;

  return (
    <div className={`alert alert--${variant} ${className}`} role={variant === 'error' ? 'alert' : 'status'}>
      <AlertIcon size={16} strokeWidth={2.2} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div className="alert__title">{title}</div>}
        {children}
      </div>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Dismiss">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

/* ─── Progress ────────────────────────────────────────────── */
export function Progress({ value = 0, max = 100, tone, size = 'md', showLabel = false, label }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (Number(value) / max) * 100)) : 0;
  const autoTone = tone || (pct >= 75 ? 'success' : pct >= 45 ? 'warning' : 'error');

  return (
    <div
      className={`progress ${size === 'sm' ? 'progress--sm' : ''} ${size === 'lg' ? 'progress--lg' : ''}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`progress__bar ${tone || autoTone ? `progress__bar--${tone || autoTone}` : ''}`}
        style={{ width: `${pct}%` }}
      />
      {showLabel && <span className="sr-only">{Math.round(pct)}%</span>}
    </div>
  );
}

export function ProgressRow({ label, value, max = 100, tone, formatter }) {
  const pct = max > 0 ? (Number(value) / max) * 100 : 0;
  return (
    <div className="progress-row">
      <div className="progress-row__head">
        <span className="text-secondary">{label}</span>
        <span className="font-semibold tabular-nums">
          {formatter ? formatter(value, pct) : `${Math.round(pct)}%`}
        </span>
      </div>
      <Progress value={value} max={max} tone={tone} />
    </div>
  );
}

/* ─── Ring (circular progress) ────────────────────────────── */
export function Ring({ value = 0, max = 100, size = 96, stroke = 8, color = 'var(--accent-primary)', caption, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(100, Math.max(0, (Number(value) / max) * 100)) : 0;

  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label || `${Math.round(pct)}%`}>
      <svg width={size} height={size} aria-hidden="true">
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="ring__fill"
          cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <span className="ring__label" style={{ fontSize: size * 0.22 }}>{Math.round(pct)}%</span>
      {caption && <span className="ring__caption">{caption}</span>}
    </div>
  );
}

/* ─── Bar chart (pure CSS) ────────────────────────────────── */
export function BarChart({ data = [], max, formatValue = (v) => v }) {
  const peak = max ?? Math.max(1, ...data.map((d) => Number(d.value) || 0));

  return (
    <div className="bar-chart" role="list">
      {data.map((d, i) => {
        const pct = peak > 0 ? (Number(d.value) / peak) * 100 : 0;
        return (
          <div className="bar-chart__row" key={d.label ?? i} role="listitem">
            <div className="bar-chart__head">
              <span className="bar-chart__label">{d.label}</span>
              <span className="bar-chart__value">{formatValue(d.value, d)}</span>
            </div>
            <div className="bar-chart__track">
              <div
                className="bar-chart__fill"
                style={{
                  width: `${pct}%`,
                  background: d.color || 'var(--gradient-accent)',
                  animationDelay: `${i * 55}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Sparkline ───────────────────────────────────────────── */
export function Sparkline({ values = [], height = 34 }) {
  const peak = Math.max(1, ...values.map(Number));
  return (
    <div className="spark" style={{ height }} aria-hidden="true">
      {values.map((v, i) => (
        <span key={i} className="spark__bar" style={{ height: `${Math.max(6, (Number(v) / peak) * 100)}%` }} />
      ))}
    </div>
  );
}

/* ─── Key-value list ──────────────────────────────────────── */
export function KVList({ items = [] }) {
  return (
    <dl className="kv-list">
      {items.filter(Boolean).map((it, i) => (
        <div className="kv-row" key={it.key ?? i}>
          <dt className="kv-row__key">{it.label}</dt>
          <dd className="kv-row__val">{it.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ─── Timeline ────────────────────────────────────────────── */
export function Timeline({ items = [] }) {
  return (
    <ol className="timeline">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <li className="timeline__item" key={it.id ?? i}>
            <span className="timeline__dot" style={it.color ? { color: it.color, background: 'var(--bg-glass)' } : undefined}>
              {Icon ? <Icon size={14} strokeWidth={2.2} aria-hidden="true" /> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />}
            </span>
            <div className="timeline__content">
              <div className="timeline__title">{it.title}</div>
              {it.meta && <div className="timeline__meta">{it.meta}</div>}
              {it.children}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ─── Divider / section title ─────────────────────────────── */
export const Divider = ({ label, className = '' }) => (
  label
    ? <div className={`divider divider--label ${className}`}>{label}</div>
    : <div className={`divider ${className}`} />
);

export const SectionTitle = ({ children, icon: Icon, className = '' }) => (
  <h2 className={`section-title ${className}`}>
    {Icon && <Icon size={13} strokeWidth={2.4} aria-hidden="true" />}
    {children}
  </h2>
);

/* ─── Tooltip (CSS-based, no portal — ýeňil) ──────────────── */
export function Tooltip({ label, placement = 'top', children, className = '' }) {
  const [open, setOpen] = useState(false);
  if (!label) return children;

  return (
    <span
      className={`tooltip-trigger ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && <span role="tooltip" className={`tooltip tooltip--${placement}`}>{label}</span>}
    </span>
  );
}

/* ─── Live indicator ──────────────────────────────────────── */
export const LiveIndicator = ({ children }) => (
  <span className="live-indicator">{children || 'Live'}</span>
);

/* ─── Kbd ─────────────────────────────────────────────────── */
export const Kbd = ({ children }) => <kbd>{children}</kbd>;
