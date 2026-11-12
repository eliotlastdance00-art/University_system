import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════
   Umumy hook-lar — UI kit we sahypalar üçin
   ═══════════════════════════════════════════════════════════ */

/**
 * Body scroll-y gulp (modal/drawer açyk wagty).
 * Scrollbar "jump"-ynyň öňüni almak üçin padding-right kompensasiýa edýär.
 * Birnäçe modal açyk bolsa ref-count bilen işleýär.
 */
let lockCount = 0;

export function useLockBodyScroll(locked = true) {
  useEffect(() => {
    if (!locked) return undefined;

    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    lockCount += 1;
    if (lockCount === 1) {
      body.dataset.prevOverflow = body.style.overflow || '';
      body.dataset.prevPadding = body.style.paddingRight || '';
      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
      body.classList.add('is-locked');
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        body.style.overflow = body.dataset.prevOverflow || '';
        body.style.paddingRight = body.dataset.prevPadding || '';
        body.classList.remove('is-locked');
        delete body.dataset.prevOverflow;
        delete body.dataset.prevPadding;
      }
    };
  }, [locked]);
}

/** Element-iň daşyna basylanda callback. `refs` — array ýa-da ýeke ref. */
export function useOnClickOutside(refs, handler, event = 'pointerdown') {
  const refList = Array.isArray(refs) ? refs : [refs];
  const savedHandler = useRef(handler);

  useLayoutEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (e) => {
      for (const ref of refList) {
        const el = ref?.current;
        if (!el) continue;
        if (el.contains(e.target)) return;
      }
      savedHandler.current?.(e);
    };

    document.addEventListener(event, listener, true);
    return () => document.removeEventListener(event, listener, true);
    // refList her render-de täze array bolup bilýär — length-e baglaýarys
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, refList.length]);
}

/** Escape basylanda callback (modal/drawer/dropdown ýapmak). */
export function useEscapeKey(handler, active = true) {
  const saved = useRef(handler);
  useLayoutEffect(() => { saved.current = handler; }, [handler]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        saved.current?.(e);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}

/**
 * Focus trap — Tab diňe container-iň içinde aýlanýar, açylanda
 * birinji focusable element-e geçýär, ýapylanda öňki fokus yzyna gaýdýar.
 */
const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]',
].join(',');

export function useFocusTrap(active = true, autoFocus = true) {
  const containerRef = useRef(null);
  const previousActive = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    previousActive.current = document.activeElement;

    if (autoFocus) {
      // autofocus attributy bar bolsa şony, ýok bolsa birinji focusable
      const target = container.querySelector('[autofocus]') ||
        container.querySelector(FOCUSABLE);
      // requestAnimationFrame: mount animasiýasy bilen ýaryşmazlyk üçin
      requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    }

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = Array.from(container.querySelectorAll(FOCUSABLE))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement;

      if (e.shiftKey && (current === first || !container.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Fokusy öňki elemente gaýtarmak (ýöne ol heniz DOM-da bolsa)
      if (previousActive.current?.isConnected) {
        previousActive.current.focus({ preventScroll: true });
      }
    };
  }, [active, autoFocus]);

  return containerRef;
}

/** Debounce — search input üçin. */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/** localStorage bilen sinhron state (tema, dil, sidebar). SSR-safe. */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // private mode / quota — sessiz geçýäris
    }
  }, [key, value]);

  // Başga tab-dan üýtgese sinhronlaş
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== key || e.newValue === null) return;
      try { setValue(JSON.parse(e.newValue)); } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue];
}

/** Öňki bahany saklaýar (transition animasiýalary üçin). */
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

/** Clipboard-a göçürmek + 2s "copied" ýagdaýy. */
export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(text));
      } else {
        // fallback — köne browser / non-HTTPS
        const ta = document.createElement('textarea');
        ta.value = String(text);
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      return true;
    } catch {
      setCopied(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), timeout);
    return () => clearTimeout(id);
  }, [copied, timeout]);

  return { copied, copy };
}

/**
 * Interval — komponent unmount bolsa durýar, delay üýtgese täzeden başlaýar.
 * `delay === null` bolsa wagtlaýynça durýar (pause).
 */
export function useInterval(callback, delay) {
  const saved = useRef(callback);
  useLayoutEffect(() => { saved.current = callback; }, [callback]);

  useEffect(() => {
    if (delay === null || delay === undefined) return undefined;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/** Window ölçegi (responsive çartlar üçin — media query ýeterlik bolmasa). */
export function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setSize({ width: window.innerWidth, height: window.innerHeight }),
      );
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return size;
}

/** Sanawy "animated count" bilen görkezmek üçin — statik hem ýeterlik. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
