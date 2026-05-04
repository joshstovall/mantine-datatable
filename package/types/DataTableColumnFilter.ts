import type { ReactNode } from 'react';

/**
 * Where a {@link DataTableColumnFilter} should be rendered.
 *
 * - `'cell'` — inside the inline filter row beneath the column titles.
 * - `'popover'` — inside the popover that opens from the funnel button next to the column title.
 * - `'both'` — both targets, sharing the same controlled value.
 *
 * @default `'cell'`
 */
export type DataTableColumnFilterDisplayIn = 'cell' | 'popover' | 'both';

/**
 * Render context passed to {@link DataTableColumnFilterCustom.render} (and used internally
 * to render the built-in primitives).
 */
export type DataTableColumnFilterRenderContext<TValue = unknown> = {
  /** Current filter value for this column (read from the controlled `filters` map). */
  value: TValue | undefined;
  /** Update the filter value for this column. Pass `undefined` to clear. */
  setValue: (next: TValue | undefined) => void;
  /** Close the popover (no-op when rendered inline). */
  close: () => void;
  /** The render target the renderer is currently mounted in. */
  target: 'cell' | 'popover';
  /** Optional label (defaults to column title). */
  label?: ReactNode;
};

type DataTableColumnFilterBase = {
  /**
   * Where to render this filter.
   * @default `'cell'`
   */
  displayIn?: DataTableColumnFilterDisplayIn;

  /**
   * Optional label used by screen readers and as the popover header.
   * Falls back to the column title.
   */
  label?: ReactNode;
};

export type DataTableColumnFilterText = DataTableColumnFilterBase & {
  kind: 'text';
  placeholder?: string;
  /** Debounce input changes by this many ms before propagating to the controlled state. Default: 0. */
  debounceMs?: number;
};

export type DataTableColumnFilterSelectOption = {
  value: string;
  label: string;
};

export type DataTableColumnFilterSelect = DataTableColumnFilterBase & {
  kind: 'select';
  options: DataTableColumnFilterSelectOption[];
  placeholder?: string;
  /** @default `true` */
  clearable?: boolean;
  searchable?: boolean;
};

export type DataTableColumnFilterMultiSelect = DataTableColumnFilterBase & {
  kind: 'multiselect';
  options: DataTableColumnFilterSelectOption[];
  placeholder?: string;
  searchable?: boolean;
};

export type DataTableColumnFilterNumberRange = DataTableColumnFilterBase & {
  kind: 'numberRange';
  /** Optional placeholder for the "from" input. */
  fromPlaceholder?: string;
  /** Optional placeholder for the "to" input. */
  toPlaceholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

export type DataTableColumnFilterNumberSlider = DataTableColumnFilterBase & {
  kind: 'numberSlider';
  /** Inclusive lower bound of the slider. */
  min: number;
  /** Inclusive upper bound of the slider. */
  max: number;
  step?: number;
  /** Marks rendered along the slider track. */
  marks?: { value: number; label?: React.ReactNode }[];
  /**
   * If true, the slider's tooltip stays visible. Otherwise it appears on hover/drag.
   * @default `false`
   */
  labelAlwaysOn?: boolean;
};

export type DataTableColumnFilterBoolean = DataTableColumnFilterBase & {
  kind: 'boolean';
  trueLabel?: string;
  falseLabel?: string;
  /** Label for the "no filter" / "all" option. @default `'All'` */
  allLabel?: string;
};

/**
 * Value shape emitted into the controlled `filters` map by `kind: 'dateRange'`.
 *
 * Dates are ISO `YYYY-MM-DD` strings — the native value emitted by Mantine's
 * `DatePickerInput` when using `valueFormat="YYYY-MM-DD"`. Either endpoint may be
 * `null` if the user has only picked one bound.
 *
 * Requires `@mantine/dates` to be installed. The package declares it as an optional
 * peer dependency, so it's only needed when this kind is actually used.
 */
export type DataTableColumnFilterDateRangeValue = [string | null, string | null];

export type DataTableColumnFilterDateRange = DataTableColumnFilterBase & {
  kind: 'dateRange';
  placeholder?: string;
  /** Min selectable date (ISO `YYYY-MM-DD`). */
  minDate?: string;
  /** Max selectable date (ISO `YYYY-MM-DD`). */
  maxDate?: string;
  /** @default `'YYYY-MM-DD'` — passed straight to DatePickerInput. */
  valueFormat?: string;
  /**
   * @default `true` — display the X clear button when a range is set.
   */
  clearable?: boolean;
};

export type DataTableColumnFilterCustom<TValue = unknown> = DataTableColumnFilterBase & {
  kind: 'custom';
  render: (ctx: DataTableColumnFilterRenderContext<TValue>) => ReactNode;
};

export type DataTableColumnFilter =
  | DataTableColumnFilterText
  | DataTableColumnFilterSelect
  | DataTableColumnFilterMultiSelect
  | DataTableColumnFilterNumberRange
  | DataTableColumnFilterNumberSlider
  | DataTableColumnFilterBoolean
  | DataTableColumnFilterDateRange
  | DataTableColumnFilterCustom;
