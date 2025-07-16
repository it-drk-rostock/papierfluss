import { parseAsString, createLoader } from "nuqs/server";

export const workflowRunsSearchParams = {
  search: parseAsString.withDefault(""),
};

export const workflowRunsSearchParamsLoader = createLoader(
  workflowRunsSearchParams
);
