import React, { useId, useState } from 'react';

/* ═══════════════════════════════════════════════════════════
   Tabs — a11y (ARIA authoring practices) bilen
   ───────────────────────────────────────────────────────────
   <Tabs
     value={tab} onChange={setTab}
     items={[{ value:'all', label:'All', count: 12, icon: Inbox }]}
     variant="underline"   // underline | pills
   />
   ═══════════════════════════════════════════════════════════ */

export function Tabs({
  value, onChange, items = [], variant = 'underline', size = 'md', ariaLabel, className = '',
}) {
  const uid = useId();
  const activeIndex = Math.max(0, items.findIndex((i) => i.value === value));

  const onKeyDown = (e) => {
    if (items.length < 2) return;
    let next = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (activeIndex + 1) % items.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (activeIndex - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;

    if (next !== null) {
      e.preventDefault();
      onChange?.(items[next].value);
      document.getElementById(`${uid}-tab-${next}`)?.focus();
    }
  };

  return (
    <div
      className={`tabs ${variant === 'pills' ? 'tabs--pills' : ''} ${className}`}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      style={size === 'sm' ? { gap: 2 } : undefined}
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        const selected = item.value === value;

        return (
          <button
            key={item.value}
            id={`${uid}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${uid}-panel`}
            tabIndex={selected ? 0 : -1}
            className={`tab ${selected ? 'is-active' : ''}`}
            style={size === 'sm' ? { padding: '6px 10px', fontSize: 'var(--font-xs)' } : undefined}
            onClick={() => onChange?.(item.value)}
          >
            {Icon && <Icon size={15} aria-hidden="true" />}
            {item.label}
            {item.count != null && <span className="tab__count">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * TabPanel — `active=false` bolsa düýbünden render edilmeýär.
 * (Öňki ýagdaý: `active` prop-y div-e düşýärdi → React "unknown prop"
 *  duýduryşy we ÄHLI paneller bir wagtda görünýärdi.)
 */
export const TabPanel = ({ children, className = '', active = true, ...rest }) => {
  if (!active) return null;
  return (
    <div role="tabpanel" className={className} {...rest}>{children}</div>
  );
};

/**
 * Ýönekeý içki tab dolandyryşy — `useState` bilen bile ulanmak üçin.
 * const tabs = useTabs('overview', [{value:'overview',label:'Overview'}]);
 */
export function useTabs(initial, items = []) {
  const [value, setValue] = useState(initial ?? items[0]?.value);
  return { value, onChange: setValue, items };
}
