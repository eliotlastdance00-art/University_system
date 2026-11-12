import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Button — ýeke-täk düwme komponenti
   ───────────────────────────────────────────────────────────
   <Button variant="primary" size="md" icon={Plus} loading onClick={…}>
     Add
   </Button>

   Variantlar: primary · secondary · ghost · outline · danger ·
               danger-soft · success
   Ölçegler:   xs · sm · md · lg · xl
   ═══════════════════════════════════════════════════════════ */

const SIZE_CLASS = { xs: 'btn-sm', sm: 'btn-sm', md: '', lg: 'btn-lg', xl: 'btn-xl' };

const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  danger: 'btn-danger',
  'danger-soft': 'btn-danger-soft',
  success: 'btn-success',
};

export const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    iconSize = 16,
    loading = false,
    disabled = false,
    block = false,
    pill = false,
    iconOnly = false,
    className = '',
    children,
    type,
    ...rest
  },
  ref,
) {
  const classes = [
    'btn',
    VARIANT_CLASS[variant] || VARIANT_CLASS.secondary,
    SIZE_CLASS[size] ?? '',
    block ? 'btn-block' : '',
    pill ? 'btn-pill' : '',
    iconOnly ? 'btn-icon' : '',
    loading ? 'is-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      className={classes}
      // `button` bolanda type default; link (`<a>`, `NavLink`) bolanda gerek däl
      {...(Component === 'button' ? { type: type || 'button' } : { type })}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-disabled={Component === 'button' ? undefined : isDisabled || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={iconSize} aria-hidden="true" />
      ) : null}

      {iconOnly && children ? <span className="sr-only">{children}</span> : children}

      {!loading && IconRight && <IconRight size={iconSize} aria-hidden="true" />}
    </Component>
  );
});

/** Diňe ikon — kwadrat düwme. `label` hökman (a11y: sr-only text). */
export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', iconSize = 17, active = false, className = '', ...rest },
  ref,
) {
  return (
    <Button
      ref={ref}
      as="button"
      icon={Icon}
      iconOnly
      variant={variant}
      size={size}
      iconSize={iconSize}
      className={`${active ? 'is-active ' : ''}${className}`}
      aria-label={label}
      title={label}
      {...rest}
    />
  );
});

/** Header-de ulanylýan 38px kwadrat ikon düwmesi (badge goldawy bilen) */
export function HeaderIconButton({
  icon: Icon, label, badge, active = false, onClick, size = 18, ...rest
}) {
  return (
    <button
      type="button"
      className={`icon-btn${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-haspopup={rest['aria-haspopup']}
      aria-expanded={rest['aria-expanded']}
    >
      <Icon size={size} strokeWidth={2} aria-hidden="true" />
      {badge > 0 && (
        <span className="icon-btn__badge" aria-hidden="true">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {badge > 0 && <span className="sr-only">{`${badge} unread`}</span>}
    </button>
  );
}

export default Button;
