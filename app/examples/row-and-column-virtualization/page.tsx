import { Code } from '@mantine/core';
import type { Route } from 'next';
import { CodeBlock } from '~/components/CodeBlock';
import { InternalLink } from '~/components/InternalLink';
import { PageNavigation } from '~/components/PageNavigation';
import { PageTitle } from '~/components/PageTitle';
import { Txt } from '~/components/Txt';
import { readCodeFile } from '~/lib/code';
import { getRouteMetadata } from '~/lib/utils';
import { RowAndColumnVirtualizationExample } from './RowAndColumnVirtualizationExample';

const PATH = '/examples/row-and-column-virtualization' as Route;

export const metadata = getRouteMetadata(PATH);

export default async function RowAndColumnVirtualizationExamplePage() {
  const code = await readCodeFile<string>(`${PATH}/RowAndColumnVirtualizationExample.tsx`);

  return (
    <>
      <PageTitle of={PATH} />
      <Txt>
        Set <Code>columns: true</Code> in addition to <Code>rows: true</Code> to virtualize
        horizontally as well — useful when you have ~30+ columns. Below: a 5,000 × 41-column
        synthetic metrics table. Both axes virtualize independently, with off-viewport rows and
        columns reserved by spacer cells whose widths are written as CSS variables on the
        scroll viewport (so horizontal scroll never propagates as React props).
      </Txt>
      <Txt>
        See also: <InternalLink to="/examples/row-virtualization">row-only virtualization</InternalLink>{' '}
        for the simpler case.
      </Txt>
      <RowAndColumnVirtualizationExample />
      <Txt>The code for this example is as follows:</Txt>
      <CodeBlock code={code} />
      <Txt info title="Constraints">
        Column virtualization is incompatible with <Code>pinFirstColumn</Code> /{' '}
        <Code>pinLastColumn</Code> and with column groups (multi-row headers) — those combos are
        logged + ignored. Every virtualizable column should declare a numeric <Code>width</Code>;
        the table is forced to <Code>table-layout: fixed</Code> when virt is on.
      </Txt>
      <PageNavigation of={PATH} />
    </>
  );
}
