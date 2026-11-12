/* ═══════════════════════════════════════════════════════════
   Format kömekçileri — sene, san, göterim, reňk, atlary
   ═══════════════════════════════════════════════════════════ */

/** Häzirki ulanylýan locale (i18n bilen sinhron) */
let activeLocale = 'en-GB';
export const setFormatLocale = (locale) => { activeLocale = locale || 'en-GB'; };

const safeDate = (value) => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // MySQL "2026-11-12" → Safari-de Invalid Date; "T00:00:00" goşup düzedýäris
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** 12.11.2026 görnüşinde gysga sene */
export const formatDate = (value, opts) => {
  const d = safeDate(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(activeLocale, {
    day: '2-digit', month: '2-digit', year: 'numeric', ...opts,
  }).format(d);
};

/** "12 November 2026" / "12 noýabr 2026" */
export const formatDateLong = (value) => {
  const d = safeDate(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(activeLocale, {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(d);
};

/** "Mon" / "Duş" — gysga gün ady */
export const formatDayShort = (value) => {
  const d = safeDate(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(activeLocale, { weekday: 'short' }).format(d);
};

export const formatDayLong = (value) => {
  const d = safeDate(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(activeLocale, { weekday: 'long' }).format(d);
};

/** 14:30 */
export const formatTime = (value, withSeconds = false) => {
  const d = safeDate(value);
  if (d) {
    return new Intl.DateTimeFormat(activeLocale, {
      hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}),
      hour12: false,
    }).format(d);
  }
  // MySQL TIME "14:30:00" → sene däl, göni gysgaldýarys
  if (typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return withSeconds ? value : value.slice(0, 5);
  }
  return '—';
};

/** 12 noýabr, 14:30 */
export const formatDateTime = (value) => {
  const d = safeDate(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(activeLocale, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
};

/** "3 sagat öň", "2 gün öň" */
export const formatRelative = (value) => {
  const d = safeDate(value);
  if (!d) return '—';
  const diff = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(activeLocale, { numeric: 'auto' });
  const abs = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;

  const units = [
    ['year', 31536000000], ['month', 2592000000], ['week', 604800000],
    ['day', 86400000], ['hour', 3600000], ['minute', 60000], ['second', 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'second') {
      return rtf.format(sign * Math.round(abs / ms), unit);
    }
  }
  return rtf.format(0, 'second');
};

/** 1 234 567 */
export const formatNumber = (value, digits = 0) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(activeLocale, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(n);
};

/** 12.4K / 1.2M */
export const formatCompact = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(activeLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
};

/** 87.5% */
export const formatPercent = (value, digits = 1) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}%`;
};

/** 87.5 → "87.5" (DECIMAL string gelip biler) */
export const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** "monday" → "Monday" / "Duşenbe" */
export const titleCase = (value) => {
  if (!value) return '';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

/**
 * "john.doe@uni.tm" → "JD", "Osman Meredow" → "OM"
 * Avatar inicial-lary üçin.
 */
export const initials = (name, email) => {
  const source = String(name || email || '').trim();
  if (!source) return '?';

  if (source.includes('@')) {
    const local = source.split('@')[0].replace(/[._-]+/g, ' ');
    return local.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Deterministik reňk — şol bir at hemişe şol bir reňki berýär.
 * (CrudPage-däki `hashToHue` mantygynyň token ulgamyna uýgunlaşdyrylan görnüşi)
 */
const AVATAR_PALETTE = [
  ['#6366f1', '#8b5cf6'], ['#06b6d4', '#3b82f6'], ['#22c55e', '#10b981'],
  ['#f59e0b', '#f97316'], ['#ec4899', '#d946ef'], ['#ef4444', '#f43f5e'],
  ['#8b5cf6', '#6366f1'], ['#14b8a6', '#06b6d4'], ['#a855f7', '#ec4899'],
  ['#64748b', '#475569'],
];

export const hashString = (str) => {
  let hash = 0;
  const s = String(str ?? '');
  for (let i = 0; i < s.length; i += 1) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const paletteFor = (key) => AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];

export const gradientFor = (key) => {
  const [a, b] = paletteFor(key);
  return `linear-gradient(135deg, ${a}, ${b})`;
};

export const hueFor = (key) => hashString(key) % 360;

/** "2026-11-12T14:30:00" → HTML <input type=date> üçin "2026-11-12" */
export const toDateInput = (value) => {
  const d = safeDate(value);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Bugünkü senäniň YYYY-MM-DD görnüşi (lokal timezone) */
export const todayISO = () => toDateInput(new Date());

/** Duşenbe = 0 … Ýekşenbe = 6 (backend ENUM bilen gabat) */
export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** Bu hepdedäki duşenbiniň senesi */
export const startOfWeek = (base = new Date()) => {
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

/** "09:00:00" → 540 (minut) — timetable gapma-garşylyk barlagy üçin */
export const timeToMinutes = (value) => {
  const s = String(value || '');
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
};

/** Baha → harp (4.0 GPA şkalasy, Türkmenistan 5-li şkala hem goldanylýar) */
export const scoreToLetter = (score, max = 100) => {
  const pct = max > 0 ? (Number(score) / Number(max)) * 100 : 0;
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
};

export const scoreToTone = (score, max = 100) => {
  const pct = max > 0 ? (Number(score) / Number(max)) * 100 : 0;
  if (pct >= 85) return 'success';
  if (pct >= 70) return 'info';
  if (pct >= 55) return 'warning';
  return 'error';
};

export const scoreToGpa = (score, max = 100) => {
  const pct = max > 0 ? (Number(score) / Number(max)) * 100 : 0;
  if (pct >= 95) return 4.0;
  if (pct >= 90) return 3.7;
  if (pct >= 85) return 3.3;
  if (pct >= 80) return 3.0;
  if (pct >= 75) return 2.7;
  if (pct >= 70) return 2.3;
  if (pct >= 65) return 2.0;
  if (pct >= 60) return 1.7;
  if (pct >= 55) return 1.3;
  if (pct >= 50) return 1.0;
  return 0;
};
