import { TableTh, TableTr } from '@mantine/core';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { ColumnFilterRenderer } from './filters/ColumnFilterRenderer';
import { columnRendersInFilterRow } from './filters/resolveColumnFilter';
import type { DataTableColumn, DataTableFiltersValue } from './types';
import { humanize } from './utils';

type DataTableFilterRowProps<T> = {
  columns: DataTableColumn<T>[];
  defaultColumnProps: Omit<DataTableColumn<T>, 'accessor'> | undefined;
  selectionVisible: boolean;
  filters: DataTableFiltersValue | undefined;
  onFiltersChange: ((next: DataTableFiltersValue) => void) | undefined;
  /** Column-virt visible-set. When set, render only matching columns flanked by spacers. */
  visibleColumns: Set<number> | null;
};

export function DataTableFilterRow<T>({
  columns,
  defaultColumnProps,
  selectionVisible,
  filters,
  onFiltersChange,
  visibleColumns,
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

  return (
    <TableTr className="mantine-datatable-filter-row">
      {selectionVisible ? <TableTh className="mantine-datatable-filter-row-selector-cell" /> : null}
      {visibleColumns ? (
        <TableTh className="mantine-datatable-virt-leading-spacer" aria-hidden="true" />
      ) : null}
      {columns.map((columnProps, columnIndex) => {
        if (columnProps.hidden) return null;
        if (visibleColumns && !visibleColumns.has(columnIndex)) return null;
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
            className={clsx('mantine-datatable-filter-row-cell', merged.titleClassName)}
            style={{
              width: merged.width,
              ...(merged.resizable ? {} : { minWidth: merged.width, maxWidth: merged.width }),
            }}
          >
            {columnRendersInFilterRow(merged.filterCell, merged.columnFilter) ? cellNode : null}
          </TableTh>
        );
      })}
      {visibleColumns ? (
        <TableTh className="mantine-datatable-virt-trailing-spacer" aria-hidden="true" />
      ) : null}
    </TableTr>
  );
}
