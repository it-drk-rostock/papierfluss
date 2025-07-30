import { Suspense } from "react";
import { WorkflowRuns } from "./_components/workflow-runs";
import { workflowRunsSearchParamsLoader } from "./_searchParams";
import { WorkflowRunsSearchParams } from "./_actions";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<WorkflowRunsSearchParams>;
}) {
  const searchParamsPromise = workflowRunsSearchParamsLoader(searchParams);
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <WorkflowRuns params={params} searchParams={searchParamsPromise} />
      </Suspense>
    </>
  );
}
