import { Title } from "@mantine/core";
import { Suspense } from "react";
import { Form } from "./_components/form";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Title order={1}>Formular Dashboard</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <Form params={params} />
      </Suspense>
    </>
  );
}
