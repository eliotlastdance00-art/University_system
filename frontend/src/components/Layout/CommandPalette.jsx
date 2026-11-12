import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, CornerDownLeft, ArrowUp, ArrowDown, X, Sun, Moon, Monitor,
  Languages, LogOut, User as UserIcon, Bell, Command,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useUi } from '../../contexts/UiContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n, SUPPORTED_LOCALES } from '../../i18n';
import { searchableNavForRole } from '../../config/navigation';
import { useDebouncedValue, useLockBodyScroll, useEscapeKey } from '../../lib/hooks';

/* ═══════════════════════════════════════════════════════════
   CommandPalette — ⌘K / Ctrl+K global gözleg we hereketler
   ───────────────────────────────────────────────────────────
   • Sahypalar (rol boýunça süzülen)
   • Hereketler: tema çalyş, dil çalyş, profil, bildirişler, çykmak
   • Klawiatura: ↑↓ gezmek · Enter saýlamak · Esc ýapmak
   • Fuzzy-ish matching: harf yzygiderliligi (subsequence) + söz başy
   ═══════════════════════════════════════════════════════════ */

/** Ýönekeý ball ulgamy — 0 bolsa gabat gelmeýär */
function scoreMatch(text, query) {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 1;

  if (t === q) return 100;
  if (t.startsWith(q)) return 80;

  const words = t.split(/\s+/);
  if (words.some((w) => w.startsWith(q))) return 65;
  if (t.includes(q)) return 50;

  // subsequence: "usr" → "users"
  let ti = 0;
  let hits = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;
    hits += 1;
    ti = found + 1;
  }
  return hits === q.length ? 20 : 0;
}

export function CommandPalette() {
  const { paletteOpen, closePalette, isMac } = useUi();
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const debounced = useDebouncedValue(query, 90);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useLockBodyScroll(paletteOpen);
  useEscapeKey(closePalette, paletteOpen);

  // Açylanda arassala + fokus
  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [paletteOpen]);

  /* ── Kandidatlar ─────────────────────────────────────────── */
  const entries = useMemo(() => {
    const nav = searchableNavForRole(user?.role || 'student').map((item) => ({
      id: `nav:${item.path}`,
      group: t('command.pages'),
      icon: item.icon,
      title: t(item.labelKey),
      hint: item.path,
      run: () => navigate(item.path),
    }));

    const actions = [
      {
        id: 'act:theme-light', group: t('command.theme'), icon: Sun,
        title: `${t('theme.light')} · ${t('theme.title')}`, hint: 'Light mode',
        run: () => setTheme('light'),
      },
      {
        id: 'act:theme-dark', group: t('command.theme'), icon: Moon,
        title: `${t('theme.dark')} · ${t('theme.title')}`, hint: 'Dark mode',
        run: () => setTheme('dark'),
      },
      {
        id: 'act:theme-system', group: t('command.theme'), icon: Monitor,
        title: `${t('theme.system')} · ${t('theme.title')}`, hint: 'Follow OS',
        run: () => setTheme('system'),
      },
      ...SUPPORTED_LOCALES.map((l) => ({
        id: `act:lang-${l.code}`, group: t('command.language'), icon: Languages,
        title: l.label, hint: `${l.short} · ${locale === l.code ? 'active' : 'switch'}`,
        run: () => setLocale(l.code),
      })),
      {
        id: 'act:profile', group: t('command.actions'), icon: UserIcon,
        title: t('nav.profile'), hint: '/profile',
        run: () => navigate('/profile'),
      },
      {
        id: 'act:notifications', group: t('command.actions'), icon: Bell,
        title: t('nav.notifications'), hint: '/notifications',
        run: () => navigate('/notifications'),
      },
      {
        id: 'act:logout', group: t('command.actions'), icon: LogOut,
        title: t('auth.signOut'), hint: '',
        run: async () => { await logout(); navigate('/login', { replace: true }); },
      },
    ];

    return [...nav, ...actions];
  }, [user?.role, t, navigate, setTheme, locale, setLocale, logout]);

  const results = useMemo(() => {
    if (!debounced.trim()) return entries.slice(0, 14);

    return entries
      .map((e) => ({ e, s: Math.max(scoreMatch(e.title, debounced), scoreMatch(e.hint || '', debounced) * 0.6) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 20)
      .map((x) => x.e);
  }, [entries, debounced]);

  // Aktiw item görünýän ýerde galsyn
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const runAt = (index) => {
    const item = results[index];
    if (!item) return;
    closePalette();
    // navigate ýapylandan soň bolsun (portal unmount yzygiderliligi)
    setTimeout(() => { item.run?.(); }, 0);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % Math.max(1, results.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + results.length) % Math.max(1, results.length)); }
    else if (e.key === 'Enter') { e.preventDefault(); runAt(activeIndex); }
    else if (e.key === 'Home') { e.preventDefault(); setActiveIndex(0); }
    else if (e.key === 'End') { e.preventDefault(); setActiveIndex(results.length - 1); }
  };

  if (!paletteOpen || typeof document === 'undefined') return null;

  // Toparlara bölüp görkezýäris
  let lastGroup = null;

  return createPortal(
    <div className="palette-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closePalette(); }} role="presentation">
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('command.placeholder')}
        onKeyDown={onKeyDown}
      >
        <div className="palette__input-row">
          <Search size={18} style={{ color: 'var(--text-faint)', flex: 'none' }} aria-hidden="true" />
          <input
            ref={inputRef}
            className="palette__input"
            value={query}
            placeholder={t('command.placeholder')}
            onChange={(e) => setQuery(e.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={closePalette} aria-label={t('common.close')}>
            <X size={16} />
          </button>
        </div>

        <div className="palette__results" ref={listRef} id="palette-listbox" role="listbox" aria-label={t('command.navigation')}>
          {results.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              {t('command.noResults')}
            </div>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon || Command;
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;

              return (
                <React.Fragment key={item.id}>
                  {showGroup && <div className="palette__group-label">{item.group}</div>}
                  <button
                    type="button"
                    className="palette__item"
                    data-active={i === activeIndex}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={() => runAt(i)}
                    onMouseMove={() => setActiveIndex(i)}
                  >
                    <span className="palette__item__icon"><Icon size={14} aria-hidden="true" /></span>
                    <span className="palette__item__body">
                      <span className="palette__item__title">{item.title}</span>
                      {item.hint && <span className="palette__item__hint">{item.hint}</span>}
                    </span>
                    {i === activeIndex && (
                      <span className="palette__item__shortcut"><kbd><CornerDownLeft size={10} /></kbd></span>
                    )}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="palette__footer">
          <span><kbd><ArrowUp size={9} /></kbd><kbd><ArrowDown size={9} /></kbd> {t('command.arrowNavigate')}</span>
          <span><kbd><CornerDownLeft size={9} /></kbd> {t('command.enterSelect')}</span>
          <span><kbd>esc</kbd> {t('command.escClose')}</span>
          <span style={{ marginLeft: 'auto' }}>{isMac ? '⌘K' : 'Ctrl+K'}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CommandPalette;
