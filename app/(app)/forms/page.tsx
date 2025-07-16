import { Suspense } from "react";
import { Title } from "@mantine/core";
import { Forms } from "./_components/forms";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { FormForm } from "./_components/form-form";
import { FormsSearchParams } from "./_actions";
import { formsSearchParamsLoader } from "./_searchParams";

export default function Page({
  searchParams,
}: {
  searchParams: FormsSearchParams;
}) {

  const searchParamsPromise = formsSearchParamsLoader(searchParams);
  return (
    <>
      <Title order={1}>Formulare</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <QuickSearchAdd
          modalTitle="Formular hinzufügen"
          modalContent={<FormForm />}
        />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <Forms searchParams={Promise.resolve(searchParamsPromise)} />
      </Suspense>
    </>
  );
}
