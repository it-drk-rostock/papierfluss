import { Suspense } from "react";
import { Form } from "./_components/form";
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
        <Form
          params={params}
          searchParams={Promise.resolve(searchParamsPromise)}
        />
      </Suspense>
    </>
  );
}
