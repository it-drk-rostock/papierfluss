import { Title } from "@mantine/core";
import { WorkflowRun } from "./_components/workflow-run";

export default function Page() {
  return (
    <>
      <Title order={1}>Workflow Ausführung</Title>
      <WorkflowRun />
    </>
  );
}
