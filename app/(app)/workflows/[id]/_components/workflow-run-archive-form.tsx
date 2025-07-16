"use client";

import React from "react";
import z from "zod";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { idSchema } from "@/schemas/id-schema";
import { zodResolver } from "mantine-form-zod-resolver";
import { useForm } from "@mantine/form";
import { Button, Stack, Textarea } from "@mantine/core";
import { archiveWorkflowRun } from "../_actions";

export const WorkflowRunArchiveForm = ({ id }: { id: string }) => {
  const form = useForm({
    name: "archive-workflow-run",
    validate: zodResolver(idSchema.extend({ message: z.string().optional() })),
    mode: "uncontrolled",
    initialValues: {
      id: id,
      message: "",
    },
  });

  const { execute, status } = useEnhancedAction({
    action: archiveWorkflowRun,
    hideModals: true,
  });

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <Textarea
          placeholder=""
          label="Nachricht"
          key={form.key("message")}
          {...form.getInputProps("message")}
        />
        <Button fullWidth type="submit" loading={status === "executing"}>
          Archivieren
        </Button>
      </Stack>
    </form>
  );
};
