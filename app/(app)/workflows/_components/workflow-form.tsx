"use client";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { updateWorkflowSchema, workflowSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { createWorkflow, updateWorkflow, WorkflowProps } from "../_actions";
import {
  Button,
  Group,
  Stack,
  Textarea,
  TextInput,
  Checkbox,
} from "@mantine/core";
import { EntitySelect } from "@/components/entity-select";
import { getTeams } from "../../dashboard/_actions";

export const WorkflowForm = ({ workflow }: { workflow?: WorkflowProps[0] }) => {
  const formForm = useForm({
    validate: zodResolver(workflow ? updateWorkflowSchema : workflowSchema),
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
        },
  });

  const { execute, status } = useEnhancedAction({
    action: workflow ? updateWorkflow : createWorkflow,
    hideModals: true,
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
          error={formForm.errors.responsibleTeam}
          action={getTeams}
          displayKeys={["name"]}
          dataKey={{ id: "id", name: "name" }}
        />
        <Checkbox
          label="Öffentlich"
          {...formForm.getInputProps("isPublic", { type: "checkbox" })}
        />
        <Checkbox
          label="Aktiv"
          {...formForm.getInputProps("isActive", { type: "checkbox" })}
        />

        {/* {workflow && (
          <>
            {workflow.processes.length === 0 && (
              <Alert color="yellow" variant="light">
                Es wurde noch kein Beispielformular erstellt. Das heißt, die
                dynamischen Felder von den Formularen sind in den Berechtigungen
                nicht auswählbar.
              </Alert>
            )}
            <PermissionBuilder
              label="Bearbeitungs Berechtigungen"
              initialData={workflow.editWorkflowPermissions ?? ""}
              formActionName="create-workflow"
              fieldValue="editWorkflowPermissions"
              submissions={workflow.processes}
            />
            <PermissionBuilder
              label="Überprüfungs Berechtigungen"
              initialData={form.reviewFormPermissions ?? ""}
              formActionName="create-form"
              fieldValue="reviewFormPermissions"
              submissions={form.submissions}
            />
          </>
        )} */}

        <Group mt="lg" justify="flex-end">
          <Button loading={status === "executing"} type="submit">
            {workflow ? "Speichern" : "Hinzufügen"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
