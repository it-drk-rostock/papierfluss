"use client";

import React from "react";
import {
  Stack,
  Title,
  Paper,
  Text,
  Group,
  ActionIcon,
  Button,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { updateFormInformationSchema } from "../../_schemas";
import { updateFormInformation } from "../../_actions";
import { EmptyState } from "@/components/empty-state";

interface FormInformationFormProps {
  form: {
    id: string;
    title: string;
    schema: any;
    information?: {
      fields: Array<{
        label: string;
        fieldKey: string;
      }>;
    };
    submissions: Array<{
      id: string;
      data: Record<string, unknown> | null;
      status: string;
    }>;
  };
}

export const FormInformationForm = ({ form }: FormInformationFormProps) => {
  const { execute: executeUpdate, status: updateStatus } = useEnhancedAction({
    action: updateFormInformation,
    hideModals: true,
  });

  const formForm = useForm({
    validate: zodResolver(updateFormInformationSchema),
    initialValues: {
      id: form.id,
      fields: form.information?.fields || [],
    },
  });

  // Get all available field keys from submissions data
  const getAllAvailableFields = () => {
    const allFields: Array<{
      value: string;
      label: string;
    }> = [
      // Add predefined fields
      { value: "status", label: "Status" },
      { value: "actions", label: "Aktionen" },
    ];

    form.submissions.forEach((submission) => {
      if (submission.data && typeof submission.data === "object") {
        const data = submission.data as Record<string, unknown>;
        Object.keys(data).forEach((key) => {
          if (!allFields.some((f) => f.value === key)) {
            allFields.push({
              value: key,
              label: key,
            });
          }
        });
      }
    });

    return allFields;
  };

  const availableFields = getAllAvailableFields();
  const connectedFieldKeys = formForm.values.fields.map((f) => f.fieldKey);
  const filteredAvailableFields = availableFields.filter(
    (f) => !connectedFieldKeys.includes(f.value)
  );

  const handleSave = () => {
    executeUpdate(formForm.values);
  };

  return (
    <Stack gap="md">
      <Stack gap="0">
        <Title order={3}>Formular Informationen</Title>
        <Text c="dimmed" size="sm">
          Konfigurieren Sie die dynamischen Informationen, die in der Tabelle
          angezeigt werden sollen.
        </Text>
      </Stack>

      {form.submissions.length === 0 ? (
        <EmptyState text="Keine Formular-Einreichungen verfügbar" />
      ) : (
        <>
          {/* Available Fields Section */}
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={4}>Verfügbare Felder</Title>
              {filteredAvailableFields.length === 0 ? (
                <EmptyState text="Keine Felder verfügbar" />
              ) : (
                filteredAvailableFields.map((field) => (
                  <Group key={field.value} justify="space-between">
                    <Text>{field.label}</Text>
                    <ActionIcon
                      variant="light"
                      onClick={() =>
                        formForm.insertListItem("fields", {
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
              {formForm.values.fields.length === 0 ? (
                <EmptyState text="Keine Felder verbunden" />
              ) : (
                formForm.values.fields.map((field, index) => (
                  <Paper key={index} p="sm" withBorder>
                    <Group justify="space-between">
                      <Text>{field.label}</Text>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          disabled={index === 0}
                          onClick={() =>
                            formForm.reorderListItem("fields", {
                              from: index,
                              to: index - 1,
                            })
                          }
                        >
                          <IconArrowUp style={baseIconStyles} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          disabled={index === formForm.values.fields.length - 1}
                          onClick={() =>
                            formForm.reorderListItem("fields", {
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
                            formForm.removeListItem("fields", index)
                          }
                        >
                          <IconTrash style={baseIconStyles} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Paper>
                ))
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
        </>
      )}
    </Stack>
  );
};
