"use client";

import {
  Stack,
  Title,
  Text,
  Paper,
  Skeleton,
  Tree,
  TreeNodeData,
  useTree,
} from "@mantine/core";
import React, { useMemo } from "react";
import { WorkflowProcessesProps } from "../_actions";
import { ProcessPreviewItem } from "./process-preview-item";

export const WorkflowPreview = ({
  workflow,
}: {
  workflow: WorkflowProcessesProps;
}) => {
  const tree = useTree({
    initialExpandedState: { root: true },
  });

  // Build tree data using useMemo to prevent unnecessary recalculations
  const treeData = useMemo(() => {
    if (!workflow) return [];

    const childrenMap = new Map<string | null, typeof workflow.processes>();
    workflow.processes.forEach((process) => {
      const parentId = process.parentId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(process);
    });

    const buildTree = (parentId: string | null): TreeNodeData[] => {
      const children = (childrenMap.get(parentId) || [])
        .sort((a, b) => a.order - b.order)
        .map((process) => ({
          value: process.id,
          label: (
            <ProcessPreviewItem
              name={process.name}
              description={process.description}
              isCategory={process.isCategory}
              status="open" // This will be dynamic when we have real runs
            />
          ),
          children: buildTree(process.id),
        }));
      return children;
    };

    return buildTree(null);
  }, [workflow]); // Rebuild tree when workflow changes

  if (!workflow) {
    return (
      <Stack gap="md">
        <Skeleton height={30} width="50%" radius="md" />
        <Skeleton height={20} width="70%" radius="md" />
        <Stack gap="sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <Paper key={i} p="md" withBorder>
              <Stack gap="sm">
                <Skeleton height={20} width="40%" radius="md" />
                <Skeleton height={15} width="60%" radius="md" />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Stack gap="0">
        <Title order={2}>{workflow.name}</Title>
        <Text c="dimmed">{workflow.description}</Text>
      </Stack>

      <Tree data={treeData} tree={tree} style={{ minHeight: "400px" }} />
    </Stack>
  );
};
