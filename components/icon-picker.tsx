"use client";
import { useMemo, useState } from "react";
import * as TablerIcons from "@tabler/icons-react";
import { IconSearch } from "@tabler/icons-react";
import {
  Popover,
  Input,
  Stack,
  TextInput,
  ScrollArea,
  Group,
  Button,
  Pagination,
  Center,
  Text,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { DynamicIcon } from "./dynamic-icon";
import { createFormActions } from "@mantine/form";

interface IconPickerProps {
  formName: string;
  fieldName: string;
  value?: string;
  label?: string;
}

const ICONS_PER_PAGE = 100;

// Move icons outside component to prevent recreation
const allIcons = Object.entries(TablerIcons)
  .filter(([name]) => name.startsWith("Icon"))
  .map(([name]) => ({
    name: name.replace("Icon", ""),
    friendly_name:
      name
        .replace("Icon", "")
        .match(/[A-Z][a-z]+/g)
        ?.join(" ") ?? name,
  }));

const useIconPicker = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const filteredIcons = useMemo(
    () =>
      debouncedSearch === ""
        ? allIcons
        : allIcons.filter((icon) =>
            icon.friendly_name
              .toLowerCase()
              .includes(debouncedSearch.toLowerCase())
          ),
    [debouncedSearch]
  );

  const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);

  const paginatedIcons = useMemo(() => {
    const startIndex = (page - 1) * ICONS_PER_PAGE;
    return filteredIcons.slice(startIndex, startIndex + ICONS_PER_PAGE);
  }, [filteredIcons, page]);

  return {
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    icons: paginatedIcons,
    totalIcons: filteredIcons.length,
  };
};

export const IconPicker = ({
  formName,
  fieldName,
  value,
  label = "Icon",
}: IconPickerProps) => {
  const [opened, setOpened] = useState(false);
  const { icons, search, setSearch, page, setPage, totalPages, totalIcons } =
    useIconPicker();

  const formActions = createFormActions(formName);
  const selectedIcon = useMemo(
    () => allIcons.find((i) => i.name === value),
    [value]
  );

  const handleIconSelect = (iconName: string) => {
    formActions.setFieldValue(fieldName, iconName);
    setOpened(false);
  };

  return (
    <Popover opened={opened} onChange={setOpened} width={350} position="top">
      <Popover.Target>
        <Input.Wrapper label={label}>
          <Input
            component="button"
            type="button"
            onClick={() => setOpened(true)}
            rightSection={value && <DynamicIcon name={value} size={20} />}
          >
            {selectedIcon ? selectedIcon.friendly_name : "Icon auswählen"}
          </Input>
        </Input.Wrapper>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="xs">
          <TextInput
            placeholder="Icon suchen..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftSection={<IconSearch size={16} />}
            rightSection={
              <Text size="sm" c="dimmed">
                {totalIcons} Icons
              </Text>
            }
          />
          <ScrollArea h={300}>
            <Group gap="xs" wrap="wrap">
              {icons.map((icon) => (
                <Button
                  key={icon.name}
                  variant={value === icon.name ? "filled" : "light"}
                  onClick={() => handleIconSelect(icon.name)}
                  size="sm"
                >
                  <DynamicIcon name={icon.name} size={20} />
                </Button>
              ))}
            </Group>
          </ScrollArea>

          {totalPages > 1 && (
            <Center>
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                size="sm"
              />
            </Center>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
