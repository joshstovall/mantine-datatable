import { CloseButton, TextInput } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
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

  // Keep a ref to the latest setValue so effects always call the most up-to-date
  // version without needing to include it in deps (which would cause loops).
  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;

  // Track the last value we flushed upstream so we never re-flush the same value.
  const lastFlushedRef = useRef(incoming);

  useEffect(() => {
    setLocalValue(incoming);
    lastFlushedRef.current = incoming;
  }, [incoming]);

  useEffect(() => {
    if (localValue === incoming) return;
    // Already flushed this exact value — skip.
    if (localValue === lastFlushedRef.current) return;

    const flush = () => {
      const next = localValue === '' ? undefined : localValue;
      lastFlushedRef.current = localValue;
      setValueRef.current(next);
    };

    if (debounceMs <= 0) {
      // Use a microtask to batch multiple rapid keystrokes into a single flush
      // and break the synchronous update chain that can exceed React's max depth.
      const id = requestAnimationFrame(flush);
      return () => cancelAnimationFrame(id);
    }
    const id = setTimeout(flush, debounceMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue, debounceMs, incoming]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    lastFlushedRef.current = '';
    setValueRef.current(undefined);
  }, []);

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
            onClick={handleClear}
          />
        ) : null
      }
    />
  );
}
