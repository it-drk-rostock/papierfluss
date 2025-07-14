import { Suspense } from "react";

import { ArchivedWorkflowRuns } from "./_components/archived-workflow-runs";
import { WorkflowRunsSearchParams } from "../_actions";
import { workflowRunsSearchParamsLoader } from "../_searchParams";
import { Loader } from "@mantine/core";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: WorkflowRunsSearchParams;
}) {
  const searchParamsPromise = workflowRunsSearchParamsLoader(searchParams);
  return (
    <>
      <Suspense fallback={<Loader size="xl" />}>
        <ArchivedWorkflowRuns
          params={params}
          searchParams={Promise.resolve(searchParamsPromise)}
        />
      </Suspense>
    </>
  );
}
