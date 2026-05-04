import type {
  MantineShadow,
  MantineStyleProp,
  ScrollAreaProps,
  StylesRecord,
  TableProps,
  TableTrProps,
} from '@mantine/core';
import type { DataTableCellClickHandler } from './DataTableCellClickHandler';
import type { DataTableColorProps } from './DataTableColorProps';
import type { DataTableColumnProps } from './DataTableColumnProps';
import type { DataTableDefaultColumnProps } from './DataTableDefaultColumnProps';
import type { DataTableEmptyStateProps } from './DataTableEmptyStateProps';
import type { DataTableFiltersValue, DataTableWithFilterRow } from './DataTableFilters';
import type { DataTableLoaderProps } from './DataTableLoaderProps';
import type { DataTableRef } from './DataTableRef';
import type { DataTableVirtualizationProps } from './DataTableVirtualizationProps';
import type { DataTableOuterBorderProps } from './DataTableOuterBorderProps';
import type { DataTablePaginationProps } from './DataTablePaginationProps';
import type { DataTableRowClickHandler } from './DataTableRowClickHandler';
import type { DataTableRowExpansionProps } from './DataTableRowExpansionProps';
import type { DataTableScrollProps } from './DataTableScrollProps';
import type { DataTableSelectionProps } from './DataTableSelectionProps';
import type { DataTableSortProps } from './DataTableSortProps';
import type { DataTableVerticalAlign } from './DataTableVerticalAlign';

