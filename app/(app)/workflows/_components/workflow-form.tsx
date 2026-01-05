"use client";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { updateWorkflowSchema, workflowSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import {
  createWorkflow,
  updateWorkflow,
  WorkflowProps,
  getWorkflowRunsForPermissions,
  getWorkflowProcesses,
} from "../_actions";
import {
  Button,
  Group,
  Stack,
  Textarea,
  TextInput,
  Checkbox,
  Alert,
} from "@mantine/core";
import { EntitySelect } from "@/components/entity-select";
import { getTeams } from "../../dashboard/_actions";
import { WorkflowPermissionBuilder } from "@/components/workflow-permission-builder";
import { useQuery } from "@tanstack/react-query";
import { useServerAction } from "@/hooks/use-server-action";

export const WorkflowForm = ({ workflow }: { workflow?: WorkflowProps[0] }) => {
  const formForm = useForm({
    validate: zod4Resolver(workflow ? updateWorkflowSchema : workflowSchema),
    mode: "uncontrolled",
    name: "create-workflow",
    initialValues: workflow
      ? {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          isActive: workflow.isActive,
          isPublic: workflow.isPublic,
          editWorkflowPermissions: workflow.editWorkflowPermissions,
          submitProcessPermissions: workflow.submitProcessPermissions,
          responsibleTeam: workflow.responsibleTeam,
          initializeProcess: workflow.initializeProcess,
        }
      : {
          name: "",
          description: "",
          isPublic: false,
          isActive: true,
          editWorkflowPermissions: "",
          submitProcessPermissions: "",
          responsibleTeam: {
            id: "",
            name: "",
          },
          initializeProcess: {
            id: "",
            name: "",
          },
        },
  });

  const { execute, status, error } = useServerAction({
    action: workflow ? updateWorkflow : createWorkflow,
    hideModals: true,
  });

  // Get workflow runs for permission builder (only for existing workflows)
  const { data: workflowRuns } = useQuery({
    queryKey: ["workflowRunsForPermissions", workflow?.id],
    queryFn: () =>
      workflow?.id
        ? getWorkflowRunsForPermissions(workflow.id)
        : Promise.resolve([]),
    enabled: !!workflow?.id,
    staleTime: 0,
  });

  return (
    <form
      onSubmit={formForm.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <TextInput label="Name" {...formForm.getInputProps("name")} />
        <Textarea
          label="Beschreibung"
          {...formForm.getInputProps("description")}
        />
        <EntitySelect
          formActionName="create-workflow"
          formField="responsibleTeam"
          label="Verantwortlicher Bereich"
          initialValue={formForm.values.responsibleTeam}
          error={formForm.errors.responsibleTeam as string}
          action={getTeams}
          displayKeys={["name"]}
          dataKey={{ id: "id", name: "name" }}
        />
        {workflow && (
          <EntitySelect
            formActionName="create-workflow"
            formField="initializeProcess"
            label="Initialisierungsprozess"
            initialValue={formForm.values.initializeProcess}
            error={formForm.errors.initializeProcess as string}
            action={getWorkflowProcesses}
            actionParams={workflow.id}
            displayKeys={["name"]}
            dataKey={{ id: "id", name: "name" }}
          />
        )}
        <Checkbox
          label="Öffentlich"
          {...formForm.getInputProps("isPublic", { type: "checkbox" })}
        />
        <Checkbox
          label="Aktiv"
          {...formForm.getInputProps("isActive", { type: "checkbox" })}
        />
        {workflow && (
          <>
            {workflowRuns && workflowRuns.length === 0 && (
              <Alert color="yellow" variant="light">
                Es wurde noch keine Workflow-Ausführung erstellt. Das heißt, die
                dynamischen Felder von den Prozessen sind in den Berechtigungen
                nicht auswählbar.
              </Alert>
            )}
            <WorkflowPermissionBuilder
              label="Workflow Bearbeitungs Berechtigungen"
              initialData={workflow.editWorkflowPermissions ?? ""}
              formActionName="create-workflow"
              fieldValue="editWorkflowPermissions"
              workflowRuns={workflowRuns}
              permissionType="workflow"
            />
            <WorkflowPermissionBuilder
              label="Workflow Übermittlungs Berechtigungen"
              initialData={workflow.submitProcessPermissions ?? ""}
              formActionName="create-workflow"
              fieldValue="submitProcessPermissions"
              workflowRuns={workflowRuns}
              permissionType="workflow"
            />
          </>
        )}
        <Group mt="lg" justify="flex-end">
          <Button loading={status === "pending"} type="submit">
            {workflow ? "Speichern" : "Hinzufügen"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
