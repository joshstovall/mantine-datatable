/**
 * DataTableRow — single body row.
 *
 * Memoization invariants (load-bearing for virtualization perf):
 *
 *  - The component is `React.memo`'d. Default shallow comparison.
 *
 *  - The merged-column array (`columns × defaultColumnProps`) is computed once
 *    per row mount with `useMemo`. When `defaultColumnProps` is undefined the
 *    consumer's `columns` reference is reused unchanged.
 *
 *  - Raw cell handlers (`onCellClick` etc) are forwarded to the cell as-is —
 *    the per-event closure is built INSIDE the cell. Building it here would
 *    leak a fresh closure per cell per render and torch the cell memo.
 */
import type { MantineTheme } from '@mantine/core';
import { TableTr, type CheckboxProps, type MantineColor, type MantineStyleProp } from '@mantine/core';
import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { DataTableRowCell } from './DataTableRowCell';
import { DataTableRowExpansion } from './DataTableRowExpansion';
import { DataTableRowSelectorCell } from './DataTableRowSelectorCell';
import { getRowCssVariables } from './cssVariables';
import type { useRowExpansion } from './hooks';
import type {
  DataTableCellClickHandler,
  DataTableColumn,
  DataTableDefaultColumnProps,
  DataTableProps,
  DataTableRowClickHandler,
  DataTableSelectionTrigger,
} from './types';
import { CONTEXT_MENU_CURSOR, POINTER_CURSOR } from './utilityClasses';

type DataTableRowProps<T> = {
  record: T;
  index: number;
  columns: DataTableColumn<T>[];
  defaultColumnProps: DataTableDefaultColumnProps<T> | undefined;
  defaultColumnRender:
    | ((record: T, index: number, accessor: keyof T | (string & NonNullable<unknown>)) => React.ReactNode)
    | undefined;
  selectionTrigger: DataTableSelectionTrigger;
  selectionVisible: boolean;
  selectionChecked: boolean;
  onSelectionChange: React.MouseEventHandler | undefined;
  isRecordSelectable: ((record: T, index: number) => boolean) | undefined;
  selectionCheckboxProps: CheckboxProps | undefined;
  getSelectionCheckboxProps: (record: T, index: number) => CheckboxProps;
  onClick: DataTableRowClickHandler<T> | undefined;
  onDoubleClick: DataTableRowClickHandler<T> | undefined;
  onContextMenu: DataTableRowClickHandler<T> | undefined;
  onCellClick: DataTableCellClickHandler<T> | undefined;
  onCellDoubleClick: DataTableCellClickHandler<T> | undefined;
  onCellContextMenu: DataTableCellClickHandler<T> | undefined;
  expansion: ReturnType<typeof useRowExpansion<T>>;
  customAttributes?: (record: T, index: number) => Record<string, unknown>;
  color:
    | ((record: T, index: number) => MantineColor | undefined | { light: MantineColor; dark: MantineColor })
    | undefined;
  backgroundColor:
    | ((record: T, index: number) => MantineColor | undefined | { light: MantineColor; dark: MantineColor })
    | undefined;
  className?: string | ((record: T, index: number) => string | undefined);
  style?: (record: T, index: number) => MantineStyleProp | undefined;
  selectorCellShadowVisible: boolean;
  selectionColumnClassName: string | undefined;
  selectionColumnStyle: MantineStyleProp | undefined;
  idAccessor: string;
  /** When set (column virtualization on), only render cells whose index is in the Set,
   *  flanked by leading/trailing spacer cells whose widths come from CSS variables.
   *  Identity-stable across no-op scroll ticks so the row's React.memo bails.
   */
  visibleColumns: Set<number> | null;
} & Pick<DataTableProps<T>, 'rowFactory'>;

