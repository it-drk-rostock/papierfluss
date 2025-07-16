"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";
import { Box, LoadingOverlay } from "@mantine/core";
import React from "react";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { initializeWorkflowRunForm } from "../_actions";

export const WorkflowRunInitializeForm = ({
  workflowId,
  schema,
}: {
  workflowId: string;
  schema: Record<string, unknown>;
}) => {
  const { execute: executeUpdate, status: statusUpdate } = useEnhancedAction({
    action: initializeWorkflowRunForm,
    hideModals: true,
    hideNotification: true,
  });

  const model = new Model(schema);
  model.locale = "de";
  model.showCompleteButton = false;

  model.addNavigationItem({
    id: "submit-process",
    title: "Hinzufügen",
    innerCss: "sd-btn submit-form",
    action: () => {
      const dataToSave = { ...model.data };
      executeUpdate({ id: workflowId, data: dataToSave });
    },
  });

  return (
    <Box pos="relative">
      <LoadingOverlay visible={statusUpdate === "executing"} />
      <Survey model={model} />
    </Box>
  );
};
