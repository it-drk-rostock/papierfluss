import { Suspense } from "react";
import { Form } from "./_components/form";
import { Loader } from "@mantine/core";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Suspense fallback={<Loader />}>
        <Form params={params} />
      </Suspense>
    </>
  );
}
