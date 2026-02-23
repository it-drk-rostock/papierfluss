"use client";

import {
  Stack,
  Title,
  Text,
  Paper,
  Tree,
  TreeNodeData,
  useTree,
  Group,
  Button,
  Grid,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconFileInfo,
  IconHelp,
} from "@tabler/icons-react";
import React, { useMemo } from "react";
import { WorkflowProcessesProps } from "../_actions";
import { ProcessPreviewItem } from "./process-preview-item";
import { SurveyPreview } from "@/components/survey-preview";
import { DrawerActionIcon } from "@/components/drawer-action-icon";

interface FormTreeNodeData extends TreeNodeData {
  processData: {
    name: string;
    description: string | null;
    schema: Record<string, unknown> | null;
    isCategory: boolean;
    informationSchema: Record<string, unknown> | null;
  };
}

interface FormNodeProps {
  node: FormTreeNodeData;
  expanded: boolean;
  elementProps: React.HTMLProps<HTMLDivElement>;
  tree: ReturnType<typeof useTree>;
}

const FormNode = ({ node, expanded, elementProps, tree }: FormNodeProps) => {
  const process = node.processData;

  return (
    <Stack gap="md">
      <div {...elementProps}>
        <Group wrap="nowrap" justify="space-between" gap="xs">
          <div style={{ flex: 1 }}>
            <Text fw={500}>{process.name}</Text>
            {process.description && (
              <Text size="sm" c="dimmed" fw={400}>
                {process.description}
              </Text>
            )}
          </div>
          {((node.children && node.children.length > 0) ||
            !process.isCategory) && (
            <ActionIcon
              variant="light"
              size="lg"
              disabled={!process.isCategory && !process.schema}
              onClick={(e) => {
                e.stopPropagation();
                tree.toggleExpanded(node.value);
              }}
            >
              {expanded ? (
                <IconChevronUp size={20} />
              ) : (
                <IconChevronDown size={20} />
              )}
            </ActionIcon>
          )}
          {!process.isCategory && (
            <Tooltip label="Informationen/Hilfe">
              <DrawerActionIcon
                disabled={!process.informationSchema}
                initialDrawerId={`information-${node.value}`}
                drawers={[
                  {
                    id: `information-${node.value}`,
                    title: "Informationen/Hilfe",
                    children: (
                      <SurveyPreview json={process.informationSchema} />
                    ),
                  },
                ]}
                variant="subtle"
                size="lg"
              >
                <IconFileInfo size={20} />
              </DrawerActionIcon>
            </Tooltip>
          )}
        </Group>
      </div>
      {expanded && (
        <Stack gap="md" pl="md">
          {!process.isCategory && (
            <Paper withBorder p="md">
              {process.schema ? (
                <SurveyPreview json={process.schema} />
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Kein Formular verfügbar
                </Text>
              )}
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export const WorkflowPreview = ({
  workflow,
}: {
  workflow: WorkflowProcessesProps;
}) => {
  const tree = useTree({
    initialExpandedState: { root: true },
    onNodeCollapse: (value) => console.log("Node collapsed:", value),
    onNodeExpand: (value) => console.log("Node expanded:", value),
  });

  const formTreeData = useMemo(() => {
    if (!workflow) return [];

    const buildFormTree = (
      processes: typeof workflow.processes,
      parentId: string | null = null,
    ): FormTreeNodeData[] => {
      return processes
        .filter((process) => process.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((process) => ({
          value: process.id,
          label: process.name,
          children: buildFormTree(processes, process.id),
          processData: {
            name: process.name,
            description: process.description,
            schema: process.schema,
            isCategory: process.isCategory,
            informationSchema: process.informationSchema,
          },
        })) as FormTreeNodeData[];
    };

    return buildFormTree(workflow.processes);
  }, [workflow]);

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
          label: process.name,
          children: buildTree(process.id),
        }));
      return children;
    };

    return buildTree(null);
  }, [workflow]);

  // Extract dynamic information from workflow
  const dynamicInformation = useMemo(() => {
    if (
      !workflow?.information ||
      typeof workflow.information !== "object" ||
      !("fields" in workflow.information)
    )
      return [];

    const info = workflow.information as {
      fields: Array<{ label: string; fieldKey: string }>;
    };

    return info.fields.map((field) => {
      return {
        fieldKey: field.fieldKey,
      };
    });
  }, [workflow]);

  const renderNode = ({
    node,
    expanded,
    hasChildren,
    elementProps,
  }: {
    node: TreeNodeData;
    expanded: boolean;
    hasChildren: boolean;
    elementProps: React.HTMLProps<HTMLDivElement>;
  }) => {
    const process = workflow?.processes.find((p) => p.id === node.value);
    if (!process) return null;

    return (
      <ProcessPreviewItem
        name={process.name}
        description={process.description}
        isCategory={process.isCategory}
        hasChildren={hasChildren}
        expanded={expanded}
        elementProps={elementProps}
      />
    );
  };

  return (
    <Stack gap="md">
      <Stack gap="0">
        <Title order={2}>{workflow?.name}</Title>
        <Text c="dimmed">{workflow?.description}</Text>
      </Stack>

      <Group justify="flex-end">
        <Button onClick={() => tree.expandAllNodes()} variant="subtle">
          Alle ausklappen
        </Button>
        <Button onClick={() => tree.collapseAllNodes()} variant="subtle">
          Alle einklappen
        </Button>
      </Group>

      <Grid gutter="lg">
        {/* Forms Section - 6 columns (half the width) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Formulare</Title>
              <Tree
                expandOnSpace={false}
                expandOnClick={false}
                data={formTreeData}
                tree={{ ...tree, setHoveredNode: () => {} }}
                renderNode={({ node, expanded, elementProps }) => (
                  <FormNode
                    node={node as FormTreeNodeData}
                    expanded={expanded}
                    elementProps={elementProps}
                    tree={tree}
                  />
                )}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Process Tree Section - 3 columns (quarter width) */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Prozesse</Title>
              <Tree
                data={treeData}
                tree={tree}
                renderNode={renderNode}
                style={{ minHeight: "400px" }}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Information Section - 3 columns (quarter width) */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Informationen</Title>
              <Stack gap="md">
                {dynamicInformation.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    Keine Informationen konfiguriert
                  </Text>
                ) : (
                  dynamicInformation.map(
                    (info: { fieldKey: string }, index: number) => (
                      <Stack key={index} gap="xs">
                        <Text size="sm" fw={500}>
                          {info.fieldKey}
                        </Text>
                      </Stack>
                    ),
                  )
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};
