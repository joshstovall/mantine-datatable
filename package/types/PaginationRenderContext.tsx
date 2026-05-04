import type { MantineSize, PaginationProps, TextProps } from '@mantine/core';
import type { JSX, ReactNode } from 'react';
import type { DataTablePageSizeSelectorProps } from './DataTablePageSizeSelectorProps';

/** Props accepted by the {@link PaginationRenderContext} `JumpToPage` control. */
export interface DataTableJumpToPageProps {
  /** Label shown before the input. Pass `null` to omit. @default `'Page'` */
  label?: ReactNode;
  /** Suffix shown after the input. Receives `totalPages`. @default `(n) => `of ${n}`` */
  suffix?: (totalPages: number) => ReactNode;
  /** Override the input width in px. @default `50` */
  width?: number;
}

export type PaginationRenderContext = {
  state: {
    paginationSize: MantineSize;
    page: number;
    totalPages: number;
    totalRecords: number | undefined;
    recordsPerPage: number | undefined;
    recordsLength: number | undefined;
    fetching: boolean | undefined;
    from?: number;
    to?: number;
    isWrapped: boolean;
  };
  actions: {
    setPage: (page: number) => void;
    setRecordsPerPage?: (n: number) => void;
  };
  Controls: {
    Text: (props?: Partial<TextProps>) => JSX.Element;
    PageSizeSelector: (props?: Partial<DataTablePageSizeSelectorProps>) => JSX.Element;
    Pagination: (props?: Partial<PaginationProps>) => JSX.Element;
    /**
     * "Jump to page N" input. Auto-clamps the value to `[1, totalPages]`,
     * commits on Enter / blur (so a single typed page doesn't fire a
     * query per keystroke), and renders nothing when there's only one
     * page so single-page tables don't carry the affordance.
     */
    JumpToPage: (props?: DataTableJumpToPageProps) => JSX.Element;
  };
};
