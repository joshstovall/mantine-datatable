import { Group, NumberInput } from '@mantine/core';
import type { DataTableColumnFilterNumberRange } from '../types';

type NumberRangeColumnFilterProps = {
  config: DataTableColumnFilterNumberRange;
  value: unknown;
  setValue: (next: [number | undefined, number | undefined] | undefined) => void;
  ariaLabel?: string;
};

function isRange(v: unknown): v is [number | undefined, number | undefined] {
  return Array.isArray(v) && v.length === 2;
}

function commit(
  next: [number | undefined, number | undefined],
  setValue: NumberRangeColumnFilterProps['setValue']
) {
  if (next[0] === undefined && next[1] === undefined) {
    setValue(undefined);
  } else {
    setValue(next);
  }
}

function toNumber(raw: number | string): number | undefined {
  if (raw === '' || raw === null || raw === undefined) return undefined;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function NumberRangeColumnFilter({ config, value, setValue, ariaLabel }: NumberRangeColumnFilterProps) {
  const [from, to] = isRange(value) ? value : [undefined, undefined];

  return (
    <Group gap="xs" wrap="nowrap">
      <NumberInput
        size="xs"
        placeholder={config.fromPlaceholder ?? 'From'}
        aria-label={ariaLabel ? `${ariaLabel} (from)` : 'From'}
        value={from ?? ''}
        min={config.min}
        max={config.max}
        step={config.step}
        onChange={(raw) => commit([toNumber(raw), to], setValue)}
        hideControls
      />
      <NumberInput
        size="xs"
        placeholder={config.toPlaceholder ?? 'To'}
        aria-label={ariaLabel ? `${ariaLabel} (to)` : 'To'}
        value={to ?? ''}
        min={config.min}
        max={config.max}
        step={config.step}
        onChange={(raw) => commit([from, toNumber(raw)], setValue)}
        hideControls
      />
    </Group>
  );
}
