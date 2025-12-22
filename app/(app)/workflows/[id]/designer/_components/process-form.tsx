"use client";

import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { processSchema, updateProcessSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { createProcess, updateProcess } from "../_actions";
import {
  Button,
  Group,
  Stack,
  TextInput,
  Switch,
  Textarea,
} from "@mantine/core";

interface ProcessFormProps {
  workflowId: string;
  parentId?: string | null;
  process?: {
    id: string;
    name: string;
    description: string | null;
    isCategory: boolean;
  };
}

export const ProcessForm = ({
  workflowId,
  parentId,
  process,
}: ProcessFormProps) => {
  const isEditing = !!process;

  const form = useForm({
    validate: zod4Resolver(isEditing ? updateProcessSchema : processSchema),
    mode: "uncontrolled",
    initialValues: isEditing
      ? {
          id: process.id,
          name: process.name,
          description: process.description || "",
        }
      : {
          name: "",
          description: "",
          isCategory: false,
          parentId: parentId || null,
          workflowId: workflowId,
        },
  });

  const { execute, status } = useEnhancedAction({
    action: isEditing ? updateProcess : createProcess,
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
        {!isEditing && (
          <Switch
            label="Als Kategorie anlegen"
            {...form.getInputProps("isCategory", { type: "checkbox" })}
          />
        )}
        <Group mt="lg" justify="flex-end">
          <Button loading={status === "executing"} type="submit">
            {isEditing ? "Speichern" : "Hinzufügen"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
