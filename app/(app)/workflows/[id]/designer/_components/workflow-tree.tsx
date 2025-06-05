"use client";

import { Tree, TreeNodeData, useTree } from "@mantine/core";
import {
  IconFolder,
  IconFolderOpen,
  IconFile,
  IconTrash,
  IconCategory,
  IconArrowUp,
  IconArrowDown,
  IconStairsDown,
} from "@tabler/icons-react";
import {
  Button,
  Group,
  Stack,
  Tooltip,
  Text,
  type GroupProps,
} from "@mantine/core";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { ModalActionIcon } from "@/components/modal-action-icon";
import { ButtonAction } from "@/components/button-action";
import { deleteProcess, moveProcess } from "../_actions";
import { ProcessForm } from "./process-form";
import { ModalButton } from "@/components/modal-button";
import { ManageDependenciesForm } from "./manage-dependencies-form";
import { ActionIconAction } from "@/components/action-icon-action";

interface Process {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  order: number;
  isCategory: boolean;
  dependencies: Array<{ id: string; name: string }>;
  dependentProcesses: Array<{ id: string; name: string }>;
  children: Array<{ id: string; name: string }>;
}

interface TreeNode {
  node: TreeNodeData;
  expanded: boolean;
  hasChildren: boolean;
  elementProps: React.HTMLProps<HTMLDivElement>;
}

interface WorkflowTreeProps {
  workflowId: string;
  initialProcesses: Process[];
  treeData: TreeNodeData[];
}

export function WorkflowTree({
  workflowId,
  initialProcesses,
  treeData,
}: WorkflowTreeProps) {
  const tree = useTree({
    initialExpandedState: {},
  });

  const renderNode = ({
    node,
    expanded,
    hasChildren,
    elementProps,
  }: TreeNode) => {
    const process = initialProcesses.find((p) => p.id === node.value);
    if (!process) return null;

    const siblings = initialProcesses
      .filter((p) => p.parentId === process.parentId)
      .sort((a, b) => a.order - b.order);
    const isFirst = siblings[0]?.id === process.id;
    const isLast = siblings[siblings.length - 1]?.id === process.id;
    const hasDependencies =
      !process.isCategory && process.dependencies.length > 0;

    const groupProps: GroupProps = {
      ...elementProps,
      gap: "xs",
      wrap: "nowrap",
    };

    const getIcon = () => {
      if (hasChildren) {
        if (expanded) {
          return (
            <IconFolderOpen
              size={16}
              color={
                process.isCategory ? "gray" : "var(--mantine-color-red-filled)"
              }
            />
          );
        }
        return (
          <IconFolder
            size={16}
            color={
              process.isCategory ? "gray" : "var(--mantine-color-red-filled)"
            }
          />
        );
      }

      if (process.isCategory) {
        return <IconCategory size={16} color="gray" />;
      }

      return <IconFile size={16} />;
    };

    return (
      <Group {...groupProps}>
        {getIcon()}
        <div style={{ flex: 1 }}>
          <Group wrap="nowrap">
            <Stack gap="0">
              <Text size="sm">
                {node.label} -{" "}
                <Text c="dimmed" display="inline-block" size="xs">
                  {process.isCategory ? "Kategorie" : "Prozess"}
                  {` (${process.children.length})`}
                </Text>
              </Text>
              <Text size="xs" c="dimmed">
                {process.description}
              </Text>
            </Stack>
            <Group gap="xs">
              {siblings.length > 1 && (
                <Group gap="xs">
                  {!isFirst && (
                    <ActionIconAction
                      variant="subtle"
                      action={moveProcess}
                      values={{
                        processId: process.id,
                        direction: "up",
                      }}
                      hideNotification
                      aria-label="Nach oben"
                    >
                      <IconArrowUp style={baseIconStyles} />
                    </ActionIconAction>
                  )}
                  {!isLast && (
                    <ActionIconAction
                      variant="subtle"
                      action={moveProcess}
                      values={{
                        processId: process.id,
                        direction: "down",
                      }}
                      hideNotification
                      aria-label="Nach unten"
                    >
                      <IconArrowDown style={baseIconStyles} />
                    </ActionIconAction>
                  )}
                </Group>
              )}
              {!process.isCategory && (
                <ModalButton
                  variant="subtle"
                  size="compact-sm"
                  color={hasDependencies ? "red" : "gray"}
                  title="Abhängigkeiten verwalten"
                  content={
                    <ManageDependenciesForm
                      processId={process.id}
                      currentDependencies={process.dependencies}
                    />
                  }
                >
                  Abhängigkeiten
                </ModalButton>
              )}
              <Tooltip
                color="red"
                label={
                  process.isCategory
                    ? "Kategorie/Prozess hinzufügen"
                    : "Unterprozess/Kategorie hinzufügen"
                }
              >
                <ModalActionIcon
                  title={
                    process.isCategory
                      ? "Kategorie/Prozess hinzufügen"
                      : "Unterprozess/Kategorie hinzufügen"
                  }
                  variant="subtle"
                  content={
                    <ProcessForm
                      workflowId={workflowId}
                      parentId={process.id}
                    />
                  }
                >
                  <IconStairsDown style={baseIconStyles} />
                </ModalActionIcon>
              </Tooltip>
              <Tooltip color="red" label="Löschen">
                <ModalActionIcon
                  title="Prozess löschen"
                  variant="subtle"
                  content={
                    <ButtonAction
                      fullWidth
                      action={deleteProcess}
                      values={{ id: process.id }}
                      hideNotification
                    >
                      Prozess löschen
                    </ButtonAction>
                  }
                  color="red"
                >
                  <IconTrash style={baseIconStyles} />
                </ModalActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </div>
      </Group>
    );
  };

  return (
    <Stack>
      <Group justify="flex-end">
        <Button onClick={() => tree.expandAllNodes()} variant="subtle">
          Alle ausklappen
        </Button>
        <Button onClick={() => tree.collapseAllNodes()} variant="subtle">
          Alle einklappen
        </Button>
      </Group>

      <Tree
        data={treeData}
        tree={tree}
        renderNode={renderNode}
        style={{ minHeight: "400px" }}
      />
    </Stack>
  );
}
