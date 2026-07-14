import { Suspense } from "react";
import { Container, Loader } from "@mantine/core";
import { authQuery } from "@/server/utils/auth-query";
import { FormsV2Dashboard } from "./_components/forms-v2-dashboard";

async function FormsV2List() {
  // Protect the route using the authQuery cache helper on the server
  const session = await authQuery();

  // Render the Client Component dashboard and pass the session
  return <FormsV2Dashboard session={session} />;
}

export default function Page() {
  return (
    <Container size="xl" py="md">
      <Suspense fallback={<Loader color="red" size="md" />}>
        <FormsV2List />
      </Suspense>
    </Container>
  );
}
