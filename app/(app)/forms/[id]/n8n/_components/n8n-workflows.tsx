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
import { disconnectN8nWorkflow, getFormN8nWorkflows } from "../_actions";
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
  const formId = (await params).id;
  const form = await getFormN8nWorkflows(formId);

  if (!form) {
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
            formId={formId}
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
                        formId,
                        workflowType,
                        workflowId: workflow.id,
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
      <Title order={2}>N8n Workflows: {form.title}</Title>
      <Paper p="lg" withBorder>
        <Tabs defaultValue="fillOutWorkflows">
          <TabsList mb="sm">
            <TabsTab value="fillOutWorkflows">Ausfüllen</TabsTab>
            <TabsTab value="saveWorkflows">Speichern</TabsTab>
            <TabsTab value="revokeWorkflows">Widerrufen</TabsTab>
            <TabsTab value="submitWorkflows">Einreichen</TabsTab>
            <TabsTab value="reviewWorkflows">Prüfen</TabsTab>
            <TabsTab value="reUpdateWorkflows">Nachbearbeiten</TabsTab>
            <TabsTab value="rejectWorkflows">Ablehnen</TabsTab>
            <TabsTab value="completeWorkflows">Abschließen</TabsTab>
          </TabsList>

          <TabsPanel value="fillOutWorkflows">
            {renderWorkflowTab(
              form.fillOutWorkflows,
              "fillOutWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer das Formular ausfüllt."
            )}
          </TabsPanel>

          <TabsPanel value="saveWorkflows">
            {renderWorkflowTab(
              form.saveWorkflows,
              "saveWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer das Formular speichert."
            )}
          </TabsPanel>

          <TabsPanel value="revokeWorkflows">
            {renderWorkflowTab(
              form.revokeWorkflows,
              "revokeWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer das Formular widerruft."
            )}
          </TabsPanel>

          <TabsPanel value="submitWorkflows">
            {renderWorkflowTab(
              form.submitWorkflows,
              "submitWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer das Formular einreicht."
            )}
          </TabsPanel>

          <TabsPanel value="reviewWorkflows">
            {renderWorkflowTab(
              form.reviewWorkflows,
              "reviewWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer das Formular prüft."
            )}
          </TabsPanel>

          <TabsPanel value="reUpdateWorkflows">
            {renderWorkflowTab(
              form.reUpdateWorkflows,
              "reUpdateWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer das Formular nachbearbeitet."
            )}
          </TabsPanel>

          <TabsPanel value="rejectWorkflows">
            {renderWorkflowTab(
              form.rejectWorkflows,
              "rejectWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer das Formular ablehnt."
            )}
          </TabsPanel>

          <TabsPanel value="completeWorkflows">
            {renderWorkflowTab(
              form.completeWorkflows,
              "completeWorkflows",
              "Diese Workflows werden ausgeführt, wenn ein Benutzer das Formular abschließt."
            )}
          </TabsPanel>
        </Tabs>
      </Paper>
    </Stack>
  );
};
