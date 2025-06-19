import { Title } from "@mantine/core";
import { Suspense } from "react";
import { N8nWorkflows } from "./_components/n8n-workflows";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <Title order={1}>N8n Workflows</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <N8nWorkflows params={params} />
      </Suspense>
    </>
  );
}
