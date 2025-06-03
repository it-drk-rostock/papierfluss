import { Title } from "@mantine/core";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Title order={1}>Workflow Übersicht</Title>
    </>
  );
}
