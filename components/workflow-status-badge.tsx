import { workflowStatus } from "@/constants/workflow-status";
import { Badge } from "@mantine/core";
import { WorkflowStatus } from "@/generated/prisma/browser";

import React from "react";

export const WorkflowStatusBadge = ({ status }: { status: WorkflowStatus }) => {
  return (
    <Badge color={workflowStatus[status].color}>
      {workflowStatus[status].label}
    </Badge>
  );
};
