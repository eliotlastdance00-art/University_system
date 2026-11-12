import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Field — form kontrol-lary (label + hint + error birleşdirilen)
   ───────────────────────────────────────────────────────────
   <Field label="Email" required error={errors.email} hint="…">
     <Input type="email" value={v} onChange={setV} />
   </Field>

   Ýa-da gysga ýol:
   <TextField label="Email" required value={v} onChange={setV} error={…} />
   ═══════════════════════════════════════════════════════════ */

export function Field({
  label, htmlFor, required = false, optional = false, hint, error, children, className = '', actions,
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label" htmlFor={htmlFor}>
          <span>{label}</span>
          {required && <span className="form-label__required" aria-hidden="true">*</span>}
          {optional && <span className="text-faint" style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>}
          {actions && <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>{actions}</span>}
        </label>
      )}

      {children}

      {error
        ? <span className="form-error" role="alert">{error}</span>
        : hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

/* ─── Input ───────────────────────────────────────────────── */
export const Input = forwardRef(function Input(
  { size = 'md', invalid = false, className = '', icon: Icon, ...rest }, ref) {
  const cls = `form-input ${size === 'sm' ? 'form-input--sm' : ''} ${size === 'lg' ? 'form-input--lg' : ''} ${invalid ? 'form-input--error' : ''} ${className}`;

  if (!Icon) return <input ref={ref} className={cls} aria-invalid={invalid || undefined} {...rest} />;

  return (
    <span className="input-affix">
      <Icon size={15} aria-hidden="true" />
      <input ref={ref} className={cls} style={{ paddingLeft: '2.25rem' }} aria-invalid={invalid || undefined} {...rest} />
    </span>
  );
});

/* ─── Textarea ────────────────────────────────────────────── */
export const Textarea = forwardRef(function Textarea(
  { rows = 4, invalid = false, className = '', ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`form-textarea ${invalid ? 'form-textarea--error' : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

/* ─── Select ──────────────────────────────────────────────── */
export const Select = forwardRef(function Select(
  { options = [], placeholder, size = 'md', invalid = false, className = '', children, ...rest }, ref) {
  const cls = `form-select ${size === 'sm' ? 'form-select--sm' : ''} ${size === 'lg' ? 'form-select--lg' : ''} ${invalid ? 'form-select--error' : ''} ${className}`;

  return (
    <select ref={ref} className={cls} aria-invalid={invalid || undefined} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((opt) => {
        // opt = { value, label, disabled } ýa-da ýönekeý string/number
        const value = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : String(opt);
        return (
          <option key={value} value={value} disabled={typeof opt === 'object' ? opt.disabled : undefined}>
            {label}
          </option>
        );
      })}
      {children}
    </select>
  );
});

/* ─── Search input (debounce üçin taýýar, clear düwmeli) ──── */
export const SearchInput = forwardRef(function SearchInput(
  { value, onChange, placeholder = 'Search…', className = '', size = 'md', autoFocus = false, ...rest }, ref) {
  const clear = () => onChange?.('');

  return (
    <span className={`input-affix ${className}`} style={{ width: '100%' }}>
      <Search size={15} aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        className={`form-input ${size === 'sm' ? 'form-input--sm' : ''}`}
        style={{ paddingLeft: '2.25rem', paddingRight: value ? '2.25rem' : undefined }}
        value={value ?? ''}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange?.(e.target.value)}
        role="searchbox"
        {...rest}
      />
      {value ? (
        <span className="input-affix__action">
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={clear} aria-label="Clear search">
            <X size={14} />
          </button>
        </span>
      ) : null}
    </span>
  );
});

/* ─── Password input (görkez/gizle düwmesi bilen) ─────────── */
export const PasswordInput = forwardRef(function PasswordInput(
  { value, onChange, invalid = false, size = 'md', placeholder = '••••••••', ...rest }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="input-affix" style={{ width: '100%' }}>
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={`form-input ${size === 'lg' ? 'form-input--lg' : ''} ${invalid ? 'form-input--error' : ''}`}
        style={{ paddingRight: '2.5rem' }}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="input-affix__action">
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </span>
    </span>
  );
});

/* ─── Checkbox / Radio ────────────────────────────────────── */
export const Checkbox = ({ label, checked, onChange, disabled, className = '', ...rest }) => (
  <label className={`checkbox ${className}`}>
    <input
      type="checkbox"
      checked={!!checked}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.checked, e)}
      {...rest}
    />
    {label && <span>{label}</span>}
  </label>
);

export const Radio = ({ label, name, value, checked, onChange, disabled, className = '', ...rest }) => (
  <label className={`radio ${className}`}>
    <input
      type="radio"
      name={name}
      value={value}
      checked={!!checked}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value, e)}
      {...rest}
    />
    {label && <span>{label}</span>}
  </label>
);

/* ─── Switch ──────────────────────────────────────────────── */
export const Switch = ({ label, checked, onChange, disabled, id, ...rest }) => {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <label className="switch" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        checked={!!checked}
        disabled={disabled}
        aria-checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked, e)}
        {...rest}
      />
      <span className="switch__track"><span className="switch__thumb" /></span>
      {label && <span className="switch__label">{label}</span>}
    </label>
  );
};

/* ─── Segmented control ───────────────────────────────────── */
export function SegmentedControl({ value, onChange, options = [], size = 'md', ariaLabel }) {
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel} style={size === 'sm' ? { padding: 2 } : undefined}>
      {options.map((opt) => {
        const optValue = typeof opt === 'object' ? opt.value : opt;
        const optLabel = typeof opt === 'object' ? opt.label : String(opt);
        const Icon = typeof opt === 'object' ? opt.icon : null;
        const active = value === optValue;

        return (
          <button
            key={optValue}
            type="button"
            role="tab"
            aria-selected={active}
            className={`segmented__item ${active ? 'is-active' : ''}`}
            style={size === 'sm' ? { height: 26 } : undefined}
            onClick={() => onChange?.(optValue)}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            {optLabel}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Convenience: label + control birleşdirilen ──────────── */
export function TextField({ label, hint, error, required, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={rest.id}>
      <Input invalid={!!error} {...rest} />
    </Field>
  );
}

export function SelectField({ label, hint, error, required, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={rest.id}>
      <Select invalid={!!error} {...rest} />
    </Field>
  );
}

export function TextareaField({ label, hint, error, required, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={rest.id}>
      <Textarea invalid={!!error} {...rest} />
    </Field>
  );
}
