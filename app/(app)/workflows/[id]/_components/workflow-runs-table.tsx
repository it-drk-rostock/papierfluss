"use client";

import React from "react";
import { Button, Menu } from "@mantine/core";
import { WorkflowStatusBadge } from "@/components/workflow-status-badge";
import { WorkflowStatus, ProcessStatus } from "@prisma-client/client";
import { MenuItemLink } from "@/components/link-menu-item";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { IconArchive, IconTrash } from "@tabler/icons-react";
import { ButtonAction } from "@/components/button-action";
import { archiveWorkflowRun, deleteWorkflowRun } from "../_actions";
import { MantineTable } from "@/components/mantine-table";
import { DataTableColumn } from "mantine-datatable";

interface ProcessRunData {
  id: string;
  status: ProcessStatus;
  data: Record<string, unknown> | null;
  process: {
    id: string;
    name: string;
    schema: Record<string, unknown> | null;
    order: number;
    submitProcessPermissions: string | null;
    teams: { name: string }[];
    responsibleTeam: { name: string } | null;
  };
}

interface WorkflowRunData {
  id: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt: Date | null;
  processes: ProcessRunData[];
}

interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  information: Record<string, unknown> | null;
  teams: { name: string }[];
  responsibleTeam: { name: string } | null;
  initializeProcess?: {
    id: string;
    name: string;
    schema: Record<string, unknown> | null;
  } | null;
}

interface WorkflowRunsTableProps {
  workflow: WorkflowData;
  runs: WorkflowRunData[];
}

// Helper function to extract information field data
const getInformationFieldData = (
  workflowRun: WorkflowRunData,
  fieldKey: string
) => {
  // Search through all process runs to find the field data
  for (const processRun of workflowRun.processes) {
    if (
      processRun.data &&
      typeof processRun.data === "object" &&
      processRun.data !== null
    ) {
      const data = processRun.data as Record<string, unknown>;
      if (fieldKey in data) {
        return String(data[fieldKey]);
      }
    }
  }
  return null;
};

export const WorkflowRunsTable = ({
  workflow,
  runs,
}: WorkflowRunsTableProps) => {
  // Extract configured information fields
  const configuredFields = (() => {
    if (
      !workflow.information ||
      typeof workflow.information !== "object" ||
      !("fields" in workflow.information)
    ) {
      return [];
    }

    const info = workflow.information as {
      fields: Array<{ label: string; fieldKey: string }>;
    };

    return info.fields;
  })();

  // Transform runs data to include information fields
  const transformedRuns = runs.map((run) => {
    const baseData = {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    };

    // Add information fields
    const informationFields: Record<string, string | null> = {};
    configuredFields.forEach((field) => {
      informationFields[field.fieldKey] = getInformationFieldData(
        run,
        field.fieldKey
      );
    });

    return {
      ...baseData,
      ...informationFields,
    };
  });

  // Build columns dynamically
  const columns: DataTableColumn<(typeof transformedRuns)[0]>[] = [
    // Add dynamic information field columns
    ...configuredFields.map((field) => ({
      accessor: field.fieldKey,
      title: field.fieldKey,

      render: (record: Record<string, unknown>) =>
        String(record[field.fieldKey] || "-"),
    })),
    {
      accessor: "status",
      title: "Status",

      render: ({ status }) => <WorkflowStatusBadge status={status} />,
    },
    {
      accessor: "actions",
      title: "Aktionen",

      render: (record) => (
        <Menu
          shadow="md"
          width={200}
          closeOnItemClick={false}
          closeOnClickOutside={false}
        >
          <Menu.Target>
            <Button variant="light">Aktionen</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <MenuItemLink href={`/runs/${record.id}`}>
              Zum Formular
            </MenuItemLink>
            <ModalMenuItem
              leftSection={<IconArchive size={14} />}
              color="gray"
              title="Archivieren"
              content={
                <ButtonAction
                  color="gray"
                  fullWidth
                  action={archiveWorkflowRun}
                  values={{ id: record.id }}
                >
                  Archivieren
                </ButtonAction>
              }
            >
              Archivieren
            </ModalMenuItem>
            <ModalMenuItem
              leftSection={<IconTrash size={14} />}
              color="red"
              title="Löschen"
              content={
                <ButtonAction
                  fullWidth
                  action={deleteWorkflowRun}
                  values={{ id: record.id }}
                >
                  Löschen
                </ButtonAction>
              }
            >
              Löschen
            </ModalMenuItem>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  return (
    <MantineTable
      records={transformedRuns}
      columns={columns}
      storeKey="workflow-runs-table"
    />
  );
};
