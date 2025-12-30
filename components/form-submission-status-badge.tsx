import React from "react";
import { formSubmissionStatus } from "@/constants/form-submission-status";
import { Badge } from "@mantine/core";
import { SubmissionStatus } from "@/generated/prisma/browser";

export const FormSubmissionStatusBadge = ({
  status,
}: {
  status: SubmissionStatus;
}) => {
  return (
    <Badge color={formSubmissionStatus[status].color}>
      {formSubmissionStatus[status].label}
    </Badge>
  );
};
