import React from "react";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { notFound } from "next/navigation";
import { getWorkflowRuns } from "../_actions";
import { Stack, Text } from "@mantine/core";
import { WorkflowRunsTable } from "./workflow-runs-table";

export const WorkflowRuns = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const workflowId = (await params).id;
  const workflow = await getWorkflowRuns(workflowId);

  if (!workflow) {
    return notFound();
  }

  return (
    <Stack gap="md">
      <QuickSearchAdd
        modalTitle="Workflow ausführen"
        searchPlaceholder="Workflow ausführungen suchen"
        modalContent={<Text>Workflow ausführen Formular kommt noch...</Text>}
      />
      <WorkflowRunsTable runs={workflow} />
    </Stack>
  );
};
