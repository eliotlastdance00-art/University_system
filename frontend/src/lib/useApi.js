import { useCallback, useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════
   useApi — `useFetch`-iň kämilleşdirilen wersiýasy
   ───────────────────────────────────────────────────────────
   `src/utils/useFetch.js`-iň kemçilikleri (AUDIT F16):
     • her render-de täze `apiFn` → infinite loop howpy
     • deps null bolsa `data` köne galýar
     • AbortController ýok → ýaryş (race) şertleri
     • retry ýok

   Ulanylyşy:
     const { data, loading, error, refetch } = useApi(
       () => getSections(),            // fetcher
       { enabled: !!sectionId, deps: [sectionId] }
     );
   ═══════════════════════════════════════════════════════════ */

/** Axios ýalňyşlygyndan ulanyja görkezip bolýan tekst çykarmak */
export function normalizeApiError(err) {
  if (!err) return 'Unknown error';

  const data = err?.response?.data;
  if (data) {
    if (typeof data === 'string' && data.trim()) return data;
    if (data.detail) {
      // FastAPI RequestValidationError → array of {loc, msg}
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((d) => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`)
          .join(' · ');
      }
      return String(data.detail);
    }
    if (data.message) return String(data.message);
    if (data.error_code) return String(data.error_code);
  }

  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Network unavailable — check your connection';
  }
  if (err?.code === 'ECONNABORTED') return 'Request timed out';
  if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return null; // abort — sessiz

  return err?.message || 'Request failed';
}

export function useApi(fetcher, options = {}) {
  const {
    deps = [],
    enabled = true,
    initialData = null,
    /** Jogaby üýtgetmek (mysal: `res.data.items`) */
    select = (res) => res?.data ?? null,
    onSuccess,
    onError,
    /** Ilkinji ýüklenişde loading=true (flash-yň öňüni alýar) */
    lazy = false,
  } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!lazy && enabled);
  const [fetching, setFetching] = useState(false);

  const controllerRef = useRef(null);
  const aliveRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  const selectRef = useRef(select);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Ref-leri täzeläp durýarys → `run` hemişe iň soňky funksiýalary ulanýar,
  // ýöne deps diňe `deps`-e bagly (infinite loop howpy ýok)
  fetcherRef.current = fetcher;
  selectRef.current = select;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  const run = useCallback(async () => {
    if (!enabled || typeof fetcherRef.current !== 'function') {
      setLoading(false);
      return initialData;
    }

    // Öňki soragy ýatyrýarys (race condition-yň öňüni alýar)
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setFetching(true);
    setError(null);

    try {
      const res = await fetcherRef.current({ signal: controller.signal });
      if (!aliveRef.current || controller.signal.aborted) return undefined;

      const value = selectRef.current ? selectRef.current(res) : res?.data;
      setData(value);
      onSuccessRef.current?.(value);
      return value;
    } catch (err) {
      if (!aliveRef.current || controller.signal.aborted) return undefined;

      const message = normalizeApiError(err);
      setData(initialData);
      setError(message);
      if (message) onErrorRef.current?.(err, message);
      return undefined;
    } finally {
      if (aliveRef.current && !controller.signal.aborted) {
        setLoading(false);
        setFetching(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  /** Maglumaty üýtgetmeden täzeden ýüklemek (optimistic update soňy) */
  const refetch = useCallback(() => run(), [run]);

  /** Lokaly üýtgetmek (serverden gaýtadan almazdan) */
  const mutate = useCallback((updater) => {
    setData((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  return { data, error, loading, fetching, refetch, mutate, setData };
}

/**
 * Mutation (POST/PUT/DELETE) üçin — loading + error dolandyryşy.
 *
 *   const { run, loading } = useMutation(createFaculty, {
 *     onSuccess: () => { toast.success('Created'); refetch(); },
 *   });
 */
export function useMutation(mutator, options = {}) {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mutator(...args);
      if (alive.current) onSuccess?.(res?.data ?? res, ...args);
      return res?.data ?? res;
    } catch (err) {
      const message = normalizeApiError(err);
      if (alive.current) setError(message);
      onError?.(err, message, ...args);
      throw err;
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [mutator, onSuccess, onError]);

  return { run, loading, error, setError };
}

export default useApi;
