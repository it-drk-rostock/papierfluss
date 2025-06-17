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
import { SurveyPreview } from "@/components/survey-preview";
import { IconChevronDown, IconChevronRight, IconChevronUp } from "@tabler/icons-react";

interface FormTreeNodeData extends TreeNodeData {
  processData: {
    name: string;
    description: string | null;
    schema: Record<string, unknown> | null;
    isCategory: boolean;
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
    <Stack gap="md">
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
            <ActionIcon variant="subtle" size="lg">
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

interface WorkflowRunFormsProps {
  processes: Array<{
    id: string;
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
            name: process.process.name,
            description: process.process.description,
            schema: process.process.schema,
            isCategory: process.process.isCategory,
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
