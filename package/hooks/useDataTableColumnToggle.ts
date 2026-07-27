import { useLocalStorage } from '@mantine/hooks';
import { useEffect, useId, useMemo } from 'react';
import type { DataTableColumn } from '../types/DataTableColumn';

export type DataTableColumnToggle = {
  accessor: string;
  defaultToggle: boolean;
  toggleable: boolean;
  toggled: boolean;
};

/**
 * Hook to handle column visibility toggling with localStorage persistence.
 * @see https://icflorescu.github.io/mantine-datatable/examples/column-dragging-and-toggling/
 */
export function useDataTableColumnToggle<T>({
  key,
  columns = [],
  getInitialValueInEffect = true,
}: {
  /**
   * The key to use in localStorage to store the columns toggle state.
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
  // Align toggle state with current columns definition
  function alignColumnsToggle<T>(columnsToggle: DataTableColumnToggle[], columns: DataTableColumn<T>[]) {
    const updatedColumnsToggle: DataTableColumnToggle[] = [];

    // Keep existing toggle states for columns that still exist
    columnsToggle.forEach((col) => {
      if (columns.find((c) => c.accessor === col.accessor)) {
        updatedColumnsToggle.push(col);
      }
    });

    // Add toggle state for new columns
    columns.forEach((col) => {
      if (!updatedColumnsToggle.find((c) => c.accessor === col.accessor)) {
        updatedColumnsToggle.push({
          accessor: col.accessor as string,
          defaultToggle: col.defaultToggle || true,
          toggleable: col.toggleable as boolean,
          toggled: col.defaultToggle === undefined ? true : col.defaultToggle,
        });
      }
    });

    return updatedColumnsToggle as DataTableColumnToggle[];
  }

  // Default columns toggle state
  const defaultColumnsToggle =
    columns &&
    columns.map((column) => ({
      accessor: column.accessor,
      defaultToggle: column.defaultToggle || true,
      toggleable: column.toggleable,
      toggled: column.defaultToggle === undefined ? true : column.defaultToggle,
    }));

  // Generate a unique fallback key per instance to avoid cross-contamination
  // when no storeColumnsKey is provided.
  const instanceId = useId();
  const storageKey = key ? `${key}-columns-toggle` : `__mdt_toggle_${instanceId}`;

  const [columnsToggle, _setColumnsToggle] = useLocalStorage<DataTableColumnToggle[]>({
    key: storageKey,
    defaultValue: defaultColumnsToggle as DataTableColumnToggle[],
    getInitialValueInEffect,
  });

  function setColumnsToggle(
    toggle: DataTableColumnToggle[] | ((prev: DataTableColumnToggle[]) => DataTableColumnToggle[])
  ) {
    if (key) {
      _setColumnsToggle(toggle);
    }
  }

  const resetColumnsToggle = () => {
    setColumnsToggle(defaultColumnsToggle as DataTableColumnToggle[]);
  };

  // Align toggle state with current columns. When no key is provided the state
  // is unmanaged, so it is returned as-is.
  const alignedColumnsToggle = useMemo(
    () => (key ? alignColumnsToggle(columnsToggle, columns) : (columnsToggle as DataTableColumnToggle[])),
    [key, columnsToggle, columns]
  );

  const serializedColumnsToggle = JSON.stringify(columnsToggle);
  const serializedAlignedColumnsToggle = JSON.stringify(alignedColumnsToggle);

  // Persist the aligned toggle state *after* commit, never during render. The
  // `useLocalStorage` setter synchronously dispatches a window event whose
  // listener is wrapped in `useEffectEvent`, and React throws if such a
  // function is invoked while rendering ("A function wrapped in useEffectEvent
  // can't be called during rendering"). This fires whenever the column set
  // changes shape — e.g. tables whose columns are derived from fetched data.
  useEffect(() => {
    if (!key || serializedAlignedColumnsToggle === serializedColumnsToggle) return;
    _setColumnsToggle(alignedColumnsToggle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serialized values stand in for the arrays
  }, [key, serializedColumnsToggle, serializedAlignedColumnsToggle, _setColumnsToggle]);

  return {
    columnsToggle: alignedColumnsToggle,
    setColumnsToggle,
    resetColumnsToggle,
  } as const;
}
