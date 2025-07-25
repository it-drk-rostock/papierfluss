import { Suspense } from "react";
import { Title } from "@mantine/core";
import { Workflows } from "./_components/workflows";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { WorkflowForm } from "./_components/workflow-form";

export default function Page() {
  return (
    <>
      <Title order={1}>Workflows</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <QuickSearchAdd
          modalTitle="Workflow hinzufügen"
          modalContent={<WorkflowForm />}
        />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <Workflows />
      </Suspense>
    </>
  );
}
