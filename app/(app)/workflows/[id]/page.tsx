
import { Suspense } from "react";
import { WorkflowRuns } from "./_components/workflow-runs";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <WorkflowRuns params={params} />
      </Suspense>
    </>
  );
}
