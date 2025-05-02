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
  JsonInput,
} from "@mantine/core";
import { IconPicker } from "@/components/icon-picker";

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
          editFormPermissions: form.editFormPermissions || "",
          reviewFormPermissions: form.reviewFormPermissions || "",
        }
      : {
          title: "",
          description: "",
          icon: "",
          isPublic: false,
          isActive: true,
          editFormPermissions: {},
          reviewFormPermissions: {},
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

        <JsonInput
          label="Bearbeitungs Berechtigungen"
          validationError="Invalid JSON"
          formatOnBlur
          autosize
          minRows={4}
          {...formForm.getInputProps("editFormPermissions")}
        />

        <JsonInput
          label="Überprüfungs Berechtigungen"
          validationError="Invalid JSON"
          formatOnBlur
          autosize
          minRows={4}
          {...formForm.getInputProps("reviewFormPermissions")}
        />

        <Group mt="lg" justify="flex-end">
          <Button loading={status === "executing"} type="submit">
            {form ? "Speichern" : "Hinzufügen"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
