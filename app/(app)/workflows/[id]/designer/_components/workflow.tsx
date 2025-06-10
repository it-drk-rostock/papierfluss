import React from "react";
import { getWorkflowProcesses, type Process } from "../_actions";
import { WorkflowTree } from "./workflow-tree";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { ProcessForm } from "./process-form";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  TreeNodeData,
} from "@mantine/core";
import { WorkflowPreview } from "./workflow-preview";

export const Workflow = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const workflowId = (await params).id;
  const workflow = await getWorkflowProcesses(workflowId);

  if (!workflow) {
    return <div>Workflow nicht gefunden</div>;
  }

  // Build tree data
  const buildTreeData = (processes: Process[]): TreeNodeData[] => {
    const childrenMap = new Map<string | null, Process[]>();
    processes.forEach((process) => {
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
  };

  const treeData = buildTreeData(workflow.processes);

  return (
    <>
      <QuickSearchAdd
        modalTitle="Prozess/Kategorie hinzufügen"
        modalContent={<ProcessForm workflowId={workflowId} />}
        searchPlaceholder="Nach Prozessen suchen"
      />
      <Tabs defaultValue="designer">
        <TabsList mb="md">
          <TabsTab value="designer">Designer</TabsTab>
          <TabsTab value="preview">Vorschau</TabsTab>
        </TabsList>

        <TabsPanel value="preview">
          <WorkflowPreview workflow={workflow} />
        </TabsPanel>

        <TabsPanel value="designer">
          <WorkflowTree
            workflowId={workflow.id}
            initialProcesses={workflow.processes}
            treeData={treeData}
          />
        </TabsPanel>
      </Tabs>
    </>
  );
};
