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
  TextInput,
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
import { zod4Resolver, zodResolver } from "mantine-form-zod-resolver";
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
    validate: zod4Resolver(
      workflowInformationSchema.extend({ id: z.string() })
    ),
    initialValues: {
      id: workflowId,
      fields: [],
    },
  });

  const [customFieldKey, setCustomFieldKey] = React.useState("");
  const [customFieldLabel, setCustomFieldLabel] = React.useState("");

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

  // Whether any completed workflow run exists to source fields from
  const hasWorkflowRun = workflow.hasWorkflowRun;

  // Deduplicated fields aggregated server-side across the last 10 runs
  const availableFields = workflow.availableFields;
  const connectedFieldKeys = form.values.fields.map((f) => f.fieldKey);
  const filteredAvailableFields = availableFields.filter(
    (f) => !connectedFieldKeys.includes(f.value)
  );

  const addField = (label: string, fieldKey: string) => {
    if (connectedFieldKeys.includes(fieldKey)) {
      return;
    }
    form.insertListItem("fields", { label, fieldKey });
  };

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

          {/* Available Fields Section */}
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={4}>Verfügbare Felder</Title>
              <Text size="xs" c="dimmed">
                Felder aus den letzten 10 abgeschlossenen Ausführungen
                (Duplikate entfernt).
              </Text>
              {!hasWorkflowRun ? (
                <EmptyState text="Keine Workflow-Ausführung verfügbar" />
              ) : filteredAvailableFields.length === 0 ? (
                <EmptyState text="Keine Felder verfügbar" />
              ) : (
                filteredAvailableFields.map((field) => (
                  <Group key={field.value} justify="space-between">
                    <Stack gap="xs">
                      <Text fw={500}>Feld: {field.value}</Text>
                      <Text size="xs" c="dimmed">
                        Prozess: {field.processName}
                      </Text>
                    </Stack>
                    <ActionIcon
                      variant="light"
                      onClick={() => addField(field.label, field.value)}
                    >
                      <IconPlus style={baseIconStyles} />
                    </ActionIcon>
                  </Group>
                ))
              )}
            </Stack>
          </Paper>

          {/* Custom Field Section */}
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={4}>Eigenes Feld hinzufügen</Title>
              <Text size="xs" c="dimmed">
                Felder, die noch in keiner Ausführung vorkommen (z. B. nach
                einem Schema-Update), können hier manuell hinzugefügt werden.
              </Text>
              <Group align="flex-end" gap="sm">
                <TextInput
                  label="Feldschlüssel"
                  placeholder="z. B. customerName"
                  value={customFieldKey}
                  onChange={(e) => setCustomFieldKey(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Bezeichnung"
                  placeholder="z. B. Kundenname"
                  value={customFieldLabel}
                  onChange={(e) => setCustomFieldLabel(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  leftSection={<IconPlus style={baseIconStyles} />}
                  disabled={
                    customFieldKey.trim().length === 0 ||
                    connectedFieldKeys.includes(customFieldKey.trim())
                  }
                  onClick={() => {
                    const key = customFieldKey.trim();
                    const label = customFieldLabel.trim() || key;
                    addField(label, key);
                    setCustomFieldKey("");
                    setCustomFieldLabel("");
                  }}
                >
                  Hinzufügen
                </Button>
              </Group>
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
                  {form.values.fields.map((field, index) => {
                    const fieldInfo = availableFields.find(
                      (f) => f.value === field.fieldKey
                    );

                    return (
                      <Paper key={index} p="sm" withBorder>
                        <Group justify="space-between">
                          <Stack gap="xs">
                            <Text fw={500}>Feld: {field.fieldKey}</Text>
                            {fieldInfo ? (
                              <Text size="xs" c="dimmed">
                                Prozess: {fieldInfo.processName}
                              </Text>
                            ) : (
                              <Text size="xs" c="dimmed">
                                Eigenes Feld
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
                              disabled={index === form.values.fields.length - 1}
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
