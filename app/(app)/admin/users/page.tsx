import { Suspense } from "react";
import { Title } from "@mantine/core";
import { Users } from "./_components/users";

export default async function Page() {
  return (
    <>
      <Title order={1}>Users</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <Users />
      </Suspense>
    </>
  );
}
