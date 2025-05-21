"use client";

import { useDebouncedValue } from "@mantine/hooks";
import {
  Button,
  TextInput,
  Text,
  Group,
  ActionIcon,
  Loader,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import React, { ReactNode, useEffect, useState, useTransition } from "react";
import { modals } from "@mantine/modals";
import { useQueryState, parseAsString } from "nuqs";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { useAuthSession } from "@/hooks/use-auth-session";

export type QuickSearchAddProps = {
  modalTitle: string;
  modalDescription?: string;
  modalContent: ReactNode;
  searchParam?: string;
  searchPlaceholder?: string;
};

export const QuickSearchAdd = ({
  modalTitle,
  modalDescription,
  modalContent,
  searchParam = "search",
  searchPlaceholder = "Suche",
}: QuickSearchAddProps) => {
  const { hasAccess } = useAuthSession();
  const [isLoading, startTransition] = useTransition();
  const [search, setSearch] = useQueryState(
    searchParam,
    parseAsString.withOptions({
      startTransition,
      shallow: false,
    })
  );

  const [inputValue, setInputValue] = useState(search || "");
  const [debouncedValue] = useDebouncedValue(inputValue, 750);

  useEffect(() => {
    setSearch(debouncedValue || null);
  }, [debouncedValue, setSearch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value);
  };

  return (
    <>
      <Group gap="xs" wrap="nowrap" w="100%">
        <TextInput
          value={inputValue}
          onChange={handleInputChange}
          placeholder={searchPlaceholder}
          w="100%"
          leftSection={isLoading ? <Loader size="xs" /> : null}
        />
        {hasAccess("moderator") && (
          <>
            <Button
              visibleFrom="sm"
              style={{ flexShrink: 0 }}
              leftSection={<IconPlus size={14} />}
              onClick={() => {
                modals.open({
                  closeOnClickOutside: false,
                  title: modalTitle,
                  children: (
                    <>
                      <Text c="dimmed" size="sm" mb="sm">
                        {modalDescription}
                      </Text>
                      {modalContent}
                    </>
                  ),
                });
              }}
            >
              Hinzufügen
            </Button>

            <ActionIcon
              hiddenFrom="sm"
              size="lg"
              onClick={() => {
                modals.open({
                  closeOnClickOutside: false,
                  title: modalTitle,
                  children: (
                    <>
                      <Text c="dimmed" size="sm" mb="sm">
                        {modalDescription}
                      </Text>
                      {modalContent}
                    </>
                  ),
                });
              }}
              aria-label="Add"
            >
              <IconPlus style={baseIconStyles} />
            </ActionIcon>
          </>
        )}
      </Group>
    </>
  );
};
