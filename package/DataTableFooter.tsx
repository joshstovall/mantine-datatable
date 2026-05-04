import { TableTfoot, TableTr, type MantineStyleProp } from '@mantine/core';
import clsx from 'clsx';
import { DataTableFooterCell } from './DataTableFooterCell';
import { DataTableFooterSelectorPlaceholderCell } from './DataTableFooterSelectorPlaceholderCell';
import type { DataTableColumn, DataTableDefaultColumnProps } from './types';

type DataTableFooterProps<T> = {
  className: string | undefined;
  style: MantineStyleProp | undefined;
  columns: DataTableColumn<T>[];
  defaultColumnProps: DataTableDefaultColumnProps<T> | undefined;
  selectionVisible: boolean;
  selectorCellShadowVisible: boolean;
  /** Column-virt visible-set. When set, render only matching columns flanked by spacers. */
  visibleColumns: Set<number> | null;
  ref: React.Ref<HTMLTableSectionElement>;
};

export function DataTableFooter<T>({
  className,
  style,
  columns,
  defaultColumnProps,
  selectionVisible,
  selectorCellShadowVisible,
  visibleColumns,
  ref,
}: DataTableFooterProps<T>) {
  return (
    <TableTfoot ref={ref} className={clsx('mantine-datatable-footer', className)} style={style}>
      <TableTr>
        {selectionVisible && <DataTableFooterSelectorPlaceholderCell shadowVisible={selectorCellShadowVisible} />}
        {visibleColumns ? (
          <td className="mantine-datatable-virt-leading-spacer" aria-hidden="true" />
        ) : null}
        {columns.map(({ hidden, ...columnProps }, index) => {
          if (hidden) return null;
          if (visibleColumns && !visibleColumns.has(index)) return null;

          const {
            accessor,
            visibleMediaQuery,
            textAlign,
            width,
            footer,
            footerClassName,
            footerStyle,
            noWrap,
            ellipsis,
          } = { ...defaultColumnProps, ...columnProps };

          return (
            <DataTableFooterCell<T>
              key={accessor as React.Key}
              className={footerClassName}
              style={footerStyle}
              visibleMediaQuery={visibleMediaQuery}
              textAlign={textAlign}
              width={width}
              title={footer}
              noWrap={noWrap}
              ellipsis={ellipsis}
            />
          );
        })}
        {visibleColumns ? (
          <td className="mantine-datatable-virt-trailing-spacer" aria-hidden="true" />
        ) : null}
      </TableTr>
    </TableTfoot>
  );
}
