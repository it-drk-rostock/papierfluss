"use client";

import React from "react";
import {
  Stack,
  Title,
  Paper,
  Text,
  Group,
  Loader,
  ActionIcon,
  Button,
} from "@mantine/core";

import {
  getWorkflowInformation,
  updateWorkflowInformation,
} from "../../../_actions";
import { EmptyState } from "@/components/empty-state";
import {
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { useQuery } from "@tanstack/react-query";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { workflowInformationSchema } from "../../../_schemas";
import { z } from "zod";

type WorkflowInformationFormValues = {
  id: string;
  fields: Array<{
    label: string;
    fieldKey: string;
  }>;
};

export const WorkflowInformationForm = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const {
    data: workflow,
    isLoading: isWorkflowLoading,
    isError: isWorkflowError,
  } = useQuery({
    queryKey: ["workflowInformation", workflowId],
    queryFn: () => getWorkflowInformation(workflowId),
    staleTime: 0,
  });

  const { execute: executeUpdate, status: updateStatus } = useEnhancedAction({
    action: updateWorkflowInformation,
    hideModals: true,
  });

  const form = useForm<WorkflowInformationFormValues>({
    validate: zodResolver(workflowInformationSchema.extend({ id: z.string() })),
    initialValues: {
      id: workflowId,
      fields: [],
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (
      workflow &&
      workflow.information &&
      typeof workflow.information === "object" &&
      "fields" in workflow.information
    ) {
      const info = workflow.information as {
        fields: Array<{ label: string; fieldKey: string }>;
      };
      form.setValues({
        id: workflowId,
        fields: info.fields || [],
      });
    }
  }, [workflow?.information, workflowId]);

  const isLoading = isWorkflowLoading;
  const isError = isWorkflowError;

  if (isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    );
  }

  if (isError || !workflow) {
    return (
      <Stack align="center" py="xl">
        <Text c="red">Fehler beim Laden der Workflow Informationen</Text>
      </Stack>
    );
  }

  // Check if workflow run exists
  const hasWorkflowRun = workflow.latestWorkflowRun !== null;
  const latestWorkflowRun = workflow.latestWorkflowRun;

  console.log("Workflow data:", workflow);
  console.log("Has workflow run:", hasWorkflowRun);
  console.log("Latest workflow run:", latestWorkflowRun);

  // Get all available field keys from workflow run data
  const getAllAvailableFields = () => {
    const allFields: Array<{
      value: string;
      label: string;
      processName: string;
    }> = [];

    if (!latestWorkflowRun) {
      console.log("No latest workflow run found");
      return allFields;
    }

    console.log(
      "Processing workflow run processes:",
      latestWorkflowRun.processes
    );

    latestWorkflowRun.processes.forEach((processRun: any) => {
      console.log("Processing run:", processRun);
      if (processRun.data && typeof processRun.data === "object") {
        const data = processRun.data as Record<string, unknown>;
        console.log("Process run data:", data);
        Object.keys(data).forEach((key) => {
          allFields.push({
            value: key,
            label: key,
            processName: processRun.process.name,
          });
        });
      } else {
        console.log("No data or invalid data for process run:", processRun);
      }
    });

    console.log("Available fields found:", allFields);
    return allFields;
  };

  const availableFields = getAllAvailableFields();
  const connectedFieldKeys = form.values.fields.map((f: any) => f.fieldKey);
  const filteredAvailableFields = availableFields.filter(
    (f: any) => !connectedFieldKeys.includes(f.value)
  );

  const handleSave = () => {
    executeUpdate(form.values);
  };

  return (
    <Stack gap="xl">
      <Stack gap="0">
        <Title order={2}>Workflow Informationen</Title>
        <Text c="dimmed">{workflow.name}</Text>
        {workflow.description && (
          <Text size="sm" c="dimmed">
            {workflow.description}
          </Text>
        )}
      </Stack>
      <Paper p="lg" withBorder>
        <Stack gap="md">
          <Text size="sm" c="dimmed" ta="center">
            Konfigurieren Sie die dynamischen Informationen, die in der
            Workflow-Ausführung angezeigt werden sollen.
          </Text>

          {!hasWorkflowRun ? (
            <Paper withBorder p="md">
              <EmptyState text="Keine Workflow-Ausführung verfügbar"></EmptyState>
            </Paper>
          ) : (
            <>
              {/* Available Fields Section */}
              <Paper withBorder p="md">
                <Stack gap="sm">
                  <Title order={4}>Verfügbare Felder</Title>
                  {filteredAvailableFields.length === 0 ? (
                    <EmptyState text="Keine Felder verfügbar" />
                  ) : (
                    filteredAvailableFields.map((field: any) => (
                      <Group key={field.value} justify="space-between">
                        <Stack gap="xs">
                          <Text fw={500}>Feld: {field.value}</Text>
                          <Text size="xs" c="dimmed">
                            Prozess: {field.processName}
                          </Text>
                        </Stack>
                        <ActionIcon
                          variant="light"
                          onClick={() =>
                            form.insertListItem("fields", {
                              label: field.label,
                              fieldKey: field.value,
                            })
                          }
                        >
                          <IconPlus style={baseIconStyles} />
                        </ActionIcon>
                      </Group>
                    ))
                  )}
                </Stack>
              </Paper>

              {/* Connected Fields Section */}
              <Paper withBorder p="md">
                <Stack gap="sm">
                  <Title order={4}>Verbundene Felder</Title>
                  {form.values.fields.length === 0 ? (
                    <EmptyState text="Keine Felder verbunden" />
                  ) : (
                    <>
                      {form.values.fields.map((field: any, index: number) => {
                        const fieldInfo = availableFields.find(
                          (f: any) => f.value === field.fieldKey
                        );

                        return (
                          <Paper key={index} p="sm" withBorder>
                            <Group justify="space-between">
                              <Stack gap="xs">
                                <Text fw={500}>Feld: {field.fieldKey}</Text>
                                {fieldInfo && (
                                  <Text size="xs" c="dimmed">
                                    Prozess: {fieldInfo.processName}
                                  </Text>
                                )}
                              </Stack>
                              <Group gap="xs">
                                <ActionIcon
                                  variant="light"
                                  disabled={index === 0}
                                  onClick={() =>
                                    form.reorderListItem("fields", {
                                      from: index,
                                      to: index - 1,
                                    })
                                  }
                                >
                                  <IconArrowUp style={baseIconStyles} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  disabled={
                                    index === form.values.fields.length - 1
                                  }
                                  onClick={() =>
                                    form.reorderListItem("fields", {
                                      from: index,
                                      to: index + 1,
                                    })
                                  }
                                >
                                  <IconArrowDown style={baseIconStyles} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() =>
                                    form.removeListItem("fields", index)
                                  }
                                >
                                  <IconTrash style={baseIconStyles} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          </Paper>
                        );
                      })}
                    </>
                  )}
                </Stack>
              </Paper>
            </>
          )}
          <Button
            fullWidth
            onClick={handleSave}
            loading={updateStatus === "executing"}
          >
            Informationen speichern
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};
