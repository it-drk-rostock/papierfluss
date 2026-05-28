import { Suspense } from "react";
import { Loader, Title } from "@mantine/core";

import { QuickSearchAdd } from "@/components/quick-search-add";

import { formsSearchParamsLoader } from "./_searchParams";
import { FormsSearchParams } from "../forms/_actions";

export default function Page({
  searchParams,
}: {
  searchParams: FormsSearchParams;
}) {
  const searchParamsPromise = formsSearchParamsLoader(searchParams);
  return (
    <>
      <Title order={1}>FormulareV2</Title>
      <Suspense fallback={<Loader color="red" />}>
        <QuickSearchAdd modalTitle="Formular hinzufügen" />
      </Suspense>
      <Suspense fallback={<Loader color="red" />}></Suspense>
    </>
  );
}
