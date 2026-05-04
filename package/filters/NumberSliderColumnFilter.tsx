import { CloseButton, Group, RangeSlider, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { DataTableColumnFilterNumberSlider } from '../types';

type NumberSliderColumnFilterProps = {
  config: DataTableColumnFilterNumberSlider;
  value: unknown;
  setValue: (next: [number, number] | undefined) => void;
  ariaLabel?: string;
};

function isRange(v: unknown): v is [number, number] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === 'number' &&
    typeof v[1] === 'number'
  );
}

export function NumberSliderColumnFilter({ config, value, setValue, ariaLabel }: NumberSliderColumnFilterProps) {
  const fullRange: [number, number] = [config.min, config.max];
  const incoming: [number, number] = isRange(value) ? value : fullRange;
  // Hold the in-flight slider position locally so we don't fire a `setValue` per pixel.
  const [local, setLocal] = useState<[number, number]>(incoming);

  useEffect(() => {
    setLocal(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming[0], incoming[1]]);

  const isFiltered = local[0] !== config.min || local[1] !== config.max;

  const commit = (next: [number, number]) => {
    if (next[0] === config.min && next[1] === config.max) {
      setValue(undefined);
    } else {
      setValue(next);
    }
  };

  return (
    <Group gap={6} wrap="nowrap" align="center">
      <Text size="xs" c="dimmed" miw={28} ta="right">
        {local[0]}
      </Text>
      <RangeSlider
        size="xs"
        flex={1}
        min={config.min}
        max={config.max}
        step={config.step}
        marks={config.marks}
        labelAlwaysOn={config.labelAlwaysOn}
        aria-label={ariaLabel}
        value={local}
        onChange={setLocal}
        onChangeEnd={commit}
      />
      <Text size="xs" c="dimmed" miw={28}>
        {local[1]}
      </Text>
      {isFiltered ? (
        <CloseButton
          size="xs"
          aria-label="Clear filter"
          onClick={() => {
            setLocal(fullRange);
            setValue(undefined);
          }}
        />
      ) : null}
    </Group>
  );
}
