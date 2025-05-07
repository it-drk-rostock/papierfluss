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
}: {
  initialData: string;
  formActionName: string;
  fieldValue: string;
  label: string;
}) => {
  const formAction = createFormActions(formActionName);
  const [query, setQuery] = useState<RuleGroupType>(
    parseJSONata(initialData) ?? {
      combinator: "and",
      rules: [],
    }
  );

  useEffect(() => {
    formAction.setFieldValue(
      fieldValue,
      formatQuery(query, { format: "jsonata", parseNumbers: true })
    );
  }, [query]);

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
      operators: [
        { name: "=", label: "equals" },
        { name: "!=", label: "not equals" },
        { name: "contains", label: "contains" },
        { name: "beginsWith", label: "begins with" },
        { name: "endsWith", label: "ends with" },
      ],
    },
    { name: "user.email", label: "E-Mail" },
    { name: "user.role", label: "Rolle" },
    { name: "user.teams", label: "Teams" },
    { name: "user.id", label: "Benutzer ID" },
    { name: "formTeams", label: "Formular Teams" },
  ];

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
