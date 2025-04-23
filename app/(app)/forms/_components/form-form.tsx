"use client";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { formSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { createForm } from "../_actions";
import {
  Button,
  Group,
  Stack,
  Textarea,
  TextInput,
  Checkbox,
} from "@mantine/core";
import { IconPicker } from "@/components/icon-picker";

export const FormForm = () => {
  const form = useForm({
    validate: zodResolver(formSchema),
    mode: "uncontrolled",
    name: "create-form",
    initialValues: {
      title: "",
      description: "",
      icon: "",
      isPublic: false,
      isActive: true,
    },
  });

  console.log(form.values);

  const { execute, status } = useEnhancedAction({
    action: createForm,
    hideModals: true,
  });

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <IconPicker
          formName="create-form"
          fieldName="icon"
          value={form.values.icon}
        />
        <TextInput label="Titel" {...form.getInputProps("title")} />
        <Textarea label="Beschreibung" {...form.getInputProps("description")} />

        <Checkbox
          label="Öffentlich"
          {...form.getInputProps("isPublic", { type: "checkbox" })}
        />
        <Checkbox
          label="Aktiv"
          {...form.getInputProps("isActive", { type: "checkbox" })}
        />

        <Group mt="lg" justify="flex-end">
          <Button loading={status === "executing"} type="submit">
            Hinzufügen
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
