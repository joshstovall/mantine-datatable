import { DatePickerInput } from '@mantine/dates';
import type {
  DataTableColumnFilterDateRange,
  DataTableColumnFilterDateRangeValue,
} from '../types';

type DateRangeColumnFilterProps = {
  config: DataTableColumnFilterDateRange;
  value: unknown;
  setValue: (next: DataTableColumnFilterDateRangeValue | undefined) => void;
  ariaLabel?: string;
};

function isRangeValue(v: unknown): v is DataTableColumnFilterDateRangeValue {
  return Array.isArray(v) && v.length === 2;
}

export function DateRangeColumnFilter({ config, value, setValue, ariaLabel }: DateRangeColumnFilterProps) {
  const current: DataTableColumnFilterDateRangeValue = isRangeValue(value) ? value : [null, null];

  return (
    <DatePickerInput
      type="range"
      size="xs"
      placeholder={config.placeholder ?? 'Pick a range'}
      aria-label={ariaLabel}
      value={current}
      valueFormat={config.valueFormat ?? 'YYYY-MM-DD'}
      minDate={config.minDate}
      maxDate={config.maxDate}
      clearable={config.clearable ?? true}
      onChange={(next) => {
        const [from, to] = next;
        if (!from && !to) {
          setValue(undefined);
        } else {
          setValue([from, to]);
        }
      }}
    />
  );
}
