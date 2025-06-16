import {
  Button,
  Paper,
  Title,
  Tree,
  TreeNodeData,
  useTree,
} from "@mantine/core";
import { Group, Stack } from "@mantine/core";
import { ProcessRunItem } from "./process-run-item";

interface ProcessRun {
  id: string;
  status: "open" | "ongoing" | "completed";
  process: {
    id: string;
    name: string;
    description: string | null;
    isCategory: boolean;
    parentId: string | null;
    order: number;
  };
}

interface WorkflowRun {
  id: string;
  status: "open" | "ongoing" | "completed" | "archived";
  processes: ProcessRun[];
}

interface ProcessRunTreeProps {
  workflowRun: WorkflowRun;
}

export function ProcessRunTree({ workflowRun }: ProcessRunTreeProps) {
  const tree = useTree({
    initialExpandedState: {},
  });

  // Build tree data
  const buildTreeData = (processes: ProcessRun[]): TreeNodeData[] => {
    const childrenMap = new Map<string | null, ProcessRun[]>();
    processes.forEach((process) => {
      const parentId = process.process.parentId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(process);
    });

    const buildTree = (parentId: string | null): TreeNodeData[] => {
      const children = (childrenMap.get(parentId) || [])
        .sort((a, b) => a.process.order - b.process.order)
        .map((process) => ({
          value: process.id,
          label: process.process.name,
          children: buildTree(process.id),
        }));
      return children;
    };

    return buildTree(null);
  };

  const treeData = buildTreeData(workflowRun.processes);

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
    const processRun = workflowRun.processes.find((p) => p.id === node.value);
    if (!processRun) return null;

    return (
      <ProcessRunItem
        name={processRun.process.name}
        description={processRun.process.description}
        isCategory={processRun.process.isCategory}
        status={processRun.status}
        hasChildren={hasChildren}
        expanded={expanded}
        elementProps={elementProps}
      />
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
    </Stack>
  );
}
