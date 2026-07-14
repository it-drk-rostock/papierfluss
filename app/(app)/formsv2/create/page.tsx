import { Suspense } from "react";
import { Container, Loader } from "@mantine/core";
import { authQuery } from "@/server/utils/auth-query";
import { CreateWizard } from "../_components/create-wizard";

async function FormV2Create() {
  // 1. Route protection via authQuery cache helper
  await authQuery();

  // Render the interactive multi-step client wizard directly
  return <CreateWizard />;
}

export default function Page() {
  return (
    <Container size="lg" py="md">
      <Suspense fallback={<Loader color="red" size="md" />}>
        <FormV2Create />
      </Suspense>
    </Container>
  );
}
