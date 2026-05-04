import {
  Checkbox,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Stack,
  TableThead,
  TableTr,
  type CheckboxProps,
  type MantineStyleProp,
} from '@mantine/core';
import clsx from 'clsx';
import { useState } from 'react';
import { DataTableColumnGroupHeaderCell } from './DataTableColumnGroupHeaderCell';
import { useDataTableColumnsContext } from './DataTableColumns.context';
import { DataTableFilterRow } from './DataTableFilterRow';
import { DataTableHeaderCell } from './DataTableHeaderCell';
import { DataTableHeaderSelectorCell } from './DataTableHeaderSelectorCell';
import { ColumnFilterRenderer } from './filters/ColumnFilterRenderer';
import { columnRendersInFilterRow, isAccessorFiltering } from './filters/resolveColumnFilter';
import type { DataTableColumnToggle } from './hooks';
import type {
  DataTableColumn,
  DataTableColumnGroup,
  DataTableFiltersValue,
  DataTableSelectionTrigger,
  DataTableSortProps,
  DataTableWithFilterRow,
} from './types';
import { getGroupsAtDepth, getMaxGroupDepth, humanize } from './utils';

type DataTableHeaderProps<T> = {
  selectionColumnHeaderRef: React.ForwardedRef<HTMLTableCellElement>;
  className: string | undefined;
  style?: MantineStyleProp;
  sortStatus: DataTableSortProps<T>['sortStatus'];
  sortIcons: DataTableSortProps<T>['sortIcons'];
  onSortStatusChange: DataTableSortProps<T>['onSortStatusChange'];
  columns: DataTableColumn<T>[];
  defaultColumnProps: Omit<DataTableColumn<T>, 'accessor'> | undefined;
  groups: readonly DataTableColumnGroup<T>[] | undefined;
  selectionTrigger: DataTableSelectionTrigger;
  selectionVisible: boolean;
  selectionChecked: boolean;
  selectionIndeterminate: boolean;
  onSelectionChange: (() => void) | undefined;
  selectionCheckboxProps: CheckboxProps;
  selectorCellShadowVisible: boolean;
  selectionColumnClassName: string | undefined;
  selectionColumnStyle: MantineStyleProp;
  withColumnBorders?: boolean;
  filters: DataTableFiltersValue | undefined;
  onFiltersChange: ((next: DataTableFiltersValue) => void) | undefined;
  withFilterRow: DataTableWithFilterRow;
  /** When set (column virt on) the title row renders only columns whose index is in
   *  the Set, flanked by leading/trailing spacer `<th>`s sized via CSS variables. */
  visibleColumns: Set<number> | null;
  ref: React.Ref<HTMLTableSectionElement>;
};

