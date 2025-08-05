import { Suspense } from "react";
import { Form } from "./_components/form";
import { Loader } from "@mantine/core";
import { FormSearchParams } from "./_actions";
import { formsSearchParamsLoader } from "./_searchParams";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: FormSearchParams;
}) {
  const searchParamsPromise = formsSearchParamsLoader(searchParams);
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
