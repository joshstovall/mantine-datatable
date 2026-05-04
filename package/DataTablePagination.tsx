import { Box, Group, Pagination, Text, TextInput, rem, type MantineSize, type MantineSpacing, type MantineStyleProp } from '@mantine/core';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { DataTablePageSizeSelector } from './DataTablePageSizeSelector';
import { getPaginationCssVariables } from './cssVariables';
import { useMediaQueryStringOrFunction } from './hooks';
import type { DataTablePaginationProps } from './types';
import type { DataTableJumpToPageProps, PaginationRenderContext } from './types/PaginationRenderContext';
import type { WithOptionalProperty, WithRequiredProperty } from './types/utils';

/**
 * Jump-to-page input. Always reflects the current `page` (re-syncs when the
 * user clicks numbered/edge controls) and commits only on Enter / blur so
 * we don't fire a query per keystroke. The input auto-selects on focus /
 * click so a typed digit immediately overwrites the current page rather
 * than appending.
 */
function JumpToPageInput({
  page,
  totalPages,
  onPageChange,
  size,
  label,
  suffix,
  width,
}: {
  page: number;
  totalPages: number;
  onPageChange: ((p: number) => void) | undefined;
  size: MantineSize;
} & DataTableJumpToPageProps) {
  const [local, setLocal] = useState<string>(String(page));

  // Outer page may change from numbered controls / nav buttons / page-size
  // resets. Mirror those into the input so the displayed page never lies.
  useEffect(() => {
    setLocal(String(page));
  }, [page]);

  const commit = () => {
    const trimmed = local.trim();
    if (trimmed === '') {
      setLocal(String(page));
      return;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed)) {
      setLocal(String(page));
      return;
    }
    const clamped = Math.max(1, Math.min(totalPages, parsed));
    setLocal(String(clamped));
    if (clamped !== page) onPageChange?.(clamped);
  };

  const selectAll = (e: React.SyntheticEvent<HTMLInputElement>) => {
    // requestAnimationFrame so iOS Safari respects the selection after a
    // click — focus + select in the same task gets clobbered there.
    const target = e.currentTarget;
    requestAnimationFrame(() => target.select());
  };

  return (
    <Group gap={6} wrap="nowrap" className="mantine-datatable-pagination-jump-to-page">
      {label !== null ? (
        <Text component="span" size={size} c="dimmed">
          {label ?? 'Page'}
        </Text>
      ) : null}
      <TextInput
        value={local}
        onChange={(e) => setLocal(e.currentTarget.value)}
        onBlur={commit}
        onFocus={selectAll}
        onClick={selectAll}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            (e.currentTarget as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            setLocal(String(page));
            (e.currentTarget as HTMLInputElement).blur();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = Math.min(totalPages, (Number.parseInt(local, 10) || page) + 1);
            setLocal(String(next));
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.max(1, (Number.parseInt(local, 10) || page) - 1);
            setLocal(String(next));
          }
        }}
        size={size}
        type="text"
        inputMode="numeric"
        aria-label="Jump to page"
        styles={{ input: { width: width ?? 50, textAlign: 'center', paddingInline: 4 } }}
      />
      <Text component="span" size={size} c="dimmed">
        {suffix ? suffix(totalPages) : `of ${totalPages}`}
      </Text>
    </Group>
  );
}

type DataTablePaginationComponentProps = WithOptionalProperty<
  WithRequiredProperty<
    DataTablePaginationProps,
    'loadingText' | 'paginationSize' | 'recordsPerPageLabel' | 'paginationWrapBreakpoint' | 'getPaginationControlProps'
  >,
  'onRecordsPerPageChange' | 'recordsPerPageOptions' | 'renderPagination'
> & {
  className: string | undefined;
  style: MantineStyleProp | undefined;
  fetching: boolean | undefined;
  recordsLength: number | undefined;
  horizontalSpacing: MantineSpacing | undefined;
  noRecordsText: string;
};

