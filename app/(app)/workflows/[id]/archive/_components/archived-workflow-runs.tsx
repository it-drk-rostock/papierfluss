import React from "react";
import { notFound } from "next/navigation";
import { WorkflowRunsSearchParams } from "../../_actions";
import { Stack, Title, Text, Group } from "@mantine/core";
import { WorkflowRunsTable } from "../../_components/workflow-runs-table";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { ButtonLink } from "@/components/button-link";
import { IconList } from "@tabler/icons-react";
import { getArchivedWorkflowRuns } from "../_actions";

export const ArchivedWorkflowRuns = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<WorkflowRunsSearchParams>;
}) => {
  const workflowId = (await params).id;
  const { search, status } = await searchParams;
  const workflowData = await getArchivedWorkflowRuns(workflowId, {
    search,
    status,
  });

  if (!workflowData) {
    return notFound();
  }

  const { workflow, runs } = workflowData;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap="0">
          <Title order={1}>{workflow.name} - Archiv</Title>
          <Text c="dimmed">{workflow.description}</Text>
        </Stack>
        <ButtonLink
          leftSection={<IconList size={14} stroke={1.5} />}
          variant="outline"
          title="Übersicht anzeigen"
          href={`/workflows/${workflowId}`}
        />
      </Group>
      <QuickSearchAdd />
      <WorkflowRunsTable workflow={workflow} runs={runs} />
    </Stack>
  );
};
