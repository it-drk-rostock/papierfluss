import { Suspense } from "react";
import { Container, Loader } from "@mantine/core";
import { authQuery } from "@/server/utils/auth-query";
import { SubmissionV2Detail } from "../../_components/submission-v2-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function SubmissionV2DetailWrapper({ params }: PageProps) {
  // 1. Authenticate via authQuery
  const session = await authQuery();
  
  // 2. Resolve parameters
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Render Client Component
  return <SubmissionV2Detail id={id} session={session} />;
}

export default function Page({ params }: PageProps) {
  return (
    <Container size="xl" py="md">
      <Suspense fallback={<Loader color="red" size="md" />}>
        <SubmissionV2DetailWrapper params={params} />
      </Suspense>
    </Container>
  );
}
