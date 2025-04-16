import { Suspense } from "react";
import { Title } from "@mantine/core";
import { Users } from "./_components/users";
import { teamSearchParamsLoader } from "./_searchParams";
import { TeamSearchParams } from "./_actions";

export default function Page({
  searchParams,
}: {
  searchParams: TeamSearchParams;
}) {
  const paramsPromise = teamSearchParamsLoader(searchParams);

  return (
    <>
      <Title order={1}>Teams</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <Users params={Promise.resolve(paramsPromise)} />
      </Suspense>
    </>
  );
}
