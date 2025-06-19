"use client";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { resetProcessRunSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { Button, Group, Stack, Textarea } from "@mantine/core";
import { resetProcessRun } from "../_actions";

export const ResetProcessRunForm = ({ id }: { id: string }) => {
  const form = useForm({
    validate: zodResolver(resetProcessRunSchema),
    mode: "uncontrolled",
    name: "reset-process-run-form",
    initialValues: {
      id: id,
      resetProcessText: "",
    },
  });

  const { execute, status } = useEnhancedAction({
    action: resetProcessRun,
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
          label="Nachricht"
          {...form.getInputProps("resetProcessText")}
        />
        <Group mt="lg" justify="flex-end">
          <Button loading={status === "executing"} type="submit">
            Prozess zurücksetzen
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
