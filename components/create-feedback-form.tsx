"use client";

import { useForm } from "@mantine/form";
import { Alert, Button, Rating, Stack, Text, Textarea } from "@mantine/core";
import { usePathname } from "next/navigation";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { createFeedback } from "@/server/actions/create-feedback";
import { useServerAction } from "@/hooks/use-server-action";
import { FeedbackSchema } from "@/server/schemas/feedback-schema";

export const CreateFeedbackForm = () => {
  const pathname = usePathname();
  const form = useForm({
    name: "create-feedback-form",
    validate: zod4Resolver(FeedbackSchema),
    initialValues: {
      feedback: "",
      path: pathname,
      rating: 0,
    },
  });

  const { execute, status } = useServerAction({
    action: createFeedback,
    hideModals: true,
  });

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <Alert color="yellow">
          Helfen Sie uns mit Ihrer Bewertung das Formularservice zu verbessern!
          Technische Details (Seite & Datensatz) werden zur Analyse automatisch
          beigefügt.
        </Alert>
        <Stack gap="2px">
          <Text size="sm" fw="500">
            Bewertung
          </Text>
          <Rating {...form.getInputProps("rating")} />
        </Stack>
        <Textarea label="Feedback" {...form.getInputProps("feedback")} />
        <Button loading={status === "pending"} type="submit">
          Senden
        </Button>
      </Stack>
    </form>
  );
};
