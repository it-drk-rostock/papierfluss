import React from "react";
import { Stack, Title, Text, Group } from "@mantine/core";
import { notFound } from "next/navigation";
import { FormSubmissionsTable } from "../../_components/form-submissions-table";
import { ButtonLink } from "@/components/button-link";
import { IconArchive } from "@tabler/icons-react";
import { getFormArchive } from "../_actions";
import { QuickSearchAdd } from "@/components/quick-search-add";

import { FormSearchParams } from "../../_actions";

export const FormArchive = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<FormSearchParams>;
}) => {
  const formId = (await params).id;
  const { search, status } = await searchParams;
  const form = await getFormArchive(formId, { search, status });

  if (!form) {
    notFound();
  }

  return (
    <Stack gap="md">
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
      <QuickSearchAdd />
      <FormSubmissionsTable form={form} />
    </Stack>
  );
};
