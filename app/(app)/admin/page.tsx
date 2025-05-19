import { Suspense } from "react";
import { AdminLinks } from "./_components/admin-links";
import { Title } from "@mantine/core";

export default async function Page() {
  return (
    <>
      <Title order={1}>Admin</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminLinks />
      </Suspense>
    </>
  );
}