export type DataTableProps<T = Record<string, unknown>> = {
  /**
   * Data table container class name.
   */
  className?: string;

  /**
   * Data table container style.
   * Either a style object or a function that accepts current theme and returns a style object.
   */
  style?: MantineStyleProp;

  /**
   * Data table elements class names.
   * An object with `root`, `table`, `header`, `footer` and `pagination` keys and class names
   * as values.
   */
  classNames?: Partial<Record<'root' | 'table' | 'header' | 'footer' | 'pagination', string>>;

  /**
   * Data table elements styles.
   * An object with `root`, `table`, `header`, `footer` and `pagination` keys and
   * either style objects, or functions that accept current theme and return style objects, as values.
   */
  styles?: StylesRecord<'root' | 'table' | 'header' | 'footer' | 'pagination', MantineStyleProp>;

  /**
   * Table height.
   * @default '100%'
   */
  height?: string | number;

  /**
   * Minimum table height.
   */
  minHeight?: string | number;

  /**
   * Maximum table height.
   */
  maxHeight?: string | number;

  /**
   * DataTable component shadow.
   */
  shadow?: MantineShadow;

  /**
   * If true, the user will not be able to select text.
   */
  textSelectionDisabled?: boolean;

  /**
   * Vertical alignment for row cells.
   * @default `center`
   */
  verticalAlign?: DataTableVerticalAlign;

  /**
   * If true, will show a loader with semi-transparent background, centered over the table.
   */
  fetching?: boolean;

  /**
   * If true, the first column will be pinned to the left side of the table.
   */
  pinFirstColumn?: boolean;

  /**
   * If true, the last column will be pinned to the right side of the table.
   */
  pinLastColumn?: boolean;

  /**
   * Default column props; will be merged with column props provided to each column
   */
  defaultColumnProps?: DataTableDefaultColumnProps<T>;

  /**
   * If you want to use drag and drop as well as toggle to reorder and toggle columns
   * provide a unique key which will be used to store the column order in localStorage.
   */
  storeColumnsKey?: string | undefined;

  /**
   * A default render function for all columns.
   * Accepts the current record, its index in `records` and the column `accessor` as
   * arguments and returns a React node (remember that a string is a valid React node too).
   */
  defaultColumnRender?: (
    record: T,
    index: number,
    accessor: keyof T | (string & NonNullable<unknown>)
  ) => React.ReactNode;

  /**
   * Accessor to use as unique record key.
   * Can be a string representing a property name or a function receiving the current record
   * and returning a unique value.
   * If you're providing a string, you can use dot-notation for nested objects property drilling
   * (i.e. `department.name` or `department.company.name`).
   * @default `id`
   */
  idAccessor?: (keyof T | (string & NonNullable<unknown>)) | ((record: T) => React.Key);

  /**
   * Visible records.
   * The component will try to infer its row type from here.
   */
  records?: T[];

  /**
   * Text to show on empty state and pagination footer when no records are available.
   */
  noRecordsText?: string;

  /**
   * If true, the table will not show the header with column titles.
   */
  noHeader?: boolean;

  /**
   * Function to call when a row cell is clicked.
   * Receives an object with the current record, its index in `records`, the current column,
   * its index in `columns` and the click event as properties.
   */
  onCellClick?: DataTableCellClickHandler<T>;

  /**
   * Function to call when a row cell is double-clicked.
   * Receives an object with the current record, its index in `records`, the current column,
   * its index in `columns` and the click event as properties.
   */
  onCellDoubleClick?: DataTableCellClickHandler<T>;

  /**
   * Function to call when the user right-clicks on a row cell.
   * Receives an object with the current record, its index in `records`, the current column,
   * its index in `columns` and the click event as properties.
   */
  onCellContextMenu?: DataTableCellClickHandler<T>;

  /**
   * Function to call when a row is clicked.
   * Receives an object with the current record, its index in `records` and the click event
   * as properties.
   */
  onRowClick?: DataTableRowClickHandler<T>;

  /**
   * Function to call when a row is double-clicked.
   * Receives an object with the current record, its index in `records` and the click event
   * as properties.
   */
  onRowDoubleClick?: DataTableRowClickHandler<T>;

  /**
   * Function to call when the user right-clicks on a row.
   * Receives an object with the current record, its index in `records` and the click event
   * as properties.
   */
  onRowContextMenu?: DataTableRowClickHandler<T>;

  /**
   * Defines the row expansion behavior.
   */
  rowExpansion?: DataTableRowExpansionProps<T>;

  /**
   * Optional class name passed to each row.
   * Can be a string or a function receiving the current record and its index as arguments and returning a string.
   */
  rowClassName?: string | ((record: T, index: number) => string | undefined);

  /**
   * Optional style passed to each row.
   * A function receiving the current record and its index as arguments and returning either
   * a style object, or a function that accepts theme and returns a style object.
   */
  rowStyle?: (record: T, index: number) => MantineStyleProp | undefined;

  /**
   * Optional style passed to each row.
   * a function that receives the current record, its index, default row props and expanded element as arguments
   * and returns a React node representing the row.
   */
  rowFactory?: (props: {
    record: T;
    index: number;
    children: React.ReactNode;
    rowProps: TableTrProps;
    expandedElement?: React.ReactNode;
  }) => React.ReactNode;

  /**
   * Optional function returning a React node representing the table wrapper.
   * If not provided, no wrapper will be used.
   *
   * examplle: This function can be used with rowFactory if using drag and drop to pass context
   */
  tableWrapper?: ({ children }: { children: React.ReactNode }) => React.ReactNode;

  /**
   * Optional function returning an object of custom attributes to be applied to each row in the table.
   * Receives the current record and its index as arguments.
   * Useful for adding data attributes, handling middle-clicks, etc.
   */
  customRowAttributes?: (record: T, index: number) => Record<string, unknown>;

  /**
   * Ref pointing to the scrollable viewport element.
   * Useful for imperative scrolling.
   */
  scrollViewportRef?: React.RefObject<HTMLDivElement | null>;

  /**
   * Additional props passed to the underlying `ScrollArea` element.
   */
  scrollAreaProps?: Omit<ScrollAreaProps, 'classNames' | 'styles' | 'onScrollPositionChange'>;

  /**
   * Ref pointing to the table element.
   */
  tableRef?: ((instance: HTMLTableElement | null) => void) | React.RefObject<HTMLTableElement>;

  /**
   * Ref pointing to the table body element.
   */
  bodyRef?: ((instance: HTMLTableSectionElement | null) => void) | React.RefObject<HTMLTableSectionElement>;

  /**
   * Controlled filter values, keyed by column accessor. Mirrors the shape of
   * `sortStatus` / `onSortStatusChange`.
   *
   * Optional — if omitted, `column.filter` and `column.filterCell` continue to work
   * exactly as before with whatever uncontrolled state the consumer wires up.
   *
   * When provided alongside `column.columnFilter`, the built-in filter primitives read and
   * write this map automatically.
   */
  filters?: DataTableFiltersValue;

  /**
   * Called when a built-in filter primitive (configured via `column.columnFilter`) updates
   * its value. Receives the entire next filter map.
   */
  onFiltersChange?: (next: DataTableFiltersValue) => void;

  /**
   * Whether to render the inline filter row beneath the column titles.
   *
   * - `'auto'` (default): rendered when at least one visible column declares `filterCell`
   *   or a `columnFilter` that targets the cell.
   * - `true` / `false`: explicitly force on/off.
   */
  withFilterRow?: DataTableWithFilterRow;

  /**
   * Opt-in row and/or column virtualization. Off by default — pass an object to enable.
   *
   * Requires `@tanstack/react-virtual` to be installed (declared as an optional peer
   * dependency). Forces `table-layout: fixed` whenever any virtualization is on, so
   * column widths must come from `column.width` rather than auto-sizing.
   *
   * See {@link DataTableVirtualizationProps} for the full config surface.
   */
  virtualization?: DataTableVirtualizationProps;

  /**
   * Imperative API ref. After mount, exposes `scrollToIndex` / `scrollToRecord` for
   * programmatically scrolling the body — useful with row virtualization (e.g. to scroll
   * to a freshly created record without paginating).
   */
  dataTableRef?: React.RefObject<DataTableRef<T> | null> | ((api: DataTableRef<T> | null) => void);
} & Omit<
  TableProps,
  | 'onScroll'
  | 'className'
  | 'classNames'
  | 'style'
  | 'styles'
  | 'p'
  | 'px'
  | 'py'
  | 'pt'
  | 'pb'
  | 'layout'
  | 'captionSide'
  | 'c'
  | 'color'
  | 'borderColor'
  | 'stripedColor'
  | 'highlightOnHoverColor'
  | 'stickyHeader'
  | 'stickyHeaderOffset'
  | 'onDragEnd'
> &
  DataTableColorProps<T> &
  DataTableColumnProps<T> &
  DataTableOuterBorderProps &
  DataTableLoaderProps &
  DataTableEmptyStateProps &
  DataTablePaginationProps &
  DataTableSortProps<T> &
  DataTableScrollProps &
  DataTableSelectionProps<T>;
