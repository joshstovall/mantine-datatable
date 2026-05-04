/**
 * `useDataTableVirtualization` — orchestrates `@tanstack/react-virtual` for
 * `<DataTable>`'s body rows AND columns.
 *
 * ============================================================================
 *   PERFORMANCE INVARIANTS — DO NOT BREAK
 * ============================================================================
 *
 * 1. Scroll state lives in REFS, not React state.
 *
 *    `isScrollingRef`, `scrollDirectionRef*`, and the scroll-end timeout are all
 *    refs mutated by an imperative scroll listener. Do not convert these to
 *    `useState` "for cleanliness" — going through state forces a re-render at
 *    scroll-start AND scroll-stop, doubling the work the rest of the memo chain
 *    is engineered to avoid.
 *
 * 2. The scroll listener also imperatively toggles `data-virt-scrolling=""` on
 *    the scroll viewport so CSS can suppress hover/pointer-events during fast
 *    scroll. Also no React commit — by design.
 *
 * 3. The `rangeExtractor`s (vertical AND horizontal) are direction-aware: they
 *    widen the rendered window only on the side the user is scrolling toward.
 *    Idle (or unknown direction) → symmetric overscan. Scrolling forward → small
 *    overscan behind + larger `scrollOverscan*` ahead.
 *
 * 4. Spacer ROW heights flow through React (they only change when crossing a
 *    row boundary). Spacer COLUMN widths do NOT — they would change every
 *    horizontal scroll tick, and propagating them as React props would torch
 *    the row/cell memo chain. Instead we write them as CSS variables on the
 *    scroll viewport via `useLayoutEffect`. Spacer cells consume the variables
 *    via CSS:
 *
 *      --mantine-datatable-virt-col-leading-width
 *      --mantine-datatable-virt-col-trailing-width
 *
 * 5. `visibleColumns` is a `Set<number>` whose IDENTITY is content-stable.
 *    TanStack rebuilds a fresh array on every scroll tick; we wrap it with an
 *    O(n) member compare and reuse the previous Set reference when contents
 *    match. Stable Set identity → stable result identity → row memo bails on
 *    every "scrolled within a column" tick.
 *
 * Anyone tempted to "simplify" any of the above should first add a render
 * counter and verify the invariant they're breaking.
 * ============================================================================
 */
import { useElementSize } from '@mantine/hooks';
import type { Range, Virtualizer } from '@tanstack/react-virtual';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { DataTableColumn, DataTableVirtualizationProps } from '../types';

type ScrollDirection = 'up' | 'down' | 'idle';
type HScrollDirection = 'left' | 'right' | 'idle';

export type UseDataTableVirtualizationOpts<T> = {
  config: DataTableVirtualizationProps | undefined;
  recordsCount: number;
  /** Effective columns (post-flatten of any groups) in render order. */
  columns: DataTableColumn<T>[];
  /** Whether the first non-hidden column should be pinned (sticky-left). */
  pinFirstColumn: boolean;
  /** Whether the last non-hidden column should be pinned (sticky-right). */
  pinLastColumn: boolean;
  /** True when grouped headers are configured — disables column virt. */
  hasGroups: boolean;
  scrollViewportRef: React.RefObject<HTMLDivElement | null>;
};

export type UseDataTableVirtualizationResult = {
  rowsEnabled: boolean;
  columnsEnabled: boolean;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element> | null;
  columnVirtualizer: Virtualizer<HTMLDivElement, Element> | null;
  virtualRows: ReturnType<Virtualizer<HTMLDivElement, Element>['getVirtualItems']>;
  /** Set of indices INTO `effectiveColumns` (the array passed in) that are currently
   *  visible. Content-stable identity — invariant #5. `null` when column virt is off.
   *  Always includes `pinnedFirstIdx` / `pinnedLastIdx` when those are set, since
   *  pinned cells must always be in the DOM for sticky positioning to work. */
  visibleColumns: Set<number> | null;
  /** Index in `effectiveColumns` of the column to render outside-and-before the
   *  leading spacer when column virt is on. `-1` when no first-pin requested.
   *  Resolves to the first non-hidden column. */
  pinnedFirstIdx: number;
  /** Index in `effectiveColumns` of the column to render outside-and-after the
   *  trailing spacer when column virt is on. `-1` when no last-pin requested. */
  pinnedLastIdx: number;
  leadingRowsHeight: number;
  trailingRowsHeight: number;
};

