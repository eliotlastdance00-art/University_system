import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight,
  Inbox, Search, RefreshCw,
} from 'lucide-react';
import { SearchInput } from './Field';
import { Button, IconButton } from './Button';
import { EmptyState, SkeletonTable, Alert } from './Primitives';

/* ═══════════════════════════════════════════════════════════
   DataTable — umumy tablisa komponenti
   ───────────────────────────────────────────────────────────
   Aýratynlyklary:
     • sütün boýunça sortlama (client-side ýa-da `onSortChange` bilen server)
     • global gözleg (client-side `searchKeys`, ýa-da `onSearch` server)
     • sahypalama (client-side ýa-da server `pagination` prop)
     • setir saýlama (checkbox)
     • setir hereketleri (`rowActions`)
     • loading skeleton · error · empty state
     • mobilde kartoçka görnüşi (`renderCard`)
     • sticky header, zebra, compact

   columns: [{
     key, label, render?(row), sortValue?(row), sortable?, align?,
     width?, hideBelow?: 'md'|'lg'|'xl', headerRender?
   }]
   ═══════════════════════════════════════════════════════════ */

const EMPTY = [];

export function DataTable({
  columns,
  data = EMPTY,
  rowKey = 'id',
  loading = false,
  error = null,
  onRetry,

  /* gözleg */
  searchable = false,
  searchKeys = [],
  searchPlaceholder = 'Search…',
  searchValue,
  onSearchChange,

  /* sortlama */
  sort,                    // { key, dir: 'asc'|'desc' }  — controlled
  defaultSort,             // { key, dir }                — uncontrolled
  onSortChange,            // berlen bolsa SERVER sortlama

  /* sahypalama */
  pagination,              // { page, pageSize, total }   — server mode
  onPageChange,
  clientPagination = false,
  pageSizeOptions = [10, 20, 50, 100],

  /* saýlama */
  selectable = false,
  selected = EMPTY,
  onSelectedChange,

  /* görünüş */
  title,
  subtitle,
  toolbar,
  rowActions,
  onRowClick,
  renderCard,              // (row) => ReactNode — mobilde ulanylýar
  compact = false,
  striped = false,
  maxHeight,
  emptyTitle = 'No records found',
  emptyDescription = 'Adjust your filters or create a new record.',
  emptyAction,
}) {
  const getRowKey = useCallback(
    (row, index) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey]) ?? index,
    [rowKey],
  );

  /* ── Gözleg (client-side) ───────────────────────────────── */
  const [internalSearch, setInternalSearch] = useState('');
  const query = (searchValue ?? internalSearch ?? '').trim().toLowerCase();
  const handleSearch = (v) => {
    if (onSearchChange) onSearchChange(v);
    else setInternalSearch(v);
  };

  /* ── Sortlama ───────────────────────────────────────────── */
  const [internalSort, setInternalSort] = useState(defaultSort || null);
  const activeSort = sort ?? internalSort;

  const toggleSort = (col) => {
    if (!col.sortable) return;
    const nextDir = activeSort?.key === col.key && activeSort.dir === 'asc' ? 'desc' : 'asc';
    const next = { key: col.key, dir: nextDir };
    if (onSortChange) onSortChange(next);
    else setInternalSort(next);
  };

  /* ── Sahypalama (client-side) ───────────────────────────── */
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(pageSizeOptions[1] ?? 20);

  useEffect(() => { setClientPage(1); }, [query, activeSort?.key, activeSort?.dir]);

  const filtered = useMemo(() => {
    if (!query || !searchable || searchKeys.length === 0 || onSearchChange) return data;

    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = typeof key === 'function' ? key(row) : row?.[key];
        return value != null && String(value).toLowerCase().includes(query);
      }),
    );
  }, [data, query, searchable, searchKeys, onSearchChange]);

  const sorted = useMemo(() => {
    if (!activeSort || onSortChange) return filtered;
    const col = columns.find((c) => c.key === activeSort.key);
    if (!col) return filtered;

    const valueOf = (row) => {
      if (col.sortValue) return col.sortValue(row);
      const v = row?.[col.key];
      return v == null ? '' : v;
    };

    return [...filtered].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);

      if (typeof av === 'number' && typeof bv === 'number') {
        return activeSort.dir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      const cmp = as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' });
      return activeSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, activeSort, columns, onSortChange]);

  const page = pagination?.page ?? clientPage;
  const pageSize = pagination?.pageSize ?? clientPageSize;
  const total = pagination?.total ?? sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const visibleRows = useMemo(() => {
    // Server sahypalamasynda data eýýäm kesilen
    if (pagination || !clientPagination) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pagination, clientPagination, page, pageSize]);

  const goPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (onPageChange) onPageChange(clamped);
    else setClientPage(clamped);
  };

  /* ── Saýlama ────────────────────────────────────────────── */
  const selectedSet = useMemo(
    () => new Set(selected.map((s) => (typeof s === 'object' ? getRowKey(s) : s))),
    [selected, getRowKey],
  );
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((r) => selectedSet.has(getRowKey(r)));

  const toggleAll = () => {
    if (!onSelectedChange) return;
    if (allVisibleSelected) {
      onSelectedChange(selected.filter((s) => !visibleRows.some((r) => getRowKey(r) === (typeof s === 'object' ? getRowKey(s) : s))));
    } else {
      const merged = [...selected];
      visibleRows.forEach((r) => { if (!selectedSet.has(getRowKey(r))) merged.push(r); });
      onSelectedChange(merged);
    }
  };

  const toggleRow = (row) => {
    if (!onSelectedChange) return;
    const k = getRowKey(row);
    if (selectedSet.has(k)) {
      onSelectedChange(selected.filter((s) => (typeof s === 'object' ? getRowKey(s) : s) !== k));
    } else {
      onSelectedChange([...selected, row]);
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  const hasToolbar = searchable || toolbar || title || (selectable && selected.length > 0);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {hasToolbar && (
        <div className="card__header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            {title && <h3 className="card__title truncate">{title}</h3>}
            {subtitle && <p className="card__subtitle truncate">{subtitle}</p>}
            {!title && !subtitle && (
              <span className="text-xs text-muted tabular-nums">
                {loading ? '…' : `${total} ${total === 1 ? 'record' : 'records'}`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {searchable && (
              <div style={{ width: 'min(260px, 100%)' }}>
                <SearchInput
                  value={searchValue ?? internalSearch}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  size="sm"
                />
              </div>
            )}
            {toolbar}
            {onRetry && (
              <IconButton icon={RefreshCw} label="Refresh" size="sm" onClick={onRetry} />
            )}
          </div>
        </div>
      )}

      {selectable && selected.length > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--bg-selected)', borderBottom: '1px solid var(--border-subtle)',
            fontSize: 'var(--font-xs)', color: 'var(--text-accent)', fontWeight: 600,
          }}
        >
          {selected.length} selected
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => onSelectedChange?.([])}>
            Clear
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: 'var(--space-4)' }}>
          <Alert variant="error" title="Failed to load data">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={{ flex: 1, minWidth: 200 }}>{error}</span>
              {onRetry && <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry}>Retry</Button>}
            </div>
          </Alert>
        </div>
      )}

      {loading && !error ? (
        <div style={{ padding: 'var(--space-4)' }}>
          <SkeletonTable rows={6} cols={Math.min(6, columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0))} />
        </div>
      ) : !error && visibleRows.length === 0 ? (
        <EmptyState
          icon={query ? Search : Inbox}
          title={query ? `No results for “${query}”` : emptyTitle}
          description={query ? 'Try a different search term or clear the filters.' : emptyDescription}
          actions={(
            <>
              {query && <Button size="sm" variant="ghost" onClick={() => handleSearch('')}>Clear search</Button>}
              {emptyAction}
            </>
          )}
          compact
        />
      ) : !error ? (
        <>
          <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', maxHeight }}>
            <table className={`table ${compact ? 'table--compact' : ''} ${striped ? 'table--striped' : ''}`}>
              <thead>
                <tr>
                  {selectable && (
                    <th style={{ width: 40, paddingLeft: 'var(--space-4)' }}>
                      <label className="checkbox" style={{ gap: 0 }}>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleAll}
                          aria-label="Select all rows on this page"
                          ref={(el) => {
                            if (el) el.indeterminate = !allVisibleSelected && visibleRows.some((r) => selectedSet.has(getRowKey(r)));
                          }}
                        />
                      </label>
                    </th>
                  )}

                  {columns.map((col) => {
                    const isSorted = activeSort?.key === col.key;
                    const SortIcon = isSorted ? (activeSort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

                    return (
                      <th
                        key={col.key}
                        scope="col"
                        className={`${col.sortable ? 'is-sortable' : ''} ${isSorted ? 'is-sorted' : ''}`}
                        style={{
                          width: col.width,
                          textAlign: col.align || 'left',
                          display: col.hide ? 'none' : undefined,
                        }}
                        onClick={col.sortable ? () => toggleSort(col) : undefined}
                        aria-sort={isSorted ? (activeSort.dir === 'asc' ? 'ascending' : 'descending') : (col.sortable ? 'none' : undefined)}
                        onKeyDown={col.sortable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort(col); } } : undefined}
                        tabIndex={col.sortable ? 0 : undefined}
                        role={col.sortable ? 'button' : undefined}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {col.label}
                          {col.sortable && <SortIcon size={12} opacity={isSorted ? 1 : 0.45} aria-hidden="true" />}
                        </span>
                      </th>
                    );
                  })}

                  {rowActions && (
                    <th style={{ width: 1, textAlign: 'right', paddingRight: 'var(--space-4)' }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row, index) => {
                  const key = getRowKey(row, index);
                  const isSelected = selectedSet.has(key);

                  return (
                    <tr
                      key={key}
                      className={isSelected ? 'is-selected' : ''}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      style={onRowClick ? { cursor: 'pointer' } : undefined}
                    >
                      {selectable && (
                        <td style={{ paddingLeft: 'var(--space-4)' }}>
                          <label className="checkbox" style={{ gap: 0 }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(row)}
                              aria-label={`Select row ${key}`}
                            />
                          </label>
                        </td>
                      )}

                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            textAlign: col.align || 'left',
                            display: col.hide ? 'none' : undefined,
                            whiteSpace: col.nowrap ? 'nowrap' : undefined,
                          }}
                          className={col.strong ? 'table__cell-strong' : undefined}
                        >
                          {col.render ? col.render(row, index) : (row?.[col.key] ?? '—')}
                        </td>
                      ))}

                      {rowActions && (
                        <td style={{ paddingRight: 'var(--space-4)' }} onClick={(e) => e.stopPropagation()}>
                          <div className="table__actions">{rowActions(row, index)}</div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobil kartoçka görnüşi (CSS bilen gizlenýär) */}
          {renderCard && (
            <div className="dt-cards" style={{ display: 'none' }}>
              {visibleRows.map((row, index) => (
                <div key={getRowKey(row, index)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                  {renderCard(row, index)}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* ── Pagination ─────────────────────────────────────── */}
      {!loading && !error && total > 0 && (totalPages > 1 || clientPagination) && (
        <div className="pagination">
          <span className="tabular-nums">
            {clientPagination
              ? `Showing ${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, total)} of ${total}`
              : `${total} ${total === 1 ? 'record' : 'records'}`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {clientPagination && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="text-faint">Per page</span>
                <select
                  className="form-select form-select--sm"
                  style={{ width: 'auto', paddingRight: 'var(--space-6)' }}
                  value={clientPageSize}
                  onChange={(e) => { setClientPageSize(Number(e.target.value)); setClientPage(1); }}
                >
                  {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            )}

            <div className="pagination__pages">
              <button
                type="button" className="pagination__btn" onClick={() => goPage(page - 1)}
                disabled={page <= 1} aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>

              {pageNumbers(page, totalPages).map((p, i) => (
                p === '…'
                  ? <span key={`gap-${i}`} className="pagination__btn" style={{ pointerEvents: 'none' }}>…</span>
                  : (
                    <button
                      key={p}
                      type="button"
                      className={`pagination__btn ${p === page ? 'is-active' : ''}`}
                      onClick={() => goPage(p)}
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
              ))}

              <button
                type="button" className="pagination__btn" onClick={() => goPage(page + 1)}
                disabled={page >= totalPages} aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          ${renderCard ? '.dt-cards { display: flex !important; flex-direction: column; gap: var(--space-3); padding: var(--space-4); }' : ''}
          ${renderCard ? '.table-container { display: none !important; }' : ''}
        }
      `}</style>
    </div>
  );
}

/** 1 … 4 5 [6] 7 8 … 20 görnüşinde sahypa sanlary */
function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out = [];
  const push = (v) => out.push(v);

  push(1);
  if (current > 3) push('…');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i += 1) push(i);

  if (current < total - 2) push('…');
  push(total);

  return out;
}

export default DataTable;
