import React from "react";
import { formSubmissionStatus } from "@/constants/form-submission-status";
import { Alert } from "@mantine/core";
import { SubmissionStatus } from "@/generated/prisma/browser";

export const FormSubmissionStatusAlert = ({
  status,
  message,
}: {
  status: SubmissionStatus;
  message: string;
}) => {
  return (
    <Alert color={formSubmissionStatus[status].color}>
      {formSubmissionStatus[status].label}: {message}
    </Alert>
  );
};
