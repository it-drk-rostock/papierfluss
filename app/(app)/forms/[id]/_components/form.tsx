import React from "react";
import { Stack, Title, Text, Group } from "@mantine/core";
import { getForm } from "../_actions";
import { notFound } from "next/navigation";
import { FormSubmissionsTable } from "./form-submissions-table";
import { ButtonLink } from "@/components/button-link";
import { IconArchive } from "@tabler/icons-react";
import { SearchParams } from "@/utils/searchparams";
import { QuickSearchAdd } from "@/components/quick-search-add";

export const Form = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) => {
  const formId = (await params).id;
  const { search } = await searchParams;
  const form = await getForm(formId, search);

  if (!form) {
    notFound();
  }

  return (
    <Stack gap="md">
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
      <QuickSearchAdd />
      <FormSubmissionsTable form={form} />
    </Stack>
  );
};
