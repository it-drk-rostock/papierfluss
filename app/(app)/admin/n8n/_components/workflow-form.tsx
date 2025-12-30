"use client";
import { useForm } from "@mantine/form";
import { createWorkflowSchema } from "../_schemas";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { createWorkflow, getN8nWorkflows } from "../_actions";
import {
  ActionIcon,
  Button,
  Group,
  Stack,
  Title,
  Text,
  Loader,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/empty-state";

type WorkflowFormProps = {
  existingWorkflows: {
    id: string;
    workflowId: string;
    name: string;
  }[];
};

export const WorkflowForm = ({ existingWorkflows }: WorkflowFormProps) => {
  const form = useForm({
    validate: zod4Resolver(createWorkflowSchema),
    mode: "uncontrolled",
    initialValues: {
      workflows: [],
    },
  });

  const { execute, status } = useEnhancedAction({
    action: createWorkflow,
    hideModals: true,
  });

  const {
    data: availableWorkflows,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["n8nWorkflows"],
    queryFn: getN8nWorkflows,
  });

  if (isPending) {
    return <Loader />;
  }

  if (isError) {
    return <Text c="red">Fehler beim Laden der Workflows</Text>;
  }

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="md">
        <Stack gap="sm">
          <Title order={3}>Verfügbare Workflows</Title>
          {(() => {
            const filteredWorkflows = (availableWorkflows || []).filter(
              (workflow) =>
                !form.values.workflows.some((w) => w.id === workflow.id) &&
                !existingWorkflows.some((w) => w.workflowId === workflow.id)
            );

            if (filteredWorkflows.length === 0) {
              return (
                <EmptyState text="Keine Workflows verfügbar">
                  <Button
                    variant="outline"
                    component="a"
                    target="_blank"
                    href={process.env.NEXT_PUBLIC_N8N_URL}
                  >
                    N8n Workflow erstellen
                  </Button>
                </EmptyState>
              );
            }

            return filteredWorkflows.map((workflow) => (
              <Group key={workflow.id} justify="space-between">
                <Text>{workflow.name}</Text>
                <ActionIcon
                  variant="light"
                  onClick={() =>
                    form.insertListItem("workflows", {
                      id: workflow.id,
                      name: workflow.name,
                    })
                  }
                >
                  <IconPlus />
                </ActionIcon>
              </Group>
            ));
          })()}
          {form.errors.workflows && (
            <Text c="red">{form.errors.workflows}</Text>
          )}
        </Stack>
        <Stack gap="sm">
          <Title order={3}>Ausgewählte Workflows</Title>
          {form.values.workflows.map((workflow, index) => (
            <Group key={workflow.id} justify="space-between">
              <Text>{workflow.name}</Text>
              <ActionIcon
                variant="light"
                onClick={() => form.removeListItem("workflows", index)}
              >
                <IconX />
              </ActionIcon>
            </Group>
          ))}
          {form.values.workflows.length === 0 && (
            <EmptyState text="Keine Workflows ausgewählt" />
          )}
          <Button loading={status === "executing"} type="submit">
            Hinzufügen
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
