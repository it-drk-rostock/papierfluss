import React from "react";
import { getFormSubmission } from "../_actions";
import { FormSubmissionForm } from "./form-submission-form";
import { notFound } from "next/navigation";
import { FormSubmissionStatusBadge } from "@/components/form-submission-status-badge";
import { Alert, Stack } from "@mantine/core";
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
  };

  return (
    <Stack gap="sm">
      <FormSubmissionStatusBadge status={submission.status} />
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
      {submission.isExample && (
        <Alert color="yellow" variant="light">
          Dieses Formular ist ein Beispiel und dient nur zur generierung der
          Felder für die Berechtigungen. Lassen Sie dieses Formular gerne offen
          und speichern Sie es nur.
        </Alert>
      )}
      <FormSubmissionForm submission={submission} />
    </Stack>
  );
};
