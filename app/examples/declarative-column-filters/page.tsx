import { Code } from '@mantine/core';
import type { Route } from 'next';
import { PRODUCT_NAME } from '~/app/config';
import { CodeBlock } from '~/components/CodeBlock';
import { InternalLink } from '~/components/InternalLink';
import { PageNavigation } from '~/components/PageNavigation';
import { PageTitle } from '~/components/PageTitle';
import { Txt } from '~/components/Txt';
import { readCodeFile } from '~/lib/code';
import { getRouteMetadata } from '~/lib/utils';
import { DeclarativeColumnFiltersExample } from './DeclarativeColumnFiltersExample';

const PATH: Route = '/examples/declarative-column-filters';

export const metadata = getRouteMetadata(PATH);

export default async function DeclarativeColumnFiltersExamplePage() {
  const code = await readCodeFile<string>(`${PATH}/DeclarativeColumnFiltersExample.tsx`);

  return (
    <>
      <PageTitle of={PATH} />
      <Txt>
        {PRODUCT_NAME} ships built-in filter primitives that read and write a single controlled{' '}
        <Code>filters</Code> map. Each column declares its filter UI declaratively via{' '}
        <Code>columnFilter</Code>, and the table renders the right input in the right slot —{' '}
        either inline beneath the column title, inside the funnel popover, or both.
      </Txt>
      <Txt>
        The escape hatches still apply: when a primitive doesn’t fit, drop down to{' '}
        <Code>column.filterCell</Code> (inline) or <Code>column.filter</Code> (popover) — see the{' '}
        <InternalLink to="/examples/searching-and-filtering">searching and filtering</InternalLink> example
        for the manual approach.
      </Txt>
      <DeclarativeColumnFiltersExample />
      <Txt>The code for this example is as follows:</Txt>
      <CodeBlock code={code} />
      <Txt info title="Supported filter kinds">
        <Code>text</Code>, <Code>select</Code>, <Code>multiselect</Code>, <Code>numberRange</Code>,{' '}
        <Code>boolean</Code>, and <Code>custom</Code> (which receives a render context with{' '}
        <Code>value</Code>, <Code>setValue</Code>, <Code>close</Code>, and <Code>target</Code>).
      </Txt>
      <PageNavigation of={PATH} />
    </>
  );
}
