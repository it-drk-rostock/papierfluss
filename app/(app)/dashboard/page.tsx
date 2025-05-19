import { Divider, Loader, Title } from "@mantine/core";
import { Suspense } from "react";
import { Teams } from "./_components/teams";
import { FormSubmissions } from "./_components/form-submissions";

export default function Page() {
  return (
    <>
      <Title order={1}>Dashboard</Title>
      <Divider />
      <Title order={2}>Bereiche</Title>
      <Suspense fallback={<Loader />}>
        <Teams />
      </Suspense>
      <Title order={2}>Formular Einreichungen</Title>
      <Suspense fallback={<Loader />}>
        <FormSubmissions />
      </Suspense>
    </>
  );
}
