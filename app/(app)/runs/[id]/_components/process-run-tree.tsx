"use client";

import {
  getTreeExpandedState,
  Tree,
  TreeNodeData,
  useTree,
} from "@mantine/core";
import { ProcessRunItem } from "./process-run-item";
import { useMemo } from "react";
import { IconFolder, IconFile } from "@tabler/icons-react";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { JsonValue } from "@/generated/prisma/runtime/library";

interface ProcessRun {
  id: string;
  status: "open" | "ongoing" | "completed";
  data: JsonValue;
  resetProcessText: string | null;
  submittedBy: { id: string; name: string } | null;
  startedAt: Date;
  completedAt: Date | null;
  process: {
    id: string;
    name: string;
    description: string | null;
    isCategory: boolean;
    order: number;
    schema: JsonValue;
    theme: JsonValue;
    parentId: string | null;
    submitProcessPermissions: string | null;
    responsibleTeam: { name: string } | null;
    teams: { name: string }[];
    dependencies: Array<{ id: string; name: string }>;
    dependentProcesses: Array<{ id: string; name: string }>;
    children: Array<{ id: string; name: string }>;
  };
}

interface WorkflowRun {
  id: string;
  status: "open" | "ongoing" | "completed" | "archived";
  startedAt: Date;
  completedAt: Date | null;
  workflow: {
    name: string;
    description: string | null;
    isActive: boolean;
    isPublic: boolean;
    submitProcessPermissions: string | null;
    responsibleTeam: { name: string } | null;
    teams: { name: string }[];
  };
  processes: ProcessRun[];
}

export function ProcessRunTree({ workflowRun }: { workflowRun: WorkflowRun }) {
  const treeData = useMemo(() => {
    // Create a map of parent IDs to their children
    const childrenMap = new Map<string | null, ProcessRun[]>();

    // First, add all processes to the map
    workflowRun.processes.forEach((process) => {
      const parentId = process.process.parentId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(process);
    });

    // Sort children by order
    childrenMap.forEach((children) => {
      children.sort((a, b) => a.process.order - b.process.order);
    });

    // Build the tree recursively
    const buildTree = (parentId: string | null): TreeNodeData[] => {
      const children = childrenMap.get(parentId) || [];
      return children.map((process) => ({
        value: process.id,
        label: process.process.name,
        children: buildTree(process.process.id),
        icon: process.process.isCategory ? (
          <IconFolder size={16} style={baseIconStyles} />
        ) : (
          <IconFile size={16} style={baseIconStyles} />
        ),
      }));
    };

    return buildTree(null);
  }, [workflowRun.processes]);

  const tree = useTree({
    initialExpandedState: getTreeExpandedState(treeData, "*"),
  });

  // Calculate children status for each process
  const getChildrenStatus = (processId: string) => {
    const children = workflowRun.processes.filter(
      (p) => p.process.parentId === processId
    );

    return {
      open: children.filter((c) => c.status === "open").length,
      ongoing: children.filter((c) => c.status === "ongoing").length,
      completed: children.filter((c) => c.status === "completed").length,
    };
  };

  return (
    <Tree
      data={treeData}
      tree={tree}
      renderNode={({ node, expanded, elementProps }) => {
        const processRun = workflowRun.processes.find(
          (p) => p.id === node.value
        );
        if (!processRun) return null;

        const childrenStatus = processRun.process.isCategory
          ? getChildrenStatus(processRun.process.id)
          : undefined;

        return (
          <ProcessRunItem
            key={processRun.id}
            id={processRun.id}
            name={processRun.process.name}
            description={processRun.process.description}
            isCategory={processRun.process.isCategory}
            status={processRun.status}
            resetProcessText={processRun.resetProcessText}
            hasChildren={(node.children?.length ?? 0) > 0}
            expanded={expanded}
            childrenStatus={childrenStatus}
            elementProps={elementProps}
          />
        );
      }}
    />
  );
}
