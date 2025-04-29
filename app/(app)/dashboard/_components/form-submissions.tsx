import React from "react";
import { Group, Stack } from "@mantine/core";
import { getFormSubmissions } from "../_actions";
import { FormSubmissionCard } from "./form-submission-card";

export const FormSubmissions = async () => {
  const submissions = await getFormSubmissions();

  return (
    <Group align="center" gap="sm">
      {submissions.map((submission) => (
        <FormSubmissionCard key={submission.id} submission={submission} />
      ))}
    </Group>
  );
};
