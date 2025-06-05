"use client";

import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { processSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { createProcess } from "../_actions";
import {
  Button,
  Group,
  Stack,
  TextInput,
  Switch,
  Textarea,
} from "@mantine/core";

export const ProcessForm = ({
  workflowId,
  parentId,
}: {
  workflowId: string;
  parentId?: string | null;
}) => {
  const form = useForm({
    validate: zodResolver(processSchema),
    mode: "uncontrolled",
    initialValues: {
      name: "",
      description: "",
      isCategory: false,
      parentId: parentId || null,
      workflowId: workflowId,
    },
  });

  const { execute, status } = useEnhancedAction({
    action: createProcess,
    hideModals: true,
  });

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <TextInput label="Name" {...form.getInputProps("name")} />
        <Textarea label="Beschreibung" {...form.getInputProps("description")} />
        <Switch
          label="Als Kategorie anlegen"
          {...form.getInputProps("isCategory", { type: "checkbox" })}
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
