import React from "react";
import { Stack, Group, Title } from "@mantine/core";
import { EmptyState } from "@/components/empty-state";
import { getForm } from "../_actions";
import { notFound } from "next/navigation";
import { FormSubmissionCard } from "./form-submission-card";

export const Form = async ({ params }: { params: Promise<{ id: string }> }) => {
  const formId = (await params).id;
  const form = await getForm(formId);

  if (!form) {
    notFound();
  }

  return (
    <Stack align="center" gap="xl">
      <Title order={2}>Einreichungen: {form.title}</Title>
      <Group justify="center" gap="xl">
        {form.submissions.length === 0 ? (
          <EmptyState
            text="Keine Formular Einreichungen gefunden"
            variant="light"
          />
        ) : (
          form.submissions.map((submission) => (
            <FormSubmissionCard key={submission.id} submission={submission} />
          ))
        )}
      </Group>
    </Stack>
  );
};
