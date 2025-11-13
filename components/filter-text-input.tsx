"use client";

import { TextInput, Loader } from "@mantine/core";
import React, { useTransition } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useDebouncedValue } from "@mantine/hooks";

export type FilterTextInputProps = {
  field: string;
};

export const FilterTextInput = ({ field }: FilterTextInputProps) => {
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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value);
  };

  return (
    <TextInput
      leftSection={isLoading ? <Loader size="xs" /> : null}
      value={inputValue}
      onChange={handleInputChange}
    />
  );
};
