import { Title, Skeleton } from "@mantine/core";
import { FormSubmission } from "./_components/form-submission";
import { Suspense } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Title order={1}>Formular Eingabe</Title>
      <Suspense fallback={<Skeleton height={500} />}>
        <FormSubmission params={params} />
      </Suspense>
    </>
  );
}
