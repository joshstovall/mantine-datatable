import { Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import type { DataTableColumnFilter, DataTableColumnFilterRenderContext } from '../types';
import { BooleanColumnFilter } from './BooleanColumnFilter';
import { DateRangeColumnFilter } from './DateRangeColumnFilter';
import { MultiSelectColumnFilter } from './MultiSelectColumnFilter';
import { NumberRangeColumnFilter } from './NumberRangeColumnFilter';
import { NumberSliderColumnFilter } from './NumberSliderColumnFilter';
import { SelectColumnFilter } from './SelectColumnFilter';
import { TextColumnFilter } from './TextColumnFilter';

type ColumnFilterRendererProps = {
  config: DataTableColumnFilter;
  value: unknown;
  setValue: (next: unknown) => void;
  close: () => void;
  target: 'cell' | 'popover';
  ariaLabel?: string;
};

/**
 * Dispatches a {@link DataTableColumnFilter} config to the correct built-in primitive
 * component (or invokes the user-supplied `render` for `kind: 'custom'`).
 */
export function ColumnFilterRenderer({
  config,
  value,
  setValue,
  close,
  target,
  ariaLabel,
}: ColumnFilterRendererProps): ReactNode {
  switch (config.kind) {
    case 'text':
      return <TextColumnFilter config={config} value={value} setValue={setValue} ariaLabel={ariaLabel} />;
    case 'select':
      return <SelectColumnFilter config={config} value={value} setValue={setValue} ariaLabel={ariaLabel} />;
    case 'multiselect':
      return (
        <MultiSelectColumnFilter config={config} value={value} setValue={setValue} ariaLabel={ariaLabel} />
      );
    case 'numberRange':
      return (
        <NumberRangeColumnFilter config={config} value={value} setValue={setValue} ariaLabel={ariaLabel} />
      );
    case 'numberSlider':
      return (
        <NumberSliderColumnFilter config={config} value={value} setValue={setValue} ariaLabel={ariaLabel} />
      );
    case 'boolean':
      return <BooleanColumnFilter config={config} value={value} setValue={setValue} ariaLabel={ariaLabel} />;
    case 'dateRange':
      return (
        <DateRangeColumnFilter config={config} value={value} setValue={setValue} ariaLabel={ariaLabel} />
      );
    case 'custom': {
      const ctx: DataTableColumnFilterRenderContext = {
        value,
        setValue,
        close,
        target,
        label: config.label,
      };
      const node = config.render(ctx);
      return target === 'popover' ? <Stack>{node}</Stack> : node;
    }
  }
}
