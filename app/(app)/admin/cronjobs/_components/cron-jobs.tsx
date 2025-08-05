import React from "react";
import { Stack } from "@mantine/core";
import { CronjobList } from "./cron-job-list";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { getN8nCronjobsWorkflows } from "../_actions";
import { SearchParams } from "@/utils/searchparams";

export const Cronjobs = async ({
  params,
}: {
  params: Promise<SearchParams>;
}) => {
  const { search } = await params;
  const cronJobs = await getN8nCronjobsWorkflows(search);

  return (
    <Stack align="center" gap="md">
      <QuickSearchAdd />
      <CronjobList cronjobs={cronJobs} />
    </Stack>
  );
};
