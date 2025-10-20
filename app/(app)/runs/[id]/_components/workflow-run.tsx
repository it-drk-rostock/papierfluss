import {
  Grid,
  Stack,
  Title,
  Text,
  Paper,
  GridCol,
  Group,
  Divider,
  Badge,
  Anchor,
} from "@mantine/core";
import React from "react";
import { getWorkflowRun } from "../_actions";
import { notFound } from "next/navigation";
import { WorkflowStatusBadge } from "@/components/workflow-status-badge";
import { ProcessRunTree } from "./process-run-tree";
import { WorkflowRunForms } from "./workflow-run-forms";
import { LinkButton } from "@/components/link-button";
import { IconArrowLeft } from "@tabler/icons-react";
import { buttonIconStyles } from "@/constants/button-icon-styles";


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

  // Get the processed information fields from the server
  const configuredFields = (() => {
    if (
      !workflowRun.workflow.information ||
      typeof workflowRun.workflow.information !== "object" ||
      !("fields" in workflowRun.workflow.information)
    ) {
      return [];
    }

    const info = workflowRun.workflow.information as {
      fields: Array<{
        label: string;
        fieldKey: string;
        data: { value: unknown; processName: string } | null;
      }>;
    };

    return info.fields;
  })();

  const formatConfiguredValue = (value: unknown): React.ReactNode => {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === "string") {
      // Try to parse date-like strings
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }
      // Render HTTPS links as downloadable anchors
      if (value.startsWith("https://")) {
        return (
          <Anchor href={value} target="_blank" rel="noopener noreferrer">
            Download
          </Anchor>
        );
      }
      return value;
    }
    return String(value);
  };

  

  return (
    <Stack gap="md">
      <Group align="flex-end" justify="space-between">
        <Stack gap="0">
          <Title order={1}>{workflowRun.workflow.name}</Title>
          <Text c="dimmed">{workflowRun.workflow.description}</Text>
        </Stack>
        <LinkButton
          leftSection={<IconArrowLeft style={buttonIconStyles} />}
          variant="outline"
          href={`/workflows/${workflowRun.workflow.id}`}
          title={`Zurück zu ${workflowRun.workflow.name} - Übersicht`}
        />
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
                  resetProcessText: processRun.resetProcessText,
                  data:
                    processRun.data &&
                    typeof processRun.data === "object" &&
                    processRun.data !== null
                      ? (processRun.data as Record<string, unknown>)
                      : null,
                  information:
                    processRun.information &&
                    typeof processRun.information === "object" &&
                    processRun.information !== null
                      ? (processRun.information as Record<string, unknown>)
                      : null,
                  informationData:
                    processRun.informationData &&
                    typeof processRun.informationData === "object" &&
                    processRun.informationData !== null
                      ? (processRun.informationData as Record<string, unknown>)
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
              <Stack gap="sm">
                <Group>
                  <WorkflowStatusBadge status={workflowRun.status} />
                  {workflowRun.isArchived && (
                    <Badge color="gray">Archiviert</Badge>
                  )}
                </Group>
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
                      <Text key={index}>
                        {field.label}:{" "}
                        {field.data
                          ? formatConfiguredValue(field.data.value)
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
