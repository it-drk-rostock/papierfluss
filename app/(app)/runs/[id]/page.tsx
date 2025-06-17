import { Title } from "@mantine/core";
import { WorkflowRun } from "./_components/workflow-run";
import { Suspense } from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <Title order={1}>Workflow Ausführung</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <WorkflowRun params={params} />
      </Suspense>
    </>
  );
}
