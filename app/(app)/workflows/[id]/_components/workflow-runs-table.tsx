"use client";

import React, { useEffect, useState } from "react";
import "survey-analytics/survey.analytics.tabulator.css";
import "tabulator-tables/dist/css/tabulator.min.css";
import { Tabulator } from "survey-analytics/survey.analytics.tabulator";
import { Model } from "survey-core";
import { Box, Button, Group, Menu, Paper, Stack, Title } from "@mantine/core";
import { WorkflowRunsProps } from "../_actions";
import { WorkflowStatusBadge } from "@/components/workflow-status-badge";
import { WorkflowStatus } from "@prisma/client";
import { LinkButton } from "@/components/link-button";
import { useDisclosure } from "@mantine/hooks";
import { MenuItemLink } from "@/components/link-menu-item";

interface ProcessRunData {
  id: string;
  status: string;
  data: Record<string, unknown> | null;
  process: {
    schema: Record<string, unknown> | null;
  };
}

interface WorkflowRunTableProps {
  workflowRun: {
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    processes: ProcessRunData[];
  };
}

export const WorkflowRunTable = ({ workflowRun }: WorkflowRunTableProps) => {
  const [opened, handlers] = useDisclosure(false);
  let [vizPanel, setVizPanel] = useState<Tabulator>();

  useEffect(() => {
    // Clear existing content
    const container = document.getElementById(
      `summaryContainer-${workflowRun.id}`
    );
    if (container) {
      container.innerHTML = "";
    }

    // Filter out entries where data is null and process has a schema
    const validProcesses = workflowRun.processes.filter(
      (process) => process.data !== null && process.process.schema !== null
    );

    if (validProcesses.length > 0) {
      try {
        // Transform the data into an array of objects
        const transformedData = validProcesses.map((process) => ({
          ...process.data,
          id: process.id,
          status: process.status,
        }));

        // Create a survey model for each process using its schema
        validProcesses.forEach((process) => {
          if (process.process.schema) {
            const survey = new Model(process.process.schema);
            const panel = new Tabulator(survey, transformedData);
            panel.render(`summaryContainer-${workflowRun.id}`);
            setVizPanel(panel);
          }
        });
      } catch (error) {
        console.error("Error initializing Tabulator:", error);
      }
    } else {
      console.log("No valid submissions to display");
    }
  }, [workflowRun]);

  return (
    <Paper withBorder p="md" mb="md">
      <Stack>
        <Group>
          <Title order={4}>Workflow Run: {workflowRun.id}</Title>
          <WorkflowStatusBadge status={workflowRun.status as WorkflowStatus} />
          <Menu
            shadow="md"
            opened={opened}
            width={200}
            closeOnItemClick={false}
            closeOnClickOutside={false}
          >
            <Menu.Target>
              <Button onClick={handlers.toggle} variant="light">
                Aktionen
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <MenuItemLink href={`/runs/${workflowRun.id}`}>
                Zum Formular
              </MenuItemLink>
            </Menu.Dropdown>
          </Menu>
        </Group>
        <Box
          style={{ height: "400px", width: "100%" }}
          id={`summaryContainer-${workflowRun.id}`}
        />
      </Stack>
    </Paper>
  );
};

export const WorkflowRunsTable = ({ runs }: { runs: WorkflowRunsProps }) => {
  return (
    <Stack>
      {runs.map((run) => (
        <WorkflowRunTable key={run.id} workflowRun={run} />
      ))}
    </Stack>
  );
};
