import { Stack, Title } from "@mantine/core";
import { Suspense } from "react";
import { Workflow } from "./_components/workflow";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { ProcessForm } from "./_components/process-form";

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
