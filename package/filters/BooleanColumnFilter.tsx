import { Select } from '@mantine/core';
import type { DataTableColumnFilterBoolean } from '../types';

const TRUE_KEY = 'true';
const FALSE_KEY = 'false';

type BooleanColumnFilterProps = {
  config: DataTableColumnFilterBoolean;
  value: unknown;
  setValue: (next: boolean | undefined) => void;
  ariaLabel?: string;
};

export function BooleanColumnFilter({ config, value, setValue, ariaLabel }: BooleanColumnFilterProps) {
  const current = value === true ? TRUE_KEY : value === false ? FALSE_KEY : null;

  return (
    <Select
      size="xs"
      aria-label={ariaLabel}
      placeholder={config.allLabel ?? 'All'}
      data={[
        { value: TRUE_KEY, label: config.trueLabel ?? 'Yes' },
        { value: FALSE_KEY, label: config.falseLabel ?? 'No' },
      ]}
      clearable
      value={current}
      onChange={(next) => {
        if (next === TRUE_KEY) setValue(true);
        else if (next === FALSE_KEY) setValue(false);
        else setValue(undefined);
      }}
    />
  );
}
