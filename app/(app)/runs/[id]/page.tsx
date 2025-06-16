import { Title } from "@mantine/core";
import { WorkflowRun } from "./_components/workflow-run";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <Title order={1}>Workflow Ausführung</Title>
      <WorkflowRun params={params} />
    </>
  );
}
