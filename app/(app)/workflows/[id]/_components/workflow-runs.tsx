import React from "react";
import { notFound } from "next/navigation";
import {
  getWorkflowRuns,
  initializeWorkflowRun,
  WorkflowRunsSearchParams,
} from "../_actions";
import { Stack, Title, Text, Group } from "@mantine/core";
import { WorkflowRunsTable } from "./workflow-runs-table";
import { ButtonAction } from "@/components/button-action";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { WorkflowRunInitializeForm } from "./workflow-run-initialize-form";
import { ButtonLink } from "@/components/button-link";
import { IconArchive } from "@tabler/icons-react";

export const WorkflowRuns = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<WorkflowRunsSearchParams>;
}) => {
  const workflowId = (await params).id;
  const { search } = await searchParams;
  const workflowData = await getWorkflowRuns(workflowId, search);

  if (!workflowData) {
    return notFound();
  }

  const { workflow, runs } = workflowData;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap="0">
          <Title order={1}>{workflow.name} - Übersicht</Title>
          <Text c="dimmed">{workflow.description}</Text>
        </Stack>
        <ButtonLink
          leftSection={<IconArchive size={14} stroke={1.5} />}
          variant="outline"
          title="Archiv anzeigen"
          href={`/workflows/${workflowId}/archive`}
        />
      </Group>
      <QuickSearchAdd
        modalTitle="Workflow ausführen"
        modalContent={
          <>
            {workflow.initializeProcess &&
              workflow.initializeProcess.schema && (
                <>
                  <WorkflowRunInitializeForm
                    workflowId={workflowId}
                    schema={
                      workflow.initializeProcess.schema as Record<
                        string,
                        unknown
                      >
                    }
                  />
                </>
              )}
            {!workflow.initializeProcess && (
              <ButtonAction
                fullWidth
                action={initializeWorkflowRun}
                values={{ id: workflowId }}
                hideNotification
              >
                Hinzufügen
              </ButtonAction>
            )}
          </>
        }
      />
      <WorkflowRunsTable workflow={workflow} runs={runs} />
    </Stack>
  );
};
