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
} from "@mantine/core";
import { IconPicker } from "@/components/icon-picker";
import { PermissionBuilder } from "@/components/permission-builder";

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
        }
      : {
          title: "",
          description: "",
          icon: "",
          isPublic: false,
          isActive: true,
          editFormPermissions: "",
          reviewFormPermissions: "",
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
            <PermissionBuilder
              label="Bearbeitungs Berechtigungen"
              initialData={form.editFormPermissions ?? ""}
              formActionName="create-form"
              fieldValue="editFormPermissions"
            />
            <PermissionBuilder
              label="Überprüfungs Berechtigungen"
              initialData={form.reviewFormPermissions ?? ""}
              formActionName="create-form"
              fieldValue="reviewFormPermissions"
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
