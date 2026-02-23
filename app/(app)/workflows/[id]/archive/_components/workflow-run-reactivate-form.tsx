"use client";

import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { idSchema } from "@/schemas/id-schema";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useForm } from "@mantine/form";
import { Button, Stack } from "@mantine/core";
import { reactivateWorkflowRun } from "../_actions";

export const WorkflowRunReactivateForm = ({ id }: { id: string }) => {
  const form = useForm({
    name: "reactivate-workflow-run",
    validate: zod4Resolver(idSchema),
    mode: "uncontrolled",
    initialValues: {
      id: id,
    },
  });

  const { execute, status } = useEnhancedAction({
    action: reactivateWorkflowRun,
    hideModals: true,
  });

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <Button fullWidth type="submit" loading={status === "executing"}>
          Reaktivieren
        </Button>
      </Stack>
    </form>
  );
};
