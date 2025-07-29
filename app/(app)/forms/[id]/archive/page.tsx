import { Suspense } from "react";
import { FormArchive } from "./_components/form-archive";
import { Loader } from "@mantine/core";
import { SearchParams, searchParamsLoader } from "@/utils/searchparams";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const searchParamsPromise = searchParamsLoader(searchParams);

  return (
    <>
      <Suspense fallback={<Loader />}>
        <FormArchive
          params={params}
          searchParams={Promise.resolve(searchParamsPromise)}
        />
      </Suspense>
    </>
  );
}
