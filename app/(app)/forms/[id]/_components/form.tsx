import React from "react";
import { Stack, Title, Text, Group } from "@mantine/core";
import { getForm } from "../_actions";
import { notFound } from "next/navigation";
import { FormSubmissionsTable } from "./form-submissions-table";
import { ButtonLink } from "@/components/button-link";
import { IconArchive } from "@tabler/icons-react";

export const Form = async ({ params }: { params: Promise<{ id: string }> }) => {
  const formId = (await params).id;
  const form = await getForm(formId);

  if (!form) {
    notFound();
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-start">
        <Stack gap="0">
          <Title order={1}>{form.title} - Übersicht</Title>
          <Text c="dimmed">{form.description}</Text>
        </Stack>
        <ButtonLink
          leftSection={<IconArchive size={14} stroke={1.5} />}
          variant="outline"
          title="Archiv anzeigen"
          href={`/forms/${formId}/archive`}
        />
      </Group>
      <FormSubmissionsTable form={form} />
    </Stack>
  );
};
