import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getMyNotifications, markNotificationRead } from '../api/notifications';
import { useAuth } from './AuthContext';
import { useInterval } from '../lib/hooks';

/* ═══════════════════════════════════════════════════════════
   NotificationsContext — header badge + dropdown üçin ýeke çeşme
   ───────────────────────────────────────────────────────────
   Öň: Header.jsx öz-özüne fetch edýärdi, NotificationsPage ýene
   bir gezek fetch edýärdi → iki sany sinhron däl nusga.
   Indi: bir provider, hemmesi şondan okaýar.

   Bellik (AUDIT.md F6): backend-de "mark all as read" BULK endpoint
   ýok, şonuň üçin şu ýerde Promise.all bilen paralel iberýäris
   (köne kod sequential `for` loop ulanýardy → 50 request yzly-yzyna).
   ═══════════════════════════════════════════════════════════ */

const NotificationsContext = createContext(null);

const REFRESH_MS = 45000;   // fon täzeleme
const PAGE_SIZE = 30;

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inflight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!user?.id || inflight.current) return;
    inflight.current = true;
    if (!silent) setLoading(true);

    try {
      const res = await getMyNotifications(PAGE_SIZE, 0);
      const payload = res?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      if (mounted.current) {
        setItems(list);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        // Sessiz ýalňyşlyk: badge 0 bolýar, UI döwülmeýär
        setError(err?.response?.data?.detail || err?.message || 'notification_error');
      }
    } finally {
      inflight.current = false;
      if (mounted.current && !silent) setLoading(false);
    }
  }, [user?.id]);

  // Login/çykyş bolanda täzeden ýüklemek
  useEffect(() => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    fetchNotifications();
  }, [user?.id, fetchNotifications]);

  // Fon polling (sahypa görünýän wagty)
  useInterval(() => {
    if (document.visibilityState === 'visible') fetchNotifications({ silent: true });
  }, user?.id ? REFRESH_MS : null);

  const markAsRead = useCallback(async (id) => {
    // Optimistic: ilki UI täzeleýäris, soňra API
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      // yzyna gaýtarmak üçin serverden täzeden alýarys
      fetchNotifications({ silent: true });
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    const unread = items.filter((n) => !n.is_read);
    if (unread.length === 0) return 0;

    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await Promise.allSettled(unread.map((n) => markNotificationRead(n.id)));
    } finally {
      fetchNotifications({ silent: true });
    }
    return unread.length;
  }, [items, fetchNotifications]);

  /** FCM foreground push gelende ýa-da sahypada hereket bolanda çagyrylýar */
  const pushLocal = useCallback((notification) => {
    if (!notification) return;
    setItems((prev) => {
      const id = notification.id ?? `local-${Date.now()}`;
      if (prev.some((n) => n.id === id)) return prev;
      return [{ id, is_read: false, created_at: new Date().toISOString(), ...notification }, ...prev].slice(0, PAGE_SIZE);
    });
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const value = useMemo(
    () => ({
      items, unreadCount, loading, error,
      refresh: fetchNotifications, markAsRead, markAllAsRead, pushLocal,
    }),
    [items, unreadCount, loading, error, fetchNotifications, markAsRead, markAllAsRead, pushLocal],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      items: [], unreadCount: 0, loading: false, error: null,
      refresh: async () => {}, markAsRead: async () => {},
      markAllAsRead: async () => 0, pushLocal: () => {},
    };
  }
  return ctx;
}
