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
} from "@mantine/core";
import { notFound } from "next/navigation";
import { disconnectN8nWorkflow, getWorkflowN8nWorkflows } from "../_actions";
import { ModalButton } from "@/components/modal-button";
import { EmptyState } from "@/components/empty-state";
import { ButtonAction } from "@/components/button-action";
import { ConnectN8nWorkflowsForm } from "./connect-n8n-workflows-form";
import { ModalActionIcon } from "@/components/modal-action-icon";
import { IconTrash } from "@tabler/icons-react";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { ViewActionIcon } from "@/components/view-action-icon";

export const N8nWorkflows = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const workflowId = (await params).id;
  const workflow = await getWorkflowN8nWorkflows(workflowId);

  if (!workflow) {
    notFound();
  }

  const renderWorkflowTab = (
    workflows: { id: string; name: string; workflowId: string }[],
    workflowType: string,
    description: string
  ) => (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {description}
      </Text>
      <ModalButton
        variant="outline"
        title="Workflow hinzufügen"
        content={
          <ConnectN8nWorkflowsForm
            workflows={workflows}
            workflowType={workflowType}
            workflowId={workflowId}
          />
        }
      >
        N8n Workflow hinzufügen
      </ModalButton>
      <Stack gap="xs">
        {workflows.map((workflow) => (
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
                      action={disconnectN8nWorkflow}
                      values={{
                        workflowId,
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
        ))}
        {workflows.length === 0 && (
          <EmptyState text="Keine Workflows gefunden" />
        )}
      </Stack>
    </Stack>
  );

  return (
    <Stack align="center" gap="xl">
      <Title order={2}>N8n Workflows: {workflow.name}</Title>
      <Paper p="lg" withBorder>
        <Tabs defaultValue="initializeN8nWorkflows">
          <TabsList mb="sm">
            <TabsTab value="initializeN8nWorkflows">Initialisieren</TabsTab>
            <TabsTab value="saveN8nWorkflows">Speichern</TabsTab>
            <TabsTab value="completeN8nWorkflows">Abschließen</TabsTab>
            <TabsTab value="archiveN8nWorkflows">Archivieren</TabsTab>
            <TabsTab value="reactivateN8nWorkflows">Wiederherstellen</TabsTab>
            <TabsTab value="lastN8nWorkflows">Vorletzter Prozess</TabsTab>
          </TabsList>

          <TabsPanel value="initializeN8nWorkflows">
            {renderWorkflowTab(
              workflow.initializeN8nWorkflows,
              "initializeN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer den Workflow initialisiert."
            )}
          </TabsPanel>

          <TabsPanel value="saveN8nWorkflows">
            {renderWorkflowTab(
              workflow.saveN8nWorkflows,
              "saveN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn der Workflow in Bearbeitung gesetzt wird."
            )}
          </TabsPanel>

          <TabsPanel value="completeN8nWorkflows">
            {renderWorkflowTab(
              workflow.completeN8nWorkflows,
              "completeN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn der Workflow abgeschlossen wird."
            )}
          </TabsPanel>

          <TabsPanel value="archiveN8nWorkflows">
            {renderWorkflowTab(
              workflow.archiveN8nWorkflows,
              "archiveN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn der Workflow archiviert wird."
            )}
          </TabsPanel>

          <TabsPanel value="reactivateN8nWorkflows">
            {renderWorkflowTab(
              workflow.reactivateN8nWorkflows,
              "reactivateN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn der Workflow wieder in Bearbeitung gesetzt wird."
            )}
          </TabsPanel>

          <TabsPanel value="lastN8nWorkflows">
            {renderWorkflowTab(
              workflow.lastN8nWorkflows,
              "lastN8nWorkflows",
              "Diese Workflows werden ausgeführt, wenn der vorletzte Prozess abgeschlossen wird."
            )}
          </TabsPanel>
        </Tabs>
      </Paper>
    </Stack>
  );
};
