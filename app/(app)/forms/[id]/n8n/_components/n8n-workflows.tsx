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
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Diese Workflows werden ausgeführt, wenn ein Benutzer das
                Formular ausfüllt.
              </Text>
              <ModalButton
                variant="outline"
                title="Workflow hinzufügen"
                content={
                  <ConnectN8nWorkflowsForm
                    workflows={form.fillOutWorkflows}
                    workflowType="fillOutWorkflows"
                    formId={formId}
                  />
                }
              >
                N8n Workflow hinzufügen
              </ModalButton>
              <Stack gap="xs">
                {form.fillOutWorkflows.map((workflow) => (
                  <Paper key={workflow.id} p="sm" withBorder>
                    <Group justify="space-between">
                      <Text>{workflow.name}</Text>
                      <ModalActionIcon
                        variant="light"
                        title="Workflow entfernen"
                        content={
                          <ButtonAction
                            fullWidth
                            action={disconnectN8nWorkflow}
                            values={{
                              formId,
                              workflowType: "fillOutWorkflows",
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
                  </Paper>
                ))}
                {form.fillOutWorkflows.length === 0 && (
                  <EmptyState text="Keine Workflows gefunden" />
                )}
              </Stack>
            </Stack>
          </TabsPanel>

          <TabsPanel value="saveWorkflows">saveWorkflows tab content</TabsPanel>

          <TabsPanel value="revokeWorkflows">
            revokeWorkflows tab content
          </TabsPanel>

          <TabsPanel value="submitWorkflows">
            submitWorkflows tab content
          </TabsPanel>

          <TabsPanel value="reviewWorkflows">
            reviewWorkflows tab content
          </TabsPanel>

          <TabsPanel value="reUpdateWorkflows">
            reUpdateWorkflows tab content
          </TabsPanel>

          <TabsPanel value="rejectWorkflows">
            rejectWorkflows tab content
          </TabsPanel>

          <TabsPanel value="completeWorkflows">
            completeWorkflows tab content
          </TabsPanel>
        </Tabs>
      </Paper>
    </Stack>
  );
};
