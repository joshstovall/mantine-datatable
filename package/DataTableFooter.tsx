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
  /** Column index to render before the leading spacer (sticky-left). `-1` when off. */
  pinnedFirstIdx: number;
  /** Column index to render after the trailing spacer (sticky-right). `-1` when off. */
  pinnedLastIdx: number;
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
  pinnedFirstIdx,
  pinnedLastIdx,
  ref,
}: DataTableFooterProps<T>) {
  const renderFooterCell = (index: number) => {
    const columnProps = columns[index];
    if (!columnProps || columnProps.hidden) return null;
    const { accessor, visibleMediaQuery, textAlign, width, footer, footerClassName, footerStyle, noWrap, ellipsis } = {
      ...defaultColumnProps,
      ...columnProps,
    };
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
  };

  return (
    <TableTfoot ref={ref} className={clsx('mantine-datatable-footer', className)} style={style}>
      <TableTr>
        {selectionVisible && <DataTableFooterSelectorPlaceholderCell shadowVisible={selectorCellShadowVisible} />}
        {visibleColumns && pinnedFirstIdx >= 0 ? renderFooterCell(pinnedFirstIdx) : null}
        {visibleColumns ? (
          <td className="mantine-datatable-virt-leading-spacer" aria-hidden="true" />
        ) : null}
        {columns.map((_columnProps, index) => {
          if (visibleColumns && !visibleColumns.has(index)) return null;
          if (visibleColumns && (index === pinnedFirstIdx || index === pinnedLastIdx)) return null;
          return renderFooterCell(index);
        })}
        {visibleColumns ? (
          <td className="mantine-datatable-virt-trailing-spacer" aria-hidden="true" />
        ) : null}
        {visibleColumns && pinnedLastIdx >= 0 ? renderFooterCell(pinnedLastIdx) : null}
      </TableTr>
    </TableTfoot>
  );
}
