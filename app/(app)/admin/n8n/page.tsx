import { Suspense } from "react";
import { Title } from "@mantine/core";
import { Workflows } from "./_components/workflows";

export default function Page() {
  return (
    <>
      <Title order={1}>n8n Workflows</Title>

      <Suspense fallback={<div>Loading...</div>}>
        <Workflows />
      </Suspense>
    </>
  );
}
