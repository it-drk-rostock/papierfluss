import { Suspense } from "react";
import { Loader, Title } from "@mantine/core";
import { Cronjobs } from "./_components/cron-jobs";
import { SearchParams, searchParamsLoader } from "@/utils/searchparams";

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  const paramsPromise = searchParamsLoader(searchParams);
  return (
    <>
      <Title order={1}>Cronjobs</Title>
      <Suspense fallback={<Loader />}>
        <Cronjobs params={Promise.resolve(paramsPromise)} />
      </Suspense>
    </>
  );
}
