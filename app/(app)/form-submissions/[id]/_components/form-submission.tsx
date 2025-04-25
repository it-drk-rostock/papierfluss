import React from "react";
import { getFormSubmission } from "../_actions";
import { FormSubmissionForm } from "./form-submission-form";
import { notFound } from "next/navigation";
import { FormSubmissionStatusBadge } from "@/components/form-submission-status-badge";
import { Stack } from "@mantine/core";
import { FormSubmissionStatusAlert } from "@/components/form-submission-status-badge copy";

export const FormSubmission = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const submission = await getFormSubmission(id);

  if (!submission) {
    return notFound();
  }

  return (
    <Stack gap="sm">
      <FormSubmissionStatusBadge status={submission.status} />
      {submission.reviewNotes && (
        <FormSubmissionStatusAlert
          status={submission.status}
          message={submission.reviewNotes}
        />
      )}
      {submission.rejectedNotes && (
        <FormSubmissionStatusAlert
          status={submission.status}
          message={submission.rejectedNotes}
        />
      )}
      {submission.completedNotes && (
        <FormSubmissionStatusAlert
          status={submission.status}
          message={submission.completedNotes}
        />
      )}
      <FormSubmissionForm submission={submission} />
    </Stack>
  );
};