const DEFAULT_OVERSCAN_ROWS = 10;
const DEFAULT_OVERSCAN_COLUMNS = 6;
const DEFAULT_SCROLL_OVERSCAN_MULTIPLIER = 3;
const DEFAULT_SCROLL_END_DELAY_MS = 150;
const DEFAULT_ESTIMATE_COLUMN_WIDTH = 160;
const DATA_SCROLLING_ATTR = 'data-virt-scrolling';
const VAR_LEADING_COL_WIDTH = '--mantine-datatable-virt-col-leading-width';
const VAR_TRAILING_COL_WIDTH = '--mantine-datatable-virt-col-trailing-width';

function setsHaveSameMembers(a: Set<number>, b: Set<number>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function widthOrEstimate<T>(column: DataTableColumn<T>, fallback: number): number {
  const w = column.width;
  if (typeof w === 'number') return w;
  // Reject percentage / em / rem here — fixed-layout virt needs absolute pixels.
  return fallback;
}

export function useDataTableVirtualization<T>({
  config,
  recordsCount,
  columns,
  pinFirstColumn,
  pinLastColumn,
  hasGroups,
  scrollViewportRef,
}: UseDataTableVirtualizationOpts<T>): UseDataTableVirtualizationResult {
  const rowsEnabledRequested = !!config && config.rows !== false;
  const columnsEnabledRequested = !!config && config.columns === true;
  // Pinning + column virt now coexist by rendering the pinned cells outside
  // the leading/trailing spacers (see `pinnedFirstIdx` / `pinnedLastIdx`
  // below) and excluding them from the virtualizer. Group headers still
  // disable column virt — multi-row grouping doesn't survive horizontal
  // windowing without a much larger refactor.
  const columnsCompatible = !hasGroups;
  const rowsEnabled = rowsEnabledRequested;
  const columnsEnabled = columnsEnabledRequested && columnsCompatible;

  // Resolve the actual column indices that get pinned. We use the first /
  // last NON-HIDDEN column rather than `0` / `length - 1` so a hidden column
  // at the edge doesn't accidentally become the pinned target. Returned to
  // callers so they can render those cells outside the spacer window.
  const { pinnedFirstIdx, pinnedLastIdx } = useMemo(() => {
    let first = -1;
    let last = -1;
    if (pinFirstColumn) {
      for (let i = 0; i < columns.length; i++) {
        if (!columns[i]?.hidden) {
          first = i;
          break;
        }
      }
    }
    if (pinLastColumn) {
      for (let i = columns.length - 1; i >= 0; i--) {
        if (!columns[i]?.hidden) {
          last = i;
          break;
        }
      }
    }
    // Don't claim the same column twice — if there's a single visible
    // column and both pins are set, prefer first-pin.
    if (first !== -1 && first === last) last = -1;
    return { pinnedFirstIdx: first, pinnedLastIdx: last };
  }, [columns, pinFirstColumn, pinLastColumn]);

  const estimateRowHeight = config?.estimateRowHeight ?? 40;
  const estimateColumnWidth = config?.estimateColumnWidth ?? DEFAULT_ESTIMATE_COLUMN_WIDTH;
  const overscanRows = config?.overscanRows ?? DEFAULT_OVERSCAN_ROWS;
  const overscanColumns = config?.overscanColumns ?? DEFAULT_OVERSCAN_COLUMNS;
  const scrollOverscanRows = config?.scrollOverscanRows ?? overscanRows * DEFAULT_SCROLL_OVERSCAN_MULTIPLIER;
  const scrollOverscanColumns =
    config?.scrollOverscanColumns ?? overscanColumns * DEFAULT_SCROLL_OVERSCAN_MULTIPLIER;
  const scrollEndDelayMs = config?.scrollEndDelayMs ?? DEFAULT_SCROLL_END_DELAY_MS;

  const isScrollingRef = useRef(false);
  const scrollDirectionVRef = useRef<ScrollDirection>('idle');
  const scrollDirectionHRef = useRef<HScrollDirection>('idle');
  const lastScrollTopRef = useRef(0);
  const lastScrollLeftRef = useRef(0);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { ref: sizeRef } = useElementSize<HTMLDivElement>();

  // ── ROW virtualizer ──────────────────────────────────────────────────────
  const rowRangeExtractor = useCallback(
    (range: Range): number[] => {
      const idle = !isScrollingRef.current || scrollDirectionVRef.current === 'idle';
      const before =
        idle ? overscanRows : scrollDirectionVRef.current === 'up' ? scrollOverscanRows : overscanRows;
      const after =
        idle ? overscanRows : scrollDirectionVRef.current === 'down' ? scrollOverscanRows : overscanRows;
      const start = Math.max(0, range.startIndex - before);
      const end = Math.min(range.count - 1, range.endIndex + after);
      const out: number[] = [];
      for (let i = start; i <= end; i++) out.push(i);
      return out;
    },
    [overscanRows, scrollOverscanRows]
  );

  const rowVirtualizer = useVirtualizer({
    count: rowsEnabled ? recordsCount : 0,
    getScrollElement: () => scrollViewportRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: overscanRows,
    rangeExtractor: rowRangeExtractor,
  });

  // ── COLUMN virtualizer ───────────────────────────────────────────────────
  // Map of virtualizable index → index in the original `columns` array.
  // We virtualize non-hidden columns minus any pinned ones — pinned columns
  // are always rendered (outside the spacer window in DataTableHeader / Row /
  // Footer / FilterRow) so their widths must be excluded from the spacer
  // offset math here.
  const { virtualizableIndices, virtualizableWidths } = useMemo(() => {
    const indices: number[] = [];
    const widths: number[] = [];
    if (!columnsEnabled) return { virtualizableIndices: indices, virtualizableWidths: widths };
    for (let i = 0; i < columns.length; i++) {
      const c = columns[i]!;
      if (c.hidden) continue;
      if (i === pinnedFirstIdx || i === pinnedLastIdx) continue;
      indices.push(i);
      widths.push(widthOrEstimate(c, estimateColumnWidth));
    }
    return { virtualizableIndices: indices, virtualizableWidths: widths };
  }, [columns, columnsEnabled, estimateColumnWidth, pinnedFirstIdx, pinnedLastIdx]);

  const colRangeExtractor = useCallback(
    (range: Range): number[] => {
      const idle = !isScrollingRef.current || scrollDirectionHRef.current === 'idle';
      const before =
        idle
          ? overscanColumns
          : scrollDirectionHRef.current === 'left'
            ? scrollOverscanColumns
            : overscanColumns;
      const after =
        idle
          ? overscanColumns
          : scrollDirectionHRef.current === 'right'
            ? scrollOverscanColumns
            : overscanColumns;
      const start = Math.max(0, range.startIndex - before);
      const end = Math.min(range.count - 1, range.endIndex + after);
      const out: number[] = [];
      for (let i = start; i <= end; i++) out.push(i);
      return out;
    },
    [overscanColumns, scrollOverscanColumns]
  );

  const columnVirtualizer = useVirtualizer({
    count: columnsEnabled ? virtualizableIndices.length : 0,
    horizontal: true,
    getScrollElement: () => scrollViewportRef.current,
    estimateSize: (i) => virtualizableWidths[i] ?? estimateColumnWidth,
    overscan: overscanColumns,
    rangeExtractor: colRangeExtractor,
  });

  // ── Imperative scroll listener (refs + DOM attribute, no React commit) ────
  useEffect(() => {
    if (!rowsEnabled && !columnsEnabled) return;
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const onScroll = () => {
      const dy = viewport.scrollTop - lastScrollTopRef.current;
      const dx = viewport.scrollLeft - lastScrollLeftRef.current;
      lastScrollTopRef.current = viewport.scrollTop;
      lastScrollLeftRef.current = viewport.scrollLeft;

      if (dy !== 0) scrollDirectionVRef.current = dy > 0 ? 'down' : 'up';
      if (dx !== 0) scrollDirectionHRef.current = dx > 0 ? 'right' : 'left';

      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        viewport.setAttribute(DATA_SCROLLING_ATTR, '');
      }

      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollDirectionVRef.current = 'idle';
        scrollDirectionHRef.current = 'idle';
        viewport.removeAttribute(DATA_SCROLLING_ATTR);
      }, scrollEndDelayMs);
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    sizeRef(viewport);
    return () => {
      viewport.removeEventListener('scroll', onScroll);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      viewport.removeAttribute(DATA_SCROLLING_ATTR);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsEnabled, columnsEnabled, scrollEndDelayMs, sizeRef]);

  const virtualRows = rowsEnabled ? rowVirtualizer.getVirtualItems() : [];
  const virtualCols = columnsEnabled ? columnVirtualizer.getVirtualItems() : [];

  const { leadingRowsHeight, trailingRowsHeight } = useMemo(() => {
    if (!rowsEnabled || virtualRows.length === 0) {
      return { leadingRowsHeight: 0, trailingRowsHeight: 0 };
    }
    const totalSize = rowVirtualizer.getTotalSize();
    const first = virtualRows[0]!;
    const last = virtualRows[virtualRows.length - 1]!;
    return {
      leadingRowsHeight: first.start,
      trailingRowsHeight: Math.max(0, totalSize - last.end),
    };
  }, [rowsEnabled, virtualRows, rowVirtualizer]);

  // ── Visible-column Set with content-stable identity (invariant #5) ───────
  // Always seed with the pinned indices (when present) — pinned cells must
  // stay in the DOM at all scroll positions for sticky-left / sticky-right
  // to keep working.
  const prevVisibleSetRef = useRef<Set<number> | null>(null);
  const visibleColumns = useMemo<Set<number> | null>(() => {
    if (!columnsEnabled) {
      prevVisibleSetRef.current = null;
      return null;
    }
    const next = new Set<number>();
    if (pinnedFirstIdx >= 0) next.add(pinnedFirstIdx);
    if (pinnedLastIdx >= 0) next.add(pinnedLastIdx);
    for (const v of virtualCols) {
      const effIdx = virtualizableIndices[v.index];
      if (effIdx !== undefined) next.add(effIdx);
    }
    const prev = prevVisibleSetRef.current;
    if (prev && setsHaveSameMembers(prev, next)) return prev;
    prevVisibleSetRef.current = next;
    return next;
  }, [columnsEnabled, virtualCols, virtualizableIndices, pinnedFirstIdx, pinnedLastIdx]);

  // ── CSS-variable channel for spacer column widths (invariant #4) ─────────
  // Writes happen on every horizontal scroll tick — but they're DOM-only, so the
  // memo chain in row/cell never sees them.
  useLayoutEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    if (!columnsEnabled) {
      viewport.style.removeProperty(VAR_LEADING_COL_WIDTH);
      viewport.style.removeProperty(VAR_TRAILING_COL_WIDTH);
      return;
    }
    const totalWidth = columnVirtualizer.getTotalSize();
    const first = virtualCols[0];
    const last = virtualCols[virtualCols.length - 1];
    const leading = first?.start ?? 0;
    const trailing = last ? Math.max(0, totalWidth - last.end) : 0;
    viewport.style.setProperty(VAR_LEADING_COL_WIDTH, `${leading}px`);
    viewport.style.setProperty(VAR_TRAILING_COL_WIDTH, `${trailing}px`);
  });

  if (process.env.NODE_ENV !== 'production') {
    if (rowsEnabled && !config?.estimateRowHeight) {
      // eslint-disable-next-line no-console
      console.warn(
        '[mantine-datatable] virtualization.rows is on but `estimateRowHeight` is missing — falling back to 40px.'
      );
    }
    if (columnsEnabledRequested && !columnsCompatible) {
      // eslint-disable-next-line no-console
      console.warn(
        '[mantine-datatable] virtualization.columns is incompatible with column groups — column virtualization disabled.'
      );
    }
  }

  return {
    rowsEnabled,
    columnsEnabled,
    rowVirtualizer: rowsEnabled ? rowVirtualizer : null,
    columnVirtualizer: columnsEnabled ? columnVirtualizer : null,
    virtualRows,
    visibleColumns,
    pinnedFirstIdx: columnsEnabled ? pinnedFirstIdx : -1,
    pinnedLastIdx: columnsEnabled ? pinnedLastIdx : -1,
    leadingRowsHeight,
    trailingRowsHeight,
  };
}
