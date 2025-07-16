import React from "react";
import { getFormSubmission } from "../_actions";
import { FormSubmissionForm } from "./form-submission-form";
import { notFound } from "next/navigation";
import { FormSubmissionStatusBadge } from "@/components/form-submission-status-badge";
import { Badge, Group, Stack } from "@mantine/core";
import { FormSubmissionStatusAlert } from "@/components/form-submission-status-alert";

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

  // Create a mapping of all possible notes
  const notesMapping = {
    reviewNotes: submission.reviewNotes,
    rejectedNotes: submission.rejectedNotes,
    completedNotes: submission.completedNotes,
    archivedNotes: submission.archivedNotes,
    submittedNotes: submission.submittedNotes,
  };

  return (
    <Stack gap="sm">
      <Group gap="sm">
        <FormSubmissionStatusBadge status={submission.status} />
        {submission.isArchived && <Badge color="gray">Archiviert</Badge>}
      </Group>
      {Object.entries(notesMapping).map(
        ([_, notes]) =>
          notes && (
            <FormSubmissionStatusAlert
              key={notes}
              status={submission.status}
              message={notes}
            />
          )
      )}
      <FormSubmissionForm submission={submission} />
    </Stack>
  );
};
