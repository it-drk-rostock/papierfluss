import { Divider, Group, Loader, Skeleton, Title } from "@mantine/core";
import Link from "next/link";
import { Suspense } from "react";
import { Teams } from "./_components/teams";

export default function Page() {
  return (
    <>
      <Title order={1}>Dashboard</Title>
      <Link href="/admin">Admin</Link>
      <Divider />
      <Title order={2}>Teams</Title>
      <Suspense fallback={<Loader />}>
        <Teams />
      </Suspense>
    </>
  );
}
