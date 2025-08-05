"use client";

import React from "react";
import { Group } from "@mantine/core";

import { N8nCronjobsProps } from "../_actions";
import { CronjobCard } from "./cron-job-card";

export const CronjobList = ({ cronjobs }: { cronjobs: N8nCronjobsProps }) => {
  return (
    <>
      <Group justify="center" gap="xl">
        {cronjobs.map((cronjob) => (
          <CronjobCard key={cronjob.id} cronjob={cronjob} />
        ))}
      </Group>
    </>
  );
};
