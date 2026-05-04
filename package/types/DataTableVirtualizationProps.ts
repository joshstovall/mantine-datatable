/**
 * Opt-in virtualization config for `<DataTable>`. Pass to `virtualization` to enable.
 *
 * Powered by `@tanstack/react-virtual` (declared as an optional peer dependency — only
 * required at runtime when this prop is set).
 *
 * Off by default. When set:
 * - `rows: true` (default when prop is set) virtualizes the body. Requires
 *   `estimateRowHeight`. Incompatible with `rowExpansion` — that combo is ignored.
 * - `columns: true` virtualizes columns. Worth it ~30+ columns. Every virtualizable
 *   column should declare a numeric `width`. Incompatible with column groups
 *   (multi-row headers).
 *
 * The implementation keeps real `<tr>`/`<td>` elements (uses spacer rows + spacer
 * cells, not absolute positioning) so sticky pinning, striped backgrounds, and
 * footer alignment survive. `table-layout: fixed` is forced whenever any virt is on.
 */
export type DataTableVirtualizationProps = {
  /**
   * Virtualize body rows. Defaults to `true` when `virtualization` is set.
   * Set to `false` for column-only virt.
   */
  rows?: boolean;

  /**
   * Virtualize columns. Defaults to `false`. Only worth enabling at ~30+ columns.
   * Every virtualizable column should declare a numeric `width`.
   */
  columns?: boolean;

  /**
   * Required when `rows: true`. Pixel estimate used until each row's actual height
   * is measured. Make this close to the *median* row height — not the maximum.
   */
  estimateRowHeight?: number;

  /**
   * Pixel estimate for any virtualizable column that doesn't declare a numeric
   * `width`. Recommended: declare `width` on every column when `columns: true`,
   * and use this only as a fallback.
   * @default `160`
   */
  estimateColumnWidth?: number;

  /**
   * How many idle rows to render above/below the viewport when not actively scrolling.
   * Each rendered row mounts real DOM, so keep this modest.
   * @default `10`
   */
  overscanRows?: number;

  /**
   * How many idle columns to render left/right of the viewport when not scrolling.
   * @default `6`
   */
  overscanColumns?: number;

  /**
   * Mid-scroll, the look-ahead is widened in the scroll direction so fast inertial
   * flicks don't unmount visible rows. Defaults to `overscanRows × 3`.
   */
  scrollOverscanRows?: number;

  /**
   * Mid-scroll horizontal extension. Defaults to `overscanColumns × 3`.
   */
  scrollOverscanColumns?: number;

  /**
   * How long after the last scroll event before reverting from `scrollOverscan*`
   * to `overscan*` and re-enabling pointer events on rows.
   * @default `150`
   */
  scrollEndDelayMs?: number;
};
