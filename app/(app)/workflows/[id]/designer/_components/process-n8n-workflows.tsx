"use client";

import React from "react";
import {
  Stack,
  Title,
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  Paper,
  Text,
  Group,
  Loader,
  ActionIcon,
  Button,
} from "@mantine/core";
import {
  disconnectProcessN8nWorkflow,
  getProcessN8nWorkflows,
  connectProcessN8nWorkflow,
} from "../_actions/process-n8n";
import { EmptyState } from "@/components/empty-state";
import { ButtonAction } from "@/components/button-action";
import { ModalActionIcon } from "@/components/modal-action-icon";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { ViewActionIcon } from "@/components/view-action-icon";
import { useQuery } from "@tanstack/react-query";
import { getN8nWorkflows } from "@/server/utils/get-n8n-workflows";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { connectProcessN8nWorkflowSchema } from "../_schemas/process-n8n";

const N8N_URL = process.env.NEXT_PUBLIC_N8N_URL || "";

type WorkflowFormValues = {
  processId: string;
  workflowType: string;
  workflows: Array<{ id: string; name: string }>;
};

export const ProcessN8nWorkflows = ({ processId }: { processId: string }) => {
  const {
    data: process,
    isLoading: isProcessLoading,
    isError: isProcessError,
  } = useQuery({
    queryKey: ["processN8nWorkflows", processId],
    queryFn: () => getProcessN8nWorkflows(processId),
    staleTime: 0,
  });

  const {
    data: availableWorkflows = [],
    isLoading: isWorkflowsLoading,
    isError: isWorkflowsError,
  } = useQuery({
    queryKey: ["n8nWorkflows"],
    queryFn: getN8nWorkflows,
    staleTime: 0,
  });

  const { execute: executeConnect, status: connectStatus } = useEnhancedAction({
    action: connectProcessN8nWorkflow,
    hideModals: true,
  });

  const isLoading = isProcessLoading || isWorkflowsLoading;
  const isError = isProcessError || isWorkflowsError;

  // Initialize forms for each workflow type
  const forms = {
    saveN8nWorkflows: useForm<WorkflowFormValues>({
      validate: zodResolver(connectProcessN8nWorkflowSchema),
      initialValues: {
        processId,
        workflowType: "saveN8nWorkflows",
        workflows: [],
      },
    }),
    completeN8nWorkflows: useForm<WorkflowFormValues>({
      validate: zodResolver(connectProcessN8nWorkflowSchema),
      initialValues: {
        processId,
        workflowType: "completeN8nWorkflows",
        workflows: [],
      },
    }),
    reactivateN8nWorkflows: useForm<WorkflowFormValues>({
      validate: zodResolver(connectProcessN8nWorkflowSchema),
      initialValues: {
        processId,
        workflowType: "reactivateN8nWorkflows",
        workflows: [],
      },
    }),
  };

  if (isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    );
  }

  if (isError || !process) {
    return (
      <Stack align="center" py="xl">
        <Text c="red">Fehler beim Laden der N8n Workflows</Text>
      </Stack>
    );
  }

  const handleSave = async (workflowType: keyof typeof forms) => {
    const form = forms[workflowType];
    if (form.values.workflows.length > 0) {
      await executeConnect(form.values);
      // Reset form after successful save
      form.reset();
    }
  };

  const renderWorkflowTab = (
    connectedWorkflows: { id: string; name: string; workflowId: string }[],
    workflowType: keyof typeof forms,
    description: string
  ) => {
    const form = forms[workflowType];

    // Get connected workflow IDs for the current tab only
    const connectedWorkflowIds = connectedWorkflows.map((w) => w.id);

    // Filter out workflows that are already connected to this specific tab or selected
    const filteredWorkflows = availableWorkflows.filter(
      (workflow) =>
        !connectedWorkflowIds.includes(workflow.id) &&
        !form.values.workflows.some((w) => w.id === workflow.id)
    );

    return (
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {description}
        </Text>

        {/* Available Workflows Section */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Title order={4}>Verfügbare Workflows</Title>
            {filteredWorkflows.length === 0 ? (
              <EmptyState text="Keine Workflows verfügbar">
                <Button
                  variant="outline"
                  component="a"
                  target="_blank"
                  href={N8N_URL}
                >
                  N8n Workflow erstellen
                </Button>
              </EmptyState>
            ) : (
              filteredWorkflows.map((workflow) => (
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
                    <IconPlus style={baseIconStyles} />
                  </ActionIcon>
                </Group>
              ))
            )}
          </Stack>
        </Paper>

        {/* Selected Workflows Section */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Title order={4}>Ausgewählte Workflows</Title>
            {form.values.workflows.length === 0 ? (
              <EmptyState text="Keine Workflows ausgewählt" />
            ) : (
              <>
                {form.values.workflows.map((workflow, index) => (
                  <Group key={workflow.id} justify="space-between">
                    <Text>{workflow.name}</Text>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => form.removeListItem("workflows", index)}
                    >
                      <IconTrash style={baseIconStyles} />
                    </ActionIcon>
                  </Group>
                ))}
                <Button
                  fullWidth
                  onClick={() => handleSave(workflowType)}
                  loading={connectStatus === "executing"}
                >
                  Ausgewählte Workflows speichern
                </Button>
              </>
            )}
          </Stack>
        </Paper>

        {/* Connected Workflows Section */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Title order={4}>Verbundene Workflows</Title>
            {connectedWorkflows.length === 0 ? (
              <EmptyState text="Keine Workflows verbunden" />
            ) : (
              connectedWorkflows.map((workflow) => (
                <Paper key={workflow.id} p="sm" withBorder>
                  <Group justify="space-between">
                    <Text>{workflow.name}</Text>
                    <Group gap="xs">
                      <ViewActionIcon href={`/admin/n8n/${workflow.id}`} />
                      <ModalActionIcon
                        variant="light"
                        title="Workflow entfernen"
                        content={
                          <ButtonAction
                            fullWidth
                            action={disconnectProcessN8nWorkflow}
                            values={{
                              processId,
                              workflowType,
                              n8nWorkflowId: workflow.id,
                            }}
                          >
                            Workflow entfernen
                          </ButtonAction>
                        }
                      >
                        <IconTrash style={baseIconStyles} />
                      </ModalActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>
    );
  };

  return (
    <Stack gap="xl">
      <Title order={2}>N8n Workflows: {process.name}</Title>
      <Paper p="lg" withBorder>
        <Tabs defaultValue="saveN8nWorkflows">
          <TabsList mb="sm">
            <TabsTab value="saveN8nWorkflows">Speichern</TabsTab>
            <TabsTab value="completeN8nWorkflows">Abschließen</TabsTab>
            <TabsTab value="reactivateN8nWorkflows">Wiederherstellen</TabsTab>
          </TabsList>

          <TabsPanel value="saveN8nWorkflows">
            {renderWorkflowTab(
              process.saveN8nWorkflows,
              "saveN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn der Prozess in Bearbeitung gesetzt wird."
            )}
          </TabsPanel>

          <TabsPanel value="completeN8nWorkflows">
            {renderWorkflowTab(
              process.completeN8nWorkflows,
              "completeN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn der Prozess abgeschlossen wird."
            )}
          </TabsPanel>

          <TabsPanel value="reactivateN8nWorkflows">
            {renderWorkflowTab(
              process.reactivateN8nWorkflows,
              "reactivateN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn der Prozess wieder in Bearbeitung gesetzt wird."
            )}
          </TabsPanel>
        </Tabs>
      </Paper>
    </Stack>
  );
};
