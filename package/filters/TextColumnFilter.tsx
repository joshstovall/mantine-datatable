import { CloseButton, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { DataTableColumnFilterText } from '../types';

type TextColumnFilterProps = {
  config: DataTableColumnFilterText;
  value: unknown;
  setValue: (next: string | undefined) => void;
  ariaLabel?: string;
};

export function TextColumnFilter({ config, value, setValue, ariaLabel }: TextColumnFilterProps) {
  const incoming = typeof value === 'string' ? value : '';
  const [localValue, setLocalValue] = useState(incoming);
  const debounceMs = config.debounceMs ?? 0;

  useEffect(() => {
    setLocalValue(incoming);
    // We re-sync only when the controlled value changes externally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  useEffect(() => {
    if (localValue === incoming) return;
    if (debounceMs <= 0) {
      setValue(localValue === '' ? undefined : localValue);
      return;
    }
    const id = setTimeout(() => {
      setValue(localValue === '' ? undefined : localValue);
    }, debounceMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue, debounceMs]);

  return (
    <TextInput
      size="xs"
      placeholder={config.placeholder}
      aria-label={ariaLabel}
      value={localValue}
      onChange={(e) => setLocalValue(e.currentTarget.value)}
      rightSection={
        localValue ? (
          <CloseButton
            size="xs"
            aria-label="Clear filter"
            onClick={() => {
              setLocalValue('');
              setValue(undefined);
            }}
          />
        ) : null
      }
    />
  );
}
