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
  Alert,
  Divider,
} from "@mantine/core";
import { useMemo } from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { WorkflowRunForm } from "./workflow-run-form";
import { WorkflowRunInformationForm } from "./workflow-run-information-form";

interface FormTreeNodeData extends TreeNodeData {
  processData: {
    id: string;
    name: string;
    description: string | null;
    schema: Record<string, unknown> | null;
    resetProcessText: string | null;
    isCategory: boolean;
    data: Record<string, unknown> | null;
    information: Record<string, unknown> | null;
    informationData: Record<string, unknown> | null;
    status: "open" | "ongoing" | "completed";
  };
}

interface FormNodeProps {
  node: FormTreeNodeData;
  expanded: boolean;
  hasChildren: boolean;
  elementProps: React.HTMLProps<HTMLDivElement>;
  tree: ReturnType<typeof useTree>;
}

const FormNode = ({
  node,
  expanded,
  hasChildren,
  elementProps,
  tree,
}: FormNodeProps) => {
  const process = node.processData;

  const submission = useMemo(() => {
    if (!process.schema) return null;
    return {
      id: process.id,
      form: {
        id: process.id,
        schema: process.schema,
      },
      data: process.data,
      information: process.information,
      informationData: process.informationData,
      status: process.status,
    };
  }, [
    process.id,
    process.schema,
    process.data,
    process.status,
    process.information,
    process.informationData,
  ]);

  return (
    <Stack gap="md" {...elementProps}>
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
      </Group>
      {expanded && (
        <Stack gap="md" pl="md">
          {!process.isCategory && (
            <Paper
              withBorder
              p="md"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {process.schema && submission ? (
                <>
                  {process.resetProcessText && (
                    <Alert
                      mb="sm"
                      title="Bitte Prozess erneut bearbeiten"
                      variant="light"
                      color="yellow"
                    >
                      {process.resetProcessText}
                    </Alert>
                  )}
                  {process.information && submission && (
                    <>
                      <WorkflowRunInformationForm submission={submission} />
                      <Divider my="md" />
                    </>
                  )}

                  <WorkflowRunForm submission={submission} />
                </>
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
    information: Record<string, unknown> | null;
    informationData: Record<string, unknown> | null;
    resetProcessText: string | null;
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
            resetProcessText: process.resetProcessText,
            id: process.id,
            name: process.process.name,
            description: process.process.description,
            schema: process.process.schema,
            isCategory: process.process.isCategory,
            data: process.data,
            information: process.information,
            informationData: process.informationData,
            status: process.status,
          },
        })) as FormTreeNodeData[];
    };

    return buildFormTree(processes);
  }, [processes]);

  const tree = useTree({
    initialExpandedState: { root: true },
    onNodeCollapse: (value) => console.log("Node collapsed:", value),
    onNodeExpand: (value) => console.log("Node expanded:", value),
  });

  return (
    <Tree
      expandOnSpace={false}
      expandOnClick={false}
      data={formTreeData}
      tree={{ ...tree, setHoveredNode: () => {} }}
      className="workflow-run-forms-tree"
      renderNode={({ node, expanded, hasChildren, elementProps }) => (
        <FormNode
          node={node as FormTreeNodeData}
          expanded={expanded}
          hasChildren={hasChildren}
          elementProps={elementProps}
          tree={tree}
        />
      )}
    />
  );
}
