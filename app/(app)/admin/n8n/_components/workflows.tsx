import React from "react";
import { Stack } from "@mantine/core";
import { getWorkflows } from "../_actions";
import { WorkflowList } from "./workflow-list";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { WorkflowForm } from "./workflow-form";

export const Workflows = async () => {
  const workflows = await getWorkflows();

  return (
    <Stack align="center" gap="xl">
      <QuickSearchAdd
        modalTitle="Workflow hinzufügen"
        modalContent={<WorkflowForm existingWorkflows={workflows} />}
      />
      <WorkflowList workflows={workflows} />
    </Stack>
  );
};
