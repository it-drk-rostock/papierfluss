import { Stack, Title } from "@mantine/core";
import { Suspense } from "react";
import { WorkflowRuns } from "../_components/workflow-runs";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Stack gap="lg">
      <Title order={1}>Workflow Designer</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <WorkflowRuns params={params} />
      </Suspense>
    </Stack>
  );
}
