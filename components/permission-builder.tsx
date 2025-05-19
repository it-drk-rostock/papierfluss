"use client";
import React, { useEffect } from "react";
import { QueryBuilderMantine } from "@react-querybuilder/mantine";
import { useState } from "react";
import {
  type Field,
  QueryBuilder,
  type RuleGroupType,
  formatQuery,
} from "react-querybuilder";
import { parseJSONata } from "react-querybuilder/parseJSONata";
import { useQuery } from "@tanstack/react-query";
import { Loader, rem, Stack, Text } from "@mantine/core";
import { getUserNames } from "@/server/utils/get-usernames";
import { createFormActions } from "@mantine/form";

export const PermissionBuilder = ({
  initialData,
  formActionName,
  fieldValue,
  label,
  submissions,
}: {
  initialData: string;
  formActionName: string;
  fieldValue: string;
  label: string;
  submissions?: { data: Record<string, string> }[];
}) => {
  const formAction = createFormActions(formActionName);

  const [query, setQuery] = useState<RuleGroupType>(
    parseJSONata(initialData) ?? {
      combinator: "and",
      rules: [],
    }
  );

  const {
    data: userNames,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["userNames"],
    queryFn: () => getUserNames(),
    staleTime: 0,
  });

  // Helper function to get unique values for a specific field
  const getUniqueFieldValues = (fieldName: string) => {
    return Array.from(
      new Set(submissions?.map((s) => s.data[fieldName]).filter(Boolean) || [])
    );
  };

  // Get all unique field names from submissions
  const submissionFields = submissions?.length
    ? Array.from(new Set(submissions.flatMap((s) => Object.keys(s.data))))
    : [];

  const fields: Field[] = [
    {
      name: "user.name",
      label: "Name",
      valueEditorType: "select",
      values:
        userNames?.map((name) => ({
          name: name,
          label: name,
        })) || [],
    },
    { name: "user.email", label: "E-Mail" },
    { name: "user.role", label: "Rolle" },
    { name: "user.id", label: "Benutzer ID" },
    // Dynamically add fields from submissions without the submission. prefix
    ...submissionFields.map((fieldName) => ({
      name: `data.${fieldName}`, // Removed submission. prefix to match the context structure
      label: fieldName,
      valueEditorType: "text",
    })),
  ];

  useEffect(() => {
    formAction.setFieldValue(
      fieldValue,
      formatQuery(query, {
        format: "jsonata",
        parseNumbers: true,
      })
    );
  }, [query, formAction, fieldValue]);

  if (isPending) {
    return <Loader />;
  }

  if (isError) {
    return <Text c="red">Fehler beim Laden: {error?.message}</Text>;
  }

  return (
    <Stack gap={rem(4)}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <QueryBuilderMantine>
        <QueryBuilder
          fields={fields}
          defaultQuery={query}
          onQueryChange={setQuery}
        />
      </QueryBuilderMantine>
    </Stack>
  );
};
