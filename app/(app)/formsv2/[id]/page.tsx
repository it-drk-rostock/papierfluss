import { Suspense } from "react";
import { Container, Loader } from "@mantine/core";
import { authQuery } from "@/server/utils/auth-query";
import { FormV2Fill } from "../_components/form-v2-fill";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function FormV2FillWrapper({ params }: PageProps) {
  // 1. Authenticate via authQuery
  const session = await authQuery();
  
  // 2. Resolve parameters
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Render Client Component
  return <FormV2Fill id={id} session={session} />;
}

export default function Page({ params }: PageProps) {
  return (
    <Container size="md" py="md">
      <Suspense fallback={<Loader color="red" size="md" />}>
        <FormV2FillWrapper params={params} />
      </Suspense>
    </Container>
  );
}
