import React from "react";
import { notFound } from "next/navigation";
import { getWorkflowRuns, initializeWorkflowRun } from "../_actions";
import { Stack, Title, Text } from "@mantine/core";
import { WorkflowRunsTable } from "./workflow-runs-table";
import { ButtonAction } from "@/components/button-action";
import { QuickSearchAdd } from "@/components/quick-search-add";

export const WorkflowRuns = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const workflowId = (await params).id;
  const workflowData = await getWorkflowRuns(workflowId);

  if (!workflowData) {
    return notFound();
  }

  const { workflow, runs } = workflowData;

  return (
    <Stack gap="md">
      <Stack gap="0">
        <Title order={1}>Übersicht {workflow.name}</Title>
        <Text c="dimmed">{workflow.description}</Text>
      </Stack>
      <QuickSearchAdd
        modalTitle="Workflow ausführen"
        searchPlaceholder="Workflow ausführungen suchen"
        modalContent={
          <ButtonAction
            fullWidth
            action={initializeWorkflowRun}
            values={{ id: workflowId }}
            hideNotification
          >
            Workflow ausführen
          </ButtonAction>
        }
      />
      <WorkflowRunsTable runs={runs} />
    </Stack>
  );
};
