import React from "react";
import { Stack, Title, Text, Group } from "@mantine/core";
import { notFound } from "next/navigation";
import { FormSubmissionsTable } from "../../_components/form-submissions-table";
import { ButtonLink } from "@/components/button-link";
import { IconArchive } from "@tabler/icons-react";
import { getFormArchive } from "../_actions";

export const FormArchive = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const formId = (await params).id;
  const form = await getFormArchive(formId);

  if (!form) {
    notFound();
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-start">
        <Stack gap="0">
          <Title order={1}>{form.title} - Archiv</Title>
          <Text c="dimmed">{form.description}</Text>
        </Stack>
        <ButtonLink
          leftSection={<IconArchive size={14} stroke={1.5} />}
          variant="outline"
          title="Übersicht anzeigen"
          href={`/forms/${formId}`}
        />
      </Group>
      <FormSubmissionsTable form={form} />
    </Stack>
  );
};