export function DataTableHeader<T>({
  selectionColumnHeaderRef,
  className,
  style,
  sortStatus,
  sortIcons,
  onSortStatusChange,
  columns,
  defaultColumnProps,
  groups,
  selectionTrigger,
  selectionVisible,
  selectionChecked,
  selectionIndeterminate,
  onSelectionChange,
  selectionCheckboxProps,
  selectorCellShadowVisible,
  selectionColumnClassName,
  selectionColumnStyle,
  withColumnBorders = false,
  filters,
  onFiltersChange,
  withFilterRow,
  visibleColumns,
  ref,
}: DataTableHeaderProps<T>) {
  const maxGroupDepth = groups ? getMaxGroupDepth(groups) : 0;
  const totalHeaderRows = maxGroupDepth > 0 ? maxGroupDepth + 1 : 1;

  const allRecordsSelectorCell = selectionVisible ? (
    <DataTableHeaderSelectorCell
      ref={selectionColumnHeaderRef}
      className={selectionColumnClassName}
      style={selectionColumnStyle}
      trigger={selectionTrigger}
      shadowVisible={selectorCellShadowVisible}
      checked={selectionChecked}
      indeterminate={selectionIndeterminate}
      checkboxProps={selectionCheckboxProps}
      onChange={onSelectionChange}
      rowSpan={groups ? totalHeaderRows : undefined}
    />
  ) : null;

  const { columnsToggle, setColumnsToggle } = useDataTableColumnsContext();
  const [columnsPopoverOpened, setColumnsPopoverOpened] = useState<boolean>(false);
  const someColumnsToggleable = columns.some((column) => column.toggleable);

  const columnToggleCheckboxLabels = someColumnsToggleable
    ? Object.fromEntries(columns.map(({ accessor, title }) => [accessor, title ?? humanize(String(accessor))]))
    : undefined;

  const content = (
    <TableThead
      className={clsx('mantine-datatable-header', className)}
      style={style}
      ref={ref}
      onContextMenu={
        someColumnsToggleable
          ? (e) => {
              e.preventDefault();
              setColumnsPopoverOpened((columnsPopoverOpened) => !columnsPopoverOpened);
            }
          : undefined
      }
    >
      {groups &&
        Array.from({ length: maxGroupDepth }, (_, depthIndex) => {
          const groupsAtDepth = getGroupsAtDepth(groups, depthIndex);

          return (
            <TableTr key={`group-depth-${depthIndex}`}>
              {depthIndex === 0 && allRecordsSelectorCell}
              {groupsAtDepth.map((group, index) => {
                return (
                  <DataTableColumnGroupHeaderCell
                    key={group.id}
                    group={group}
                    maxDepth={maxGroupDepth}
                    currentDepth={depthIndex}
                    previousGroups={groupsAtDepth.slice(0, index)}
                    isLastGroup={index === groupsAtDepth.length - 1}
                    withColumnBorders={withColumnBorders}
                    totalTableColumns={columns.length}
                  />
                );
              })}
            </TableTr>
          );
        })}

      <TableTr>
        {!groups && allRecordsSelectorCell}
        {visibleColumns ? (
          <th className="mantine-datatable-virt-leading-spacer" aria-hidden="true" />
        ) : null}

        {columns.map(({ hidden, ...columnProps }, index) => {
          if (hidden) return null;
          if (visibleColumns && !visibleColumns.has(index)) return null;

          const {
            accessor,
            visibleMediaQuery,
            textAlign,
            width,
            title,
            sortable,
            draggable,
            toggleable,
            resizable,
            titleClassName,
            titleStyle,
            filter,
            filterPopoverProps,
            filterPopoverDisableClickOutside,
            filtering,
            sortKey,
            columnFilter,
          } = { ...defaultColumnProps, ...columnProps };

          let resolvedFilter = filter;
          let resolvedFiltering = filtering;

          if (columnFilter && resolvedFilter === undefined) {
            const target = columnFilter.displayIn ?? 'cell';
            if (target === 'popover' || target === 'both') {
              const accessorString = accessor as string;
              const labelText =
                columnFilter.label ?? (typeof title === 'string' ? title : humanize(accessorString));
              resolvedFilter = ({ close }) => (
                <ColumnFilterRenderer
                  config={columnFilter}
                  value={filters?.[accessorString]}
                  setValue={(next: unknown) => {
                    if (!onFiltersChange) return;
                    const current = filters ?? {};
                    if (next === undefined) {
                      if (!(accessorString in current)) return;
                      const { [accessorString]: _removed, ...rest } = current;
                      onFiltersChange(rest);
                    } else {
                      onFiltersChange({ ...current, [accessorString]: next });
                    }
                  }}
                  close={close}
                  target="popover"
                  ariaLabel={typeof labelText === 'string' ? `Filter ${labelText}` : `Filter ${accessorString}`}
                />
              );
            }
          }

          if (columnFilter && resolvedFiltering === undefined) {
            resolvedFiltering = isAccessorFiltering(filters, accessor as string);
          }

          return (
            <DataTableHeaderCell<T>
              key={accessor as React.Key}
              accessor={accessor}
              className={titleClassName}
              style={titleStyle}
              visibleMediaQuery={visibleMediaQuery}
              textAlign={textAlign}
              width={width}
              title={title}
              sortable={sortable}
              draggable={draggable}
              toggleable={toggleable}
              // we won't display the resize handle for the last column to avoid overflow render issues
              resizable={resizable && index < columns.length - 1}
              sortStatus={sortStatus}
              sortIcons={sortIcons}
              sortKey={sortKey}
              onSortStatusChange={onSortStatusChange}
              filter={resolvedFilter}
              filterPopoverProps={filterPopoverProps}
              filterPopoverDisableClickOutside={filterPopoverDisableClickOutside}
              filtering={resolvedFiltering}
            />
          );
        })}
        {visibleColumns ? (
          <th className="mantine-datatable-virt-trailing-spacer" aria-hidden="true" />
        ) : null}
      </TableTr>
      {(() => {
        if (withFilterRow === false) return null;
        const shouldRender =
          withFilterRow === true ||
          columns.some((c) => {
            if (c.hidden) return false;
            const merged = { ...defaultColumnProps, ...c };
            return columnRendersInFilterRow(merged.filterCell, merged.columnFilter);
          });
        if (!shouldRender) return null;
        return (
          <DataTableFilterRow<T>
            columns={columns}
            defaultColumnProps={defaultColumnProps}
            selectionVisible={selectionVisible}
            filters={filters}
            onFiltersChange={onFiltersChange}
            visibleColumns={visibleColumns}
          />
        );
      })()}
    </TableThead>
  );

  return someColumnsToggleable ? (
    <Popover position="bottom" withArrow shadow="md" opened={columnsPopoverOpened} onChange={setColumnsPopoverOpened}>
      <PopoverTarget>{content}</PopoverTarget>
      <PopoverDropdown>
        <Stack>
          {columnsToggle
            .filter((column) => column.toggleable)
            .map((column: DataTableColumnToggle) => {
              return (
                <Group key={column.accessor}>
                  <Checkbox
                    classNames={{ label: 'mantine-datatable-header-column-toggle-checkbox-label' }}
                    size="xs"
                    label={columnToggleCheckboxLabels![column.accessor]}
                    checked={column.toggled}
                    onChange={(e) => {
                      setColumnsToggle(
                        columnsToggle.map((c: DataTableColumnToggle) => {
                          if (c.accessor === column.accessor) {
                            return { ...c, toggled: e.currentTarget.checked };
                          }
                          return c;
                        })
                      );
                    }}
                  />
                </Group>
              );
            })}
        </Stack>
      </PopoverDropdown>
    </Popover>
  ) : (
    content
  );
}
