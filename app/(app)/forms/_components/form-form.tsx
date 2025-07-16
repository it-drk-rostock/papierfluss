"use client";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { formSchema, updateFormSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { createForm, FormProps, updateForm } from "../_actions";
import {
  Button,
  Group,
  Stack,
  Textarea,
  TextInput,
  Checkbox,
  Alert,
  Paper,
  Title,
  Text,
  ActionIcon,
} from "@mantine/core";
import { PermissionBuilder } from "@/components/permission-builder";
import { EntitySelect } from "@/components/entity-select";
import { getTeams } from "../../dashboard/_actions";
import {
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { EmptyState } from "@/components/empty-state";

interface FormField {
  label: string;
  fieldKey: string;
}

interface FormInformation {
  fields: FormField[];
}

interface FormValues {
  id?: string;
  title: string;
  description: string;
  isPublic: boolean;
  isActive: boolean;
  editFormPermissions: string;
  reviewFormPermissions: string;
  responsibleTeam: {
    id: string;
    name: string;
  };
  information: FormInformation;
}

export const FormForm = ({ form }: { form?: FormProps[0] }) => {
  const formForm = useForm<FormValues>({
    validate: zodResolver(form ? updateFormSchema : formSchema),
    mode: "uncontrolled",
    name: "create-form",
    initialValues: form
      ? {
          id: form.id,
          title: form.title,
          description: form.description || "",
          isPublic: form.isPublic,
          isActive: form.isActive,
          editFormPermissions: form.editFormPermissions || "",
          reviewFormPermissions: form.reviewFormPermissions || "",
          responsibleTeam: form.responsibleTeam || { id: "", name: "" },
          information: form.information || { fields: [] },
        }
      : {
          title: "",
          description: "",
          isPublic: false,
          isActive: true,
          editFormPermissions: "",
          reviewFormPermissions: "",
          responsibleTeam: {
            id: "",
            name: "",
          },
          information: { fields: [] },
        },
  });

  const { execute, status } = useEnhancedAction({
    action: form ? updateForm : createForm,
    hideModals: true,
  });

  // Get all available field keys from submissions data
  const getAllAvailableFields = () => {
    const allFields: Array<{
      value: string;
      label: string;
    }> = [
      // Add predefined fields
    ];

    if (form?.submissions) {
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
    }

    return allFields;
  };

  const availableFields = getAllAvailableFields();
  const connectedFieldKeys = formForm.values.information.fields.map(
    (f: FormField) => f.fieldKey
  );
  const filteredAvailableFields = availableFields.filter(
    (f) => !connectedFieldKeys.includes(f.value)
  );

  return (
    <form
      onSubmit={formForm.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <TextInput label="Titel" {...formForm.getInputProps("title")} />
        <Textarea
          label="Beschreibung"
          {...formForm.getInputProps("description")}
        />
        <EntitySelect
          formActionName="create-form"
          formField="responsibleTeam"
          label="Verantwortlicher Bereich"
          initialValue={formForm.values.responsibleTeam}
          error={formForm.errors.responsibleTeam?.toString()}
          action={getTeams}
          displayKeys={["name"]}
          dataKey={{ id: "id", name: "name" }}
        />
        <Checkbox
          label="Öffentlich"
          {...formForm.getInputProps("isPublic", { type: "checkbox" })}
        />
        <Checkbox
          label="Aktiv"
          {...formForm.getInputProps("isActive", { type: "checkbox" })}
        />

        {form && (
          <>
            {form.submissions.length === 0 && (
              <Alert color="yellow" variant="light">
                Es wurde noch keine Formular Einreichung abgeschlossen. Das
                heißt, die dynamischen Felder von den Formularen sind in den
                Berechtigungen nicht auswählbar.
              </Alert>
            )}
            <PermissionBuilder
              label="Bearbeitungs Berechtigungen"
              initialData={form.editFormPermissions ?? ""}
              formActionName="create-form"
              fieldValue="editFormPermissions"
              submissions={
                form.submissions as { data: Record<string, string> }[]
              }
            />
            <PermissionBuilder
              label="Überprüfungs Berechtigungen"
              initialData={form.reviewFormPermissions ?? ""}
              formActionName="create-form"
              fieldValue="reviewFormPermissions"
              submissions={
                form.submissions as { data: Record<string, string> }[]
              }
            />

            {/* Information Fields Section */}
            <Stack gap="md">
              <Stack gap="0">
                <Title order={3}>Formular Informationen</Title>
                <Text c="dimmed" size="sm">
                  Konfigurieren Sie die dynamischen Informationen, die in der
                  Tabelle angezeigt werden sollen.
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
                                formForm.insertListItem("information.fields", {
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
                      {formForm.values.information.fields.length === 0 ? (
                        <EmptyState text="Keine Felder verbunden" />
                      ) : (
                        formForm.values.information.fields.map(
                          (field: FormField, index: number) => (
                            <Paper key={index} p="sm" withBorder>
                              <Group justify="space-between">
                                <Text>{field.label}</Text>
                                <Group gap="xs">
                                  <ActionIcon
                                    variant="light"
                                    disabled={index === 0}
                                    onClick={() =>
                                      formForm.reorderListItem(
                                        "information.fields",
                                        {
                                          from: index,
                                          to: index - 1,
                                        }
                                      )
                                    }
                                  >
                                    <IconArrowUp style={baseIconStyles} />
                                  </ActionIcon>
                                  <ActionIcon
                                    variant="light"
                                    disabled={
                                      index ===
                                      formForm.values.information.fields
                                        .length -
                                        1
                                    }
                                    onClick={() =>
                                      formForm.reorderListItem(
                                        "information.fields",
                                        {
                                          from: index,
                                          to: index + 1,
                                        }
                                      )
                                    }
                                  >
                                    <IconArrowDown style={baseIconStyles} />
                                  </ActionIcon>
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    onClick={() =>
                                      formForm.removeListItem(
                                        "information.fields",
                                        index
                                      )
                                    }
                                  >
                                    <IconTrash style={baseIconStyles} />
                                  </ActionIcon>
                                </Group>
                              </Group>
                            </Paper>
                          )
                        )
                      )}
                    </Stack>
                  </Paper>
                </>
              )}
            </Stack>
          </>
        )}

        <Group mt="lg" justify="flex-end">
          <Button loading={status === "executing"} type="submit">
            {form ? "Speichern" : "Hinzufügen"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
