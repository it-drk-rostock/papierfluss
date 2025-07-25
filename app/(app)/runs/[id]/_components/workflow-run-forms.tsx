"use client";

import {
  Stack,
  Text,
  Paper,
  Tree,
  TreeNodeData,
  useTree,
  Group,
  ActionIcon,
} from "@mantine/core";
import { useMemo } from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { WorkflowRunForm } from "./workflow-run-form";

interface FormTreeNodeData extends TreeNodeData {
  processData: {
    id: string;
    name: string;
    description: string | null;
    schema: Record<string, unknown> | null;
    isCategory: boolean;
    data: Record<string, unknown> | null;
    status: "open" | "ongoing" | "completed";
  };
}

interface FormNodeProps {
  node: FormTreeNodeData;
  expanded: boolean;
  hasChildren: boolean;
  elementProps: React.HTMLProps<HTMLDivElement>;
}

const FormNode = ({
  node,
  expanded,
  hasChildren,
  elementProps,
}: FormNodeProps) => {
  const process = node.processData;

  return (
    <Stack gap="md" mb="md">
      <div {...elementProps}>
        <Group wrap="nowrap" justify="space-between">
          <div style={{ flex: 1 }}>
            <Text fw={500}>{process.name}</Text>
            {process.description && (
              <Text size="sm" c="dimmed" fw={400}>
                {process.description}
              </Text>
            )}
          </div>
          {(hasChildren || !process.isCategory) && (
            <ActionIcon variant="light" size="lg" disabled={!process.schema}>
              {expanded ? (
                <IconChevronUp size={20} />
              ) : (
                <IconChevronDown size={20} />
              )}
            </ActionIcon>
          )}
        </Group>
      </div>
      {expanded && (
        <Stack gap="md" pl="md">
          {!process.isCategory && (
            <Paper withBorder p="md">
              {process.schema ? (
                <WorkflowRunForm
                  submission={{
                    id: process.id,
                    form: {
                      id: process.id,
                      schema: process.schema,
                    },
                    data: process.data,
                    status: process.status,
                  }}
                />
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Kein Formular verfügbar oder fehlende Berechtigung dieses
                  auszufüllen bzw. zu sehen
                </Text>
              )}
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
};

interface WorkflowRunFormsProps {
  processes: Array<{
    id: string;
    status: "open" | "ongoing" | "completed";
    data: Record<string, unknown> | null;
    process: {
      id: string;
      name: string;
      description: string | null;
      isCategory: boolean;
      order: number;
      schema: Record<string, unknown> | null;
      parentId: string | null;
    };
  }>;
}

export function WorkflowRunForms({ processes }: WorkflowRunFormsProps) {
  const formTreeData = useMemo(() => {
    const buildFormTree = (
      processes: WorkflowRunFormsProps["processes"],
      parentId: string | null = null
    ): FormTreeNodeData[] => {
      return processes
        .filter((process) => process.process.parentId === parentId)
        .sort((a, b) => a.process.order - b.process.order)
        .map((process) => ({
          value: process.id,
          label: process.process.name,
          children: buildFormTree(processes, process.process.id),
          processData: {
            id: process.id,
            name: process.process.name,
            description: process.process.description,
            schema: process.process.schema,
            isCategory: process.process.isCategory,
            data: process.data,
            status: process.status,
          },
        })) as FormTreeNodeData[];
    };

    return buildFormTree(processes);
  }, [processes]);

  const tree = useTree({
    initialExpandedState: { root: true },
  });

  return (
    <Tree
      expandOnSpace={false}
      data={formTreeData}
      tree={tree}
      renderNode={({ node, expanded, hasChildren, elementProps }) => (
        <FormNode
          node={node as FormTreeNodeData}
          expanded={expanded}
          hasChildren={hasChildren}
          elementProps={elementProps}
        />
      )}
    />
  );
}
