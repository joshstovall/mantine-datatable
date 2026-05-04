import { Code } from '@mantine/core';
import type { Route } from 'next';
import { CodeBlock } from '~/components/CodeBlock';
import { PageNavigation } from '~/components/PageNavigation';
import { PageTitle } from '~/components/PageTitle';
import { Txt } from '~/components/Txt';
import { readCodeFile } from '~/lib/code';
import { getRouteMetadata } from '~/lib/utils';
import { RowVirtualizationExample } from './RowVirtualizationExample';

const PATH = '/examples/row-virtualization' as Route;

export const metadata = getRouteMetadata(PATH);

export default async function RowVirtualizationExamplePage() {
  const code = await readCodeFile<string>(`${PATH}/RowVirtualizationExample.tsx`);

  return (
    <>
      <PageTitle of={PATH} />
      <Txt>
        Pass <Code>virtualization</Code> to render thousands of rich rows without paginating. The
        body becomes virtualized via <Code>@tanstack/react-virtual</Code> (an optional peer
        dependency); only the rows visible in the viewport plus a small overscan ring mount in
        the DOM.
      </Txt>
      <Txt>
        Below: 5,000 synthetic employees with avatars, status badges, and formatted salaries.
        Scroll the table — the DOM stays bounded, the table layout is locked to{' '}
        <Code>fixed</Code> for stability, and pinned columns / sticky headers continue to work
        because real <Code>{'<tr>'}</Code> / <Code>{'<td>'}</Code> elements are reserved as
        spacers (no absolute positioning).
      </Txt>
      <RowVirtualizationExample />
      <Txt>The code for this example is as follows:</Txt>
      <CodeBlock code={code} />
      <Txt info title="Constraints">
        Row virtualization is incompatible with <Code>rowExpansion</Code> (per-row height
        changes invalidate the offset math) — it’s logged + ignored when both are set. Every
        column should declare <Code>width</Code> so the fixed table layout can size correctly.
      </Txt>
      <PageNavigation of={PATH} />
    </>
  );
}
