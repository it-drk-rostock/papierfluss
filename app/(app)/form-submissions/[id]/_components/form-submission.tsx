import React from "react";
import { getFormSubmission } from "../_actions";
import { FormSubmissionForm } from "./form-submission-form";

export const FormSubmission = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const submission = await getFormSubmission(id);

  if (!submission) {
    return <div>Submission not found</div>;
  }

  return <FormSubmissionForm submission={submission} />;
};
