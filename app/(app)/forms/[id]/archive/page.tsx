import { Suspense } from "react";
import { FormArchive } from "./_components/form-archive";
import { Loader } from "@mantine/core";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Suspense fallback={<Loader />}>
        <FormArchive params={params} />
      </Suspense>
    </>
  );
}
