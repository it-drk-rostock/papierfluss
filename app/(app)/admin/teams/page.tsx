import { Suspense } from "react";
import { Title } from "@mantine/core";
import { Teams } from "./_components/teams";
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
        <Teams params={Promise.resolve(paramsPromise)} />
      </Suspense>
    </>
  );
}
