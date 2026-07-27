import { useLocalStorage } from '@mantine/hooks';
import { useEffect, useId, useMemo } from 'react';
import type { DataTableColumn } from '../types/DataTableColumn';

/**
 * Hook to handle column reordering with localStorage persistence.
 * @see https://icflorescu.github.io/mantine-datatable/examples/column-dragging-and-toggling/
 */
export function useDataTableColumnReorder<T>({
  key,
  columns = [],
  getInitialValueInEffect = true,
}: {
  /**
   * The key to use in localStorage to store the columns order.
   */
  key: string | undefined;
  /**
   * Columns definitions.
   */
  columns: DataTableColumn<T>[];
  /**
   * If set to true, value will be updated in useEffect after mount.
   * @default true
   */
  getInitialValueInEffect?: boolean;
}) {
  // Align order with current columns definition
  function alignColumnsOrder<T>(columnsOrder: string[], columns: DataTableColumn<T>[]) {
    const updatedColumnsOrder: string[] = [];

    // Keep existing order for columns that still exist
    columnsOrder.forEach((col) => {
      if (columns.find((c) => c.accessor === col)) {
        updatedColumnsOrder.push(col);
      }
    });

    // Add new columns to the end
    columns.forEach((col) => {
      if (!updatedColumnsOrder.includes(col.accessor as string)) {
        updatedColumnsOrder.push(col.accessor as string);
      }
    });

    return updatedColumnsOrder;
  }

  // Default columns order is the order of the columns in the array
  const defaultColumnsOrder = (columns && columns.map((column) => column.accessor)) || [];

  // Generate a unique fallback key per instance to avoid cross-contamination
  // when no storeColumnsKey is provided.
  const instanceId = useId();
  const storageKey = key ? `${key}-columns-order` : `__mdt_reorder_${instanceId}`;

  const [columnsOrder, _setColumnsOrder] = useLocalStorage<string[]>({
    key: storageKey,
    defaultValue: defaultColumnsOrder as string[],
    getInitialValueInEffect,
  });

  function setColumnsOrder(order: string[] | ((prev: string[]) => string[])) {
    if (key) {
      _setColumnsOrder(order);
    }
  }

  const resetColumnsOrder = () => {
    setColumnsOrder(defaultColumnsOrder as string[]);
  };

  // Align order with current columns. When no key is provided the state is
  // unmanaged, so it is returned as-is.
  const alignedColumnsOrder = useMemo(
    () => (key ? alignColumnsOrder(columnsOrder, columns) : (columnsOrder as string[])),
    [key, columnsOrder, columns]
  );

  const serializedColumnsOrder = JSON.stringify(columnsOrder);
  const serializedAlignedColumnsOrder = JSON.stringify(alignedColumnsOrder);

  // Persist the aligned order *after* commit, never during render. The
  // `useLocalStorage` setter synchronously dispatches a window event whose
  // listener is wrapped in `useEffectEvent`, and React throws if such a
  // function is invoked while rendering ("A function wrapped in useEffectEvent
  // can't be called during rendering"). This fires whenever the column set
  // changes shape — e.g. tables whose columns are derived from fetched data.
  useEffect(() => {
    if (!key || serializedAlignedColumnsOrder === serializedColumnsOrder) return;
    _setColumnsOrder(alignedColumnsOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serialized values stand in for the arrays
  }, [key, serializedColumnsOrder, serializedAlignedColumnsOrder, _setColumnsOrder]);

  return {
    columnsOrder: alignedColumnsOrder,
    setColumnsOrder,
    resetColumnsOrder,
  } as const;
}
