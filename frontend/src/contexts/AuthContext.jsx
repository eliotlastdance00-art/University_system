import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { getUserFromToken, clearTokens, getAccessToken } from '../utils/token';
import { logout as apiLogout } from '../api/auth';
import { getMyProfile } from '../api/profile';

/* ═══════════════════════════════════════════════════════════
   AuthContext — v2
   ───────────────────────────────────────────────────────────
   Öňki wersiýanyň kemçilikleri (AUDIT.md F4, F9):
     • JWT-de `email`/`full_name` ýok → Header-de avatar hemişe "U",
       email boş görünýärdi.
     • Token **dogrulanmaýardy** → möhleti geçen token bilen UI
       "logged in" görkezýärdi, soňra 401 loop.
     • `exp` barlanmaýardy.

   Täze wersiýa:
     1. JWT payload-inden deslapky ulanyjyny alýar (derrew, flash ýok)
     2. `exp` barlaýar — geçen bolsa derrew çykarýar
     3. `/profile/me` bilen hakyky maglumaty (at, email, fakultet,
        kafedra, topar, rol) ýükleýär we JWT-ni **tassyklaýar**
     4. Şowsuz bolsa JWT fallback-de galýar (offline/5xx)
   ═══════════════════════════════════════════════════════════ */

const AuthContext = createContext(null);

const REFRESH_SKEW_SECONDS = 30;

/** JWT `exp` (unix sekunt) gutardymy? */
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(
      decodeURIComponent(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(''),
      ),
    );
    if (!payload.exp) return false; // exp ýok bolsa çäklendirmeýäris
    return payload.exp * 1000 <= Date.now() + REFRESH_SKEW_SECONDS * 1000;
  } catch {
    return true; // bozuk token
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const verified = useRef(false);

  /* ─── 1. Başlangyç: JWT-den deslapky ulanyjy ─────────────── */
  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setStatus('anonymous');
      return;
    }

    if (isTokenExpired(token)) {
      // Access token gutaran — client.js interceptor refresh synanyşar,
      // ýöne refresh token hem ýok bolsa arassalaýarys.
      clearTokens();
      setUser(null);
      setProfile(null);
      setStatus('anonymous');
      return;
    }

    const fromToken = getUserFromToken();
    if (!fromToken?.id) {
      clearTokens();
      setStatus('anonymous');
      return;
    }

    setUser({
      id: Number(fromToken.id),
      role: fromToken.role || 'student',
      email: fromToken.email || null,
      full_name: fromToken.full_name || null,
      verified: false,
    });
    setStatus('authenticated');
  }, []);

  /* ─── 2. Serverden tassyklama + doly profil ───────────────── */
  useEffect(() => {
    if (status !== 'authenticated' || verified.current) return;
    verified.current = true;

    let cancelled = false;

    (async () => {
      try {
        const res = await getMyProfile();
        if (cancelled) return;

        const data = res?.data || {};
        // `get_profile_me` None meýdanlary aýyrýar — şonuň üçin fallback gerek
        setProfile(data);
        setUser((prev) => ({
          ...prev,
          id: data.id ?? prev?.id,
          full_name: data.full_name ?? prev?.full_name ?? null,
          email: data.email ?? prev?.email ?? null,
          role: data.role ?? prev?.role ?? 'student',
          faculty: data.faculty ?? null,
          department: data.department ?? null,
          section: data.section_number ?? null,
          faculty_id: data.faculty_id ?? null,
          department_id: data.department_id ?? null,
          section_id: data.section_id ?? null,
          verified: true,
        }));
      } catch (err) {
        if (cancelled) return;

        const code = err?.response?.status;

        // 401 → token hakykatdan ýaramsyz (refresh hem şowsuz boldy)
        if (code === 401) {
          clearTokens();
          setUser(null);
          setProfile(null);
          setStatus('anonymous');
          verified.current = false;
          return;
        }

        // 403/404/5xx → JWT bilen dowam edýäris (offline-tolerant)
        setUser((prev) => (prev ? { ...prev, verified: false } : prev));
      }
    })();

    return () => { cancelled = true; };
  }, [status]);

  /* ─── Hereketler ──────────────────────────────────────────── */
  const loginSuccess = useCallback(() => {
    verified.current = false;
    const fromToken = getUserFromToken();
    setUser({
      id: Number(fromToken?.id),
      role: fromToken?.role || 'student',
      email: fromToken?.email || null,
      full_name: fromToken?.full_name || null,
      verified: false,
    });
    setStatus('authenticated');
    // Profil täzeden ýüklenýär (status üýtgän bolsa effect işleýär)
    if (status === 'authenticated') {
      getMyProfile()
        .then((res) => {
          const data = res?.data || {};
          setProfile(data);
          setUser((prev) => ({
            ...prev,
            full_name: data.full_name ?? prev?.full_name,
            email: data.email ?? prev?.email,
            role: data.role ?? prev?.role,
            faculty: data.faculty ?? null,
            department: data.department ?? null,
            section: data.section_number ?? null,
            verified: true,
          }));
        })
        .catch(() => {});
    }
  }, [status]);

  const logout = useCallback(async () => {
    // Backend-e refresh token-i revoke etmäge synanyşýarys,
    // ýöne şowsuz bolsa-da lokal sessiýany arassalaýarys.
    try {
      const refreshToken = localStorage.getItem('us_refresh_token');
      if (refreshToken) await apiLogout(refreshToken);
    } catch {
      /* network ýa-da 4xx — sessiýany ýene-de arassalaýarys */
    } finally {
      clearTokens();
      verified.current = false;
      setUser(null);
      setProfile(null);
      setStatus('anonymous');
    }
  }, []);

  /** Profili täzeden ýüklemek (profil sahypasy üýtgedenden soň) */
  const refreshProfile = useCallback(async () => {
    try {
      const res = await getMyProfile();
      const data = res?.data || {};
      setProfile(data);
      setUser((prev) => ({
        ...prev,
        full_name: data.full_name ?? prev?.full_name,
        email: data.email ?? prev?.email,
        role: data.role ?? prev?.role,
        faculty: data.faculty ?? null,
        department: data.department ?? null,
        section: data.section_number ?? null,
        verified: true,
      }));
      return data;
    } catch {
      return null;
    }
  }, []);

  const isAuthenticated = status === 'authenticated' && !!user;

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthenticated,
      loading: status === 'loading',
      status,
      loginSuccess,
      logout,
      refreshProfile,
      /** Rol barlagy — `hasRole('admin')` ýa-da `hasRole(['admin','dean'])` */
      hasRole: (roles) => {
        if (!user?.role) return false;
        return Array.isArray(roles) ? roles.includes(user.role) : roles === user.role;
      },
      displayName: user?.full_name || user?.email || 'User',
    }),
    [user, profile, isAuthenticated, status, loginSuccess, logout, refreshProfile],
  );

  if (status === 'loading') {
    return (
      <div className="page-loader" style={{ minHeight: '100dvh' }} role="status" aria-live="polite">
        <span className="spinner spinner--lg" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null, profile: null, isAuthenticated: false, loading: false,
      status: 'anonymous', loginSuccess: () => {}, logout: async () => {},
      refreshProfile: async () => null, hasRole: () => false, displayName: 'User',
    };
  }
  return ctx;
}
