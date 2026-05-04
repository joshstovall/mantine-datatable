/**
 * DataTableRowCell — the single cell in a body row.
 *
 * Memoization invariant (load-bearing for virtualization perf): the cell is
 * `React.memo`'d, and every prop reaching it must be reference-stable across
 * renders that don't actually change cell content. In particular:
 *
 *  - DOM event handlers (`onClick`, `onDoubleClick`, `onContextMenu`) are built
 *    INSIDE the cell with `useMemo` from the *raw* consumer callback. Building
 *    them in the parent row leaks a fresh closure per cell per render and
 *    silently torches the memo.
 *
 *  - `cellsClassName` / `cellsStyle` function-form resolution also lives inside
 *    the cell — same reason.
 */
import { TableTd, type MantineStyleProp } from '@mantine/core';
import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { useMediaQueryStringOrFunction } from './hooks';
import type { DataTableCellClickHandler, DataTableColumn } from './types';
import {
  CONTEXT_MENU_CURSOR,
  ELLIPSIS,
  NOWRAP,
  POINTER_CURSOR,
  TEXT_ALIGN_CENTER,
  TEXT_ALIGN_LEFT,
  TEXT_ALIGN_RIGHT,
} from './utilityClasses';
import { getValueAtPath } from './utils';

export type DataTableRowCellProps<T> = {
  /** Merged column (column + defaultColumnProps) — pre-merged in the parent row. */
  column: DataTableColumn<T>;
  /** Index of this column among visible columns. */
  columnIndex: number;
  record: T;
  index: number;
  defaultRender:
    | ((record: T, index: number, accessor: keyof T | (string & NonNullable<unknown>)) => React.ReactNode)
    | undefined;
  /** Raw consumer-supplied handlers — kept as opaque references so memo identity holds. */
  onCellClick: DataTableCellClickHandler<T> | undefined;
  onCellDoubleClick: DataTableCellClickHandler<T> | undefined;
  onCellContextMenu: DataTableCellClickHandler<T> | undefined;
};

function DataTableRowCellInner<T>({
  column,
  columnIndex,
  record,
  index,
  defaultRender,
  onCellClick,
  onCellDoubleClick,
  onCellContextMenu,
}: DataTableRowCellProps<T>) {
  const {
    accessor,
    visibleMediaQuery,
    textAlign,
    width,
    noWrap,
    ellipsis,
    render,
    cellsClassName,
    cellsStyle,
    customCellAttributes,
  } = column;

  const onClick = useMemo<React.MouseEventHandler<HTMLTableCellElement> | undefined>(
    () =>
      onCellClick
        ? (event) => onCellClick({ event, record, index, column, columnIndex })
        : undefined,
    [onCellClick, record, index, column, columnIndex]
  );

  const onDoubleClick = useMemo<React.MouseEventHandler<HTMLTableCellElement> | undefined>(
    () =>
      onCellDoubleClick
        ? (event) => onCellDoubleClick({ event, record, index, column, columnIndex })
        : undefined,
    [onCellDoubleClick, record, index, column, columnIndex]
  );

  const onContextMenu = useMemo<React.MouseEventHandler<HTMLTableCellElement> | undefined>(
    () =>
      onCellContextMenu
        ? (event) => onCellContextMenu({ event, record, index, column, columnIndex })
        : undefined,
    [onCellContextMenu, record, index, column, columnIndex]
  );

  const resolvedClassName = useMemo(
    () => (typeof cellsClassName === 'function' ? cellsClassName(record, index) : cellsClassName),
    [cellsClassName, record, index]
  );

  const resolvedStyle = useMemo(
    () => cellsStyle?.(record, index),
    [cellsStyle, record, index]
  );

  const customAttrs = useMemo(
    () => customCellAttributes?.(record, index),
    [customCellAttributes, record, index]
  );

  if (!useMediaQueryStringOrFunction(visibleMediaQuery)) return null;

  return (
    <TableTd
      className={clsx(
        {
          [NOWRAP]: noWrap || ellipsis,
          [ELLIPSIS]: ellipsis,
          [POINTER_CURSOR]: onClick || onDoubleClick,
          [CONTEXT_MENU_CURSOR]: onContextMenu,
          [TEXT_ALIGN_LEFT]: textAlign === 'left',
          [TEXT_ALIGN_CENTER]: textAlign === 'center',
          [TEXT_ALIGN_RIGHT]: textAlign === 'right',
        },
        resolvedClassName
      )}
      style={[
        {
          width,
          minWidth: width,
          maxWidth: width,
        },
        resolvedStyle,
      ]}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      {...customAttrs}
    >
      {render
        ? render(record, index)
        : defaultRender
          ? defaultRender(record, index, accessor)
          : (getValueAtPath(record, accessor) as React.ReactNode)}
    </TableTd>
  );
}

// React.memo erases the generic — re-cast so generic call sites still typecheck.
export const DataTableRowCell = memo(DataTableRowCellInner) as <T>(
  props: DataTableRowCellProps<T>
) => React.ReactElement | null;
