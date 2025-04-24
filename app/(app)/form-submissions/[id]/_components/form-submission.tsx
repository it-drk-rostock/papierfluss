import React from "react";
import { getFormSubmission } from "../_actions";
import { FormSubmissionForm } from "./form-submission-form";
import { notFound } from "next/navigation";

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

  return <FormSubmissionForm submission={submission} />;
};
