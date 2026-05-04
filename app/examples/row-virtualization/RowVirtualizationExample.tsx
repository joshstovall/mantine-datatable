'use client';

import { Avatar, Badge, Button, Group, NumberFormatter, Stack, Text } from '@mantine/core';
import { DataTable, type DataTableRef } from '__PACKAGE__';
import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import { useMemo, useRef } from 'react';

faker.seed(42);

type SyntheticEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  title: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'on-leave' | 'terminated';
};

const DEPARTMENTS = ['Engineering', 'Sales', 'Operations', 'Finance', 'Legal', 'Design', 'Support'];
const STATUSES: SyntheticEmployee['status'][] = ['active', 'active', 'active', 'on-leave', 'terminated'];

function generateRecords(n: number): SyntheticEmployee[] {
  const out: SyntheticEmployee[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: i,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      department: faker.helpers.arrayElement(DEPARTMENTS),
      title: faker.person.jobTitle(),
      salary: faker.number.int({ min: 45000, max: 240000 }),
      hireDate: faker.date.past({ years: 12 }).toISOString().slice(0, 10),
      status: faker.helpers.arrayElement(STATUSES),
    });
  }
  return out;
}

const STATUS_COLORS: Record<SyntheticEmployee['status'], string> = {
  active: 'green',
  'on-leave': 'yellow',
  terminated: 'red',
};

export function RowVirtualizationExample() {
  // 5,000 rich rows. With virtualization off, this would freeze the page on mount.
  const records = useMemo(() => generateRecords(5000), []);
  const dataTableRef = useRef<DataTableRef<SyntheticEmployee> | null>(null);

  return (
    <Stack gap="sm">
      <Group>
        <Button
          variant="light"
          onClick={() => {
            const idx = Math.floor(Math.random() * records.length);
            dataTableRef.current?.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
          }}
        >
          Scroll to random row
        </Button>
        <Button
          variant="light"
          onClick={() => dataTableRef.current?.scrollToIndex(records.length - 1, { align: 'end' })}
        >
          Jump to last row
        </Button>
        <Button
          variant="light"
          color="gray"
          onClick={() => dataTableRef.current?.scrollToIndex(0, { align: 'start' })}
        >
          Back to top
        </Button>
      </Group>
      <DataTable
        height={500}
        withTableBorder
        withColumnBorders
        striped
        highlightOnHover
        records={records}
        dataTableRef={dataTableRef}
        virtualization={{
          rows: true,
          estimateRowHeight: 52,
          overscanRows: 8,
        }}
      columns={[
        {
          accessor: 'employee',
          title: 'Employee',
          width: 280,
          render: (r) => (
            <Group gap="sm" wrap="nowrap">
              <Avatar color="blue" radius="xl" size={32}>
                {r.firstName[0]}
                {r.lastName[0]}
              </Avatar>
              <Stack gap={0}>
                <Text fw={500} size="sm">
                  {r.firstName} {r.lastName}
                </Text>
                <Text size="xs" c="dimmed">
                  {r.email}
                </Text>
              </Stack>
            </Group>
          ),
        },
        { accessor: 'department', width: 140 },
        { accessor: 'title', title: 'Title', width: 240 },
        {
          accessor: 'salary',
          title: 'Salary',
          width: 120,
          textAlign: 'right',
          render: (r) => <NumberFormatter value={r.salary} prefix="$" thousandSeparator />,
        },
        {
          accessor: 'hireDate',
          title: 'Hired',
          width: 120,
          render: (r) => dayjs(r.hireDate).format('MMM D, YYYY'),
        },
        {
          accessor: 'status',
          title: 'Status',
          width: 110,
          render: (r) => (
            <Badge color={STATUS_COLORS[r.status]} variant="light" size="sm">
              {r.status}
            </Badge>
          ),
        },
      ]}
    />
    </Stack>
  );
}
