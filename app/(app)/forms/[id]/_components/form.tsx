import React from "react";
import {
  Stack,
  Group,
  Title,
  TabsList,
  TabsTab,
  TabsPanel,
  Tabs,
} from "@mantine/core";
import { EmptyState } from "@/components/empty-state";
import { getForm } from "../_actions";
import { notFound } from "next/navigation";
import { FormSubmissionCard } from "./form-submission-card";
import { IconLayoutGrid, IconList } from "@tabler/icons-react";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { FormSubmissionsTable } from "./form-submissions-table";

export const Form = async ({ params }: { params: Promise<{ id: string }> }) => {
  const formId = (await params).id;
  const form = await getForm(formId);

  if (!form) {
    notFound();
  }

  return (
    <Stack align="center" gap="xl">
      <Title order={2}>Einreichungen: {form.title}</Title>

      {form.submissions.length === 0 ? (
        <EmptyState
          text="Keine Formular Einreichungen gefunden"
          variant="light"
        />
      ) : (
        <Tabs defaultValue="cards">
          <TabsList>
            <TabsTab
              value="cards"
              leftSection={<IconLayoutGrid style={baseIconStyles} />}
            ></TabsTab>
            <TabsTab
              value="list"
              leftSection={<IconList style={baseIconStyles} />}
            ></TabsTab>
          </TabsList>

          <TabsPanel value="cards" mt="sm">
            <Group justify="center" gap="sm">
              {form.submissions.map((submission) => (
                <FormSubmissionCard
                  key={submission.id}
                  submission={submission}
                />
              ))}
            </Group>
          </TabsPanel>

          <TabsPanel value="list">
            <FormSubmissionsTable json={form.schema} data={form.submissions} />
          </TabsPanel>
        </Tabs>
      )}
    </Stack>
  );
};
