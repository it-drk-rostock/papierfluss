import React from "react";
import { Stack, Title, Text } from "@mantine/core";
import { getForm } from "../_actions";
import { notFound } from "next/navigation";
import { FormSubmissionsTable } from "./form-submissions-table";

export const Form = async ({ params }: { params: Promise<{ id: string }> }) => {
  const formId = (await params).id;
  const form = await getForm(formId);

  if (!form) {
    notFound();
  }

  return (
    <Stack gap="xl">
      <Stack gap="0">
        <Title order={2}>Einreichungen: {form.title}</Title>
        {form.description && <Text c="dimmed">{form.description}</Text>}
      </Stack>
      <FormSubmissionsTable form={form} />
    </Stack>
  );
};
