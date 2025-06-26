"use client";

import React from "react";
import { Stack, Title, Paper, Text, Alert } from "@mantine/core";
import { WorkflowPermissionBuilder } from "@/components/workflow-permission-builder";
import { useQuery } from "@tanstack/react-query";
import { getWorkflowRunsForPermissions } from "../../../_actions";

interface ProcessPermissionFormProps {
  workflowId: string;
  processId: string;
  editProcessPermissions?: string | null;
  submitProcessPermissions?: string | null;
  formActionName: string;
}

export const ProcessPermissionForm = ({
  workflowId,
  processId,
  editProcessPermissions,
  submitProcessPermissions,
  formActionName,
}: ProcessPermissionFormProps) => {
  // Get workflow runs for permission builder
  const { data: workflowRuns } = useQuery({
    queryKey: ["workflowRunsForPermissions", workflowId],
    queryFn: () => getWorkflowRunsForPermissions(workflowId),
    staleTime: 0,
  });

  return (
    <Stack gap="xl">
      <Stack gap="0">
        <Title order={2}>Prozess Berechtigungen</Title>
        <Text c="dimmed">
          Konfigurieren Sie die Berechtigungen für diesen Prozess
        </Text>
      </Stack>

      <Paper p="lg" withBorder>
        <Stack gap="md">
          {workflowRuns && workflowRuns.length === 0 && (
            <Alert color="yellow" variant="light">
              Es wurde noch keine Workflow-Ausführung erstellt. Das heißt, die
              dynamischen Felder von den Prozessen sind in den Berechtigungen
              nicht auswählbar.
            </Alert>
          )}

          <WorkflowPermissionBuilder
            label="Prozess Bearbeitungs Berechtigungen"
            initialData={editProcessPermissions ?? ""}
            formActionName={formActionName}
            fieldValue="editProcessPermissions"
            workflowRuns={workflowRuns}
            permissionType="process"
          />

          <WorkflowPermissionBuilder
            label="Prozess Übermittlungs Berechtigungen"
            initialData={submitProcessPermissions ?? ""}
            formActionName={formActionName}
            fieldValue="submitProcessPermissions"
            workflowRuns={workflowRuns}
            permissionType="process"
          />
        </Stack>
      </Paper>
    </Stack>
  );
};
