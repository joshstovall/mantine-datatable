import { ActionIcon, Box, Center, Flex, Group, TableTh, type MantineStyleProp, type MantineTheme } from '@mantine/core';
import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { useDataTableColumnsContext } from './DataTableColumns.context';
import { DataTableHeaderCellFilter } from './DataTableHeaderCellFilter';
import { DataTableResizableHeaderHandle } from './DataTableResizableHeaderHandle';
import { useMediaQueryStringOrFunction } from './hooks';
import { IconArrowUp } from './icons/IconArrowUp';
import { IconArrowsVertical } from './icons/IconArrowsVertical';
import { IconGripVertical } from './icons/IconGripVertical';
import { IconX } from './icons/IconX';
import type { DataTableColumn, DataTableHeaderCellClickHandler, DataTableSortProps } from './types';
import { ELLIPSIS, NOWRAP, TEXT_ALIGN_CENTER, TEXT_ALIGN_LEFT, TEXT_ALIGN_RIGHT } from './utilityClasses';
import { humanize } from './utils';

type DataTableHeaderCellProps<T> = {
  className: string | undefined;
  style: MantineStyleProp | undefined;
  visibleMediaQuery: string | ((theme: MantineTheme) => string) | undefined;
  title: React.ReactNode | undefined;
  sortStatus: DataTableSortProps<T>['sortStatus'];
  sortIcons: DataTableSortProps<T>['sortIcons'];
  onSortStatusChange: DataTableSortProps<T>['onSortStatusChange'];
  /** Full column descriptor — needed only to build the `onHeaderCellContextMenu` payload. */
  column: DataTableColumn<T>;
  /** Position of this column in the original `columns` array. */
  columnIndex: number;
  /** Right-click handler from `<DataTable>` props. */
  onHeaderCellContextMenu: DataTableHeaderCellClickHandler<T> | undefined;
} & Pick<
  DataTableColumn<T>,
  | 'accessor'
  | 'sortable'
  | 'draggable'
  | 'hideDragHandle'
  | 'toggleable'
  | 'resizable'
  | 'textAlign'
  | 'width'
  | 'filter'
  | 'filterPopoverProps'
  | 'filterPopoverDisableClickOutside'
  | 'filtering'
  | 'sortKey'
>;

