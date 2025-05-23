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
} from "@mantine/core";
import { IconPicker } from "@/components/icon-picker";
import { PermissionBuilder } from "@/components/permission-builder";
import { EntitySelect } from "@/components/entity-select";
import { getTeams } from "../../dashboard/_actions";

export const FormForm = ({ form }: { form?: FormProps[0] }) => {
  const formForm = useForm({
    validate: zodResolver(form ? updateFormSchema : formSchema),
    mode: "uncontrolled",
    name: "create-form",
    initialValues: form
      ? {
          id: form.id,
          title: form.title,
          description: form.description,
          icon: form.icon,
          isPublic: form.isPublic,
          isActive: form.isActive,
          editFormPermissions: form.editFormPermissions,
          reviewFormPermissions: form.reviewFormPermissions,
          responsibleTeam: form.responsibleTeam,
        }
      : {
          title: "",
          description: "",
          icon: "",
          isPublic: false,
          isActive: true,
          editFormPermissions: "",
          reviewFormPermissions: "",
          responsibleTeam: {
            id: "",
            name: "",
          },
        },
  });

  const { execute, status } = useEnhancedAction({
    action: form ? updateForm : createForm,
    hideModals: true,
  });

  return (
    <form
      onSubmit={formForm.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <IconPicker
          formName="create-form"
          fieldName="icon"
          value={formForm.values.icon}
        />
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
          error={formForm.errors.responsibleTeam}
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
                Es wurde noch kein Beispielformular erstellt. Das heißt, die
                dynamischen Felder von den Formularen sind in den Berechtigungen
                nicht auswählbar.
              </Alert>
            )}
            <PermissionBuilder
              label="Bearbeitungs Berechtigungen"
              initialData={form.editFormPermissions ?? ""}
              formActionName="create-form"
              fieldValue="editFormPermissions"
              submissions={form.submissions}
            />
            <PermissionBuilder
              label="Überprüfungs Berechtigungen"
              initialData={form.reviewFormPermissions ?? ""}
              formActionName="create-form"
              fieldValue="reviewFormPermissions"
              submissions={form.submissions}
            />
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
