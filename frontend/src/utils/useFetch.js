import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data-fetching hook.
 *
 * @param {Function|null} apiFn  - Çağrılacak API fonksiyonu (null ise fetch yapılmaz)
 * @param {Array}         deps   - apiFn'i yeniden tetikleyecek dependency listesi
 *
 * @returns {{ data, loading, error, refetch }}
 *
 * Kullanım:
 *   const { data, loading, error } = useFetch(() => getGradesForStudent(userId), [userId]);
 */
const useFetch = (apiFn, deps = []) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    // apiFn veya bağımlılıklardan biri henüz hazır değilse (null/undefined) bekle
    if (!apiFn || deps.some((d) => d === null || d === undefined)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn();
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

export default useFetch;
