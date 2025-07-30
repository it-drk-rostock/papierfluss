import { WorkflowStatus } from "@/generated/prisma";
import { parseAsString, createLoader, parseAsStringEnum } from "nuqs/server";

export const workflowRunsSearchParams = {
  search: parseAsString.withDefault(""),
  status: parseAsStringEnum(Object.values(WorkflowStatus)),
};

export const workflowRunsSearchParamsLoader = createLoader(
  workflowRunsSearchParams
);
