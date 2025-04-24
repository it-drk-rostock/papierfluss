"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";
import { Box, LoadingOverlay } from "@mantine/core";
import React, { useState } from "react";
import { FormSubmissionProps, updateFormSubmission } from "../_actions";
import { ModalButton } from "@/components/modal-button";
import { modals } from "@mantine/modals";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";

export const FormSubmissionForm = ({
  submission,
}: {
  submission: FormSubmissionProps;
}) => {
  const { execute, status } = useEnhancedAction({
    action: updateFormSubmission,
    hideModals: true,
  });
  const model = new Model(submission.form.schema);
  model.locale = "de";
  model.data = submission.data;

  // Disable default complete button
  model.showCompleteButton = false;

  model.addNavigationItem({
    id: "save-form",
    title: "Speichern",
    innerCss: "sd-btn save-form",
    action: () => {
      execute({ id: submission.id, data: model.data });
    },
  });
  model.addNavigationItem({
    id: "submit-form",
    title: "Formular einreichen",
    innerCss: "sd-btn submit-form",
    action: () => {
      modals.open({
        closeOnClickOutside: false,
        title: "Formular einreichen",
        children: <div>Formular einreichen</div>,
      });
    },
  });

  return (
    <Box pos="relative">
      <LoadingOverlay visible={status === "executing"} />
      <Survey model={model} />
    </Box>
  );
};
