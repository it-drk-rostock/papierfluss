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
import { authClient } from "@/lib/auth-client";

export const FormForm = ({ form }: { form?: FormProps[0] }) => {
  const { data: session } = authClient.useSession();
  const initialEditPermissions = `user.role == "admin" || user.email == "${session?.user?.email}"`;
  const initialReviewPermissions = `user.email == "${session?.user?.email}"`;
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
          editFormPermissions:
            form.editFormPermissions || initialEditPermissions,
          reviewFormPermissions:
            form.reviewFormPermissions || initialReviewPermissions,
        }
      : {
          title: "",
          description: "",
          icon: "",
          isPublic: false,
          isActive: true,
          editFormPermissions: initialEditPermissions,
          reviewFormPermissions: initialReviewPermissions,
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
            <Textarea
              label="Bearbeitungs Berechtigungen"
              description="CEL Expression (z.B. user.role == 'admin' || user.email == user.email)"
              autosize
              {...formForm.getInputProps("editFormPermissions")}
            />

            <Textarea
              label="Überprüfungs Berechtigungen"
              description="CEL Expression (z.B. user.role == 'admin')"
              autosize
              {...formForm.getInputProps("reviewFormPermissions")}
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
