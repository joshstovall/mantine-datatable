/**
 * Controlled filter state for a {@link DataTable}.
 *
 * Keys are column accessors (or any string the consumer chooses). Values are opaque to
 * the component — the consumer is still responsible for actually applying these to the
 * `records` they pass in.
 */
export type DataTableFiltersValue = Record<string, unknown>;

/**
 * Visibility mode for the inline filter row that appears beneath the column titles.
 *
 * - `'auto'` (default) — show the row whenever at least one visible column has a
 *   `filterCell` ReactNode or a `columnFilter` configured to render in the cell.
 * - `true` — always show the row.
 * - `false` — never show the row.
 */
export type DataTableWithFilterRow = 'auto' | boolean;
