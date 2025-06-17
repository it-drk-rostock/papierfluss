import { Grid, Stack, Title, Text, Paper, GridCol } from "@mantine/core";
import React from "react";
import { getWorkflowRun } from "../_actions";
import { notFound } from "next/navigation";
import { WorkflowStatusBadge } from "@/components/workflow-status-badge";
import { ProcessRunTree } from "./process-run-tree";

export const WorkflowRun = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const workflowRunId = (await params).id;

  const workflowRun = await getWorkflowRun(workflowRunId);

  if (!workflowRun) {
    return notFound();
  }

  return (
    <Stack gap="md">
      <Stack gap="0">
        <Title order={2}>{workflowRun.workflow.name}</Title>
        <Text c="dimmed">{workflowRun.workflow.description}</Text>
      </Stack>

      <Grid gutter="lg">
        {/* Forms Section - 6 columns (half the width) */}
        <GridCol span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Formulare</Title>
            </Stack>
          </Paper>
        </GridCol>

        <GridCol span={{ base: 12, md: 3 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Prozesse</Title>
              <ProcessRunTree workflowRun={workflowRun} />
            </Stack>
          </Paper>
        </GridCol>

        {/* Information Section - 3 columns (quarter width) */}
        <GridCol span={{ base: 12, md: 3 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Informationen</Title>
              <Stack gap="md">
                <WorkflowStatusBadge status={workflowRun.status} />
                <Text>
                  Gestartet am: {workflowRun.startedAt.toLocaleDateString()}
                </Text>
                <Text>
                  Abgeschlossen am:{" "}
                  {workflowRun.completedAt?.toLocaleDateString()}
                </Text>
              </Stack>
            </Stack>
          </Paper>
        </GridCol>
      </Grid>
    </Stack>
  );
};
