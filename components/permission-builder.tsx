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
import { parseJsonLogic } from "react-querybuilder/parseJsonLogic";
import { useQuery } from "@tanstack/react-query";
import { Loader, rem, Stack, Text } from "@mantine/core";
import { getUserNames } from "@/server/utils/get-usernames";
import { createFormActions } from "@mantine/form";
import { getTeamNames } from "@/server/utils/get-teamnames";
import { arrayContainsOperator } from "@/utils/array-contains-operator";

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
    parseJsonLogic(initialData) ?? {
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

  const {
    data: teamNames,
    isPending: teamNamesPending,
    isError: isTeamNamesError,
    error: teamNamesError,
  } = useQuery({
    queryKey: ["teamNames"],
    queryFn: () => getTeamNames(),
    staleTime: 0,
  });

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
          value: name, // Changed from name to value
          label: name,
        })) || [],
    },
    { name: "user.email", label: "E-Mail" },
    { name: "user.role", label: "Rolle" },
    { name: "user.id", label: "Benutzer ID" },
    {
      name: "user.teams",
      label: "Benutzer Bereiche",
      valueEditorType: "multiselect",
      values: teamNames?.map((team) => ({ value: team, label: team })),
      defaultOperator: "contains",
      operators: [
        {
          name: "contains",
          label: "enthält",
          formatOp: (field, op, valueSource, value) =>
            arrayContainsOperator(field, value),
        },
      ],
    },
    ...submissionFields.map((fieldName) => ({
      name: `data.${fieldName}`,
      label: fieldName,
      valueEditorType: "text",
    })),
  ];

  useEffect(() => {
    formAction.setFieldValue(
      fieldValue,
      JSON.stringify(formatQuery(query, "jsonlogic"))
    );
  }, [query, formAction, fieldValue]);

  if (isPending || teamNamesPending) {
    return <Loader />;
  }

  if (isError || isTeamNamesError) {
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
          getValueSources={() => ["value", "field"]}
        />
      </QueryBuilderMantine>
    </Stack>
  );
};
