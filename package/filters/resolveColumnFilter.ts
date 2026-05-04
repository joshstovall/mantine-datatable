import type { ReactNode } from 'react';
import type { DataTableColumn, DataTableColumnFilter, DataTableFiltersValue } from '../types';

export type ResolvedColumnFilter = {
  /**
   * What to render in the popover (next to the column title). May be a ReactNode or a render
   * function that receives `{ close }`. `undefined` means no popover for this column.
   */
  filter: DataTableColumn<unknown>['filter'];
  /** What to render inline beneath the column title. `undefined` means no cell for this column. */
  filterCell: ReactNode;
  /** Whether the column currently has an active filter (used to style the funnel icon). */
  filtering: boolean;
};

/**
 * Whether a column will end up rendering anything inline in the filter row, taking the
 * effective merged column props (column + defaultColumnProps) into account.
 */
export function columnRendersInFilterRow(
  filterCell: ReactNode,
  columnFilter: DataTableColumnFilter | undefined
): boolean {
  if (filterCell !== undefined && filterCell !== null && filterCell !== false) return true;
  if (!columnFilter) return false;
  const target = columnFilter.displayIn ?? 'cell';
  return target === 'cell' || target === 'both';
}

/**
 * Whether a value in the controlled filters map should count as "filter active".
 *
 * - `undefined` / `null` / empty string → not filtering.
 * - empty array → not filtering (multiselect cleared).
 * - 2-tuple of both undefined → not filtering (number/date range cleared).
 */
export function isFilterValueActive(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value === '') return false;
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    if (value.length === 2 && value[0] === undefined && value[1] === undefined) return false;
  }
  return true;
}

export function isAccessorFiltering(filters: DataTableFiltersValue | undefined, accessor: string): boolean {
  if (!filters) return false;
  return isFilterValueActive(filters[accessor]);
}
