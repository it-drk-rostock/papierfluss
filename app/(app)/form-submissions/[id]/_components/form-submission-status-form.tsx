"use client";

import React from "react";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { Button, Group, Stack, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { SubmissionStatus } from "@prisma/client";
import { zod4Resolver, zodResolver } from "mantine-form-zod-resolver";
import { updateFormSubmissionStatusSchema } from "../_schemas";
import { updateFormSubmissionStatus } from "../_actions";

export const FormSubmissionStatusForm = ({
  id,
  status,
}: {
  id: string;
  status: Extract<SubmissionStatus, "ongoing" | "rejected" | "completed">;
}) => {
  const form = useForm({
    validate: zod4Resolver(updateFormSubmissionStatusSchema),
    mode: "uncontrolled",
    name: "update-form-submission-status",
    initialValues: {
      status: status,
      id: id,
      message: "",
    },
  });

  const { execute, status: actionStatus } = useEnhancedAction({
    action: updateFormSubmissionStatus,
    hideModals: true,
  });

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <Text>
          {status === "ongoing" &&
            "Hiermit setzen Sie den Status auf 'in Bearbeitung' zurück. Somit wird dem Benutzer das Formular als in Bearbeitung markiert und das Formular kann erneut bearbeitet werden."}
          {status === "rejected" &&
            "Hiermit setzen Sie den Status auf 'Abgelehnt'. Somit wird dem Benutzer das Formular als abgelehnt markiert und das Formular ist nicht durchgegangen."}
          {status === "completed" &&
            "Hiermit setzen Sie den Status auf 'Abgeschlossen'. Somit wird dem Benutzer das Formular als abgeschlossen markiert und das Formular ist erfolgreich durchgegangen."}
        </Text>
        <Textarea
          label="Mitteilung"
          key={form.key("message")}
          {...form.getInputProps("message")}
        />
        <Group justify="flex-end">
          <Button loading={actionStatus === "executing"} type="submit">
            Aktualisieren
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
