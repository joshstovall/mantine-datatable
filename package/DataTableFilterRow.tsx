import { TableTh, TableTr } from '@mantine/core';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { ColumnFilterRenderer } from './filters/ColumnFilterRenderer';
import { columnRendersInFilterRow } from './filters/resolveColumnFilter';
import type { DataTableColumn, DataTableFiltersValue, DataTableHeaderCellClickHandler } from './types';
import { humanize } from './utils';

type DataTableFilterRowProps<T> = {
  columns: DataTableColumn<T>[];
  defaultColumnProps: Omit<DataTableColumn<T>, 'accessor'> | undefined;
  selectionVisible: boolean;
  filters: DataTableFiltersValue | undefined;
  onFiltersChange: ((next: DataTableFiltersValue) => void) | undefined;
  onFilterCellContextMenu: DataTableHeaderCellClickHandler<T> | undefined;
  /** Column-virt visible-set. When set, render only matching columns flanked by spacers. */
  visibleColumns: Set<number> | null;
  /** Column index to render before the leading spacer (sticky-left). `-1` when off. */
  pinnedFirstIdx: number;
  /** Column index to render after the trailing spacer (sticky-right). `-1` when off. */
  pinnedLastIdx: number;
};

export function DataTableFilterRow<T>({
  columns,
  defaultColumnProps,
  selectionVisible,
  filters,
  onFiltersChange,
  onFilterCellContextMenu,
  visibleColumns,
  pinnedFirstIdx,
  pinnedLastIdx,
}: DataTableFilterRowProps<T>) {
  const setColumnValue = (accessor: string) => (next: unknown) => {
    if (!onFiltersChange) return;
    const current = filters ?? {};
    if (next === undefined) {
      if (!(accessor in current)) return;
      const { [accessor]: _removed, ...rest } = current;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...current, [accessor]: next });
    }
  };

  // Per-cell renderer; identical contract to the inline `.map()` below but
  // pulled into a closure so the pinned-first / pinned-last slots can share
  // it. `columnIndex` is always the index in the original `columns` array.
  const renderFilterCell = (columnIndex: number): ReactNode => {
    const columnProps = columns[columnIndex];
    if (!columnProps || columnProps.hidden) return null;

    const merged = { ...defaultColumnProps, ...columnProps };
    const accessor = merged.accessor as string;

    let cellNode: ReactNode = merged.filterCell;

    if (cellNode === undefined && merged.columnFilter) {
      const target = merged.columnFilter.displayIn ?? 'cell';
      if (target === 'cell' || target === 'both') {
        const accessorLabel =
          merged.columnFilter.label ??
          (typeof merged.title === 'string' ? merged.title : humanize(accessor));
        cellNode = (
          <ColumnFilterRenderer
            config={merged.columnFilter}
            value={filters?.[accessor]}
            setValue={setColumnValue(accessor)}
            close={() => {}}
            target="cell"
            ariaLabel={
              typeof accessorLabel === 'string' ? `Filter ${accessorLabel}` : `Filter ${accessor}`
            }
          />
        );
      }
    }

    return (
      <TableTh
        key={accessor as React.Key}
        data-accessor={accessor}
        // Filter cells opt out of column-reorder drag and click-to-sort
        // gestures inherited from the header above. `DataTableHeaderCell`
        // walks ancestors looking for `[data-no-drag]` to decide whether
        // to honour a drag/sort, so emitting it here is the contract.
        data-no-drag=""
        className={clsx('mantine-datatable-filter-row-cell', merged.titleClassName)}
        style={{
          width: merged.width,
          ...(merged.resizable ? {} : { minWidth: merged.width, maxWidth: merged.width }),
        }}
        onContextMenu={
          onFilterCellContextMenu
            ? (event) => {
                onFilterCellContextMenu({ event, column: columnProps as DataTableColumn<T>, columnIndex });
              }
            : undefined
        }
      >
        {columnRendersInFilterRow(merged.filterCell, merged.columnFilter) ? cellNode : null}
      </TableTh>
    );
  };

  return (
    <TableTr className="mantine-datatable-filter-row">
      {selectionVisible ? <TableTh className="mantine-datatable-filter-row-selector-cell" /> : null}
      {visibleColumns && pinnedFirstIdx >= 0 ? renderFilterCell(pinnedFirstIdx) : null}
      {visibleColumns ? (
        <TableTh className="mantine-datatable-virt-leading-spacer" aria-hidden="true" />
      ) : null}
      {columns.map((_columnProps, columnIndex) => {
        if (visibleColumns && !visibleColumns.has(columnIndex)) return null;
        if (visibleColumns && (columnIndex === pinnedFirstIdx || columnIndex === pinnedLastIdx)) return null;
        return renderFilterCell(columnIndex);
      })}
      {visibleColumns ? (
        <TableTh className="mantine-datatable-virt-trailing-spacer" aria-hidden="true" />
      ) : null}
      {visibleColumns && pinnedLastIdx >= 0 ? renderFilterCell(pinnedLastIdx) : null}
    </TableTr>
  );
}
