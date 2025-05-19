"use client";

import {
  Combobox,
  InputBase,
  Input,
  Loader,
  useCombobox,
  Stack,
  Text,
  rem,
} from "@mantine/core";
import { createFormActions } from "@mantine/form";
import { useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";

export type EntitySelectProps = {
  formActionName: string;
  formField: string;
  label?: string;
  initialValue?: { id: string; [key: string]: any } | null;
  error?: string;
  action: any;
  displayKeys: string[];
  dataKey: string | string[] | Record<string, string>;
};

export const EntitySelect = ({
  formActionName,
  formField,
  label,
  initialValue,
  error,
  action,
  displayKeys,
  dataKey,
}: EntitySelectProps) => {
  const formAction = createFormActions(formActionName);

  const [firstOpen, setFirstOpen] = useState(false);

  const [value, setValue] = useState<{ id: string; [key: string]: any } | null>(
    initialValue || null
  );

  const [search, setSearch] = useState("");

  const [debounced] = useDebouncedValue(search, 300);

  const { isLoading, data } = useQuery({
    queryKey: [formField, debounced],
    queryFn: () => action(debounced),
    enabled: firstOpen,
  });

  const items = Array.isArray(data) ? data : data?.[dataKey] || [];

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      combobox.focusTarget();
    },
    onDropdownOpen: () => {
      combobox.focusSearchInput();
      if (!firstOpen) {
        setFirstOpen(true);
      }
    },
  });

  const getDisplayValue = (item: { [key: string]: any }) => {
    if (typeof displayKeys === "string") {
      return item[displayKeys];
    }
    return displayKeys
      .map((key) => item[key])
      .filter(Boolean)
      .join(" ");
  };

  const getFormValue = (item: { [key: string]: any }) => {
    if (typeof dataKey === "string") {
      return item[dataKey];
    }
    if (Array.isArray(dataKey)) {
      return dataKey.map((key) => item[key]);
    }
    return Object.entries(dataKey).reduce((obj, [targetKey, sourceKey]) => {
      obj[targetKey] = item[sourceKey];
      return obj;
    }, {} as { [key: string]: any });
  };

  return (
    <Stack gap={rem(4)}>
      <Text component="label" size="sm" fw={500}>
        {label}
      </Text>
      <Combobox
        store={combobox}
        withinPortal={true}
        onOptionSubmit={(val) => {
          const selectedEntity = items.find((entity) => entity.id === val);
          setValue(selectedEntity);
          formAction.setFieldValue(formField, getFormValue(selectedEntity));
          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <InputBase
            component="button"
            type="button"
            pointer
            rightSection={<Combobox.Chevron />}
            onClick={() => combobox.toggleDropdown()}
            rightSectionPointerEvents="none"
          >
            {(value && getDisplayValue(value)) || (
              <Input.Placeholder>Auswählen</Input.Placeholder>
            )}
          </InputBase>
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder={`Suche ${label}`}
          />
          <Combobox.Options>
            {isLoading ? (
              <Combobox.Empty>
                <Loader size="sm" />
              </Combobox.Empty>
            ) : items.length > 0 ? (
              items.map((item) => (
                <Combobox.Option value={item.id} key={item.id}>
                  {getDisplayValue(item)}
                </Combobox.Option>
              ))
            ) : (
              <Combobox.Empty>Keine Ergebnisse</Combobox.Empty>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      {error && (
        <Text c="red" size="xs">
          {error}
        </Text>
      )}
    </Stack>
  );
};
