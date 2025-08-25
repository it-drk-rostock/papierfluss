"use client";

import React from "react";
import { Group } from "@mantine/core";
import { WorkflowCard } from "./workflow-card";
import { WorkflowProps } from "../_actions";

export const WorkflowList = ({ workflows }: { workflows: WorkflowProps }) => {
  return (
    <>
      <Group justify="center">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </Group>
    </>
  );
};
