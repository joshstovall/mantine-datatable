import {
  CheckIcon,
  Combobox,
  Group,
  Input,
  OverflowList,
  Pill,
  PillsInput,
  ScrollArea,
  useCombobox,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import type { DataTableColumnFilterMultiSelect, DataTableColumnFilterSelectOption } from '../types';

type MultiSelectColumnFilterProps = {
  config: DataTableColumnFilterMultiSelect;
  value: unknown;
  setValue: (next: string[] | undefined) => void;
  ariaLabel?: string;
};

export function MultiSelectColumnFilter({ config, value, setValue, ariaLabel }: MultiSelectColumnFilterProps) {
  const selected = useMemo(() => (Array.isArray(value) ? (value as string[]) : []), [value]);
  const [search, setSearch] = useState('');

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch('');
    },
    onDropdownOpen: () => {
      combobox.updateSelectedOptionIndex('active');
      if (config.searchable) combobox.focusSearchInput();
    },
  });

  const optionByValue = useMemo(() => {
    const map = new Map<string, DataTableColumnFilterSelectOption>();
    for (const o of config.options) map.set(o.value, o);
    return map;
  }, [config.options]);

  const handleSelect = (val: string) => {
    const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val];
    setValue(next.length === 0 ? undefined : next);
  };

  const handleRemove = (val: string) => {
    const next = selected.filter((v) => v !== val);
    setValue(next.length === 0 ? undefined : next);
  };

  const visibleOptions = config.searchable
    ? config.options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : config.options;

  const selectedItems = useMemo(
    () =>
      selected.map((v) => ({
        value: v,
        label: optionByValue.get(v)?.label ?? v,
      })),
    [selected, optionByValue]
  );

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={handleSelect}
      withinPortal
      // Don't squeeze the dropdown to the (often narrow) cell width — let it size to the
      // longest option label, with a reasonable floor so it isn't comically narrow either.
      width="max-content"
      position="bottom-start"
      styles={{ dropdown: { minWidth: 200 } }}
    >
      <Combobox.DropdownTarget>
        <PillsInput
          size="xs"
          pointer
          aria-label={ariaLabel}
          onClick={() => combobox.toggleDropdown()}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          // Don't let pill padding grow the input — keeps the filter row a constant height
          // regardless of how many items are picked.
          styles={{ input: { minHeight: 'auto' } }}
        >
          {selectedItems.length === 0 ? (
            <Input.Placeholder>{config.placeholder}</Input.Placeholder>
          ) : (
            <OverflowList
              data={selectedItems}
              gap={4}
              maxRows={1}
              renderItem={(item) => (
                <Pill
                  key={item.value}
                  size="xs"
                  withRemoveButton
                  onRemove={() => handleRemove(item.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {item.label}
                </Pill>
              )}
              renderOverflow={(hidden) => <Pill size="xs">+{hidden.length}</Pill>}
            />
          )}
        </PillsInput>
      </Combobox.DropdownTarget>
      <Combobox.Dropdown>
        {config.searchable ? (
          <Combobox.Search
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search…"
          />
        ) : null}
        <Combobox.Options>
          <ScrollArea.Autosize type="scroll" mah={220}>
            {visibleOptions.length === 0 ? (
              <Combobox.Empty>Nothing found</Combobox.Empty>
            ) : (
              visibleOptions.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <Combobox.Option value={opt.value} key={opt.value} active={checked}>
                    <Group gap="xs" wrap="nowrap">
                      <CheckIcon
                        size={12}
                        style={{ visibility: checked ? 'visible' : 'hidden', flexShrink: 0 }}
                      />
                      <span>{opt.label}</span>
                    </Group>
                  </Combobox.Option>
                );
              })
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