export function DataTablePagination({
  className,
  style,
  fetching,
  page,
  onPageChange,
  paginationWithEdges,
  paginationWithControls,
  paginationActiveTextColor,
  paginationActiveBackgroundColor,
  paginationSize,
  loadingText,
  noRecordsText,
  paginationText,
  totalRecords,
  recordsPerPage,
  onRecordsPerPageChange,
  recordsPerPageLabel,
  recordsPerPageOptions,
  recordsLength,
  horizontalSpacing,
  paginationWrapBreakpoint,
  getPaginationControlProps,
  getPaginationItemProps,
  renderPagination,
}: DataTablePaginationComponentProps) {
  let paginationTextValue: React.ReactNode;
  if (totalRecords) {
    const from = (page - 1) * recordsPerPage + 1;
    const to = from + (recordsLength || 0) - 1;
    paginationTextValue = paginationText!({ from, to, totalRecords });
  } else {
    paginationTextValue = fetching ? loadingText : noRecordsText;
  }

  const totalPages = totalRecords && recordsPerPage ? Math.max(1, Math.ceil(totalRecords / recordsPerPage)) : 1;

  const from = totalRecords ? (page - 1) * (recordsPerPage ?? 0) + 1 : undefined;
  const to = totalRecords ? (from ?? 1) + (recordsLength ?? 0) - 1 : undefined;

  const isAbovePaginationWrapBreakpoint = useMediaQueryStringOrFunction(
    ({ breakpoints }) =>
      `(min-width: ${
        typeof paginationWrapBreakpoint === 'number'
          ? `${rem(paginationWrapBreakpoint)}rem`
          : breakpoints[paginationWrapBreakpoint] || paginationWrapBreakpoint
      })`
  );

  const isWrapped = !isAbovePaginationWrapBreakpoint;

  const Controls: PaginationRenderContext['Controls'] = {
    Text: (props) => (
      <Text component="div" className="mantine-datatable-pagination-text" size={paginationSize} {...props}>
        {paginationTextValue}
      </Text>
    ),
    PageSizeSelector: (props) =>
      recordsPerPageOptions ? (
        <DataTablePageSizeSelector
          activeTextColor={paginationActiveTextColor}
          activeBackgroundColor={paginationActiveBackgroundColor}
          size={paginationSize}
          label={recordsPerPageLabel}
          values={recordsPerPageOptions}
          value={recordsPerPage!}
          onChange={onRecordsPerPageChange!}
          {...props}
        />
      ) : (
        <></>
      ),
    Pagination: (props) => (
      <Pagination
        classNames={{
          root: clsx('mantine-datatable-pagination-pages', {
            'mantine-datatable-pagination-pages-fetching': fetching || !recordsLength,
          }),
          control: 'mantine-datatable-pagination-pages-control',
        }}
        style={
          paginationActiveTextColor || paginationActiveBackgroundColor
            ? (theme) =>
                getPaginationCssVariables({
                  theme,
                  paginationActiveTextColor,
                  paginationActiveBackgroundColor,
                })
            : undefined
        }
        withEdges={paginationWithEdges}
        withControls={paginationWithControls}
        value={page}
        onChange={onPageChange}
        size={paginationSize}
        total={totalPages}
        getControlProps={getPaginationControlProps}
        getItemProps={getPaginationItemProps}
        {...props}
      />
    ),
    JumpToPage: (props) =>
      // Hide on single-page tables — there's nothing to jump to and the
      // affordance only adds visual noise.
      totalPages > 1 ? (
        <JumpToPageInput
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          size={paginationSize}
          {...props}
        />
      ) : (
        <></>
      ),
  };

  const ctx: PaginationRenderContext = {
    state: {
      paginationSize,
      page,
      totalPages,
      totalRecords,
      recordsPerPage,
      recordsLength,
      fetching,
      from,
      to,
      isWrapped,
    },
    actions: {
      setPage: (n) => onPageChange?.(n),
      setRecordsPerPage: onRecordsPerPageChange ? (n) => onRecordsPerPageChange(n) : undefined,
    },
    Controls,
  };

  return (
    <Box
      px={horizontalSpacing ?? 'xs'}
      py="xs"
      className={clsx('mantine-datatable-pagination', className)}
      style={[{ flexDirection: isWrapped ? 'column' : 'row' }, style]}
    >
      {typeof renderPagination === 'function' ? (
        renderPagination(ctx)
      ) : (
        <>
          <Controls.Text />
          <Controls.PageSizeSelector />
          <Controls.Pagination />
        </>
      )}
    </Box>
  );
}
