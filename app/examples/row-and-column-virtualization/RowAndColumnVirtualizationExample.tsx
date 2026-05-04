'use client';

import { Badge, NumberFormatter } from '@mantine/core';
import { DataTable, type DataTableColumn } from '__PACKAGE__';
import { faker } from '@faker-js/faker';
import { useMemo } from 'react';

faker.seed(7);

type WideRow = {
  id: number;
  // 40 metric columns — wide enough to make column virt meaningful.
} & Record<`metric_${number}`, number>;

const ROW_COUNT = 5000;
const METRIC_COUNT = 40;

function generateRows(n: number): WideRow[] {
  const out: WideRow[] = [];
  for (let i = 0; i < n; i++) {
    const row: WideRow = { id: i } as WideRow;
    for (let j = 0; j < METRIC_COUNT; j++) {
      (row as Record<string, number>)[`metric_${j}`] = faker.number.int({ min: 0, max: 9999 });
    }
    out.push(row);
  }
  return out;
}

function buildColumns(): DataTableColumn<WideRow>[] {
  const cols: DataTableColumn<WideRow>[] = [
    { accessor: 'id', title: '#', width: 80, textAlign: 'right' },
  ];
  for (let j = 0; j < METRIC_COUNT; j++) {
    cols.push({
      accessor: `metric_${j}`,
      title: `M${j}`,
      width: 100,
      textAlign: 'right',
      render: (r) => {
        const v = (r as Record<string, number>)[`metric_${j}`]!;
        return v > 8000 ? (
          <Badge size="sm" color="red" variant="light">
            <NumberFormatter value={v} thousandSeparator />
          </Badge>
        ) : (
          <NumberFormatter value={v} thousandSeparator />
        );
      },
    });
  }
  return cols;
}

export function RowAndColumnVirtualizationExample() {
  const records = useMemo(() => generateRows(ROW_COUNT), []);
  const columns = useMemo(buildColumns, []);

  return (
    <DataTable
      height={500}
      withTableBorder
      withColumnBorders
      striped
      records={records}
      columns={columns}
      virtualization={{
        rows: true,
        columns: true,
        estimateRowHeight: 36,
        estimateColumnWidth: 100,
        overscanRows: 8,
        overscanColumns: 4,
      }}
    />
  );
}
