'use client';

import { Group, Switch } from '@mantine/core';
import {
  DataTable,
  type DataTableColumnFilterDateRangeValue,
  type DataTableFiltersValue,
} from '__PACKAGE__';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { type Employee, employees } from '~/data';

const ALL_RECORDS: Employee[] = employees.slice(0, 100);

type EmployeeRow = Employee & {
  age: number;
  isSenior: boolean;
};

const RECORDS: EmployeeRow[] = ALL_RECORDS.map((e) => {
  const age = dayjs().diff(e.birthDate, 'year');
  return { ...e, age, isSenior: age >= 70 };
});

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'] as const;
type EmailDomain = (typeof EMAIL_DOMAINS)[number];

function applyFilters(records: EmployeeRow[], filters: DataTableFiltersValue) {
  return records.filter((r) => {
    const name = filters.name as string | undefined;
    if (name && !`${r.firstName} ${r.lastName}`.toLowerCase().includes(name.toLowerCase())) return false;

    // Filter key matches the column accessor literally — including dot-notation accessors.
    const departments = filters['department.name'] as string[] | undefined;
    if (departments?.length && !departments.includes(r.department.name)) return false;

    const ageRange = filters.age as [number, number] | undefined;
    if (ageRange) {
      const [min, max] = ageRange;
      if (r.age < min || r.age > max) return false;
    }

    const isSenior = filters.isSenior as boolean | undefined;
    if (isSenior !== undefined && r.isSenior !== isSenior) return false;

    const emailDomain = filters.email as EmailDomain | undefined;
    if (emailDomain && !r.email.toLowerCase().endsWith(`@${emailDomain}`)) return false;

    const birthFilter = filters.birthDate as DataTableColumnFilterDateRangeValue | undefined;
    if (birthFilter) {
      const [from, to] = birthFilter;
      const recordDate = dayjs(r.birthDate);
      if (from && recordDate.isBefore(from, 'day')) return false;
      if (to && recordDate.isAfter(to, 'day')) return false;
    }

    return true;
  });
}

export function DeclarativeColumnFiltersExample() {
  const [filters, setFilters] = useState<DataTableFiltersValue>({});
  const [showFilterRow, setShowFilterRow] = useState(true);

  const departmentOptions = useMemo(
    () => [...new Set(ALL_RECORDS.map((e) => e.department.name))].map((name) => ({ value: name, label: name })),
    []
  );

  const filteredRecords = useMemo(() => applyFilters(RECORDS, filters), [filters]);

  return (
    <>
      <Group mb="sm">
        <Switch
          label="Show inline filter row"
          checked={showFilterRow}
          onChange={(e) => setShowFilterRow(e.currentTarget.checked)}
        />
      </Group>
      <DataTable
        height={400}
        withTableBorder
        withColumnBorders
        highlightOnHover
        records={filteredRecords}
        filters={filters}
        onFiltersChange={setFilters}
        withFilterRow={showFilterRow}
        columns={[
          {
            accessor: 'name',
            render: (r) => `${r.firstName} ${r.lastName}`,
            // kind: 'text' — debounced TextInput, defaults to inline.
            columnFilter: { kind: 'text', placeholder: 'Search name…', debounceMs: 200 },
          },
          {
            accessor: 'department.name',
            title: 'Department',
            render: (r) => r.department.name,
            // kind: 'multiselect' — multi-choice dropdown with chips.
            columnFilter: {
              kind: 'multiselect',
              options: departmentOptions,
              placeholder: 'Any',
              searchable: true,
            },
          },
          {
            accessor: 'age',
            title: 'Age',
            width: 120,
            // kind: 'numberSlider' — bounded range slider, much more compact than two number inputs.
            // Use 'numberRange' instead when min/max aren't known up front.
            columnFilter: { kind: 'numberRange', min: 0, max: 100, step: 1 },
          },
          {
            accessor: 'isSenior',
            title: 'Senior?',
            render: (r) => (r.isSenior ? 'Yes' : 'No'),
            // kind: 'boolean' — Yes / No / All select.
            columnFilter: { kind: 'boolean', allLabel: 'Any' },
          },
          {
            accessor: 'birthDate',
            title: 'Born',
            width: 220,
            render: (r) => dayjs(r.birthDate).format('MMM D, YYYY'),
            // kind: 'dateRange' — Mantine DatePickerInput with type="range".
            // Emits [fromISO, toISO] (either may be null) into the controlled state.
            // Requires @mantine/dates (declared as an optional peer dep).
            columnFilter: { kind: 'dateRange', placeholder: 'Pick a range' },
          },
          {
            accessor: 'email',
            title: 'Email',
            // Domain picker — Select fits cleanly in a narrow inline cell.
            columnFilter: {
              kind: 'select',
              placeholder: 'Any',
              options: EMAIL_DOMAINS.map((d) => ({ value: d, label: `@${d}` })),
            },
          },
        ]}
      />
    </>
  );
}
