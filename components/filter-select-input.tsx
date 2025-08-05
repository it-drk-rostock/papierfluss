"use client";

import { Select, Loader } from "@mantine/core";
import React, { useTransition } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useDebouncedValue } from "@mantine/hooks";

export type FilterSelectInputProps = {
  field: string;
  data: { value: string; label: string }[];
};

export const FilterSelectInput = ({ field, data }: FilterSelectInputProps) => {
  const [isLoading, startTransition] = useTransition();
  const [queryState, setQueryState] = useQueryState(
    field,
    parseAsString.withOptions({
      startTransition,
      shallow: false,
    })
  );

  const [inputValue, setInputValue] = React.useState(queryState || "");
  const [debouncedValue] = useDebouncedValue(inputValue, 750);

  React.useEffect(() => {
    setQueryState(debouncedValue || null);
  }, [debouncedValue, setQueryState]);

  const handleInputChange = (value: string | null) => {
    setInputValue(value || "");
  };

  return (
    <Select
      comboboxProps={{ withinPortal: false }}
      leftSection={isLoading ? <Loader size="xs" /> : null}
      value={inputValue}
      onChange={handleInputChange}
      data={data}
      searchable
      clearable
    />
  );
};