export function DataTableHeaderCell<T>({
  className,
  style,
  accessor,
  visibleMediaQuery,
  title,
  sortable,
  draggable,
  hideDragHandle,
  toggleable,
  resizable,
  sortIcons,
  textAlign,
  width,
  sortStatus,
  onSortStatusChange,
  filter,
  filterPopoverProps,
  filterPopoverDisableClickOutside,
  filtering,
  sortKey,
  column,
  columnIndex,
  onHeaderCellContextMenu,
}: DataTableHeaderCellProps<T>) {
  const { setSourceColumn, setTargetColumn, swapColumns, setColumnsToggle } = useDataTableColumnsContext();
  const [dragOver, setDragOver] = useState<boolean>(false);
  const columnRef = useRef<HTMLTableCellElement | null>(null);
  // Capture the original mousedown target on the <th>. Native HTML5
  // dragstart's `event.target` is the draggable ancestor (the inner
  // <Flex>), not the actual click target — so we record it here to
  // support the `[data-no-drag]` opt-out below.
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  const handleContextMenu = useMemo<((e: React.MouseEvent) => void) | undefined>(
    () =>
      onHeaderCellContextMenu
        ? (event: React.MouseEvent) => {
            event.stopPropagation();
            onHeaderCellContextMenu({ event, column, columnIndex });
          }
        : undefined,
    [onHeaderCellContextMenu, column, columnIndex]
  );

  if (!useMediaQueryStringOrFunction(visibleMediaQuery)) return null;
  const text = title ?? humanize(accessor as string);
  const tooltip = typeof text === 'string' ? text : undefined;

  // Returns true if `node` (or any ancestor up to but not including the
  // header `<th>`) carries `data-no-drag`. Used to skip both column-reorder
  // drag and click-to-sort when the user is interacting with an explicit
  // no-drag region (e.g. an inline filter input rendered in the title).
  const isNoDragRegion = (node: EventTarget | null): boolean => {
    if (!(node instanceof HTMLElement)) return false;
    let cursor: HTMLElement | null = node;
    while (cursor && cursor !== columnRef.current) {
      if (cursor.dataset?.noDrag != null) return true;
      cursor = cursor.parentElement;
    }
    return false;
  };

  const sortAction =
    sortable && onSortStatusChange
      ? (e?: React.BaseSyntheticEvent) => {
          if (e?.defaultPrevented) return;
          // Bail when the click originated inside a `[data-no-drag]` region
          // so filter inputs / chips inside the header don't toggle sort.
          if (isNoDragRegion(e?.target ?? null)) return;

          onSortStatusChange({
            sortKey,
            columnAccessor: accessor,
            direction:
              sortStatus?.columnAccessor === accessor
                ? sortStatus.direction === 'asc'
                  ? 'desc'
                  : 'asc'
                : (sortStatus?.direction ?? 'asc'),
          });
        }
      : undefined;

  const handleColumnDragStart = (e: React.DragEvent) => {
    // Cancel the column-reorder drag when the user-initiated gesture
    // started in a `[data-no-drag]` region. Native dragstart's
    // `event.target` is the draggable ancestor, so we use the mousedown
    // target captured on the <th> below.
    if (isNoDragRegion(mouseDownTargetRef.current)) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setSourceColumn(accessor as string);
    setDragOver(false);
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setTargetColumn(accessor as string);
    setDragOver(true);
  };

  const handleColumnDrop = () => {
    setTargetColumn(accessor as string);
    setDragOver(false);
    swapColumns();
  };

  const handleColumnDragEnter = () => {
    setDragOver(true);
  };

  const handleColumnDragLeave = () => {
    setDragOver(false);
  };

  const handleColumnToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    setColumnsToggle((columnsToggle) =>
      columnsToggle.map((c) => {
        if (c.accessor === accessor) {
          return { ...c, toggled: false };
        }
        return c;
      })
    );
  };

  return (
    <TableTh
      data-accessor={accessor}
      className={clsx(
        {
          'mantine-datatable-header-cell-sortable': sortable,
          'mantine-datatable-header-cell-toggleable': toggleable,
          'mantine-datatable-header-cell-resizable': resizable,
        },
        className
      )}
      style={[
        {
          width,
          ...(!resizable ? { minWidth: width, maxWidth: width } : {}),
        },
        style,
      ]}
      role={sortable ? 'button' : undefined}
      tabIndex={sortable ? 0 : undefined}
      onClick={sortAction}
      onKeyDown={(e) => e.key === 'Enter' && sortAction?.()}
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onContextMenu={handleContextMenu}
      ref={columnRef}
    >
      <Group className="mantine-datatable-header-cell-sortable-group" justify="space-between" wrap="nowrap">
        <Flex
          align="center"
          w="100%"
          className={clsx({
            'mantine-datatable-header-cell-draggable': draggable,
            'mantine-datatable-header-cell-drag-over': dragOver,
          })}
          draggable={draggable}
          onDragStart={draggable ? handleColumnDragStart : undefined}
          onDragEnter={draggable ? handleColumnDragEnter : undefined}
          onDragOver={draggable ? handleColumnDragOver : undefined}
          onDrop={draggable ? handleColumnDrop : undefined}
          onDragLeave={draggable ? handleColumnDragLeave : undefined}
        >
          {draggable && !hideDragHandle ? (
            <Center role="img" aria-label="Drag column">
              <ActionIcon
                className="mantine-datatable-header-cell-draggable-action-icon"
                variant="subtle"
                size="xs"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                }}
              >
                <IconGripVertical />
              </ActionIcon>
            </Center>
          ) : null}
          <Box
            className={clsx(
              'mantine-datatable-header-cell-sortable-text',
              {
                [TEXT_ALIGN_LEFT]: textAlign === 'left',
                [TEXT_ALIGN_CENTER]: textAlign === 'center',
                [TEXT_ALIGN_RIGHT]: textAlign === 'right',
              },
              NOWRAP,
              ELLIPSIS
            )}
            title={tooltip}
          >
            {text}
          </Box>
        </Flex>
        {toggleable ? (
          <Center className="mantine-datatable-header-cell-toggleable-icon" role="img" aria-label="Toggle column">
            <ActionIcon size="xs" variant="light" onClick={handleColumnToggle}>
              <IconX />
            </ActionIcon>
          </Center>
        ) : null}
        {sortable || sortStatus?.columnAccessor === accessor ? (
          <>
            {sortStatus?.columnAccessor === accessor ? (
              <Center
                className={clsx('mantine-datatable-header-cell-sortable-icon', {
                  'mantine-datatable-header-cell-sortable-icon-reversed': sortStatus.direction === 'desc',
                })}
                role="img"
                aria-label={`Sorted ${sortStatus.direction === 'desc' ? 'descending' : 'ascending'}`}
              >
                {sortIcons?.sorted || <IconArrowUp />}
              </Center>
            ) : (
              <Center
                className="mantine-datatable-header-cell-sortable-unsorted-icon"
                role="img"
                aria-label="Not sorted"
              >
                {sortIcons?.unsorted || <IconArrowsVertical />}
              </Center>
            )}
          </>
        ) : null}
        {filter ? (
          <DataTableHeaderCellFilter
            filterPopoverProps={filterPopoverProps}
            isActive={!!filtering}
            filterPopoverDisableClickOutside={filterPopoverDisableClickOutside}
          >
            {filter}
          </DataTableHeaderCellFilter>
        ) : null}
      </Group>
      {resizable && accessor !== '__selection__' ? (
        <DataTableResizableHeaderHandle accessor={accessor as string} columnRef={columnRef} />
      ) : null}
    </TableTh>
  );
}
