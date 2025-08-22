import React from "react";
import { Stack, Group } from "@mantine/core";
import { getWorkflows } from "../_actions";
import { WorkflowCard } from "./workflow-card";
import { EmptyState } from "@/components/empty-state";

export const Workflows = async () => {
  const workflows = await getWorkflows();

  return (
    <Stack align="center" gap="xl">
      <Group justify="center">
        {workflows.length === 0 ? (
          <EmptyState text="Keine Workflows gefunden" variant="light" />
        ) : (
          workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))
        )}
      </Group>
    </Stack>
  );
};
