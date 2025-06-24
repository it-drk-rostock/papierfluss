import {
  Grid,
  Stack,
  Title,
  Text,
  Paper,
  GridCol,
  Group,
  Divider,
} from "@mantine/core";
import React from "react";
import { archiveWorkflowRun, getWorkflowRun } from "../_actions";
import { notFound } from "next/navigation";
import { WorkflowStatusBadge } from "@/components/workflow-status-badge";
import { ProcessRunTree } from "./process-run-tree";
import { WorkflowRunForms } from "./workflow-run-forms";
import { LinkButton } from "@/components/link-button";
import { IconArrowLeft } from "@tabler/icons-react";
import { buttonIconStyles } from "@/constants/button-icon-styles";
import { ModalButton } from "@/components/modal-button";
import { ButtonAction } from "@/components/button-action";

// Helper function to extract information field data
const getInformationFieldData = (
  workflowRun: Awaited<ReturnType<typeof getWorkflowRun>>,
  fieldKey: string
) => {
  if (!workflowRun) return null;

  // Search through all process runs to find the field data
  for (const processRun of workflowRun.processes) {
    if (
      processRun.data &&
      typeof processRun.data === "object" &&
      processRun.data !== null
    ) {
      const data = processRun.data as Record<string, unknown>;
      if (fieldKey in data) {
        return {
          value: data[fieldKey],
          processName: processRun.process.name,
        };
      }
    }
  }
  return null;
};

export const WorkflowRun = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const workflowRunId = (await params).id;

  const workflowRun = await getWorkflowRun(workflowRunId);

  if (!workflowRun) {
    return notFound();
  }

  // Extract configured information fields
  const configuredFields = (() => {
    if (
      !workflowRun.workflow.information ||
      typeof workflowRun.workflow.information !== "object" ||
      !("fields" in workflowRun.workflow.information)
    ) {
      return [];
    }

    const info = workflowRun.workflow.information as {
      fields: Array<{ label: string; fieldKey: string }>;
    };

    return info.fields.map((field) => {
      const fieldData = getInformationFieldData(workflowRun, field.fieldKey);
      return {
        ...field,
        data: fieldData,
      };
    });
  })();

  return (
    <Stack gap="md">
      <Group align="flex-end" justify="space-between">
        <Stack gap="0">
          <Title order={2}>{workflowRun.workflow.name}</Title>
          <Text c="dimmed">{workflowRun.workflow.description}</Text>
        </Stack>
        <Group gap="sm">
          <LinkButton
            leftSection={<IconArrowLeft style={buttonIconStyles} />}
            variant="outline"
            href={`/workflows/${workflowRun.workflow.id}`}
            title={`Zurück zu ${workflowRun.workflow.name}`}
          />
          <ModalButton
            variant="outline"
            color="gray"
            title="Archivieren"
            content={
              <ButtonAction
                fullWidth
                color="gray"
                action={archiveWorkflowRun}
                values={{ id: workflowRunId }}
              >
                Archivieren
              </ButtonAction>
            }
          >
            Archivieren
          </ModalButton>
        </Group>
      </Group>
      <Divider />
      <Grid gutter="lg">
        {/* Forms Section - 6 columns (half the width) */}
        <GridCol span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Formulare</Title>
              <WorkflowRunForms
                processes={workflowRun.processes.map((processRun) => ({
                  id: processRun.id,
                  status: processRun.status,
                  data:
                    processRun.data &&
                    typeof processRun.data === "object" &&
                    processRun.data !== null
                      ? (processRun.data as Record<string, unknown>)
                      : null,
                  process: {
                    id: processRun.process.id,
                    name: processRun.process.name,
                    description: processRun.process.description,
                    isCategory: processRun.process.isCategory,
                    order: processRun.process.order,
                    schema:
                      processRun.process.schema &&
                      typeof processRun.process.schema === "object" &&
                      processRun.process.schema !== null
                        ? (processRun.process.schema as Record<string, unknown>)
                        : null,
                    parentId: processRun.process.parentId,
                  },
                }))}
              />
            </Stack>
          </Paper>
        </GridCol>

        <GridCol span={{ base: 12, md: 3 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Prozesse</Title>
              <ProcessRunTree workflowRun={workflowRun} />
            </Stack>
          </Paper>
        </GridCol>

        {/* Information Section - 3 columns (quarter width) */}
        <GridCol span={{ base: 12, md: 3 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Informationen</Title>
              <Stack gap="md">
                <WorkflowStatusBadge status={workflowRun.status} />
                <Text>
                  Gestartet am: {workflowRun.startedAt.toLocaleDateString()}
                </Text>
                <Text>
                  Abgeschlossen am:{" "}
                  {workflowRun.completedAt?.toLocaleDateString()}
                </Text>

                {/* Dynamic Information Fields */}
                {configuredFields.length > 0 && (
                  <>
                    <Divider />
                    {configuredFields.map((field, index) => (
                      <Text key={index} size="sm">
                        {field.fieldKey}:{" "}
                        {field.data
                          ? String(field.data.value)
                          : "Keine Daten verfügbar"}
                      </Text>
                    ))}
                  </>
                )}
              </Stack>
            </Stack>
          </Paper>
        </GridCol>
      </Grid>
    </Stack>
  );
};
