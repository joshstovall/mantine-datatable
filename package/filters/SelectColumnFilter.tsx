import { Select } from '@mantine/core';
import type { DataTableColumnFilterSelect } from '../types';

type SelectColumnFilterProps = {
  config: DataTableColumnFilterSelect;
  value: unknown;
  setValue: (next: string | undefined) => void;
  ariaLabel?: string;
};

export function SelectColumnFilter({ config, value, setValue, ariaLabel }: SelectColumnFilterProps) {
  const current = typeof value === 'string' ? value : null;
  return (
    <Select
      size="xs"
      data={config.options}
      placeholder={config.placeholder}
      aria-label={ariaLabel}
      clearable={config.clearable ?? true}
      searchable={config.searchable}
      value={current}
      onChange={(next) => setValue(next ?? undefined)}
    />
  );
}
