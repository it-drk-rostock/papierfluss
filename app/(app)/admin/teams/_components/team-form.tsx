"use client";
import { useForm } from "@mantine/form";
import React from "react";
import { createTeamSchema } from "../_schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { createTeam } from "../_actions";
import { Button, Group, Stack, TextInput } from "@mantine/core";

export const TeamForm = () => {
  const form = useForm({
    validate: zodResolver(createTeamSchema),
    mode: "uncontrolled",
    initialValues: {
      name: "",
      contactEmail: "",
    },
  });

  const { execute, status } = useEnhancedAction({
    action: createTeam,
    hideModals: true,
  });
  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <TextInput
          label="Name"
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <TextInput
          label="E-Mail"
          key={form.key("contactEmail")}
          {...form.getInputProps("contactEmail")}
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
