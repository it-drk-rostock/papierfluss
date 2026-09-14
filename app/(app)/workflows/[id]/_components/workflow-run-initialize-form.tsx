"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";
import { Box, LoadingOverlay } from "@mantine/core";
import React, { useEffect, useMemo } from "react";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useAuthSession } from "@/hooks/use-auth-session";
import { initializeWorkflowRunForm } from "../_actions";

export const WorkflowRunInitializeForm = ({
  workflowId,
  schema,
}: {
  workflowId: string;
  schema: Record<string, unknown>;
}) => {
  const { session, isPending: isSessionPending } = useAuthSession();
  const currentUserEmail = session?.user.email ?? "";
  const { execute: executeUpdate, status: statusUpdate } = useEnhancedAction({
    action: initializeWorkflowRunForm,
    hideModals: true,
    hideNotification: true,
  });

  const model = useMemo(() => {
    const model = new Model(schema);
    model.locale = "de";
    model.showCompleteButton = false;

    model.addNavigationItem({
      id: "submit-process",
      title: "Hinzufügen",
      innerCss: "sd-btn submit-form",
      action: () => {
        // Use built-in model validation
        const validationResult = model.validate();

        if (!validationResult) {
          return;
        }

        const dataToSave = { ...model.data };
        executeUpdate({ id: workflowId, data: dataToSave });
      },
    });

    return model;
  }, [schema, workflowId, executeUpdate]);

  // Update runtime context without recreating the model or resetting answers.
  useEffect(() => {
    model.setVariable("currentUserEmail", currentUserEmail);
  }, [model, currentUserEmail]);

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={isSessionPending || statusUpdate === "executing"}
      />
      <Survey model={model} />
    </Box>
  );
};
