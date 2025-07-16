"use client";

import React from "react";
import { Stack, Title, Paper, Text, Alert, Button } from "@mantine/core";
import { WorkflowPermissionBuilder } from "@/components/workflow-permission-builder";
import { useQuery } from "@tanstack/react-query";
import { getWorkflowRunsForPermissions } from "../../../_actions";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { updateProcessPermissions } from "../_actions";
import { updateProcessPermissionsSchema } from "../_schemas";

interface ProcessPermissionFormProps {
  workflowId: string;
  processId: string;
  editProcessPermissions?: string | null;
  submitProcessPermissions?: string | null;
  viewProcessPermissions?: string | null;
  resetProcessPermissions?: string | null;
  formActionName: string;
}

export const ProcessPermissionForm = ({
  workflowId,
  processId,
  editProcessPermissions,
  submitProcessPermissions,
  viewProcessPermissions,
  resetProcessPermissions,
  formActionName,
}: ProcessPermissionFormProps) => {
  const { data: workflowRuns } = useQuery({
    queryKey: ["workflowRunsForPermissions", workflowId],
    queryFn: () => getWorkflowRunsForPermissions(workflowId),
    staleTime: 0,
  });

  // Initialize form
  const form = useForm({
    name: formActionName,
    validate: zodResolver(updateProcessPermissionsSchema),
    mode: "uncontrolled",
    initialValues: {
      id: processId,
      editProcessPermissions: editProcessPermissions ?? "",
      submitProcessPermissions: submitProcessPermissions ?? "",
      viewProcessPermissions: viewProcessPermissions ?? "",
      resetProcessPermissions: resetProcessPermissions ?? "",
    },
  });

  const { execute, status } = useEnhancedAction({
    action: updateProcessPermissions,
    hideModals: true,
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
        <form
          onSubmit={form.onSubmit(async (values) => {
            execute(values);
          })}
        >
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

            <WorkflowPermissionBuilder

              label="Prozess Ansicht Berechtigungen"
              initialData={viewProcessPermissions ?? ""}
              formActionName={formActionName}
              fieldValue="viewProcessPermissions"
              workflowRuns={workflowRuns}
              permissionType="process"
            />

            <WorkflowPermissionBuilder
              label="Prozess Zurücksetzen Berechtigungen"
              initialData={resetProcessPermissions ?? ""}
              formActionName={formActionName}
              fieldValue="resetProcessPermissions"
              workflowRuns={workflowRuns}
              permissionType="process"
            />

            <Button fullWidth type="submit" loading={status === "executing"}>
              Berechtigungen speichern
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
};
