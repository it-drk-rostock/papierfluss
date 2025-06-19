import { Stack, Title } from "@mantine/core";
import { Suspense } from "react";
import { Workflow } from "./_components/workflow";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Stack gap="lg">
      <Title order={1}>Workflow Designer</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <Workflow params={params} />
      </Suspense>
    </Stack>
  );
}
