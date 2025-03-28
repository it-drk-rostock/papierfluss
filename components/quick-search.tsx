"use client";

import { useDebouncedValue } from "@mantine/hooks";
import { Loader, TextInput } from "@mantine/core";
import React, { useEffect, useState, useTransition } from "react";
import { parseAsString, useQueryState } from "nuqs";

export const QuickSearch = ({ param }: { param?: string }) => {
  const [isLoading, startTransition] = useTransition();
  const [search, setSearch] = useQueryState(
    param ?? "search",
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
    <TextInput
      value={inputValue}
      onChange={handleInputChange}
      placeholder="Suche"
      className="w-full"
      leftSection={isLoading ? <Loader size="xs" /> : null}
    />
  );
};
