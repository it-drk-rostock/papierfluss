"use client";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import React from "react";
import { connectN8nWorkflow } from "../_actions";
import { connectN8nWorkflowSchema } from "../_schemas";
import { IconPlus, IconX } from "@tabler/icons-react";
import { EmptyState } from "@/components/empty-state";
import { useQuery } from "@tanstack/react-query";
import { getN8nWorkflows } from "@/server/utils/get-n8n-workflows";

export const ConnectN8nWorkflowsForm = ({
  workflows,
  workflowType,
  workflowId,
}: {
  workflows: {
    name: string;
    id: string;
    workflowId: string;
  }[];
  workflowType: string;
  workflowId: string;
}) => {
  const form = useForm({
    validate: zodResolver(connectN8nWorkflowSchema),
    mode: "uncontrolled",
    initialValues: {
      workflowId,
      workflows: [],
      workflowType: workflowType,
    },
  });

  const { execute, status } = useEnhancedAction({
    action: connectN8nWorkflow,
    hideModals: true,
  });

  const {
    data: availableWorkflows = [],
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

  // Filter out workflows that are already connected
  const filteredWorkflows = availableWorkflows.filter(
    (workflow) =>
      !form.values.workflows.some(
        (w) => w.workflowId === workflow.workflowId
      ) && !workflows.some((w) => w.workflowId === workflow.workflowId)
  );

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
                      workflowId: workflow.workflowId,
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
