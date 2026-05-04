import type { DataTableColumn } from './DataTableColumn';

/**
 * Click / context-menu handler signature for header (and filter-row) cells.
 *
 * Parallel to {@link DataTableRowClickHandler} but fired from a `<th>` rather
 * than a row. Receives the full column descriptor and its position in the
 * original `columns` array, so consumers can wire mantine-contextmenu (or
 * any other menu library) to a specific column header or filter cell.
 */
export type DataTableHeaderCellClickHandler<T = Record<string, unknown>> = (params: {
  /** The native React mouse event. */
  event: React.MouseEvent;
  /** Full column descriptor for the column whose header was interacted with. */
  column: DataTableColumn<T>;
  /** Position of the column in the original column array (pre-virtualization). */
  columnIndex: number;
}) => void;
