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

export const WorkflowPermissionBuilder = ({
  initialData,
  formActionName,
  fieldValue,
  label,
  workflowRuns,
  permissionType,
}: {
  initialData: string;
  formActionName: string;
  fieldValue: string;
  label: string;
  workflowRuns?: Array<{
    processes: Array<{
      data: Record<string, unknown> | null;
      process: {
        name: string;
      };
    }>;
  }>;
  permissionType: "workflow" | "process";
}) => {
  const formAction = createFormActions(formActionName);

  const [query, setQuery] = useState<RuleGroupType>(() => {
    // Handle the case where initialData is "true" (string)
    if (initialData === "true") {
      return {
        combinator: "and",
        rules: [],
      };
    }

    // Try to parse JSONLogic, fallback to empty rules
    try {
      const parsed = parseJsonLogic(initialData);
      return (
        parsed ?? {
          combinator: "and",
          rules: [],
        }
      );
    } catch {
      return {
        combinator: "and",
        rules: [],
      };
    }
  });

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
  } = useQuery({
    queryKey: ["teamNames"],
    queryFn: () => getTeamNames(),
    staleTime: 0,
  });

  // Get all unique field names from workflow runs
  const workflowFields = workflowRuns?.length
    ? Array.from(
        new Set(
          workflowRuns.flatMap((run) =>
            run.processes.flatMap((process) =>
              process.data ? Object.keys(process.data) : []
            )
          )
        )
      )
    : [];

  const fields: Field[] = [
    {
      name: "user.name",
      label: "Name",
      valueEditorType: "select",
      values:
        userNames?.map((name) => ({
          value: name,
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
      values: teamNames?.map((team) => ({
        value: team,
        label: team,
      })),
      defaultOperator: "contains",
    },
    // Add workflow-specific fields
    {
      name: "workflow.responsibleTeam",
      label: "Verantwortlicher Bereich",
      valueEditorType: "select" as const,
      values:
        teamNames?.map((team) => ({
          value: team,
          label: team,
        })) || [],
    },
    {
      name: "workflow.teams",
      label: "Workflow Bereiche",
      valueEditorType: "multiselect" as const,
      values: teamNames?.map((team) => ({
        value: team,
        label: team,
      })),
      defaultOperator: "contains",
    },
    // Add process-specific fields if this is for process permissions
    ...(permissionType === "process"
      ? [
          {
            name: "process.responsibleTeam",
            label: "Prozess Verantwortlicher Bereich",
            valueEditorType: "select" as const,
            values:
              teamNames?.map((team) => ({
                value: team,
                label: team,
              })) || [],
          },
          {
            name: "process.teams",
            label: "Prozess Bereiche",
            valueEditorType: "multiselect" as const,
            values: teamNames?.map((team) => ({
              value: team,
              label: team,
            })),
            defaultOperator: "contains",
          },
        ]
      : []),
    // Add dynamic fields from workflow runs
    ...workflowFields.map((fieldName) => ({
      name: `data.${fieldName}`,
      label: fieldName,
      valueEditorType: "text" as const,
    })),
  ];

  useEffect(() => {
    // If there are no rules, it means "allow all" (true)
    if (query.rules.length === 0) {
      formAction.setFieldValue(fieldValue, "true");
    } else {
      formAction.setFieldValue(
        fieldValue,
        JSON.stringify(formatQuery(query, "jsonlogic"))
      );
    }
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