function DataTableRowInner<T>({
  record,
  index,
  columns,
  defaultColumnProps,
  defaultColumnRender,
  selectionTrigger,
  selectionVisible,
  selectionChecked,
  onSelectionChange,
  isRecordSelectable,
  selectionCheckboxProps,
  getSelectionCheckboxProps,
  onClick,
  onDoubleClick,
  onContextMenu,
  onCellClick,
  onCellDoubleClick,
  onCellContextMenu,
  expansion,
  customAttributes,
  color,
  backgroundColor,
  className,
  style,
  selectorCellShadowVisible,
  selectionColumnClassName,
  selectionColumnStyle,
  rowFactory,
  visibleColumns,
}: Readonly<DataTableRowProps<T>>) {
  // Common case: no defaultColumnProps → reuse consumer reference unchanged.
  // Otherwise: compute the merged array once per (columns, defaults) change.
  // The cast is needed because spreading erases the `ellipsis xor noWrap` discriminator.
  const mergedColumns = useMemo<DataTableColumn<T>[]>(() => {
    if (!defaultColumnProps) return columns;
    return columns.map((c) => ({ ...defaultColumnProps, ...c }) as DataTableColumn<T>);
  }, [columns, defaultColumnProps]);

  const cols = (
    <>
      {selectionVisible && (
        <DataTableRowSelectorCell<T>
          className={selectionColumnClassName}
          style={selectionColumnStyle}
          record={record}
          index={index}
          trigger={selectionTrigger}
          withRightShadow={selectorCellShadowVisible}
          checked={selectionChecked}
          disabled={!onSelectionChange || (isRecordSelectable ? !isRecordSelectable(record, index) : false)}
          onChange={onSelectionChange}
          checkboxProps={selectionCheckboxProps}
          getCheckboxProps={getSelectionCheckboxProps}
        />
      )}

      {visibleColumns ? (
        <td className="mantine-datatable-virt-leading-spacer" aria-hidden="true" />
      ) : null}
      {mergedColumns.map((column, columnIndex) => {
        if (column.hidden || column.hiddenContent) return null;
        if (visibleColumns && !visibleColumns.has(columnIndex)) return null;
        return (
          <DataTableRowCell<T>
            key={column.accessor as React.Key}
            column={column}
            columnIndex={columnIndex}
            record={record}
            index={index}
            defaultRender={defaultColumnRender}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
            onCellContextMenu={onCellContextMenu}
          />
        );
      })}
      {visibleColumns ? (
        <td className="mantine-datatable-virt-trailing-spacer" aria-hidden="true" />
      ) : null}
    </>
  );

  const expandedElement = expansion && (
    <DataTableRowExpansion
      colSpan={mergedColumns.filter(({ hidden }) => !hidden).length + (selectionVisible ? 1 : 0)}
      open={expansion.isRowExpanded(record)}
      content={expansion.content({ record, index })}
      collapseProps={expansion.collapseProps}
    />
  );

  const rowProps = getRowProps({
    record,
    index,
    selectionChecked,
    onClick,
    onDoubleClick,
    onContextMenu,
    expansion,
    customAttributes,
    color,
    backgroundColor,
    className,
    style,
  });

  if (rowFactory) {
    return rowFactory({
      record,
      index,
      rowProps,
      children: cols,
      expandedElement,
    });
  }

  return (
    <>
      <TableTr {...rowProps}>{cols}</TableTr>
      {expandedElement}
    </>
  );
}

export const DataTableRow = memo(DataTableRowInner) as <T>(
  props: Readonly<DataTableRowProps<T>>
) => React.ReactElement | null;

type GetRowPropsArgs<T> = Readonly<
  Pick<
    DataTableRowProps<T>,
    | 'record'
    | 'index'
    | 'selectionChecked'
    | 'onClick'
    | 'onDoubleClick'
    | 'onContextMenu'
    | 'expansion'
    | 'customAttributes'
    | 'color'
    | 'backgroundColor'
    | 'className'
    | 'style'
  >
>;

export function getRowProps<T>({
  record,
  index,
  selectionChecked,
  onClick,
  onDoubleClick,
  onContextMenu,
  expansion,
  customAttributes,
  color,
  backgroundColor,
  className,
  style,
}: GetRowPropsArgs<T>) {
  return {
    className: clsx(
      'mantine-datatable-row',
      {
        [POINTER_CURSOR]:
          onClick || onDoubleClick || (expansion?.isExpandable({ record, index }) && expansion?.expandOnClick),
      },
      { [CONTEXT_MENU_CURSOR]: onContextMenu },
      typeof className === 'function' ? className(record, index) : className
    ),

    ['data-selected']: selectionChecked || undefined,
    // Index attribute survives virtualization unmounts — used by the virt-aware striped CSS
    // rule (Mantine's `:nth-child` would otherwise count spacer rows and shift colors on scroll).
    ['data-row-index']: index,
    ['data-stripe']: index % 2 === 0 ? 'even' : 'odd',

    onClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
      if (expansion) {
        const { isExpandable, isRowExpanded, expandOnClick, expandRow, collapseRow } = expansion;
        if (isExpandable({ record, index }) && expandOnClick) {
          if (isRowExpanded(record)) {
            collapseRow(record);
          } else {
            expandRow(record);
          }
        }
      }
      onClick?.({ event: e, record, index });
    },
    onDoubleClick: onDoubleClick
      ? (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => onDoubleClick({ event: e, record, index })
      : undefined,
    onContextMenu: onContextMenu
      ? (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => onContextMenu({ event: e, record, index })
      : undefined,
    style: [
      color || backgroundColor
        ? (theme: MantineTheme) => {
            const colorValue = color?.(record, index);
            const backgroundColorValue = backgroundColor?.(record, index);
            return getRowCssVariables({ theme, color: colorValue, backgroundColor: backgroundColorValue });
          }
        : undefined,
      style?.(record, index),
    ],
    ...(customAttributes?.(record, index) ?? {}),
  };
}
